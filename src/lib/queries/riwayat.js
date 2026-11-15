import { parseId } from "../id.js";
import { STATUS } from "./detail.js";

const gagal = (pesan) => ({ ok: false, pesan });
const ROLE = ["karyawan", "ketua_divisi", "hrd", "admin"];
// Nama kolom urut berasal dari daftar putih ini, bukan dari input pengguna.
const URUT = {
  terbaru: "p.id DESC",
  mulai: "p.tanggal_mulai DESC, p.id DESC",
  pengaju: "pg.nama_lengkap ASC, p.id DESC",
};
const escLike = (s) => s.replace(/[\\%_]/g, "\\$&");

// Cakupan ditentukan oleh role pemanggil, bukan oleh filter: filter hanya mempersempit.
//   karyawan: miliknya | ketua_divisi: divisi_id miliknya (+ pengajuannya sendiri) | hrd/admin: semua
export async function riwayat(db, user, filter) {
  if (!user || !ROLE.includes(user.role)) return [];
  const f = filter ?? {};
  const w = [];
  const p = [];
  const param = (v) => { p.push(v); return `$${p.length}`; };

  if (user.role === "karyawan") w.push(`p.pengaju_id = ${param(user.id)}`);
  else if (user.role === "ketua_divisi") {
    const sendiri = param(user.id);
    w.push(user.divisi_id != null ? `(p.divisi_id = ${param(user.divisi_id)} OR p.pengaju_id = ${sendiri})` : `p.pengaju_id = ${sendiri}`);
  }

  if (STATUS.includes(f.status)) w.push(`p.status = ${param(f.status)}`);
  const jenis = parseId(f.jenisId);
  if (jenis != null) w.push(`p.jenis_id = ${param(jenis)}`);
  if (/^\d{4}$/.test(String(f.tahun ?? ""))) w.push(`EXTRACT(YEAR FROM p.tanggal_mulai) = ${param(Number(f.tahun))}`);
  // Mencari nama dan memilih divisi hanya bermakna di luar karyawan; untuk ketua divisi, cakupan divisi tetap dari role.
  if (user.role !== "karyawan" && typeof f.q === "string" && f.q.trim()) w.push(`pg.nama_lengkap ILIKE ${param(`%${escLike(f.q.trim())}%`)}`);
  if (user.role === "hrd" || user.role === "admin") {
    const divisi = parseId(f.divisiId);
    if (divisi != null) w.push(`p.divisi_id = ${param(divisi)}`);
  }

  const r = await db.query(
    `SELECT p.id, p.pengaju_id, pg.nama_lengkap AS pengaju_nama, dv.nama AS divisi_nama, j.nama AS jenis_nama,
            p.tanggal_mulai, p.tanggal_selesai, p.total_hari, p.status, p.tahap, p.tanggal_pengajuan
     FROM pengajuan_cuti p
     JOIN users pg ON pg.id = p.pengaju_id
     JOIN jenis_cuti j ON j.id = p.jenis_id
     LEFT JOIN divisi dv ON dv.id = p.divisi_id
     ${w.length ? `WHERE ${w.join(" AND ")}` : ""}
     ORDER BY ${URUT[f.urut] ?? URUT.terbaru}`,
    p
  );
  return r.rows;
}

export async function notifikasiUser(db, userId, { hanyaBelum = false } = {}) {
  const id = parseId(userId);
  if (id == null) return [];
  const r = await db.query(
    `SELECT id, tipe, pesan, link, dibaca, created_at FROM notifications
     WHERE user_id = $1 ${hanyaBelum ? "AND NOT dibaca" : ""} ORDER BY created_at DESC, id DESC LIMIT 200`,
    [id]
  );
  return r.rows;
}

export async function jumlahBelumDibaca(db, userId) {
  const id = parseId(userId);
  if (id == null) return 0;
  return (await db.query("SELECT count(*)::int AS n FROM notifications WHERE user_id = $1 AND NOT dibaca", [id])).rows[0].n;
}

// Pesan sama untuk "tidak ada" dan "milik orang lain" supaya keberadaan notifikasi orang lain tidak terbaca.
export async function tandaiDibaca(db, userId, id) {
  const u = parseId(userId), n = parseId(id);
  if (u == null || n == null) return gagal("Notifikasi tidak ditemukan.");
  const r = await db.query("UPDATE notifications SET dibaca = true WHERE id = $1 AND user_id = $2 RETURNING link", [n, u]);
  return r.rowCount === 1 ? { ok: true, link: r.rows[0].link } : gagal("Notifikasi tidak ditemukan.");
}

export async function tandaiSemuaDibaca(db, userId) {
  const u = parseId(userId);
  if (u == null) return gagal("Pengguna tidak valid.");
  const r = await db.query("UPDATE notifications SET dibaca = true WHERE user_id = $1 AND NOT dibaca", [u]);
  return { ok: true, jumlah: r.rowCount };
}
