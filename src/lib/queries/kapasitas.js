import { parseId } from "../id.js";
import { hariDalamRentang } from "../leave/tanggal.js";
import { hitungBatasHarian } from "../leave/kapasitas.js";
import { muatHariLibur } from "./hari-libur.js";
import { statusHari } from "../leave/kalender.js";

const gagal = (pesan) => ({ ok: false, pesan });
const AKTIF = "('Pending','Approved by Leader','Approved')";

export async function okupansiDivisi(db, divisiId, dari, sampai, { kecualiPengajuanId = null, kecualiPengajuId = null } = {}) {
  const r = await db.query(
    `SELECT d::date AS tanggal, count(DISTINCT p.pengaju_id)::int AS n
     FROM generate_series($2::date, $3::date, interval '1 day') d
     JOIN pengajuan_cuti p ON p.divisi_id = $1 AND p.status IN ${AKTIF}
      AND p.tanggal_mulai <= d::date AND p.tanggal_selesai >= d::date
      AND ($4::int IS NULL OR p.id <> $4) AND ($5::int IS NULL OR p.pengaju_id <> $5)
     GROUP BY d`,
    [divisiId, dari, sampai, kecualiPengajuanId, kecualiPengajuId]
  );
  return new Map(r.rows.map((x) => [x.tanggal, x.n]));
}

export async function ubahPersenKapasitas(db, divisiId, persen) {
  const id = parseId(divisiId);
  if (id == null) return gagal("Divisi tidak ditemukan.");
  const teks = String(persen ?? "").trim();
  const n = Number(teks);
  if (!/^\d{1,3}$/.test(teks) || n < 1 || n > 100) return gagal("Batas harus berupa angka bulat 1 sampai 100 persen.");
  const r = await db.query("UPDATE divisi SET max_persen_cuti=$2 WHERE id=$1 AND deleted_at IS NULL", [id, n]);
  return r.rowCount ? { ok: true } : gagal("Divisi tidak ditemukan.");
}

export async function petaKapasitas(db, { dari, sampai }) {
  const divisi = (await db.query(
    `SELECT d.id, d.nama, d.max_persen_cuti, k.nama_lengkap AS ketua_nama,
            (SELECT count(*)::int FROM users u WHERE u.divisi_id = d.id AND u.aktif AND u.deleted_at IS NULL) AS jumlah_anggota
     FROM divisi d LEFT JOIN users k ON k.id = d.ketua_id WHERE d.deleted_at IS NULL ORDER BY d.nama`
  )).rows;
  const libur = await muatHariLibur(db, { dari, sampai });
  const hari = hariDalamRentang(dari, sampai);
  const hasil = [];
  for (const d of divisi) {
    const okupansi = await okupansiDivisi(db, d.id, dari, sampai);
    const batas = hitungBatasHarian(d.max_persen_cuti, d.jumlah_anggota);
    const harian = hari.map((tanggal) => {
      const terisi = okupansi.get(tanggal) ?? 0;
      return { tanggal, terisi, status: statusHari({ tanggal, libur, terisi, batas }) };
    });
    hasil.push({
      id: d.id, nama: d.nama, ketuaNama: d.ketua_nama, jumlahAnggota: d.jumlah_anggota,
      persen: d.max_persen_cuti, batas, hariPenuh: harian.filter((h) => h.status === "penuh").length, harian,
    });
  }
  return hasil;
}
