import { parseId } from "../id.js";

export const STATUS = ["Pending", "Approved by Leader", "Approved", "Rejected", "Cancelled"];

export function bolehLihat(user, p) {
  if (user.id === p.pengaju_id) return true;
  if (user.role === "hrd" || user.role === "admin") return true;
  return user.role === "ketua_divisi" && user.divisi_id != null && user.divisi_id === p.divisi_id;
}

export async function detailPengajuan(db, id, user) {
  const n = parseId(id);
  if (n == null) return null;
  const p = (await db.query(
    `SELECT p.*, j.nama AS jenis_nama, j.kode AS jenis_kode, pg.nama_lengkap AS pengaju_nama, dv.nama AS divisi_nama, h.nama_lengkap AS handover_nama
     FROM pengajuan_cuti p
     JOIN jenis_cuti j ON j.id = p.jenis_id
     JOIN users pg ON pg.id = p.pengaju_id
     LEFT JOIN divisi dv ON dv.id = p.divisi_id
     LEFT JOIN users h ON h.id = p.handover_id
     WHERE p.id = $1`, [n])).rows[0];
  if (!p || !bolehLihat(user, p)) return null;
  p.persetujuan = (await db.query(
    `SELECT s.*, u.nama_lengkap AS approver_nama FROM persetujuan s JOIN users u ON u.id = s.approver_id
     WHERE s.pengajuan_id = $1 ORDER BY s.created_at, s.id`, [n])).rows;
  p.lampiran = (await db.query("SELECT id, nama_asli, mime, ukuran FROM lampiran WHERE pengajuan_id = $1 ORDER BY id", [n])).rows;
  return p;
}

export async function ambilLampiranUntuk(db, id, user) {
  const n = parseId(id);
  if (n == null) return null;
  const l = (await db.query("SELECT * FROM lampiran WHERE id = $1", [n])).rows[0];
  if (!l) return null;
  if (l.pengajuan_id == null) return l.diunggah_oleh === user.id ? l : null;
  const p = (await db.query("SELECT pengaju_id, divisi_id FROM pengajuan_cuti WHERE id = $1", [l.pengajuan_id])).rows[0];
  return p && bolehLihat(user, p) ? l : null;
}

export async function daftarCutiSaya(db, userId, { status, urut } = {}) {
  const p = [userId];
  let where = "p.pengaju_id = $1";
  if (STATUS.includes(status)) { p.push(status); where += ` AND p.status = $${p.length}`; }
  const order = urut === "mulai" ? "p.tanggal_mulai DESC, p.id DESC" : "p.id DESC";
  const r = await db.query(
    `SELECT p.id, p.tanggal_mulai, p.tanggal_selesai, p.total_hari, p.status, p.tahap, p.tanggal_pengajuan, j.nama AS jenis_nama
     FROM pengajuan_cuti p JOIN jenis_cuti j ON j.id = p.jenis_id WHERE ${where} ORDER BY ${order}`, p);
  return r.rows;
}
