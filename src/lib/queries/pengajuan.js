import { denganTransaksi } from "./tx.js";
import { ambilJenis } from "./jenis-cuti.js";
import { muatHariLibur } from "./hari-libur.js";
import { ambilLampiranUpload, tautkanLampiran } from "./lampiran.js";
import { hariIni, tanggalValid, hariDalamRentang } from "../leave/tanggal.js";
import { kandidatRekan } from "../leave/rekan.js";
import { validasiPengajuan } from "../leave/validasi.js";
import { formatRentang } from "../format.js";

const AKTIF = "('Pending','Approved by Leader','Approved')";
const gagal = (kode, pesan) => ({ ok: false, kode, pesan });

export async function terpakaiPotongKuota(db, userId, tahun) {
  const r = await db.query(
    `SELECT COALESCE(SUM(p.total_hari), 0) AS n FROM pengajuan_cuti p JOIN jenis_cuti j ON j.id = p.jenis_id
     WHERE p.pengaju_id=$1 AND j.potong_kuota AND p.status IN ${AKTIF} AND EXTRACT(YEAR FROM p.tanggal_mulai) = $2`,
    [userId, tahun]
  );
  return Number(r.rows[0].n);
}

async function terpakaiJenis(db, userId, jenisId, tahun) {
  const r = await db.query(
    `SELECT COALESCE(SUM(total_hari), 0) AS n FROM pengajuan_cuti
     WHERE pengaju_id=$1 AND jenis_id=$2 AND status IN ${AKTIF} AND EXTRACT(YEAR FROM tanggal_mulai) = $3`,
    [userId, jenisId, tahun]
  );
  return Number(r.rows[0].n);
}

// Bentuk Konteks sama persis dengan yang dipakai validasiPengajuan (Task 4); dipakai juga oleh what-if (Task 17).
export async function muatKonteks(db, pengajuId, input, lampiran = null) {
  const { mulai, selesai } = input;
  const tahun = Number(mulai.slice(0, 4));
  const u = (await db.query(
    "SELECT id, role, divisi_id, tanggal_bergabung, kuota_awal FROM users WHERE id=$1 AND aktif AND deleted_at IS NULL", [pengajuId])).rows[0];
  const jenisId = Number(input.jenisId);
  const jenisAda = Number.isInteger(jenisId) ? await ambilJenis(db, jenisId) : null;
  const jenis = jenisAda && jenisAda.aktif ? jenisAda : null;

  const k = {
    hariIni: hariIni(),
    pengaju: u && { id: u.id, role: u.role, divisiId: u.divisi_id, tanggalBergabung: u.tanggal_bergabung, kuotaAwal: u.kuota_awal },
    jenis,
    hariLibur: await muatHariLibur(db, { dari: mulai, sampai: selesai }),
    pengajuanAktifPengaju: [],
    terpakaiPotongKuota: 0,
    terpakaiJenis: 0,
    kandidatRekan: [],
    divisi: null,
    okupansi: new Map(),
    lampiran: lampiran ? { mime: lampiran.mime, ukuran: lampiran.ukuran } : null,
  };
  if (!u || !jenis) return k;

  k.pengajuanAktifPengaju = (await db.query(
    `SELECT tanggal_mulai AS mulai, tanggal_selesai AS selesai FROM pengajuan_cuti WHERE pengaju_id=$1 AND status IN ${AKTIF}`, [u.id])).rows;
  k.terpakaiPotongKuota = await terpakaiPotongKuota(db, u.id, tahun);
  if (jenis.kuotaHari != null) k.terpakaiJenis = await terpakaiJenis(db, u.id, jenis.id, tahun);

  if (u.divisi_id) {
    const dv = (await db.query("SELECT max_persen_cuti FROM divisi WHERE id=$1 AND deleted_at IS NULL", [u.divisi_id])).rows[0];
    const anggotaRows = (await db.query("SELECT id FROM users WHERE divisi_id=$1 AND aktif AND deleted_at IS NULL", [u.divisi_id])).rows;
    const ids = anggotaRows.map((a) => a.id);
    const aktifAnggota = (await db.query(
      `SELECT pengaju_id, tanggal_mulai AS mulai, tanggal_selesai AS selesai FROM pengajuan_cuti
       WHERE pengaju_id = ANY($1) AND status IN ${AKTIF} AND tanggal_mulai <= $3 AND tanggal_selesai >= $2`, [ids, mulai, selesai])).rows;
    const anggota = ids.map((id) => ({ id, aktif: true, pengajuanAktif: aktifAnggota.filter((x) => x.pengaju_id === id) }));
    k.kandidatRekan = kandidatRekan(anggota, u.id, mulai, selesai);
    if (dv) k.divisi = { maxPersen: dv.max_persen_cuti, jumlahAnggotaAktif: ids.length };
    if (hariDalamRentang(mulai, selesai).length > 0) {
      const ok = (await db.query(
        `SELECT d::date AS tanggal, count(DISTINCT p.pengaju_id)::int AS n
         FROM generate_series($2::date, $3::date, interval '1 day') d
         JOIN pengajuan_cuti p ON p.divisi_id = $1 AND p.status IN ${AKTIF} AND p.tanggal_mulai <= d::date AND p.tanggal_selesai >= d::date
         GROUP BY d`, [u.divisi_id, mulai, selesai])).rows;
      k.okupansi = new Map(ok.map((r) => [r.tanggal, r.n]));
    }
  }
  return k;
}

async function kirimNotifikasi(c, { id, pengaju, jenis, input, tahap, divisiId }) {
  const nama = (await c.query("SELECT nama_lengkap FROM users WHERE id=$1", [pengaju])).rows[0].nama_lengkap;
  const rentang = formatRentang(input.mulai, input.selesai);
  await c.query(
    "INSERT INTO notifications (user_id, tipe, pesan, link) VALUES ($1,'handover',$2,NULL)",
    [Number(input.handoverId), `${nama} menunjuk Anda sebagai rekan pengganti pada ${rentang}.`]
  );
  const pesan = `${nama} mengajukan ${jenis.nama} (${rentang}).`;
  if (tahap === "leader") {
    const ketua = (await c.query("SELECT ketua_id FROM divisi WHERE id=$1", [divisiId])).rows[0]?.ketua_id;
    if (ketua) await c.query("INSERT INTO notifications (user_id, tipe, pesan, link) VALUES ($1,'pengajuan',$2,'/verifikasi')", [ketua, pesan]);
  } else {
    await c.query(
      `INSERT INTO notifications (user_id, tipe, pesan, link) SELECT id, 'pengajuan', $1, '/persetujuan' FROM users WHERE role='hrd' AND aktif AND deleted_at IS NULL`,
      [pesan]
    );
  }
}

export async function simpanPengajuan(pool, pengajuId, input, lampiranId = null) {
  if (!tanggalValid(input.mulai) || !tanggalValid(input.selesai)) return gagal("BENTUK_DATA", "Tanggal tidak valid.");
  return denganTransaksi(pool, async (c) => {
    const u = (await c.query("SELECT role, divisi_id FROM users WHERE id=$1 AND aktif AND deleted_at IS NULL", [pengajuId])).rows[0];
    if (!u || !["karyawan", "ketua_divisi"].includes(u.role)) return gagal("ROLE", "Hanya Karyawan dan Ketua Divisi yang dapat mengajukan cuti.");
    // Kunci divisi: serialisasi pengecekan kapasitas dan kuota untuk satu divisi.
    if (u.divisi_id) await c.query("SELECT id FROM divisi WHERE id=$1 FOR UPDATE", [u.divisi_id]);

    let lampiran = null;
    if (lampiranId) {
      lampiran = await ambilLampiranUpload(c, lampiranId, pengajuId);
      if (!lampiran) return gagal("LAMPIRAN_INVALID", "Lampiran tidak ditemukan. Unggah ulang berkas Anda.");
    }
    const k = await muatKonteks(c, pengajuId, input, lampiran);
    if (!k.jenis) return gagal("BENTUK_DATA", "Jenis cuti tidak valid.");
    const v = validasiPengajuan(input, k);
    if (!v.ok) return v;

    const tahap = u.role === "ketua_divisi" ? "hrd" : "leader";
    const ins = await c.query(
      `INSERT INTO pengajuan_cuti (pengaju_id, divisi_id, jenis_id, tanggal_pengajuan, tanggal_mulai, tanggal_selesai, setengah_hari,
         total_hari, alasan, handover_id, catatan_tugas, alamat_cuti, nomor_darurat, status, tahap)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'Pending',$14) RETURNING id`,
      [pengajuId, u.divisi_id, k.jenis.id, k.hariIni, input.mulai, input.selesai, Boolean(input.setengahHari), v.totalHari,
       String(input.alasan).trim(), Number(input.handoverId), input.catatanTugas || null, input.alamatCuti || null, input.nomorDarurat || null, tahap]
    );
    const id = ins.rows[0].id;
    if (lampiran) await tautkanLampiran(c, lampiran.id, id);
    await kirimNotifikasi(c, { id, pengaju: pengajuId, jenis: k.jenis, input, tahap, divisiId: u.divisi_id });
    return { ok: true, id };
  });
}

export async function batalkanPengajuan(db, id, userId, alasan) {
  const n = Number(id);
  if (!Number.isInteger(n)) return { ok: false, pesan: "Pengajuan tidak ditemukan." };
  if (!alasan || !String(alasan).trim()) return { ok: false, pesan: "Alasan pembatalan wajib diisi." };
  const r = await db.query(
    "UPDATE pengajuan_cuti SET status='Cancelled', alasan_batal=$3 WHERE id=$1 AND pengaju_id=$2 AND status='Pending'",
    [n, userId, String(alasan).trim()]
  );
  if (r.rowCount === 1) return { ok: true };
  const ada = (await db.query("SELECT pengaju_id FROM pengajuan_cuti WHERE id=$1", [n])).rows[0];
  if (!ada || ada.pengaju_id !== userId) return { ok: false, pesan: "Pengajuan tidak ditemukan." };
  return { ok: false, pesan: "Hanya pengajuan berstatus Pending yang dapat dibatalkan." };
}
