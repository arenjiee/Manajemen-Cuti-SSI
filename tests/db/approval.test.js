import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { testPool, resetDb } from "../helpers/db.js";
import { putuskan, antreanLeader } from "../../src/lib/queries/approval.js";

const pool = testPool();
const q = (s, p) => pool.query(s, p);
after(() => pool.end());

let u, d1, d2, jenis;
const user = async (nama, role, divisi = null) =>
  (await q(`INSERT INTO users (username,email,password_hash,nama_lengkap,role,tanggal_bergabung,divisi_id) VALUES ($1,$2,'x',$1,$3,'2022-01-01',$4) RETURNING id`, [nama, `${nama}@x.id`, role, divisi])).rows[0].id;
const pengajuan = async (pengaju, divisi, o = {}) =>
  (await q(`INSERT INTO pengajuan_cuti (pengaju_id,divisi_id,jenis_id,tanggal_mulai,tanggal_selesai,total_hari,alasan,handover_id,status,tahap)
    VALUES ($1,$2,$3,'2026-12-07','2026-12-08',2,'Liburan',$4,$5,$6) RETURNING id`, [pengaju, divisi, jenis, u.b, o.status ?? "Pending", o.tahap ?? "leader"])).rows[0].id;
const status = async (id) => (await q("SELECT status, tahap, ditolak_oleh FROM pengajuan_cuti WHERE id=$1", [id])).rows[0];
const aksi = (o) => ({ tahap: "leader", keputusan: "approve", catatan: null, ...o });

beforeEach(async () => {
  await resetDb(pool);
  jenis = (await q("INSERT INTO jenis_cuti (nama,kode,is_system,potong_kuota) VALUES ('Cuti Tahunan','tahunan',true,true) RETURNING id")).rows[0].id;
  const k1 = await user("ketua1", "ketua_divisi"), k2 = await user("ketua2", "ketua_divisi");
  d1 = (await q("INSERT INTO divisi (nama,ketua_id) VALUES ('D1',$1) RETURNING id", [k1])).rows[0].id;
  d2 = (await q("INSERT INTO divisi (nama,ketua_id) VALUES ('D2',$1) RETURNING id", [k2])).rows[0].id;
  await q("UPDATE users SET divisi_id=$1 WHERE id=$2", [d1, k1]);
  await q("UPDATE users SET divisi_id=$1 WHERE id=$2", [d2, k2]);
  u = { k1, k2, a: await user("a", "karyawan", d1), b: await user("b", "karyawan", d1), hrd: await user("hrd", "hrd") };
});

test("approve leader → Approved by Leader + tahap hrd; reject → Rejected + ditolak_oleh leader", async () => {
  const p1 = await pengajuan(u.a, d1);
  assert.deepEqual(await putuskan(pool, aksi({ pengajuanId: p1, approverId: u.k1, catatan: "Silakan" })), { ok: true });
  assert.deepEqual(await status(p1), { status: "Approved by Leader", tahap: "hrd", ditolak_oleh: null });
  const p2 = await pengajuan(u.a, d1);
  assert.equal((await putuskan(pool, aksi({ pengajuanId: p2, approverId: u.k1, keputusan: "reject", catatan: "Jadwal padat" }))).ok, true);
  assert.deepEqual(await status(p2), { status: "Rejected", tahap: "leader", ditolak_oleh: "leader" });
});

test("reject tanpa catatan ditolak dan tidak mengubah apa pun", async () => {
  const p = await pengajuan(u.a, d1);
  for (const catatan of [null, "", "   "]) {
    assert.equal((await putuskan(pool, aksi({ pengajuanId: p, approverId: u.k1, keputusan: "reject", catatan }))).ok, false);
  }
  assert.equal((await status(p)).status, "Pending");
  assert.equal((await q("SELECT count(*)::int n FROM persetujuan")).rows[0].n, 0);
});

test("DUA putuskan paralel pada pengajuan yang sama: satu berhasil, satu gagal, satu baris persetujuan (Review Focus 4)", async () => {
  const p = await pengajuan(u.a, d1);
  await Promise.all(Array.from({ length: 5 }, () => pool.connect())).then((cs) => cs.forEach((c) => c.release()));
  const hasil = await Promise.all([1, 2, 3].map(() => putuskan(pool, aksi({ pengajuanId: p, approverId: u.k1 }))));
  assert.equal(hasil.filter((h) => h.ok).length, 1);
  assert.equal((await q("SELECT count(*)::int n FROM persetujuan WHERE pengajuan_id=$1", [p])).rows[0].n, 1);
});

test("approve pada pengajuan Cancelled atau sudah diputuskan gagal", async () => {
  const c = await pengajuan(u.a, d1, { status: "Cancelled" });
  assert.equal((await putuskan(pool, aksi({ pengajuanId: c, approverId: u.k1 }))).ok, false);
  const r = await pengajuan(u.a, d1, { status: "Rejected" });
  assert.equal((await putuskan(pool, aksi({ pengajuanId: r, approverId: u.k1 }))).ok, false);
  assert.equal((await status(c)).status, "Cancelled");
});

test("otorisasi: ketua divisi lain, karyawan, HRD (tahap leader), dan pengajuan milik sendiri ditolak", async () => {
  const p = await pengajuan(u.a, d1);
  for (const who of [u.k2, u.b, u.hrd]) assert.equal((await putuskan(pool, aksi({ pengajuanId: p, approverId: who }))).ok, false);
  const milikKetua = await pengajuan(u.k1, d1, { tahap: "leader" });
  assert.equal((await putuskan(pool, aksi({ pengajuanId: milikKetua, approverId: u.k1 }))).ok, false);
  assert.equal((await status(p)).status, "Pending");
});

test("id tidak valid atau tak ada tidak melempar (Review Focus 2)", async () => {
  for (const id of ["abc", -1, null, 999999]) assert.equal((await putuskan(pool, aksi({ pengajuanId: id, approverId: u.k1 }))).ok, false);
  assert.equal((await putuskan(pool, aksi({ pengajuanId: 1, approverId: u.k1, keputusan: "mungkin" }))).ok, false);
});

test("antrean leader memakai divisi_id pengajuan: ketua baru langsung melihat antrean lama; milik sendiri tidak tampil", async () => {
  const p = await pengajuan(u.a, d1);
  await pengajuan(u.b, d2);
  const milikK1 = await pengajuan(u.k1, d1); // fixture buatan: pengajuan ketua yang masih di tahap leader
  assert.deepEqual((await antreanLeader(pool, { id: u.k1, divisi_id: d1 })).map((r) => r.id), [p]);
  const k3 = await user("ketua3", "ketua_divisi");
  await q("UPDATE users SET divisi_id=NULL WHERE id=$1", [u.k1]);
  await q("UPDATE divisi SET ketua_id=$1 WHERE id=$2", [k3, d1]);
  await q("UPDATE users SET divisi_id=$1 WHERE id=$2", [d1, k3]);
  // ketua baru melihat antrean lama divisi, termasuk pengajuan ketua lama yang masih menunggu verifikasi
  assert.deepEqual((await antreanLeader(pool, { id: k3, divisi_id: d1 })).map((r) => r.id), [p, milikK1]);
  assert.equal((await putuskan(pool, aksi({ pengajuanId: p, approverId: k3 }))).ok, true);
  assert.deepEqual(await antreanLeader(pool, { id: u.k1, divisi_id: null }), []);
});

test("riwayat persetujuan dan notifikasi: pengaju selalu; HRD hanya saat approve leader", async () => {
  const p1 = await pengajuan(u.a, d1);
  await putuskan(pool, aksi({ pengajuanId: p1, approverId: u.k1, catatan: "OK" }));
  const s = (await q("SELECT tahap, approver_id, keputusan, catatan FROM persetujuan WHERE pengajuan_id=$1", [p1])).rows;
  assert.deepEqual(s, [{ tahap: "leader", approver_id: u.k1, keputusan: "approve", catatan: "OK" }]);
  const n1 = (await q("SELECT user_id FROM notifications ORDER BY user_id")).rows.map((r) => r.user_id);
  assert.deepEqual(n1.sort(), [u.a, u.hrd].sort());
  await q("DELETE FROM notifications");
  const p2 = await pengajuan(u.a, d1);
  await putuskan(pool, aksi({ pengajuanId: p2, approverId: u.k1, keputusan: "reject", catatan: "Tidak" }));
  assert.deepEqual((await q("SELECT user_id FROM notifications")).rows.map((r) => r.user_id), [u.a]);
});
