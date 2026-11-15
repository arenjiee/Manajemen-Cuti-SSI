import { test, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { testPool, resetDb } from "../helpers/db.js";
import { seed } from "../../scripts/seed.mjs";
import { dashboardAdmin, dashboardKaryawan, dashboardKetua, dashboardHrd } from "../../src/lib/queries/dashboard.js";

const pool = testPool();
const q = (s, p) => pool.query(s, p);
const HARI = "2026-11-10"; // Selasa; minggu 9-15 Nov, bulan November 2026
const opts = { hari: HARI };
let id = {};

// Tiap tes mulai dari seed bersih supaya data tambahan tes lain tidak ikut terhitung.
beforeEach(async () => {
  await resetDb(pool);
  await seed(pool);
  const r = await q("SELECT id, username FROM users");
  id = Object.fromEntries(r.rows.map((x) => [x.username, x.id]));
});
after(() => pool.end());

const sisip = (pengaju, divisi, mulai, selesai, total, status, { setengah = false, jenis = 1, tahap = "hrd" } = {}) =>
  q(`INSERT INTO pengajuan_cuti (pengaju_id,divisi_id,jenis_id,tanggal_mulai,tanggal_selesai,setengah_hari,total_hari,alasan,handover_id,status,tahap)
     VALUES ($1,$2,$3,$4,$5,$6,$7,'x',$1,$8,$9)`, [pengaju, divisi, jenis, mulai, selesai, setengah, total, status, tahap]);
const divisiDari = async (username) => (await q("SELECT divisi_id FROM users WHERE username=$1", [username])).rows[0].divisi_id;

test("karyawan: sisa kuota = 12 − pemakaian aktif (Pending, Approved by Leader, Approved saja)", async () => {
  const ana = await dashboardKaryawan(pool, id.ana, opts);   // Approved 1 hari
  assert.equal(ana.kuotaAwal, 12); assert.equal(ana.terpakai, 1); assert.equal(ana.sisa, 11);
  assert.equal((await dashboardKaryawan(pool, id.dedi, opts)).sisa, 11);  // Approved by Leader 1 hari
  assert.equal((await dashboardKaryawan(pool, id.eka, opts)).sisa, 9);    // Pending 3 hari
  for (const u of ["fajar", "ivan", "gita"]) assert.equal((await dashboardKaryawan(pool, id[u], opts)).sisa, 12, u); // Rejected/Cancelled
  assert.equal((await dashboardKaryawan(pool, id.hana, opts)).sisa, 12);  // Cuti Sakit tidak memotong kuota
});

test("karyawan: rekap status, cuti mendatang, dan pengajuan terbaru", async () => {
  const ana = await dashboardKaryawan(pool, id.ana, opts);
  assert.equal(ana.perStatus.Approved, 1);
  assert.equal(ana.menunggu, 0);
  assert.deepEqual(ana.cutiMendatang.map((c) => c.tanggal_mulai), ["2026-11-18"]);
  assert.equal(ana.terbaru.length, 1);
  const dedi = await dashboardKaryawan(pool, id.dedi, opts);
  assert.equal(dedi.menunggu, 1); assert.equal(dedi.perStatus["Approved by Leader"], 1);
  assert.deepEqual(dedi.cutiMendatang, []);   // belum Approved
  const gita = await dashboardKaryawan(pool, id.gita, opts);
  assert.equal(gita.perStatus.Cancelled, 1); assert.equal(gita.perStatus.Pending, 0);
});

test("karyawan: sisa pecahan 0,5 tampil benar dan cuti yang sudah lewat tidak jadi 'mendatang'", async () => {
  const dFlm = await divisiDari("budi");
  await sisip(id.budi, dFlm, "2026-11-24", "2026-11-24", 0.5, "Approved", { setengah: true });
  await sisip(id.budi, dFlm, "2026-11-03", "2026-11-03", 1, "Approved");
  const b = await dashboardKaryawan(pool, id.budi, opts);
  assert.equal(b.terpakai, 1.5); assert.equal(b.sisa, 10.5);
  assert.deepEqual(b.cutiMendatang.map((c) => c.tanggal_mulai), ["2026-11-24"]);
  await q("DELETE FROM pengajuan_cuti WHERE pengaju_id=$1 AND tanggal_mulai='2026-11-03'", [id.budi]);
  assert.equal((await dashboardKaryawan(pool, id.budi, opts)).sisa, 11.5);
});

test("karyawan: hanya pemakaian tahun berjalan; user tidak ada atau terhapus → null", async () => {
  const dCit = await divisiDari("lani");
  await sisip(id.lani, dCit, "2025-12-01", "2025-12-05", 5, "Approved");
  assert.equal((await dashboardKaryawan(pool, id.lani, opts)).sisa, 12);
  assert.equal(await dashboardKaryawan(pool, 999999, opts), null);
  await q("UPDATE users SET deleted_at=now(), aktif=false WHERE id=$1", [id.joko]);
  assert.equal(await dashboardKaryawan(pool, id.joko, opts), null);
});

test("ketua: antrean verifikasi, anggota cuti minggu ini (hanya Approved, hanya minggu ini), sisa kuota sendiri", async () => {
  const k = await dashboardKetua(pool, id["ketua.cpc"], opts);
  assert.equal(k.divisi.nama, "CPC");
  assert.equal(k.menungguVerifikasi, 1);              // eka; pengajuan ketua sendiri (tahap hrd) tidak terhitung
  assert.deepEqual(k.anggotaCutiMingguIni, []);       // sakit hana 2-3 Nov = minggu lalu
  assert.equal(k.sisa, 9);                            // Pending 3 hari milik ketua

  const dCit = await divisiDari("mirza");
  await sisip(id.mirza, dCit, "2026-11-11", "2026-11-12", 2, "Approved");             // minggu ini
  await sisip(id.gita, dCit, "2026-11-16", "2026-11-16", 1, "Approved");              // minggu depan
  await sisip(id.lani, dCit, "2026-11-13", "2026-11-13", 1, "Pending", { tahap: "leader" }); // belum Approved
  const c = await dashboardKetua(pool, id["ketua.cit"], opts);
  assert.deepEqual(c.anggotaCutiMingguIni.map((a) => a.nama_lengkap), ["Mirza Akbar"]); // ketua sendiri tidak ikut daftar
  assert.deepEqual(c.minggu, { dari: "2026-11-09", sampai: "2026-11-15" });
  assert.equal(c.menungguVerifikasi, 1);              // lani Pending/leader
  assert.equal(c.sisa, 7);
});

test("ketua: anggota yang sudah terhapus atau keluar divisi tidak muncul; ketua tanpa divisi tidak crash", async () => {
  await sisip(id.mirza, await divisiDari("mirza"), "2026-11-11", "2026-11-12", 2, "Approved");
  assert.equal((await dashboardKetua(pool, id["ketua.cit"], opts)).anggotaCutiMingguIni.length, 1);
  await q("UPDATE users SET deleted_at=now(), aktif=false, divisi_id=NULL WHERE id=$1", [id.mirza]);
  const c = await dashboardKetua(pool, id["ketua.cit"], opts);
  assert.deepEqual(c.anggotaCutiMingguIni, []);
  await q("UPDATE users SET divisi_id=NULL WHERE id=$1", [id["ketua.flm"]]);
  const f = await dashboardKetua(pool, id["ketua.flm"], opts);
  assert.equal(f.divisi, null); assert.equal(f.menungguVerifikasi, 0); assert.deepEqual(f.anggotaCutiMingguIni, []);
  assert.equal(await dashboardKetua(pool, id.ana, opts), null);   // bukan ketua divisi
});

test("hrd: menunggu final dan karyawan cuti bulan ini (Approved, user terhapus tidak terhitung)", async () => {
  const h = await dashboardHrd(pool, opts);
  assert.equal(h.menungguFinal, 2);                   // dedi (Approved by Leader) + ketua CPC (Pending/hrd)
  assert.deepEqual(h.cutiBulanIni.map((c) => c.nama_lengkap).sort(), ["Ana Rahma", "Hana Lestari", "Kurnia Ketua CIT"]);
  assert.equal(h.jumlahOrangCuti, 3);
  assert.equal(h.bulan.label, "November 2026");
  await q("UPDATE users SET deleted_at=now(), aktif=false WHERE id=$1", [id.hana]);
  const h2 = await dashboardHrd(pool, opts);
  assert.equal(h2.jumlahOrangCuti, 2);
  assert.ok(!h2.cutiBulanIni.some((c) => c.nama_lengkap === "Hana Lestari"));
});

test("hrd: satu orang dengan dua pengajuan di bulan yang sama dihitung satu orang", async () => {
  const dFlm = await divisiDari("ana");
  await sisip(id.ana, dFlm, "2026-11-26", "2026-11-26", 1, "Approved");
  const h = await dashboardHrd(pool, opts);
  assert.equal(h.cutiBulanIni.length, 4);
  assert.equal(h.cutiBulanIni.filter((c) => c.nama_lengkap === "Ana Rahma").length, 2);
  assert.equal(h.jumlahOrangCuti, 3);   // Ana (2 pengajuan), Hana, Kurnia
});

test("admin: hitungan per role mengabaikan user terhapus; masa kerja < 1 tahun muncul", async () => {
  const a = await dashboardAdmin(pool, opts);
  assert.equal(a.perRole.admin, 1); assert.equal(a.perRole.hrd, 1);
  assert.deepEqual(a.masaKerjaKurang1Tahun.map((u) => u.nama_lengkap), ["Rina Karyawan Baru"]);
  assert.equal(a.masaKerjaKurang1Tahun[0].layakTahunan, "2027-06-01");
  assert.equal(a.totalDivisi, 3); assert.equal(a.jenisCutiAktif, 4); assert.equal(a.hariLiburTahunIni, 6);
  const sebelum = a.perRole.karyawan;
  await q("UPDATE users SET deleted_at=now(), aktif=false WHERE id=$1", [id.rina]);
  const b = await dashboardAdmin(pool, opts);
  assert.equal(b.perRole.karyawan, sebelum - 1);
  assert.deepEqual(b.masaKerjaKurang1Tahun, []);
});

test("admin: tepat satu tahun masa kerja sudah tidak termasuk; nonaktif dihitung terpisah", async () => {
  await q("UPDATE users SET tanggal_bergabung='2025-11-10' WHERE id=$1", [id.cici]);   // genap 1 tahun hari ini
  await q("UPDATE users SET tanggal_bergabung='2025-11-11' WHERE id=$1", [id.dedi]);   // besok genap 1 tahun
  const a = await dashboardAdmin(pool, opts);
  assert.deepEqual(a.masaKerjaKurang1Tahun.map((u) => u.nama_lengkap), ["Rina Karyawan Baru", "Dedi Kurniawan"]); // Cici genap 1 tahun → keluar
  const aktif = a.totalAktif;
  await q("UPDATE users SET aktif=false WHERE id=$1", [id.budi]);
  const b = await dashboardAdmin(pool, opts);
  assert.equal(b.totalAktif, aktif - 1); assert.equal(b.tidakAktif, 1);
});
