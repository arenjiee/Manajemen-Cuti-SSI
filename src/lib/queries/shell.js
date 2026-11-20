import { hariIni } from "../leave/tanggal.js";
import { rentangMinggu, rentangBulan } from "../periode.js";

/**
 * Mengambil ringkasan metrik ringan untuk top bar shell berdasarkan role.
 * Query dibatasi ke metrik kunci agar pemanggilan di root layout tetap cepat.
 *
 * @param {import("pg").Pool} db
 * @param {{ id: number, role: string }} user
 * @param {{ hari?: string }} [opts]
 */
export async function ringkasanShell(db, user, opts) {
  const hari = opts?.hari ?? hariIni();
  const peran = user.role;

  if (peran === "admin") {
    const [u, p] = await Promise.all([
      db.query("SELECT count(*)::int AS n FROM users WHERE deleted_at IS NULL AND aktif"),
      db.query("SELECT count(*)::int AS n FROM pengajuan_cuti WHERE status IN ('Pending','Approved by Leader')"),
    ]);
    return {
      role: "admin",
      totalAktif: u.rows[0]?.n ?? 0,
      pengajuanMenunggu: p.rows[0]?.n ?? 0,
    };
  }

  if (peran === "hrd") {
    const bulan = rentangBulan(hari);
    const [final, cuti] = await Promise.all([
      db.query("SELECT count(*)::int AS n FROM pengajuan_cuti WHERE tahap = 'hrd' AND status IN ('Pending','Approved by Leader')"),
      db.query(
        `SELECT count(DISTINCT p.pengaju_id)::int AS n
         FROM pengajuan_cuti p JOIN users u ON u.id = p.pengaju_id
         WHERE u.aktif AND u.deleted_at IS NULL AND p.status = 'Approved'
           AND p.tanggal_mulai <= $2 AND p.tanggal_selesai >= $1`,
        [bulan.dari, bulan.sampai]
      ),
    ]);
    return {
      role: "hrd",
      menungguFinal: final.rows[0]?.n ?? 0,
      jumlahOrangCuti: cuti.rows[0]?.n ?? 0,
    };
  }

  if (peran === "ketua_divisi") {
    const u = (
      await db.query(
        "SELECT id, divisi_id FROM users WHERE id = $1 AND role = 'ketua_divisi' AND aktif AND deleted_at IS NULL",
        [user.id]
      )
    ).rows[0];

    if (!u || u.divisi_id == null) {
      return {
        role: "ketua_divisi",
        divisiNama: null,
        menungguVerifikasi: 0,
        anggotaCutiMingguIni: 0,
      };
    }

    const minggu = rentangMinggu(hari);
    const [dv, antre, cuti] = await Promise.all([
      db.query("SELECT nama FROM divisi WHERE id = $1 AND deleted_at IS NULL", [u.divisi_id]),
      db.query(
        "SELECT count(*)::int AS n FROM pengajuan_cuti WHERE divisi_id = $1 AND status = 'Pending' AND tahap = 'leader' AND pengaju_id <> $2",
        [u.divisi_id, user.id]
      ),
      db.query(
        `SELECT count(DISTINCT p.pengaju_id)::int AS n
         FROM pengajuan_cuti p JOIN users u2 ON u2.id = p.pengaju_id
         WHERE u2.divisi_id = $1 AND u2.aktif AND u2.deleted_at IS NULL AND u2.id <> $2
           AND p.status = 'Approved' AND p.tanggal_mulai <= $4 AND p.tanggal_selesai >= $3`,
        [u.divisi_id, user.id, minggu.dari, minggu.sampai]
      ),
    ]);

    return {
      role: "ketua_divisi",
      divisiNama: dv.rows[0]?.nama ?? null,
      menungguVerifikasi: antre.rows[0]?.n ?? 0,
      anggotaCutiMingguIni: cuti.rows[0]?.n ?? 0,
    };
  }

  // Karyawan: ambil pengajuan menunggu
  const p = await db.query(
    "SELECT count(*)::int AS n FROM pengajuan_cuti WHERE pengaju_id = $1 AND status IN ('Pending','Approved by Leader')",
    [user.id]
  );
  return {
    role: "karyawan",
    menunggu: p.rows[0]?.n ?? 0,
  };
}
