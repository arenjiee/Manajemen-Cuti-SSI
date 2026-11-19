import { parseId } from "../id.js";
import { hariIni } from "../leave/tanggal.js";
import { mimeDariKunci } from "../foto-file.js";
import { denganTransaksi } from "./tx.js";
import { ringkasanKuota } from "./kuota.js";
import { pesanUnik, EMAIL, ROLES } from "./users.js";

const gagal = (pesan) => ({ ok: false, pesan });
const PEMOHON = ["karyawan", "ketua_divisi"];
const TELEPON = /^[0-9+()\-\s]{3,30}$/;

// Pemilik dan Admin. Dipakai bersama oleh ubahProfil, ubahFoto, dan route upload foto.
export const bolehUbahProfil = (actor, targetId) => actor.role === "admin" || actor.id === targetId;

// Diri sendiri, Admin, HRD, dan teman satu divisi (termasuk Ketua Divisi). Divisi lain tidak.
export function bolehLihatFoto(viewer, target) {
  if (viewer.id === target.id) return true;
  if (viewer.role === "admin" || viewer.role === "hrd") return true;
  return viewer.divisi_id != null && viewer.divisi_id === target.divisi_id;
}

export async function ambilProfil(db, userId, opts) {
  const id = parseId(userId);
  if (id == null) return null;
  const u = (await db.query(
    `SELECT u.id, u.username, u.email, u.nama_lengkap, u.telepon, u.alamat, u.foto_key, u.role, u.aktif, u.divisi_id,
            u.tanggal_bergabung, u.kuota_awal, d.nama AS divisi_nama, k.nama_lengkap AS ketua_nama,
            EXISTS (
              SELECT 1 FROM pengajuan_cuti p
              WHERE p.pengaju_id=u.id AND p.status='Approved'
                AND p.tanggal_mulai <= (now() AT TIME ZONE 'Asia/Makassar')::date
                AND p.tanggal_selesai >= (now() AT TIME ZONE 'Asia/Makassar')::date
            ) AS sedang_cuti
     FROM users u
     LEFT JOIN divisi d ON d.id = u.divisi_id AND d.deleted_at IS NULL
     LEFT JOIN users k ON k.id = d.ketua_id AND k.deleted_at IS NULL
     WHERE u.id = $1 AND u.deleted_at IS NULL`,
    [id]
  )).rows[0];
  if (!u) return null;
  const tahun = Number((opts?.hari ?? hariIni()).slice(0, 4));
  // Admin dan HRD tidak mengajukan cuti, jadi kuota tidak relevan bagi mereka.
  u.kuota = PEMOHON.includes(u.role) ? await ringkasanKuota(db, u.id, tahun) : null;
  return u;
}

function cekData(d) {
  const nama = String(d.nama_lengkap ?? "").trim();
  if (!nama || nama.length > 100) return "Nama lengkap wajib diisi (maksimal 100 karakter).";
  const email = String(d.email ?? "").trim();
  if (!EMAIL.test(email) || email.length > 100) return "Format email tidak valid.";
  const telepon = String(d.telepon ?? "").trim();
  if (telepon && !TELEPON.test(telepon)) return "Nomor telepon hanya boleh berisi angka, spasi, +, -, dan tanda kurung (maksimal 30 karakter).";
  const alamat = String(d.alamat ?? "").trim();
  if (alamat.length > 500) return "Alamat maksimal 500 karakter.";
  return null;
}

// Hanya kolom yang ada di daftar putih ini yang dapat berubah. Kuota, divisi, tanggal bergabung, dan status aktif
// sengaja tidak bisa diubah lewat profil (itu urusan Admin di halaman Pengguna/Divisi).
export async function ubahProfil(db, actor, targetId, d) {
  const id = parseId(targetId);
  if (id == null) return gagal("Pengguna tidak ditemukan.");
  if (!bolehUbahProfil(actor, id)) return gagal("Anda hanya dapat mengubah profil Anda sendiri.");
  const lama = (await db.query("SELECT role, username FROM users WHERE id=$1 AND deleted_at IS NULL", [id])).rows[0];
  if (!lama) return gagal("Pengguna tidak ditemukan.");

  const err = cekData(d);
  if (err) return gagal(err);

  const kolom = { nama_lengkap: String(d.nama_lengkap).trim(), email: String(d.email).trim(), telepon: String(d.telepon ?? "").trim() || null, alamat: String(d.alamat ?? "").trim() || null };

  const usernameBaru = d.username === undefined || d.username === null ? null : String(d.username).trim();
  if (usernameBaru !== null && usernameBaru !== lama.username) {
    if (actor.role !== "admin") return gagal("Hanya Admin yang dapat mengubah username.");
    if (!usernameBaru || usernameBaru.length > 50) return gagal("Username wajib diisi (maksimal 50 karakter).");
    kolom.username = usernameBaru;
  }

  if (d.role !== undefined && d.role !== null && d.role !== "" && d.role !== lama.role) {
    if (actor.role !== "admin") return gagal("Hanya Admin yang dapat mengubah role.");
    if (!ROLES.includes(d.role)) return gagal("Role tidak valid.");
    if (actor.id === id) return gagal("Anda tidak dapat mengubah role akun Anda sendiri.");
    if (lama.role === "ketua_divisi") {
      const memimpin = (await db.query("SELECT nama FROM divisi WHERE ketua_id=$1 AND deleted_at IS NULL", [id])).rows[0];
      if (memimpin) return gagal(`Pengguna masih memimpin divisi ${memimpin.nama}. Ganti ketua divisi terlebih dahulu.`);
    }
    kolom.role = d.role;
  }

  const nama = Object.keys(kolom);
  const set = nama.map((k, i) => `${k}=$${i + 2}`).join(", ");   // nama kolom berasal dari daftar putih di atas, nilai tetap parameter
  try {
    await db.query(`UPDATE users SET ${set} WHERE id=$1 AND deleted_at IS NULL`, [id, ...nama.map((k) => kolom[k])]);
    return { ok: true };
  } catch (e) {
    return pesanUnik(e);
  }
}

// storageKey null = hapus foto. Mengembalikan kunci lama agar pemanggil bisa menghapus berkasnya.
export async function ubahFoto(db, actor, targetId, storageKey) {
  const id = parseId(targetId);
  if (id == null) return gagal("Pengguna tidak ditemukan.");
  if (!bolehUbahProfil(actor, id)) return gagal("Anda hanya dapat mengubah foto profil Anda sendiri.");
  // Satu transaksi: dua unggahan bersamaan tidak boleh sama-sama membaca kunci lama yang sama (berkas yatim).
  return denganTransaksi(db, async (c) => {
    const lama = (await c.query("SELECT foto_key FROM users WHERE id=$1 AND deleted_at IS NULL FOR UPDATE", [id])).rows[0];
    if (!lama) return gagal("Pengguna tidak ditemukan.");
    await c.query("UPDATE users SET foto_key=$2 WHERE id=$1", [id, storageKey]);
    return { ok: true, lama: lama.foto_key };
  });
}

export async function ambilFotoUntuk(db, viewer, targetId) {
  const id = parseId(targetId);
  if (id == null) return null;
  const t = (await db.query("SELECT id, divisi_id, foto_key FROM users WHERE id=$1 AND deleted_at IS NULL", [id])).rows[0];
  if (!t || !t.foto_key || !bolehLihatFoto(viewer, t)) return null;
  const mime = mimeDariKunci(t.foto_key);
  return mime ? { storage_key: t.foto_key, mime } : null;
}
