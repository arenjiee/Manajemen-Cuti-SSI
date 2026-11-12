import { denganTransaksi } from "./tx.js";
import { parseId } from "../id.js";
import { terpakaiPotongKuota } from "./pengajuan.js";
import { muatHariLibur } from "./hari-libur.js";
import { hariKerjaDalamRentang } from "../leave/hitung-hari.js";
import { batasHarian, cekKapasitas } from "../leave/kapasitas.js";
import { sisaKuota } from "../leave/kuota.js";

const gagal = (pesan) => ({ ok: false, pesan });
const PERAN = { leader: "Ketua Divisi", hrd: "HRD" };

// Satu UPDATE bersyarat menentukan siapa yang menang saat dua keputusan bertabrakan:
// transaksi kedua menunggu, lalu membaca status baru dan tidak menemukan baris yang cocok.
export async function putuskan(pool, { pengajuanId, approverId, tahap, keputusan, catatan }) {
  const id = parseId(pengajuanId);
  if (id == null) return gagal("Pengajuan tidak ditemukan.");
  if (!["approve", "reject"].includes(keputusan)) return gagal("Keputusan tidak valid.");
  if (!PERAN[tahap]) return gagal("Tahap tidak valid.");
  const cat = typeof catatan === "string" && catatan.trim() ? catatan.trim() : null;
  if (keputusan === "reject" && !cat) return gagal("Catatan wajib diisi saat menolak pengajuan.");

  return denganTransaksi(pool, async (c) => {
    const a = (await c.query("SELECT id, role, divisi_id FROM users WHERE id=$1 AND aktif AND deleted_at IS NULL", [approverId])).rows[0];
    if (!a || a.role !== (tahap === "leader" ? "ketua_divisi" : "hrd")) return gagal("Anda tidak berwenang memutuskan pengajuan ini.");

    const setir = tahap === "leader"
      ? (keputusan === "approve" ? "status='Approved by Leader', tahap='hrd'" : "status='Rejected', ditolak_oleh='leader'")
      : (keputusan === "approve" ? "status='Approved'" : "status='Rejected', ditolak_oleh='hrd'");
    const [syarat, param] = tahap === "leader"
      ? ["status='Pending' AND tahap='leader' AND divisi_id=$2 AND pengaju_id<>$3", [id, a.divisi_id, a.id]]
      : ["tahap='hrd' AND status IN ('Pending','Approved by Leader') AND pengaju_id<>$2", [id, a.id]];
    const r = await c.query(
      `UPDATE pengajuan_cuti SET ${setir} WHERE id=$1 AND ${syarat} RETURNING pengaju_id, tanggal_mulai, tanggal_selesai`,
      param
    );
    if (r.rowCount !== 1) return gagal("Pengajuan sudah diproses, dibatalkan, atau bukan wewenang Anda.");
    const { pengaju_id } = r.rows[0];

    await c.query("INSERT INTO persetujuan (pengajuan_id, tahap, approver_id, keputusan, catatan) VALUES ($1,$2,$3,$4,$5)", [id, tahap, a.id, keputusan, cat]);

    let pesan;
    if (keputusan === "reject") pesan = `Pengajuan cuti Anda ditolak ${PERAN[tahap]}. Catatan: ${cat}`;
    else if (tahap === "leader") pesan = "Pengajuan cuti Anda disetujui Ketua Divisi dan menunggu persetujuan final HRD.";
    else pesan = "Pengajuan cuti Anda telah disetujui HRD.";
    await c.query("INSERT INTO notifications (user_id, tipe, pesan, link) VALUES ($1,'keputusan',$2,$3)", [pengaju_id, pesan, `/cuti/${id}`]);

    if (tahap === "leader" && keputusan === "approve") {
      await c.query(
        `INSERT INTO notifications (user_id, tipe, pesan, link)
         SELECT id, 'pengajuan', 'Ada pengajuan cuti yang menunggu persetujuan final Anda.', '/persetujuan' FROM users WHERE role='hrd' AND aktif AND deleted_at IS NULL`
      );
    }
    return { ok: true };
  });
}

const KOLOM_KARTU = `p.id, p.pengaju_id, pg.nama_lengkap AS pengaju_nama, pg.foto_key, dv.nama AS divisi_nama, j.nama AS jenis_nama,
  p.tanggal_mulai, p.tanggal_selesai, p.total_hari, p.setengah_hari, p.alasan, p.catatan_tugas, p.tanggal_pengajuan, p.status, p.tahap,
  h.nama_lengkap AS handover_nama,
  COALESCE((SELECT json_agg(json_build_object('id', l.id, 'nama_asli', l.nama_asli, 'mime', l.mime) ORDER BY l.id) FROM lampiran l WHERE l.pengajuan_id = p.id), '[]') AS lampiran`;
const DARI_KARTU = `FROM pengajuan_cuti p JOIN users pg ON pg.id = p.pengaju_id JOIN jenis_cuti j ON j.id = p.jenis_id
  LEFT JOIN divisi dv ON dv.id = p.divisi_id LEFT JOIN users h ON h.id = p.handover_id`;

export async function antreanLeader(db, user) {
  if (user.divisi_id == null) return [];
  const r = await db.query(
    `SELECT ${KOLOM_KARTU} ${DARI_KARTU}
     WHERE p.divisi_id = $1 AND p.status = 'Pending' AND p.tahap = 'leader' AND p.pengaju_id <> $2 ORDER BY p.created_at, p.id`,
    [user.divisi_id, user.id]
  );
  return r.rows;
}

export async function antreanHrd(db) {
  const r = await db.query(
    `SELECT ${KOLOM_KARTU},
       (SELECT json_build_object('nama', u.nama_lengkap, 'waktu', s.created_at, 'catatan', s.catatan)
          FROM persetujuan s JOIN users u ON u.id = s.approver_id
         WHERE s.pengajuan_id = p.id AND s.tahap = 'leader' AND s.keputusan = 'approve' ORDER BY s.id DESC LIMIT 1) AS atasan
     ${DARI_KARTU}
     WHERE p.tahap = 'hrd' AND p.status IN ('Pending','Approved by Leader') ORDER BY p.created_at, p.id`
  );
  return r.rows;
}

// Dihitung ulang saat HRD membuka kartu; hanya peringatan, keputusan tetap di tangan HRD.
export async function muatPeringatanHrd(db, pengajuanId) {
  const id = parseId(pengajuanId);
  const kosong = { kuotaKurang: false };
  if (id == null) return kosong;
  const p = (await db.query(
    `SELECT p.pengaju_id, p.divisi_id, p.tanggal_mulai, p.tanggal_selesai, j.kode, j.potong_kuota, u.kuota_awal
     FROM pengajuan_cuti p JOIN jenis_cuti j ON j.id = p.jenis_id JOIN users u ON u.id = p.pengaju_id WHERE p.id = $1`, [id])).rows[0];
  if (!p) return kosong;

  const tahun = Number(p.tanggal_mulai.slice(0, 4));
  const hasil = { kuotaKurang: Boolean(p.potong_kuota) && sisaKuota(p.kuota_awal, await terpakaiPotongKuota(db, p.pengaju_id, tahun)) < 0 };

  if (p.kode !== "sakit" && p.divisi_id) {
    const dv = (await db.query("SELECT max_persen_cuti FROM divisi WHERE id=$1", [p.divisi_id])).rows[0];
    const jumlah = (await db.query("SELECT count(*)::int n FROM users WHERE divisi_id=$1 AND aktif AND deleted_at IS NULL", [p.divisi_id])).rows[0].n;
    if (dv) {
      const libur = await muatHariLibur(db, { dari: p.tanggal_mulai, sampai: p.tanggal_selesai });
      const lain = (await db.query(
        `SELECT d::date AS tanggal, count(DISTINCT p2.pengaju_id)::int AS n
         FROM generate_series($2::date, $3::date, interval '1 day') d
         JOIN pengajuan_cuti p2 ON p2.divisi_id = $1 AND p2.id <> $4 AND p2.pengaju_id <> $5
          AND p2.status IN ('Pending','Approved by Leader','Approved') AND p2.tanggal_mulai <= d::date AND p2.tanggal_selesai >= d::date
         GROUP BY d`, [p.divisi_id, p.tanggal_mulai, p.tanggal_selesai, id, p.pengaju_id])).rows;
      const r = cekKapasitas({
        hariKerja: hariKerjaDalamRentang(p.tanggal_mulai, p.tanggal_selesai, libur),
        okupansi: new Map(lain.map((x) => [x.tanggal, x.n])),
        batas: batasHarian(dv.max_persen_cuti, jumlah),
      });
      if (!r.ok) hasil.kapasitasPenuh = { tanggal: r.tanggalPenuh, terisi: r.terisi, batas: r.batas };
    }
  }
  return hasil;
}

// Satu transaksi per item: item yang gagal dilewati dan dilaporkan, sisanya tetap diproses.
export async function approveBanyak(pool, hrdId, ids) {
  const berhasil = [], dilewati = [];
  for (const raw of ids) {
    const r = await putuskan(pool, { pengajuanId: raw, approverId: hrdId, tahap: "hrd", keputusan: "approve", catatan: null });
    if (r.ok) berhasil.push(parseId(raw));
    else dilewati.push({ id: raw, pesan: r.pesan });
  }
  return { berhasil, dilewati };
}
