import { denganTransaksi } from "./tx.js";
import { KUOTA_TAHUNAN_DEFAULT, KUOTA_TAHUNAN_MIN, KUOTA_TAHUNAN_MAX } from "../leave/kuota.js";

const gagal = (pesan) => ({ ok: false, pesan });

const petakan = (r) => ({
  id: r.id, nama: r.nama, kode: r.kode, isSystem: r.is_system, kuotaHari: r.kuota_hari,
  batasPengajuanHari: r.batas_pengajuan_hari, wajibLampiran: r.wajib_lampiran, potongKuota: r.potong_kuota, aktif: r.aktif,
});

export async function kuotaTahunan(db) {
  const r = (await db.query("SELECT kuota_hari FROM jenis_cuti WHERE kode='tahunan' LIMIT 1")).rows[0];
  const n = Number(r?.kuota_hari);
  return Number.isFinite(n) && n >= KUOTA_TAHUNAN_MIN ? n : KUOTA_TAHUNAN_DEFAULT;
}

export async function daftarJenis(db) {
  return (await db.query("SELECT * FROM jenis_cuti ORDER BY is_system DESC, id")).rows.map(petakan);
}

export async function daftarJenisAktif(db) {
  return (await db.query("SELECT * FROM jenis_cuti WHERE aktif ORDER BY is_system DESC, id")).rows.map(petakan);
}

export async function ambilJenis(db, id) {
  const r = (await db.query("SELECT * FROM jenis_cuti WHERE id=$1", [id])).rows[0];
  return r ? petakan(r) : null;
}

function cek(d, { kode } = {}) {
  if (!d.nama?.trim()) return "Nama jenis cuti wajib diisi.";
  if (kode === "tahunan") {
    const k = Number(d.kuotaHari);
    if (!Number.isFinite(k) || k < KUOTA_TAHUNAN_MIN || k > KUOTA_TAHUNAN_MAX) {
      return `Kuota Cuti Tahunan wajib diisi, minimal ${KUOTA_TAHUNAN_MIN} hari dan maksimal ${KUOTA_TAHUNAN_MAX} hari.`;
    }
  } else if (d.kuotaHari != null && !(Number(d.kuotaHari) >= 0)) {
    return "Kuota tidak boleh negatif.";
  }
  if (!Number.isInteger(Number(d.batasPengajuanHari))) return "Batas pengajuan harus berupa bilangan bulat.";
  return null;
}

export async function buatJenis(db, d) {
  const err = cek(d, { kode: d.kode });
  if (err) return gagal(err);
  try {
    const r = await db.query(
      `INSERT INTO jenis_cuti (nama, kuota_hari, batas_pengajuan_hari, wajib_lampiran, potong_kuota)
       VALUES ($1,$2,$3,$4,$5) RETURNING id`,
      [d.nama.trim(), d.kuotaHari ?? null, Number(d.batasPengajuanHari), Boolean(d.wajibLampiran), Boolean(d.potongKuota)]
    );
    return { ok: true, id: r.rows[0].id };
  } catch (e) {
    if (e.code === "23505") return gagal("Nama jenis cuti sudah dipakai.");
    throw e;
  }
}

export async function ubahJenis(db, id, d) {
  const lama = await ambilJenis(db, id);
  if (!lama) return gagal("Jenis cuti tidak ditemukan.");
  const err = cek(d, { kode: lama.kode });
  if (err) return gagal(err);
  if (lama.isSystem && !d.aktif) return gagal("Jenis cuti bawaan sistem tidak dapat dinonaktifkan.");
  if (lama.kode === "tahunan" && !d.potongKuota) return gagal("Cuti Tahunan harus selalu memotong kuota.");
  try {
    return await denganTransaksi(db, async (c) => {
      const kuota = lama.kode === "tahunan" ? Number(d.kuotaHari) : (d.kuotaHari ?? null);
      await c.query(
        `UPDATE jenis_cuti SET nama=$2, kuota_hari=$3, batas_pengajuan_hari=$4, wajib_lampiran=$5, potong_kuota=$6, aktif=$7 WHERE id=$1`,
        [id, d.nama.trim(), kuota, Number(d.batasPengajuanHari), Boolean(d.wajibLampiran), Boolean(d.potongKuota), Boolean(d.aktif)]
      );
      // Cuti Tahunan: sinkronkan kuota_awal seluruh pengguna aktif agar konsisten mengikuti jenis cuti.
      if (lama.kode === "tahunan") {
        await c.query("UPDATE users SET kuota_awal=$1 WHERE deleted_at IS NULL", [kuota]);
      }
      return { ok: true };
    });
  } catch (e) {
    if (e.code === "23505") return gagal("Nama jenis cuti sudah dipakai.");
    throw e;
  }
}

export async function hapusJenis(db, id) {
  const j = await ambilJenis(db, id);
  if (!j) return gagal("Jenis cuti tidak ditemukan.");
  if (j.isSystem) return gagal("Jenis cuti bawaan sistem tidak dapat dihapus.");
  const dipakai = (await db.query("SELECT count(*)::int n FROM pengajuan_cuti WHERE jenis_id=$1", [id])).rows[0].n;
  if (dipakai > 0) {
    await db.query("UPDATE jenis_cuti SET aktif=false WHERE id=$1", [id]);
    return { ok: true, dinonaktifkan: true };
  }
  await db.query("DELETE FROM jenis_cuti WHERE id=$1", [id]);
  return { ok: true };
}
