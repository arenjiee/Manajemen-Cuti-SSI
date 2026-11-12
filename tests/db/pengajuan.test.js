import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { testPool, resetDb } from "../helpers/db.js";
import { hariIni, tambahHari, adalahAkhirPekan } from "../../src/lib/leave/tanggal.js";
import { simpanPengajuan, batalkanPengajuan, terpakaiPotongKuota } from "../../src/lib/queries/pengajuan.js";
import { simpanMetaLampiran } from "../../src/lib/queries/lampiran.js";

const pool = testPool();
after(() => pool.end());

let ids, divisiId, TAHUNAN, SAKIT;
const q = (sql, p) => pool.query(sql, p);

// hari kerja ke-n (mulai 14 hari dari sekarang) agar lolos H-3 dan bebas akhir pekan
function hariKerja(n = 0) {
  let t = tambahHari(hariIni(), 14);
  let sisa = n;
  while (adalahAkhirPekan(t) || sisa-- > 0) t = tambahHari(t, 1);
  while (adalahAkhirPekan(t)) t = tambahHari(t, 1);
  return t;
}
const input = (o = {}) => ({ jenisId: TAHUNAN, mulai: hariKerja(0), selesai: hariKerja(0), setengahHari: false, alasan: "Keperluan", handoverId: ids.e, ...o });

async function user(username, role, divisi) {
  const r = await q(`INSERT INTO users (username,email,password_hash,nama_lengkap,role,tanggal_bergabung,divisi_id)
    VALUES ($1,$2,'x',$3,$4,'2022-01-01',$5) RETURNING id`, [username, `${username}@x.id`, username.toUpperCase(), role, divisi]);
  return r.rows[0].id;
}

beforeEach(async () => {
  await resetDb(pool);
  TAHUNAN = (await q(`INSERT INTO jenis_cuti (nama,kode,is_system,batas_pengajuan_hari,potong_kuota) VALUES ('Cuti Tahunan','tahunan',true,3,true) RETURNING id`)).rows[0].id;
  SAKIT = (await q(`INSERT INTO jenis_cuti (nama,kode,is_system,batas_pengajuan_hari,wajib_lampiran) VALUES ('Cuti Sakit','sakit',true,-3,true) RETURNING id`)).rows[0].id;
  const ketua = await user("ketua", "ketua_divisi", null);
  divisiId = (await q(`INSERT INTO divisi (nama,ketua_id,max_persen_cuti) VALUES ('FLM',$1,34) RETURNING id`, [ketua])).rows[0].id;
  await q("UPDATE users SET divisi_id=$1 WHERE id=$2", [divisiId, ketua]);
  ids = { ketua };
  for (const n of ["a", "b", "c", "d", "e"]) ids[n] = await user(n, "karyawan", divisiId);
  ids.hrd = await user("hrd", "hrd", null);
  ids.admin = await user("admin", "admin", null);
  ids.solo = await user("solo", "karyawan", null);
});

test("karyawan → Pending/leader; ketua divisi → Pending/hrd", async () => {
  const a = await simpanPengajuan(pool, ids.a, input());
  assert.equal(a.ok, true);
  const rA = (await q("SELECT status, tahap, divisi_id, total_hari FROM pengajuan_cuti WHERE id=$1", [a.id])).rows[0];
  assert.deepEqual(rA, { status: "Pending", tahap: "leader", divisi_id: divisiId, total_hari: 1 });
  const k = await simpanPengajuan(pool, ids.ketua, input({ mulai: hariKerja(3), selesai: hariKerja(3) }));
  assert.equal(k.ok, true);
  const rK = (await q("SELECT status, tahap FROM pengajuan_cuti WHERE id=$1", [k.id])).rows[0];
  assert.deepEqual(rK, { status: "Pending", tahap: "hrd" });
});

test("kegagalan validasi tidak membuat baris apa pun (kuota habis, tanggal mustahil, jenis tak dikenal)", async () => {
  await q("UPDATE users SET kuota_awal=0 WHERE id=$1", [ids.a]);
  const r = await simpanPengajuan(pool, ids.a, input());
  assert.deepEqual([r.ok, r.kode], [false, "KUOTA"]);
  assert.equal((await simpanPengajuan(pool, ids.b, input({ mulai: "2026-02-31" }))).kode, "BENTUK_DATA");
  assert.equal((await simpanPengajuan(pool, ids.b, input({ jenisId: 9999 }))).ok, false);
  assert.equal((await q("SELECT count(*)::int n FROM pengajuan_cuti")).rows[0].n, 0);
  assert.equal((await q("SELECT count(*)::int n FROM notifications")).rows[0].n, 0);
});

test("pengaju tanpa divisi dan role admin/hrd ditolak (Review Focus 5)", async () => {
  assert.equal((await simpanPengajuan(pool, ids.solo, input())).kode, "TANPA_DIVISI");
  assert.equal((await simpanPengajuan(pool, ids.admin, input())).ok, false);
  assert.equal((await simpanPengajuan(pool, ids.hrd, input())).ok, false);
  assert.equal((await q("SELECT count(*)::int n FROM pengajuan_cuti")).rows[0].n, 0);
});

test("submit paralel untuk slot kapasitas terakhir: tepat satu berhasil (Review Focus 4)", async () => {
  // batas harian = floor(34*6/100) = 2; satu slot sudah terisi oleh ketua, sisa satu slot
  const hari = hariKerja(2);
  const pre = await simpanPengajuan(pool, ids.ketua, input({ mulai: hari, selesai: hari, handoverId: ids.e }));
  assert.equal(pre.ok, true);
  // Panaskan pool: koneksi baru dibuat serial (SCRAM), yang menggeser waktu mulai transaksi dan menyembunyikan race.
  const hangat = await Promise.all(Array.from({ length: 5 }, () => pool.connect()));
  hangat.forEach((c) => c.release());
  const pesaing = [ids.a, ids.b, ids.c, ids.d];
  const hasil = await Promise.all(pesaing.map((u) => simpanPengajuan(pool, u, input({ mulai: hari, selesai: hari, handoverId: ids.e }))));
  assert.equal(hasil.filter((h) => h.ok).length, 1, JSON.stringify(hasil.map((h) => h.kode ?? "ok")));
  assert.ok(hasil.filter((h) => !h.ok).every((h) => h.kode === "KAPASITAS"));
  const n = (await q("SELECT count(*)::int n FROM pengajuan_cuti WHERE tanggal_mulai=$1 AND status='Pending'", [hari])).rows[0].n;
  assert.equal(n, 2);
});

test("kuota berkurang saat submit; kembali saat Cancelled atau Rejected", async () => {
  const tahun = Number(hariKerja(0).slice(0, 4));
  assert.equal(await terpakaiPotongKuota(pool, ids.a, tahun), 0);
  const r = await simpanPengajuan(pool, ids.a, input());
  assert.equal(await terpakaiPotongKuota(pool, ids.a, tahun), 1);
  assert.equal((await batalkanPengajuan(pool, r.id, ids.a, "Rencana berubah")).ok, true);
  assert.equal(await terpakaiPotongKuota(pool, ids.a, tahun), 0);
  const r2 = await simpanPengajuan(pool, ids.a, input());
  await q("UPDATE pengajuan_cuti SET status='Rejected', ditolak_oleh='leader' WHERE id=$1", [r2.id]);
  assert.equal(await terpakaiPotongKuota(pool, ids.a, tahun), 0);
});

test("batal: alasan wajib; hanya pemilik; hanya Pending; id non-numerik tidak melempar (Review Focus 2/3)", async () => {
  const r = await simpanPengajuan(pool, ids.a, input());
  assert.equal((await batalkanPengajuan(pool, r.id, ids.a, "  ")).ok, false);
  assert.equal((await batalkanPengajuan(pool, r.id, ids.b, "iseng")).ok, false);
  assert.equal((await batalkanPengajuan(pool, "abc", ids.a, "x")).ok, false);
  assert.equal((await batalkanPengajuan(pool, 999999, ids.a, "x")).ok, false);
  await q("UPDATE pengajuan_cuti SET status='Approved by Leader', tahap='hrd' WHERE id=$1", [r.id]);
  const nonPending = await batalkanPengajuan(pool, r.id, ids.a, "x");
  assert.equal(nonPending.ok, false);
  assert.match(nonPending.pesan, /Pending/);
  assert.equal((await q("SELECT status FROM pengajuan_cuti WHERE id=$1", [r.id])).rows[0].status, "Approved by Leader");
});

test("Cuti Sakit: lampiran wajib, tidak boleh memakai lampiran milik orang lain, lampiran sendiri ditautkan", async () => {
  const mulai = hariIni(), selesai = hariIni();
  const hariKerjaIni = adalahAkhirPekan(mulai) ? hariKerja(0) : mulai;
  const si = (o = {}) => input({ jenisId: SAKIT, mulai: hariKerjaIni, selesai: hariKerjaIni, ...o });
  assert.equal((await simpanPengajuan(pool, ids.a, si())).kode, "LAMPIRAN_WAJIB");
  const milikB = await simpanMetaLampiran(pool, ids.b, { nama_asli: "s.pdf", mime: "application/pdf", ukuran: 1000, storage_key: "k1" });
  const orangLain = await simpanPengajuan(pool, ids.a, si(), milikB);
  assert.equal(orangLain.ok, false);
  const milikA = await simpanMetaLampiran(pool, ids.a, { nama_asli: "s.pdf", mime: "application/pdf", ukuran: 1000, storage_key: "k2" });
  const ok = await simpanPengajuan(pool, ids.a, si(), milikA);
  assert.equal(ok.ok, true);
  assert.equal((await q("SELECT pengajuan_id FROM lampiran WHERE id=$1", [milikA])).rows[0].pengajuan_id, ok.id);
  const reuse = await simpanMetaLampiran(pool, ids.c, { nama_asli: "s.pdf", mime: "application/pdf", ukuran: 1000, storage_key: "k3" });
  await simpanPengajuan(pool, ids.c, si(), reuse);
  assert.equal((await simpanPengajuan(pool, ids.d, si(), reuse)).ok, false);
});

test("notifikasi: rekan pengganti dan ketua divisi (tahap leader); HRD untuk pengajuan ketua", async () => {
  await simpanPengajuan(pool, ids.a, input());
  const n1 = (await q("SELECT user_id, tipe FROM notifications ORDER BY user_id")).rows;
  assert.deepEqual(n1.map((x) => x.user_id).sort(), [ids.ketua, ids.e].sort());
  await q("DELETE FROM notifications");
  await simpanPengajuan(pool, ids.ketua, input({ mulai: hariKerja(4), selesai: hariKerja(4) }));
  const n2 = (await q("SELECT user_id FROM notifications")).rows.map((x) => x.user_id);
  assert.ok(n2.includes(ids.hrd) && n2.includes(ids.e));
});

test("overlap dan rekan sedang cuti ditolak pada pengajuan berikutnya", async () => {
  await simpanPengajuan(pool, ids.a, input());
  assert.equal((await simpanPengajuan(pool, ids.a, input())).kode, "OVERLAP");
  // e sedang cuti pada tanggal itu → tidak boleh jadi rekan pengganti b
  await simpanPengajuan(pool, ids.e, input({ handoverId: ids.d }));
  assert.equal((await simpanPengajuan(pool, ids.b, input({ handoverId: ids.e }))).kode, "REKAN_TIDAK_VALID");
});
