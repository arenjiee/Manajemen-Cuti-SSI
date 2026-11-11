import { denganTransaksi } from "./tx.js";

const gagal = (pesan) => ({ ok: false, pesan });

function pesanUnik(e) {
  if (e.code !== "23505") throw e;
  if (String(e.constraint).includes("nama")) return gagal("Nama divisi sudah dipakai.");
  if (String(e.constraint).includes("ketua")) return gagal("Ketua divisi tersebut sudah memimpin divisi lain.");
  throw e;
}

async function cekKetua(db, ketuaId, kecualiDivisiId = null) {
  if (!ketuaId) return "Ketua divisi wajib dipilih.";
  const k = (await db.query("SELECT role, aktif FROM users WHERE id=$1 AND deleted_at IS NULL", [ketuaId])).rows[0];
  if (!k || k.role !== "ketua_divisi" || !k.aktif) return "Ketua divisi harus pengguna aktif dengan role Ketua Divisi.";
  const lain = (await db.query(
    "SELECT nama FROM divisi WHERE ketua_id=$1 AND deleted_at IS NULL AND id <> COALESCE($2, -1)", [ketuaId, kecualiDivisiId])).rows[0];
  if (lain) return `Ketua tersebut sudah memimpin divisi ${lain.nama}.`;
  return null;
}

export async function buatDivisi(db, { nama, deskripsi, ketuaId }) {
  if (!nama?.trim()) return gagal("Nama divisi wajib diisi.");
  const err = await cekKetua(db, ketuaId);
  if (err) return gagal(err);
  try {
    return await denganTransaksi(db, async (c) => {
      const r = await c.query("INSERT INTO divisi (nama, deskripsi, ketua_id) VALUES ($1,$2,$3) RETURNING id", [nama.trim(), deskripsi ?? null, ketuaId]);
      await c.query("UPDATE users SET divisi_id=$1 WHERE id=$2", [r.rows[0].id, ketuaId]);
      return { ok: true, id: r.rows[0].id };
    });
  } catch (e) {
    return pesanUnik(e);
  }
}

export async function ubahDivisi(db, id, { nama, deskripsi, ketuaId }) {
  if (!nama?.trim()) return gagal("Nama divisi wajib diisi.");
  const lama = (await db.query("SELECT ketua_id FROM divisi WHERE id=$1 AND deleted_at IS NULL", [id])).rows[0];
  if (!lama) return gagal("Divisi tidak ditemukan.");
  const err = await cekKetua(db, ketuaId, id);
  if (err) return gagal(err);
  try {
    return await denganTransaksi(db, async (c) => {
      if (lama.ketua_id && lama.ketua_id !== ketuaId) await c.query("UPDATE users SET divisi_id=NULL WHERE id=$1", [lama.ketua_id]);
      await c.query("UPDATE divisi SET nama=$2, deskripsi=$3, ketua_id=$4 WHERE id=$1", [id, nama.trim(), deskripsi ?? null, ketuaId]);
      await c.query("UPDATE users SET divisi_id=$1 WHERE id=$2", [id, ketuaId]);
      return { ok: true };
    });
  } catch (e) {
    return pesanUnik(e);
  }
}

export async function hapusDivisi(db, id) {
  const d = (await db.query("SELECT id FROM divisi WHERE id=$1 AND deleted_at IS NULL", [id])).rows[0];
  if (!d) return gagal("Divisi tidak ditemukan.");
  const n = (await db.query("SELECT count(*)::int n FROM pengajuan_cuti WHERE divisi_id=$1 AND status='Pending' AND tahap='leader'", [id])).rows[0].n;
  if (n > 0) return gagal(`Masih ada ${n} pengajuan yang menunggu verifikasi Ketua Divisi.`);
  return denganTransaksi(db, async (c) => {
    await c.query("UPDATE users SET divisi_id=NULL WHERE divisi_id=$1", [id]);
    await c.query("UPDATE divisi SET deleted_at=now(), ketua_id=NULL WHERE id=$1", [id]);
    return { ok: true };
  });
}

const URUT_DIVISI = {
  nama_asc: "nama ASC",
  nama_desc: "nama DESC",
  anggota: "jumlah_anggota DESC, nama ASC",
  dibuat: "created_at DESC, id",
};

export async function daftarDivisi(db, f = {}) {
  const w = [];
  const p = [];
  const tambah = (sql, v) => { p.push(v); w.push(sql.replace("?", `$${p.length}`)); };
  if (f.q) tambah("nama ILIKE ?", `%${f.q}%`);
  if (f.ketuaId) tambah("ketua_id = ?", Number(f.ketuaId));
  if (f.minAnggota) tambah("jumlah_anggota >= ?", Number(f.minAnggota));
  if (f.maxAnggota) tambah("jumlah_anggota <= ?", Number(f.maxAnggota));
  const sql = `SELECT * FROM (
      SELECT d.id, d.nama, d.deskripsi, d.max_persen_cuti, d.created_at, d.ketua_id, k.nama_lengkap AS ketua_nama,
             (SELECT count(*)::int FROM users u WHERE u.divisi_id = d.id AND u.deleted_at IS NULL AND u.aktif) AS jumlah_anggota
      FROM divisi d LEFT JOIN users k ON k.id = d.ketua_id
      WHERE d.deleted_at IS NULL) t
    ${w.length ? "WHERE " + w.join(" AND ") : ""} ORDER BY ${URUT_DIVISI[f.urut] ?? URUT_DIVISI.nama_asc}`;
  return (await db.query(sql, p)).rows;
}

export async function ambilDivisi(db, id) {
  const r = await db.query(
    `SELECT d.id, d.nama, d.deskripsi, d.max_persen_cuti, d.created_at, d.ketua_id, k.nama_lengkap AS ketua_nama
     FROM divisi d LEFT JOIN users k ON k.id = d.ketua_id WHERE d.id=$1 AND d.deleted_at IS NULL`, [id]);
  return r.rows[0] ?? null;
}

export async function anggotaDivisi(db, divisiId) {
  const r = await db.query(
    `SELECT id, username, nama_lengkap, role, aktif, tanggal_bergabung FROM users
     WHERE divisi_id=$1 AND deleted_at IS NULL ORDER BY (role='ketua_divisi') DESC, nama_lengkap`, [divisiId]);
  return r.rows;
}

export async function tambahAnggota(db, divisiId, userId) {
  const d = (await db.query("SELECT id FROM divisi WHERE id=$1 AND deleted_at IS NULL", [divisiId])).rows[0];
  if (!d) return gagal("Divisi tidak ditemukan.");
  const u = (await db.query(
    "SELECT u.role, u.aktif, u.divisi_id, dv.nama AS divisi_nama FROM users u LEFT JOIN divisi dv ON dv.id=u.divisi_id WHERE u.id=$1 AND u.deleted_at IS NULL", [userId])).rows[0];
  if (!u || u.role !== "karyawan" || !u.aktif) return gagal("Hanya karyawan aktif yang dapat ditambahkan sebagai anggota.");
  if (u.divisi_id) return gagal(`Karyawan sudah tergabung di divisi ${u.divisi_nama}. Keluarkan dulu dari divisi tersebut.`);
  await db.query("UPDATE users SET divisi_id=$1 WHERE id=$2", [divisiId, userId]);
  return { ok: true };
}

export async function keluarkanAnggota(db, userId) {
  const u = (await db.query("SELECT role FROM users WHERE id=$1 AND deleted_at IS NULL", [userId])).rows[0];
  if (!u) return gagal("Pengguna tidak ditemukan.");
  if (u.role !== "karyawan") return gagal("Ketua divisi tidak dapat dikeluarkan. Ganti ketua lewat Edit Divisi.");
  await db.query("UPDATE users SET divisi_id=NULL WHERE id=$1", [userId]);
  return { ok: true };
}

export async function calonKetua(db) {
  const r = await db.query(
    `SELECT id, nama_lengkap FROM users u
     WHERE role='ketua_divisi' AND deleted_at IS NULL AND aktif
       AND NOT EXISTS (SELECT 1 FROM divisi d WHERE d.ketua_id=u.id AND d.deleted_at IS NULL)
     ORDER BY nama_lengkap`);
  return r.rows;
}

export async function karyawanTanpaDivisi(db) {
  const r = await db.query("SELECT id, nama_lengkap FROM users WHERE role='karyawan' AND divisi_id IS NULL AND deleted_at IS NULL AND aktif ORDER BY nama_lengkap");
  return r.rows;
}
