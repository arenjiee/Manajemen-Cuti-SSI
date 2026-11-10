import bcrypt from "bcryptjs";

const PASSWORD = "password123";

export async function seed(pool) {
  const hash = await bcrypt.hash(PASSWORD, 10);
  const q = (sql, p) => pool.query(sql, p);

  // Jenis cuti
  await q(`INSERT INTO jenis_cuti (nama, kode, is_system, kuota_hari, batas_pengajuan_hari, wajib_lampiran, potong_kuota) VALUES
    ('Cuti Tahunan','tahunan',true,NULL,3,false,true),
    ('Cuti Sakit','sakit',true,NULL,-3,true,false),
    ('Cuti Menikah',NULL,false,3,7,true,false),
    ('Cuti Duka',NULL,false,2,0,false,false)`);

  const mk = async (username, nama, role, bergabung, extra = {}) => {
    const r = await q(
      `INSERT INTO users (username,email,password_hash,nama_lengkap,telepon,alamat,role,tanggal_bergabung)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
      [username, `${username}@ssi.co.id`, hash, nama, extra.telepon ?? "0811000000", "Makassar", role, bergabung]
    );
    return r.rows[0].id;
  };

  const admin = await mk("admin", "Admin Sistem", "admin", "2020-01-01");
  const hrd = await mk("hrd", "Hesti HRD", "hrd", "2020-03-01");
  const kCpc = await mk("ketua.cpc", "Kirana Ketua CPC", "ketua_divisi", "2019-05-01");
  const kCit = await mk("ketua.cit", "Kurnia Ketua CIT", "ketua_divisi", "2019-06-01");
  const kFlm = await mk("ketua.flm", "Kartono Ketua FLM", "ketua_divisi", "2019-07-01");

  const div = async (nama, desk, ketua, persen) =>
    (await q("INSERT INTO divisi (nama, deskripsi, ketua_id, max_persen_cuti) VALUES ($1,$2,$3,$4) RETURNING id", [nama, desk, ketua, persen])).rows[0].id;
  const dCpc = await div("CPC", "Cash Processing Center: penyortir dan penghitung uang", kCpc, 25);
  const dCit = await div("CIT", "Cash in Transit: pengawalan dan pengiriman uang", kCit, 25);
  const dFlm = await div("FLM", "First Line Maintenance: perbaikan ringan dan pengisian kaset ATM", kFlm, 34);
  await q("UPDATE users SET divisi_id=$1 WHERE id=$2", [dCpc, kCpc]);
  await q("UPDATE users SET divisi_id=$1 WHERE id=$2", [dCit, kCit]);
  await q("UPDATE users SET divisi_id=$1 WHERE id=$2", [dFlm, kFlm]);

  const anggota = async (divisi, list) => {
    const ids = {};
    for (const [u, n, tgl] of list) {
      ids[u] = await mk(u, n, "karyawan", tgl);
      await q("UPDATE users SET divisi_id=$1 WHERE id=$2", [divisi, ids[u]]);
    }
    return ids;
  };
  const cpc = await anggota(dCpc, [["eka", "Eka Putri", "2022-02-01"], ["hana", "Hana Lestari", "2021-08-01"], ["ivan", "Ivan Saputra", "2023-01-10"], ["joko", "Joko Santoso", "2022-09-05"]]);
  const cit = await anggota(dCit, [["fajar", "Fajar Nugraha", "2022-04-01"], ["gita", "Gita Permata", "2023-03-15"], ["lani", "Lani Marlina", "2021-11-01"], ["mirza", "Mirza Akbar", "2022-12-01"]]);
  const flm = await anggota(dFlm, [["ana", "Ana Rahma", "2022-01-03"], ["dedi", "Dedi Kurniawan", "2021-06-01"], ["budi", "Budi Hartono", "2020-02-01"], ["cici", "Cici Amelia", "2023-05-01"], ["rina", "Rina Karyawan Baru", "2026-06-01"]]);

  await q(`INSERT INTO hari_libur (tanggal, keterangan, jenis) VALUES
    ('2026-01-01','Tahun Baru 2026','nasional'),('2026-05-01','Hari Buruh','nasional'),
    ('2026-06-01','Hari Lahir Pancasila','nasional'),('2026-08-17','Hari Kemerdekaan RI','nasional'),
    ('2026-12-24','Cuti Bersama Natal','cuti_bersama'),('2026-12-25','Hari Natal','nasional')`);
  await q(`INSERT INTO pengaturan (key,value) VALUES ('ambang_kuota_hangus','8'),('bulan_mulai_peringatan','9')`);

  const J = { tahunan: 1, sakit: 2 };
  const ajukan = async (o) => {
    const r = await q(
      `INSERT INTO pengajuan_cuti (pengaju_id,divisi_id,jenis_id,tanggal_mulai,tanggal_selesai,setengah_hari,total_hari,alasan,handover_id,catatan_tugas,alamat_cuti,nomor_darurat,status,tahap,ditolak_oleh,alasan_batal)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'Makassar','08120000000',$11,$12,$13,$14) RETURNING id`,
      [o.pengaju, o.divisi, o.jenis, o.mulai, o.selesai, !!o.setengah, o.total, o.alasan, o.handover, o.catatan ?? "Serah terima tugas harian",
       o.status, o.tahap, o.ditolak ?? null, o.batal ?? null]
    );
    return r.rows[0].id;
  };
  const setuju = (id, tahap, approver, keputusan, catatan = null) =>
    q("INSERT INTO persetujuan (pengajuan_id,tahap,approver_id,keputusan,catatan) VALUES ($1,$2,$3,$4,$5)", [id, tahap, approver, keputusan, catatan]);

  // FLM penuh 2026-11-18 (batas 2 dari 6 anggota): ana Approved, dedi Approved by Leader
  const pAna = await ajukan({ pengaju: flm.ana, divisi: dFlm, jenis: J.tahunan, mulai: "2026-11-18", selesai: "2026-11-18", total: 1, alasan: "Urusan keluarga", handover: flm.cici, status: "Approved", tahap: "hrd" });
  await setuju(pAna, "leader", kFlm, "approve"); await setuju(pAna, "hrd", hrd, "approve", "Disetujui");
  const pDedi = await ajukan({ pengaju: flm.dedi, divisi: dFlm, jenis: J.tahunan, mulai: "2026-11-18", selesai: "2026-11-18", total: 1, alasan: "Keperluan pribadi", handover: flm.budi, status: "Approved by Leader", tahap: "hrd" });
  await setuju(pDedi, "leader", kFlm, "approve", "Silakan");
  // Pending tahap leader
  await ajukan({ pengaju: cpc.eka, divisi: dCpc, jenis: J.tahunan, mulai: "2026-12-07", selesai: "2026-12-09", total: 3, alasan: "Liburan akhir tahun", handover: cpc.joko, status: "Pending", tahap: "leader" });
  // Ketua CIT sedang cuti minggu ini (Approved)
  const pKcit = await ajukan({ pengaju: kCit, divisi: dCit, jenis: J.tahunan, mulai: "2026-11-09", selesai: "2026-11-13", total: 5, alasan: "Cuti keluarga", handover: cit.lani, status: "Approved", tahap: "hrd" });
  await setuju(pKcit, "hrd", hrd, "approve");
  // Ketua CPC pending HRD
  await ajukan({ pengaju: kCpc, divisi: dCpc, jenis: J.tahunan, mulai: "2026-12-14", selesai: "2026-12-16", total: 3, alasan: "Acara keluarga", handover: cpc.hana, status: "Pending", tahap: "hrd" });
  // Rejected leader
  const pFajar = await ajukan({ pengaju: cit.fajar, divisi: dCit, jenis: J.tahunan, mulai: "2026-11-23", selesai: "2026-11-25", total: 3, alasan: "Perjalanan", handover: cit.mirza, status: "Rejected", tahap: "leader", ditolak: "leader" });
  await setuju(pFajar, "leader", kCit, "reject", "Jadwal pengawalan padat pada tanggal tersebut");
  // Rejected HRD
  const pIvan = await ajukan({ pengaju: cpc.ivan, divisi: dCpc, jenis: J.tahunan, mulai: "2026-11-30", selesai: "2026-12-02", total: 3, alasan: "Liburan", handover: cpc.joko, status: "Rejected", tahap: "hrd", ditolak: "hrd" });
  await setuju(pIvan, "leader", kCpc, "approve"); await setuju(pIvan, "hrd", hrd, "reject", "Bertepatan dengan penutupan periode");
  // Cancelled
  await ajukan({ pengaju: cit.gita, divisi: dCit, jenis: J.tahunan, mulai: "2026-12-01", selesai: "2026-12-01", total: 1, alasan: "Keperluan", handover: cit.lani, status: "Cancelled", tahap: "leader", batal: "Rencana berubah" });
  // Sakit Approved dengan lampiran
  const pHana = await ajukan({ pengaju: cpc.hana, divisi: dCpc, jenis: J.sakit, mulai: "2026-11-02", selesai: "2026-11-03", total: 2, alasan: "Demam tinggi", handover: cpc.eka, status: "Approved", tahap: "hrd" });
  await setuju(pHana, "leader", kCpc, "approve"); await setuju(pHana, "hrd", hrd, "approve");
  await q("INSERT INTO lampiran (pengajuan_id,nama_asli,mime,ukuran,storage_key) VALUES ($1,'surat-dokter-contoh.pdf','application/pdf',$2,'surat-dokter-contoh.pdf')", [pHana, 500]);

  await q("INSERT INTO notifications (user_id,tipe,pesan,link) VALUES ($1,'handover','Anda ditunjuk sebagai rekan pengganti Ana Rahma pada 18 Nov 2026','/cuti')", [flm.cici]);
  return { admin, hrd };
}
