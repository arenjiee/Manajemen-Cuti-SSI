import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { testPool, resetDb } from "../helpers/db.js";
import { putuskan, antreanHrd, muatPeringatanHrd, approveBanyak } from "../../src/lib/queries/approval.js";

const pool = testPool();
const q = (s, p) => pool.query(s, p);
after(() => pool.end());

let u, d1, tahunan, sakit;
const user = async (nama, role, divisi = null) =>
  (await q(`INSERT INTO users (username,email,password_hash,nama_lengkap,role,tanggal_bergabung,divisi_id) VALUES ($1,$2,'x',$1,$3,'2022-01-01',$4) RETURNING id`, [nama, `${nama}@x.id`, role, divisi])).rows[0].id;
const peng = async (pengaju, o = {}) =>
  (await q(`INSERT INTO pengajuan_cuti (pengaju_id,divisi_id,jenis_id,tanggal_mulai,tanggal_selesai,total_hari,alasan,handover_id,status,tahap)
    VALUES ($1,$2,$3,$4,$4,1,'x',$5,$6,$7) RETURNING id`, [pengaju, o.divisi ?? d1, o.jenis ?? tahunan, o.hari ?? "2026-12-08", u.m1, o.status ?? "Approved by Leader", o.tahap ?? "hrd"])).rows[0].id;
const st = async (id) => (await q("SELECT status, tahap, ditolak_oleh FROM pengajuan_cuti WHERE id=$1", [id])).rows[0];
const aksi = (o) => ({ tahap: "hrd", keputusan: "approve", catatan: null, ...o });

beforeEach(async () => {
  await resetDb(pool);
  tahunan = (await q("INSERT INTO jenis_cuti (nama,kode,is_system,potong_kuota) VALUES ('Cuti Tahunan','tahunan',true,true) RETURNING id")).rows[0].id;
  sakit = (await q("INSERT INTO jenis_cuti (nama,kode,is_system,wajib_lampiran) VALUES ('Cuti Sakit','sakit',true,true) RETURNING id")).rows[0].id;
  const k = await user("ketua", "ketua_divisi");
  d1 = (await q("INSERT INTO divisi (nama,ketua_id,max_persen_cuti) VALUES ('D1',$1,34) RETURNING id", [k])).rows[0].id;
  await q("UPDATE users SET divisi_id=$1 WHERE id=$2", [d1, k]);
  u = { k, hrd: await user("hrd", "hrd"), hrd2: await user("hrd2", "hrd") };
  for (const n of ["m1", "m2", "m3", "m4", "m5"]) u[n] = await user(n, "karyawan", d1); // 6 anggota → batas harian 2
});

test("HRD approve final → Approved; reject (catatan wajib) → Rejected ditolak_oleh hrd", async () => {
  const a = await peng(u.m2), b = await peng(u.m3);
  assert.equal((await putuskan(pool, aksi({ pengajuanId: a, approverId: u.hrd }))).ok, true);
  assert.deepEqual(await st(a), { status: "Approved", tahap: "hrd", ditolak_oleh: null });
  assert.equal((await putuskan(pool, aksi({ pengajuanId: b, approverId: u.hrd, keputusan: "reject", catatan: " " }))).ok, false);
  assert.equal((await st(b)).status, "Approved by Leader");
  assert.equal((await putuskan(pool, aksi({ pengajuanId: b, approverId: u.hrd, keputusan: "reject", catatan: "Penutupan periode" }))).ok, true);
  assert.deepEqual(await st(b), { status: "Rejected", tahap: "hrd", ditolak_oleh: "hrd" });
});

test("pengajuan ketua (Pending/hrd) langsung dapat diputuskan HRD", async () => {
  const p = await peng(u.k, { status: "Pending", tahap: "hrd" });
  assert.equal((await putuskan(pool, aksi({ pengajuanId: p, approverId: u.hrd }))).ok, true);
  assert.equal((await st(p)).status, "Approved");
});

test("otorisasi tahap hrd: bukan HRD ditolak; pengajuan yang masih di tahap leader tidak bisa dilompati", async () => {
  const p = await peng(u.m2);
  for (const who of [u.k, u.m1]) assert.equal((await putuskan(pool, aksi({ pengajuanId: p, approverId: who }))).ok, false);
  const masihLeader = await peng(u.m3, { status: "Pending", tahap: "leader" });
  assert.equal((await putuskan(pool, aksi({ pengajuanId: masihLeader, approverId: u.hrd }))).ok, false);
  assert.equal((await st(masihLeader)).status, "Pending");
});

test("dua HRD memutuskan bersamaan: hanya satu yang berhasil (Review Focus 4)", async () => {
  const p = await peng(u.m2);
  await Promise.all(Array.from({ length: 5 }, () => pool.connect())).then((cs) => cs.forEach((c) => c.release()));
  const hasil = await Promise.all([u.hrd, u.hrd2, u.hrd].map((h) => putuskan(pool, aksi({ pengajuanId: p, approverId: h }))));
  assert.equal(hasil.filter((h) => h.ok).length, 1);
  assert.equal((await q("SELECT count(*)::int n FROM persetujuan WHERE pengajuan_id=$1 AND tahap='hrd'", [p])).rows[0].n, 1);
});

test("approveBanyak melewati item yang gagal dan tetap memproses sisanya", async () => {
  const a = await peng(u.m2), b = await peng(u.m3, { status: "Cancelled" }), c = await peng(u.m4);
  const r = await approveBanyak(pool, u.hrd, [a, b, c, "abc", 999999]);
  assert.deepEqual(r.berhasil.sort(), [a, c].sort());
  assert.deepEqual(r.dilewati.map((x) => String(x.id)).sort(), [String(b), "abc", "999999"].sort());
  assert.ok(r.dilewati.every((x) => typeof x.pesan === "string" && x.pesan.length > 0));
  assert.equal((await st(b)).status, "Cancelled");
});

test("antreanHrd: tahap hrd saja, memuat info atasan untuk alur karyawan dan null untuk ketua", async () => {
  const kar = await peng(u.m2);
  await q("INSERT INTO persetujuan (pengajuan_id,tahap,approver_id,keputusan,catatan) VALUES ($1,'leader',$2,'approve','Silakan')", [kar, u.k]);
  const ket = await peng(u.k, { status: "Pending", tahap: "hrd" });
  await peng(u.m3, { status: "Pending", tahap: "leader" });
  await peng(u.m4, { status: "Approved" });
  const a = await antreanHrd(pool);
  assert.deepEqual(a.map((x) => x.id), [kar, ket]);
  assert.deepEqual([a[0].atasan.nama, a[0].atasan.catatan], ["ketua", "Silakan"]);
  assert.equal(a[1].atasan, null);
});

test("peringatan kapasitas: muncul saat orang lain sudah memenuhi batas, tapi HRD tetap bisa menyetujui", async () => {
  const hari = "2026-12-08";
  await peng(u.m2, { status: "Approved", hari });
  await peng(u.m3, { status: "Approved", hari });
  const target = await peng(u.m4, { hari });
  const w = await muatPeringatanHrd(pool, target);
  assert.deepEqual(w.kapasitasPenuh, { tanggal: hari, terisi: 2, batas: 2 });
  assert.equal((await putuskan(pool, aksi({ pengajuanId: target, approverId: u.hrd }))).ok, true);
});

test("tanpa peringatan: kapasitas longgar, Cuti Sakit, atau pengajuan sendiri tidak dihitung ganda", async () => {
  const hari = "2026-12-09";
  await peng(u.m2, { status: "Approved", hari });
  const target = await peng(u.m4, { hari });
  assert.equal((await muatPeringatanHrd(pool, target)).kapasitasPenuh, undefined);
  await peng(u.m3, { status: "Approved", hari });
  const s = await peng(u.m5, { hari, jenis: sakit });
  assert.equal((await muatPeringatanHrd(pool, s)).kapasitasPenuh, undefined);
  assert.equal((await muatPeringatanHrd(pool, "abc")).kuotaKurang, false);
});

test("peringatan kuota kurang saat sisa kuota negatif", async () => {
  const target = await peng(u.m4, { hari: "2026-12-10" });
  assert.equal((await muatPeringatanHrd(pool, target)).kuotaKurang, false);
  await q("UPDATE users SET kuota_awal=0 WHERE id=$1", [u.m4]);
  assert.equal((await muatPeringatanHrd(pool, target)).kuotaKurang, true);
});
