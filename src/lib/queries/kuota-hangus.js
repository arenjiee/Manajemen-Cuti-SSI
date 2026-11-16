import { hariIni } from "../leave/tanggal.js";
import { tambahTahun } from "../leave/aturan-jenis.js";
import { sisaKuota } from "../leave/kuota.js";
import { hariKerjaTersisa, risikoHangus, ambangValid, JEDA_PENGINGAT_HARI } from "../leave/kuota-hangus.js";
import { muatHariLibur } from "./hari-libur.js";
import { denganTransaksi } from "./tx.js";
import { parseId } from "../id.js";
import { formatHari } from "../format.js";

const PEMOHON = ["karyawan", "ketua_divisi"];

async function muatSisa(db, hari, idTertentu = null) {
  const tahun = Number(hari.slice(0, 4));
  const r = await db.query(
    `SELECT u.id, u.nama_lengkap, u.role, u.tanggal_bergabung, u.kuota_awal, dv.nama AS divisi_nama,
       COALESCE((SELECT SUM(p.total_hari) FROM pengajuan_cuti p JOIN jenis_cuti j ON j.id = p.jenis_id
                 WHERE p.pengaju_id = u.id AND j.potong_kuota AND p.status IN ('Pending','Approved by Leader','Approved')
                   AND EXTRACT(YEAR FROM p.tanggal_mulai) = $1), 0) AS terpakai,
       (SELECT max(n.created_at) FROM notifications n WHERE n.user_id = u.id AND n.tipe = 'pengingat') AS pengingat_terakhir
     FROM users u LEFT JOIN divisi dv ON dv.id = u.divisi_id AND dv.deleted_at IS NULL
     WHERE u.role = ANY($2) AND u.aktif AND u.deleted_at IS NULL AND u.tanggal_bergabung <= ($3::date - interval '1 year' + interval '1 day')
       AND ($4::int[] IS NULL OR u.id = ANY($4))
     ORDER BY u.nama_lengkap`,
    [tahun, PEMOHON, hari, idTertentu]
  );
  return r.rows.filter((u) => tambahTahun(u.tanggal_bergabung, 1) <= hari);
}

export async function daftarKuotaHangus(db, opts = {}) {
  const hari = opts.hari ?? hariIni();
  const ambang = ambangValid(opts.ambang);
  const tahun = Number(hari.slice(0, 4));
  const libur = await muatHariLibur(db, { dari: hari, sampai: `${tahun}-12-31` });
  const sisaHari = hariKerjaTersisa(hari, libur);
  const rows = (await muatSisa(db, hari))
    .map((u) => {
      const sisa = sisaKuota(u.kuota_awal, u.terpakai);
      return {
        id: u.id, nama: u.nama_lengkap, role: u.role, divisiNama: u.divisi_nama, kuotaAwal: u.kuota_awal, terpakai: u.terpakai, sisa,
        risiko: risikoHangus(sisa, sisaHari, ambang), pengingatTerakhir: u.pengingat_terakhir,
      };
    })
    .filter((u) => u.risiko)
    .sort((a, b) => b.sisa - a.sisa || a.nama.localeCompare(b.nama));
  return { hari, tahun, ambang, hariKerjaTersisa: sisaHari, rows };
}

export async function kirimPengingat(db, ids, opts = {}) {
  const hari = opts.hari ?? hariIni();
  const ambang = ambangValid(opts.ambang);
  const daftar = [...new Set(ids.map(parseId).filter((x) => x != null))].slice(0, 500);
  if (daftar.length === 0) return { terkirim: 0, dilewati: 0 };
  const tahun = Number(hari.slice(0, 4));
  const libur = await muatHariLibur(db, { dari: hari, sampai: `${tahun}-12-31` });
  const sisaHari = hariKerjaTersisa(hari, libur);
  return denganTransaksi(db, async (c) => {
    let terkirim = 0;
    for (const u of await muatSisa(c, hari, daftar)) {
      const sisa = sisaKuota(u.kuota_awal, u.terpakai);
      if (!risikoHangus(sisa, sisaHari, ambang)) continue;
      await c.query("SELECT id FROM users WHERE id=$1 FOR UPDATE", [u.id]);
      const pesan = `Sisa Cuti Tahunan Anda ${formatHari(sisa)} hari dan akan hangus pada 31 Desember ${tahun}. Segera ajukan cuti.`;
      const r = await c.query(
        `INSERT INTO notifications (user_id, tipe, pesan, link)
         SELECT $1, 'pengingat', $2, '/cuti/ajukan'
         WHERE NOT EXISTS (SELECT 1 FROM notifications WHERE user_id = $1 AND tipe = 'pengingat' AND created_at > now() - make_interval(days => $3))`,
        [u.id, pesan, JEDA_PENGINGAT_HARI]
      );
      terkirim += r.rowCount;
    }
    return { terkirim, dilewati: daftar.length - terkirim };
  });
}
