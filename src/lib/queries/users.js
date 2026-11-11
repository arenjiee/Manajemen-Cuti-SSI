import { HARI_INI_SQL } from "./tx.js";
export const USER_KOLOM =
  "id, username, email, nama_lengkap, telepon, alamat, foto_key, role, divisi_id, tanggal_bergabung, kuota_awal";

export async function cariUserLogin(db, identifier) {
  const r = await db.query(
    `SELECT ${USER_KOLOM}, password_hash FROM users
     WHERE (lower(email) = lower($1) OR lower(username) = lower($1)) AND deleted_at IS NULL AND aktif
     LIMIT 1`,
    [identifier]
  );
  return r.rows[0] ?? null;
}

export async function ambilUserAktif(db, id) {
  const r = await db.query(
    `SELECT ${USER_KOLOM} FROM users WHERE id = $1 AND deleted_at IS NULL AND aktif`,
    [id]
  );
  return r.rows[0] ?? null;
}

// ---------- Admin: CRUD pengguna ----------

export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const ROLES = ["admin", "karyawan", "ketua_divisi", "hrd"];
const gagal = (pesan) => ({ ok: false, pesan });

export function pesanUnik(e) {
  if (e.code !== "23505") throw e;
  if (String(e.constraint).includes("email")) return gagal("Email sudah terdaftar.");
  if (String(e.constraint).includes("username")) return gagal("Username sudah dipakai.");
  throw e;
}

function cekUser(d) {
  if (!d.username?.trim() || !d.email?.trim() || !d.nama_lengkap?.trim()) return "Username, email, dan nama lengkap wajib diisi.";
  if (!EMAIL.test(d.email.trim())) return "Format email tidak valid.";
  if (!ROLES.includes(d.role)) return "Role tidak valid.";
  return null;
}

export async function buatUser(db, d) {
  const err = cekUser(d) ?? (!d.password_hash ? "Password wajib diisi." : null) ?? (!d.tanggal_bergabung ? "Tanggal bergabung wajib diisi." : null);
  if (err) return gagal(err);
  const kuota = d.kuota_awal ?? 12;
  if (!(Number(kuota) >= 0)) return gagal("Kuota awal tidak valid.");
  try {
    const r = await db.query(
      `INSERT INTO users (username,email,password_hash,nama_lengkap,telepon,alamat,role,tanggal_bergabung,kuota_awal)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
      [d.username.trim(), d.email.trim(), d.password_hash, d.nama_lengkap.trim(), d.telepon ?? null, d.alamat ?? null, d.role, d.tanggal_bergabung, kuota]
    );
    return { ok: true, id: r.rows[0].id };
  } catch (e) {
    return pesanUnik(e);
  }
}

export async function ubahUser(db, id, d) {
  const err = cekUser(d);
  if (err) return gagal(err);
  const lama = (await db.query("SELECT role FROM users WHERE id=$1 AND deleted_at IS NULL", [id])).rows[0];
  if (!lama) return gagal("Pengguna tidak ditemukan.");
  if (d.role !== "ketua_divisi") {
    const memimpin = await db.query("SELECT nama FROM divisi WHERE ketua_id=$1 AND deleted_at IS NULL", [id]);
    if (memimpin.rows[0]) return gagal(`Pengguna masih memimpin divisi ${memimpin.rows[0].nama}. Ganti ketua divisi terlebih dahulu.`);
  }
  try {
    await db.query(
      "UPDATE users SET username=$2,email=$3,nama_lengkap=$4,role=$5,aktif=$6 WHERE id=$1",
      [id, d.username.trim(), d.email.trim(), d.nama_lengkap.trim(), d.role, Boolean(d.aktif)]
    );
    return { ok: true };
  } catch (e) {
    return pesanUnik(e);
  }
}

export async function hapusUser(db, id) {
  const u = (await db.query("SELECT role FROM users WHERE id=$1 AND deleted_at IS NULL", [id])).rows[0];
  if (!u) return gagal("Pengguna tidak ditemukan.");
  if (!["karyawan", "ketua_divisi"].includes(u.role)) return gagal("Hanya Karyawan dan Ketua Divisi yang dapat dihapus.");
  const memimpin = (await db.query("SELECT nama FROM divisi WHERE ketua_id=$1 AND deleted_at IS NULL", [id])).rows[0];
  if (memimpin) return gagal(`Pengguna masih memimpin divisi ${memimpin.nama}. Ganti ketua divisi terlebih dahulu.`);
  const berjalan = (await db.query(
    "SELECT count(*)::int n FROM pengajuan_cuti WHERE pengaju_id=$1 AND status IN ('Pending','Approved by Leader')", [id])).rows[0].n;
  if (berjalan > 0) return gagal(`Pengguna masih memiliki ${berjalan} pengajuan cuti yang sedang diproses.`);
  await db.query("UPDATE users SET deleted_at=now(), aktif=false, divisi_id=NULL WHERE id=$1", [id]);
  return { ok: true };
}

const URUT_USER = {
  nama: "u.nama_lengkap ASC",
  bergabung: "u.tanggal_bergabung DESC, u.id",
  divisi: "d.nama ASC NULLS LAST, u.nama_lengkap ASC",
};

export async function daftarUser(db, f = {}) {
  const w = ["u.deleted_at IS NULL"];
  const p = [];
  const tambah = (sql, v) => { p.push(v); w.push(sql.replace("?", `$${p.length}`)); };
  if (f.role) tambah("u.role = ?", f.role);
  if (f.divisiId) tambah("u.divisi_id = ?", Number(f.divisiId));
  if (f.aktif === "true" || f.aktif === "false") tambah("u.aktif = ?", f.aktif === "true");
  if (f.masaKerja === "lt1") w.push(`u.tanggal_bergabung > ${HARI_INI_SQL} - interval '1 year'`);
  if (f.masaKerja === "gte1") w.push(`u.tanggal_bergabung <= ${HARI_INI_SQL} - interval '1 year'`);
  if (f.q) {
    p.push(`%${f.q}%`);
    const n = `$${p.length}`;
    w.push(`(u.nama_lengkap ILIKE ${n} OR u.username ILIKE ${n} OR u.email ILIKE ${n})`);
  }
  const sql = `SELECT u.id, u.username, u.email, u.nama_lengkap, u.role, u.aktif, u.tanggal_bergabung, u.divisi_id, d.nama AS divisi_nama
     FROM users u LEFT JOIN divisi d ON d.id = u.divisi_id AND d.deleted_at IS NULL
     WHERE ${w.join(" AND ")} ORDER BY ${URUT_USER[f.urut] ?? "u.id"}`;
  return (await db.query(sql, p)).rows;
}

export async function ambilUser(db, id) {
  const r = await db.query(
    `SELECT id, username, email, nama_lengkap, telepon, alamat, role, aktif, tanggal_bergabung, kuota_awal, divisi_id
     FROM users WHERE id=$1 AND deleted_at IS NULL`, [id]);
  return r.rows[0] ?? null;
}
