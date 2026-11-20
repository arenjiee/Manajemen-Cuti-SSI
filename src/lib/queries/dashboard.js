import { hariIni } from "../leave/tanggal.js";
import { tambahTahun } from "../leave/aturan-jenis.js";
import { rentangMinggu, rentangBulan, labelBulan } from "../periode.js";
import { ringkasanKuota } from "./kuota.js";
import { STATUS } from "./detail.js";
import { daftarDivisi } from "./divisi.js";

// Setiap fungsi menerima { hari } opsional ("YYYY-MM-DD") agar tes tidak bergantung pada jam sistem.
function konteks(opts) {
  const hari = opts?.hari ?? hariIni();
  return { hari, tahun: Number(hari.slice(0, 4)) };
}

const PEMOHON = ["karyawan", "ketua_divisi"];
const ROLE_KOSONG = () => ({ admin: 0, karyawan: 0, ketua_divisi: 0, hrd: 0 });

export async function dashboardAdmin(db, opts) {
  const { hari, tahun } = konteks(opts);
  const bulan = rentangBulan(hari);
  const [role, nonaktif, divisi, jenis, libur, tanpaDivisi, divisiTanpaKetua, cutiHariIni, baru, pengajuan] = await Promise.all([
    db.query("SELECT role, count(*)::int AS n FROM users WHERE deleted_at IS NULL AND aktif GROUP BY role"),
    db.query("SELECT count(*)::int AS n FROM users WHERE deleted_at IS NULL AND NOT aktif"),
    db.query("SELECT count(*)::int AS n FROM divisi WHERE deleted_at IS NULL"),
    db.query("SELECT count(*)::int AS n FROM jenis_cuti WHERE aktif"),
    db.query("SELECT count(*)::int AS n FROM hari_libur WHERE EXTRACT(YEAR FROM tanggal) = $1", [tahun]),
    db.query(
      `SELECT u.id, u.nama_lengkap, u.role, u.tanggal_bergabung
       FROM users u
       WHERE u.role = ANY($1) AND u.aktif AND u.deleted_at IS NULL AND u.divisi_id IS NULL
       ORDER BY u.role, u.nama_lengkap`,
      [PEMOHON]
    ),
    db.query(
      `SELECT d.id, d.nama, d.max_persen_cuti,
              (SELECT count(*)::int FROM users u WHERE u.divisi_id = d.id AND u.aktif AND u.deleted_at IS NULL) AS jumlah_anggota
       FROM divisi d
       WHERE d.deleted_at IS NULL AND d.ketua_id IS NULL
       ORDER BY d.nama`
    ),
    db.query(
      `SELECT p.id, u.id AS pengaju_id, u.nama_lengkap, d.nama AS divisi_nama, j.nama AS jenis_nama,
              p.tanggal_mulai, p.tanggal_selesai, p.total_hari
       FROM pengajuan_cuti p
       JOIN users u ON u.id = p.pengaju_id
       JOIN jenis_cuti j ON j.id = p.jenis_id
       LEFT JOIN divisi d ON d.id = p.divisi_id
       WHERE p.status = 'Approved'
         AND p.tanggal_mulai <= $1 AND p.tanggal_selesai >= $1
         AND u.aktif AND u.deleted_at IS NULL
       ORDER BY d.nama NULLS LAST, u.nama_lengkap`,
      [hari]
    ),
    // Prefilter longgar di SQL; batas pastinya memakai aturan yang sama dengan validasi Cuti Tahunan (tambahTahun).
    db.query(
      `SELECT u.id, u.nama_lengkap, u.role, u.tanggal_bergabung, d.nama AS divisi_nama
       FROM users u LEFT JOIN divisi d ON d.id = u.divisi_id AND d.deleted_at IS NULL
       WHERE u.role = ANY($1) AND u.aktif AND u.deleted_at IS NULL AND u.tanggal_bergabung > ($2::date - interval '2 years')
       ORDER BY u.tanggal_bergabung DESC, u.id`,
      [PEMOHON, hari]
    ),
    db.query(
      `SELECT count(*) FILTER (WHERE tanggal_pengajuan BETWEEN $1 AND $2)::int AS bulan_ini,
              count(*) FILTER (WHERE status IN ('Pending','Approved by Leader'))::int AS menunggu
       FROM pengajuan_cuti`,
      [bulan.dari, bulan.sampai]
    ),
  ]);
  const karyawanTanpaDivisi = tanpaDivisi.rows.filter((u) => u.role === "karyawan").length;
  const ketuaTanpaDivisi = tanpaDivisi.rows.filter((u) => u.role === "ketua_divisi").length;
  const perRole = ROLE_KOSONG();
  for (const r of role.rows) perRole[r.role] = r.n;
  return {
    perRole,
    totalAktif: Object.values(perRole).reduce((a, b) => a + b, 0),
    tidakAktif: nonaktif.rows[0].n,
    totalDivisi: divisi.rows[0].n,
    jenisCutiAktif: jenis.rows[0].n,
    hariLiburTahunIni: libur.rows[0].n,
    pengajuanBulanIni: pengajuan.rows[0].bulan_ini,
    pengajuanMenunggu: pengajuan.rows[0].menunggu,
    tanpaDivisi: {
      total: tanpaDivisi.rows.length,
      karyawan: karyawanTanpaDivisi,
      ketua: ketuaTanpaDivisi,
      rows: tanpaDivisi.rows,
    },
    divisiTanpaKetua: divisiTanpaKetua.rows,
    cutiHariIni: cutiHariIni.rows,
    bulan: { ...bulan, label: labelBulan(hari) },
    masaKerjaDiBawah1Tahun: baru.rows
      .map((u) => ({ ...u, layakTahunan: tambahTahun(u.tanggal_bergabung, 1) }))
      .filter((u) => u.layakTahunan > hari),
  };
}

export async function dashboardKaryawan(db, userId, opts) {
  const { hari, tahun } = konteks(opts);
  const kuota = await ringkasanKuota(db, userId, tahun);
  if (!kuota) return null;
  const [status, mendatang, terbaru, sakit, divisi] = await Promise.all([
    db.query(
      `SELECT status, count(*)::int AS n FROM pengajuan_cuti
       WHERE pengaju_id = $1 AND EXTRACT(YEAR FROM tanggal_mulai) = $2 GROUP BY status`,
      [userId, tahun]
    ),
    db.query(
      `SELECT p.id, p.tanggal_mulai, p.tanggal_selesai, p.total_hari, j.nama AS jenis_nama
       FROM pengajuan_cuti p JOIN jenis_cuti j ON j.id = p.jenis_id
       WHERE p.pengaju_id = $1 AND p.status = 'Approved' AND p.tanggal_selesai >= $2
       ORDER BY p.tanggal_mulai, p.id LIMIT 3`,
      [userId, hari]
    ),
    db.query(
      `SELECT p.id, p.tanggal_mulai, p.tanggal_selesai, p.total_hari, p.status, p.tahap, j.nama AS jenis_nama
       FROM pengajuan_cuti p JOIN jenis_cuti j ON j.id = p.jenis_id
       WHERE p.pengaju_id = $1 ORDER BY p.id DESC LIMIT 5`,
      [userId]
    ),
    db.query(
      `SELECT count(*)::int AS n FROM pengajuan_cuti p JOIN jenis_cuti j ON j.id = p.jenis_id
       WHERE p.pengaju_id = $1 AND j.kode = 'sakit' AND p.status <> 'Cancelled' AND EXTRACT(YEAR FROM p.tanggal_mulai) = $2`,
      [userId, tahun]
    ),
    db.query(
      `SELECT d.nama, k.nama_lengkap AS ketua_nama FROM users u
       JOIN divisi d ON d.id = u.divisi_id AND d.deleted_at IS NULL LEFT JOIN users k ON k.id = d.ketua_id AND k.deleted_at IS NULL
       WHERE u.id = $1`,
      [userId]
    ),
  ]);
  const perStatus = Object.fromEntries(STATUS.map((s) => [s, 0]));
  for (const r of status.rows) perStatus[r.status] = r.n;
  return {
    ...kuota,
    perStatus,
    menunggu: perStatus.Pending + perStatus["Approved by Leader"],
    totalPengajuan: Object.values(perStatus).reduce((a, b) => a + b, 0),
    cutiSakitDiajukan: sakit.rows[0].n,
    divisi: divisi.rows[0] ?? null,
    cutiMendatang: mendatang.rows,
    terbaru: terbaru.rows,
  };
}

export async function dashboardKetua(db, userId, opts) {
  const { hari, tahun } = konteks(opts);
  const u = (await db.query(
    "SELECT id, divisi_id FROM users WHERE id = $1 AND role = 'ketua_divisi' AND aktif AND deleted_at IS NULL", [userId])).rows[0];
  if (!u) return null;
  const kuota = await ringkasanKuota(db, userId, tahun);
  const minggu = rentangMinggu(hari);
  const hasil = { ...kuota, divisi: null, menungguVerifikasi: 0, totalMasuk: 0, anggotaCutiMingguIni: [], anggota: [], minggu };
  if (u.divisi_id == null) return hasil;

  const [dv, antre, cuti, masuk, anggota] = await Promise.all([
    db.query(
      `SELECT d.id, d.nama, (SELECT count(*)::int FROM users WHERE divisi_id = d.id AND aktif AND deleted_at IS NULL) AS jumlah_anggota_aktif
       FROM divisi d WHERE d.id = $1 AND d.deleted_at IS NULL`,
      [u.divisi_id]
    ),
    // Syarat sama persis dengan antreanLeader() agar angka dashboard = isi halaman Verifikasi.
    db.query(
      "SELECT count(*)::int AS n FROM pengajuan_cuti WHERE divisi_id = $1 AND status = 'Pending' AND tahap = 'leader' AND pengaju_id <> $2",
      [u.divisi_id, userId]
    ),
    db.query(
      `SELECT p.id, u.id AS user_id, u.nama_lengkap, j.nama AS jenis_nama, p.tanggal_mulai, p.tanggal_selesai, p.total_hari
       FROM pengajuan_cuti p JOIN users u ON u.id = p.pengaju_id JOIN jenis_cuti j ON j.id = p.jenis_id
       WHERE u.divisi_id = $1 AND u.aktif AND u.deleted_at IS NULL AND u.id <> $2
         AND p.status = 'Approved' AND p.tanggal_mulai <= $4 AND p.tanggal_selesai >= $3
       ORDER BY p.tanggal_mulai, u.nama_lengkap, p.id`,
      [u.divisi_id, userId, minggu.dari, minggu.sampai]
    ),
    db.query(
      "SELECT count(*)::int AS n FROM pengajuan_cuti WHERE divisi_id = $1 AND pengaju_id <> $2 AND EXTRACT(YEAR FROM tanggal_mulai) = $3",
      [u.divisi_id, userId, tahun]
    ),
    db.query(
      "SELECT id, nama_lengkap FROM users WHERE divisi_id = $1 AND id <> $2 AND aktif AND deleted_at IS NULL ORDER BY nama_lengkap",
      [u.divisi_id, userId]
    ),
  ]);
  hasil.totalMasuk = masuk.rows[0].n;
  hasil.anggota = anggota.rows.map((a) => ({ ...a, cutiMingguIni: cuti.rows.some((c) => c.user_id === a.id) }));
  hasil.divisi = dv.rows[0] ?? null;
  hasil.menungguVerifikasi = antre.rows[0].n;
  hasil.anggotaCutiMingguIni = cuti.rows;
  return hasil;
}

export async function dashboardHrd(db, opts) {
  const { hari } = konteks(opts);
  const bulan = { ...rentangBulan(hari), label: labelBulan(hari) };
  const [final, cuti, pengajuan, divisi] = await Promise.all([
    // Syarat sama persis dengan antreanHrd().
    db.query("SELECT count(*)::int AS n FROM pengajuan_cuti WHERE tahap = 'hrd' AND status IN ('Pending','Approved by Leader')"),
    db.query(
      `SELECT p.id, u.id AS user_id, u.nama_lengkap, dv.nama AS divisi_nama, j.nama AS jenis_nama, p.tanggal_mulai, p.tanggal_selesai, p.total_hari
       FROM pengajuan_cuti p JOIN users u ON u.id = p.pengaju_id JOIN jenis_cuti j ON j.id = p.jenis_id
       LEFT JOIN divisi dv ON dv.id = p.divisi_id
       WHERE u.aktif AND u.deleted_at IS NULL AND p.status = 'Approved' AND p.tanggal_mulai <= $2 AND p.tanggal_selesai >= $1
       ORDER BY p.tanggal_mulai, u.nama_lengkap, p.id`,
      [bulan.dari, bulan.sampai]
    ),
    db.query("SELECT count(*)::int AS n FROM pengajuan_cuti WHERE tanggal_pengajuan BETWEEN $1 AND $2", [bulan.dari, bulan.sampai]),
    daftarDivisi(db, {}),
  ]);
  return {
    pengajuanBulanIni: pengajuan.rows[0].n,
    divisi: divisi.map((d) => ({ ...d, cutiBulanIni: new Set(cuti.rows.filter((c) => c.divisi_nama === d.nama).map((c) => c.user_id)).size })),
    menungguFinal: final.rows[0].n,
    cutiBulanIni: cuti.rows,
    jumlahOrangCuti: new Set(cuti.rows.map((r) => r.user_id)).size,
    bulan,
  };
}
