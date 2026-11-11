import { tanggalValid } from "../leave/tanggal.js";

const gagal = (pesan) => ({ ok: false, pesan });

export async function daftarHariLibur(db, { tahun } = {}) {
  const r = tahun
    ? await db.query("SELECT * FROM hari_libur WHERE EXTRACT(YEAR FROM tanggal) = $1 ORDER BY tanggal", [Number(tahun)])
    : await db.query("SELECT * FROM hari_libur ORDER BY tanggal");
  return r.rows;
}

export async function muatHariLibur(db, { dari, sampai } = {}) {
  const r = await db.query(
    "SELECT tanggal FROM hari_libur WHERE ($1::date IS NULL OR tanggal >= $1) AND ($2::date IS NULL OR tanggal <= $2)",
    [dari ?? null, sampai ?? null]
  );
  return new Set(r.rows.map((x) => x.tanggal));
}

function cek(d) {
  if (!tanggalValid(d.tanggal)) return "Tanggal tidak valid.";
  if (!d.keterangan?.trim()) return "Keterangan wajib diisi.";
  if (!["nasional", "cuti_bersama"].includes(d.jenis)) return "Jenis hari libur tidak valid.";
  return null;
}

export async function buatHariLibur(db, d) {
  const err = cek(d);
  if (err) return gagal(err);
  try {
    const r = await db.query("INSERT INTO hari_libur (tanggal, keterangan, jenis) VALUES ($1,$2,$3) RETURNING id", [d.tanggal, d.keterangan.trim(), d.jenis]);
    return { ok: true, id: r.rows[0].id };
  } catch (e) {
    if (e.code === "23505") return gagal("Tanggal tersebut sudah terdaftar sebagai hari libur.");
    throw e;
  }
}

export async function ubahHariLibur(db, id, d) {
  const err = cek(d);
  if (err) return gagal(err);
  try {
    const r = await db.query("UPDATE hari_libur SET tanggal=$2, keterangan=$3, jenis=$4 WHERE id=$1", [id, d.tanggal, d.keterangan.trim(), d.jenis]);
    return r.rowCount ? { ok: true } : gagal("Hari libur tidak ditemukan.");
  } catch (e) {
    if (e.code === "23505") return gagal("Tanggal tersebut sudah terdaftar sebagai hari libur.");
    throw e;
  }
}

export async function hapusHariLibur(db, id) {
  const r = await db.query("DELETE FROM hari_libur WHERE id=$1", [id]);
  return r.rowCount ? { ok: true } : gagal("Hari libur tidak ditemukan.");
}
