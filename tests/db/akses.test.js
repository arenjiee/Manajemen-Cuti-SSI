import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { testPool, resetDb } from "../helpers/db.js";
import { detailPengajuan, ambilLampiranUntuk, daftarCutiSaya } from "../../src/lib/queries/detail.js";
import { simpanMetaLampiran, tautkanLampiran } from "../../src/lib/queries/lampiran.js";

const pool = testPool();
const q = (s, p) => pool.query(s, p);
let u = {}, pid, lamTerikat, lamLepas;

const user = async (nama, role, divisi) => {
  const r = await q(`INSERT INTO users (username,email,password_hash,nama_lengkap,role,tanggal_bergabung,divisi_id) VALUES ($1,$2,'x',$1,$3,'2022-01-01',$4) RETURNING id, role, divisi_id`, [nama, `${nama}@x.id`, role, divisi]);
  return r.rows[0];
};

before(async () => {
  await resetDb(pool);
  const k1 = await user("ketua1", "ketua_divisi", null), k2 = await user("ketua2", "ketua_divisi", null);
  const d1 = (await q("INSERT INTO divisi (nama,ketua_id) VALUES ('D1',$1) RETURNING id", [k1.id])).rows[0].id;
  const d2 = (await q("INSERT INTO divisi (nama,ketua_id) VALUES ('D2',$1) RETURNING id", [k2.id])).rows[0].id;
  await q("UPDATE users SET divisi_id=$1 WHERE id=$2", [d1, k1.id]); k1.divisi_id = d1;
  await q("UPDATE users SET divisi_id=$1 WHERE id=$2", [d2, k2.id]); k2.divisi_id = d2;
  u = { k1, k2, a: await user("a", "karyawan", d1), b: await user("b", "karyawan", d1), c: await user("c", "karyawan", d2), hrd: await user("hrd", "hrd", null), admin: await user("admin", "admin", null) };
  const j = (await q("INSERT INTO jenis_cuti (nama,kode,is_system,potong_kuota) VALUES ('Cuti Tahunan','tahunan',true,true) RETURNING id")).rows[0].id;
  const ins = (status) => q(`INSERT INTO pengajuan_cuti (pengaju_id,divisi_id,jenis_id,tanggal_mulai,tanggal_selesai,total_hari,alasan,handover_id,status,tahap)
    VALUES ($1,$2,$3,'2026-12-07','2026-12-08',2,'Liburan',$4,$5,'leader') RETURNING id`, [u.a.id, d1, j, u.b.id, status]);
  pid = (await ins("Pending")).rows[0].id;
  await ins("Approved");
  await q("INSERT INTO persetujuan (pengajuan_id,tahap,approver_id,keputusan,catatan) VALUES ($1,'leader',$2,'approve','Silakan')", [pid, k1.id]);
  lamTerikat = await simpanMetaLampiran(pool, u.a.id, { nama_asli: "s.pdf", mime: "application/pdf", ukuran: 10, storage_key: "k1.pdf" });
  await tautkanLampiran(pool, lamTerikat, pid);
  lamLepas = await simpanMetaLampiran(pool, u.a.id, { nama_asli: "belum.pdf", mime: "application/pdf", ukuran: 10, storage_key: "k2.pdf" });
});
after(() => pool.end());

test("detail dapat dibuka pemilik, ketua divisi terkait, HRD, dan Admin (Review Focus 3)", async () => {
  for (const who of ["a", "k1", "hrd", "admin"]) {
    const d = await detailPengajuan(pool, pid, u[who]);
    assert.ok(d, who);
    assert.equal(d.pengaju_nama, "a");
  }
});

test("detail ditolak (null) untuk karyawan lain, ketua divisi lain, dan karyawan divisi lain", async () => {
  for (const who of ["b", "c", "k2"]) assert.equal(await detailPengajuan(pool, pid, u[who]), null, who);
});

test("id non-numerik, negatif, atau tak ada → null, tidak melempar (Review Focus 2)", async () => {
  for (const bad of ["abc", "1e3", "-1", "", null, undefined, 999999, "1; DROP TABLE users"]) {
    assert.equal(await detailPengajuan(pool, bad, u.admin), null, String(bad));
  }
});

test("detail memuat timeline persetujuan, nama rekan, dan lampiran", async () => {
  const d = await detailPengajuan(pool, pid, u.a);
  assert.equal(d.handover_nama, "b");
  assert.equal(d.persetujuan.length, 1);
  assert.equal(d.persetujuan[0].approver_nama, "ketua1");
  assert.deepEqual(d.lampiran.map((l) => l.id), [lamTerikat]);
});

test("lampiran: hanya yang berhak membuka; lampiran belum terikat hanya untuk pengunggahnya (Review Focus 3)", async () => {
  for (const who of ["a", "k1", "hrd", "admin"]) assert.ok(await ambilLampiranUntuk(pool, lamTerikat, u[who]), who);
  for (const who of ["b", "c", "k2"]) assert.equal(await ambilLampiranUntuk(pool, lamTerikat, u[who]), null, who);
  assert.ok(await ambilLampiranUntuk(pool, lamLepas, u.a));
  for (const who of ["b", "k1", "hrd", "admin"]) assert.equal(await ambilLampiranUntuk(pool, lamLepas, u[who]), null, who);
  assert.equal(await ambilLampiranUntuk(pool, "abc", u.a), null);
  assert.equal(await ambilLampiranUntuk(pool, 999999, u.a), null);
});

test("daftarCutiSaya: hanya milik sendiri, filter status, urut terbaru", async () => {
  assert.equal((await daftarCutiSaya(pool, u.a.id, {})).length, 2);
  assert.equal((await daftarCutiSaya(pool, u.b.id, {})).length, 0);
  const r = await daftarCutiSaya(pool, u.a.id, { status: "Approved" });
  assert.deepEqual(r.map((x) => x.status), ["Approved"]);
  assert.equal((await daftarCutiSaya(pool, u.a.id, { status: "Ngawur" })).length, 2);
});
