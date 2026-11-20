import { test, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { testPool, resetDb } from "../helpers/db.js";
import { seed } from "../../scripts/seed.mjs";
import { ambilProfil, ubahProfil, ubahFoto, ambilFotoUntuk, bolehUbahProfil } from "../../src/lib/queries/profil.js";
import { dashboardKaryawan, dashboardKetua } from "../../src/lib/queries/dashboard.js";

const pool = testPool();
const q = (s, p) => pool.query(s, p);
const HARI = "2026-11-10";
let id = {}, aktor = {};

beforeEach(async () => {
  await resetDb(pool);
  await seed(pool);
  const r = await q("SELECT id, username, role, divisi_id FROM users");
  id = Object.fromEntries(r.rows.map((x) => [x.username, x.id]));
  aktor = Object.fromEntries(r.rows.map((x) => [x.username, { id: x.id, role: x.role, divisi_id: x.divisi_id }]));
});
after(() => pool.end());

const baris = async (u) => (await q("SELECT * FROM users WHERE id=$1", [id[u]])).rows[0];
const data = (o = {}) => ({ nama_lengkap: "Nama Baru", email: "baru@ssi.co.id", telepon: "0812 3456 789", alamat: "Jl. Baru 1", ...o });

test("ambilProfil: data lengkap tanpa password_hash, dengan divisi dan ketua", async () => {
  const p = await ambilProfil(pool, id.ana, { hari: HARI });
  assert.equal(p.nama_lengkap, "Ana Rahma"); assert.equal(p.divisi_nama, "FLM"); assert.equal(p.ketua_nama, "Kartono Ketua FLM");
  assert.equal(p.username, "ana"); assert.equal(p.tanggal_bergabung, "2022-01-03");
  assert.ok(!("password_hash" in p));
});

test("ambilProfil: id tidak valid, tidak ada, atau user terhapus → null", async () => {
  for (const bad of ["abc", -1, null, 999999]) assert.equal(await ambilProfil(pool, bad, { hari: HARI }), null, String(bad));
  await q("UPDATE users SET deleted_at=now(), aktif=false WHERE id=$1", [id.ana]);
  assert.equal(await ambilProfil(pool, id.ana, { hari: HARI }), null);
});

test("kuota tahunan, terpakai, dan sisa di profil sama dengan dashboard untuk setiap karyawan dan ketua", async () => {
  await q(`INSERT INTO pengajuan_cuti (pengaju_id,divisi_id,jenis_id,tanggal_mulai,tanggal_selesai,setengah_hari,total_hari,alasan,handover_id,status,tahap)
           SELECT id, divisi_id, 1, '2026-11-24','2026-11-24', true, 0.5, 'x', id, 'Approved', 'hrd' FROM users WHERE username='budi'`);
  for (const u of Object.keys(id).filter((x) => !["admin", "hrd"].includes(x))) {
    const p = await ambilProfil(pool, id[u], { hari: HARI });
    const d = u.startsWith("ketua.") ? await dashboardKetua(pool, id[u], { hari: HARI }) : await dashboardKaryawan(pool, id[u], { hari: HARI });
    assert.deepEqual([p.kuota.kuotaAwal, p.kuota.terpakai, p.kuota.sisa], [d.kuotaAwal, d.terpakai, d.sisa], u);
  }
  assert.equal((await ambilProfil(pool, id.budi, { hari: HARI })).kuota.sisa, 11.5);
  assert.equal((await ambilProfil(pool, id.ana, { hari: HARI })).kuota.sisa, 11);
});

test("admin dan HRD tidak punya kuota cuti di profil", async () => {
  assert.equal((await ambilProfil(pool, id.admin, { hari: HARI })).kuota, null);
  assert.equal((await ambilProfil(pool, id.hrd, { hari: HARI })).kuota, null);
});

test("user mengubah data miliknya sendiri", async () => {
  const r = await ubahProfil(pool, aktor.ana, id.ana, data());
  assert.deepEqual(r, { ok: true });
  const u = await baris("ana");
  assert.deepEqual([u.nama_lengkap, u.email, u.telepon, u.alamat], ["Nama Baru", "baru@ssi.co.id", "0812 3456 789", "Jl. Baru 1"]);
  assert.equal(u.role, "karyawan"); assert.equal(u.username, "ana");
});

test("user tidak dapat mengubah data orang lain (rekan, ketua, HRD); data tidak berubah", async () => {
  for (const pelaku of ["budi", "ketua.flm", "hrd"]) {
    const r = await ubahProfil(pool, aktor[pelaku], id.ana, data());
    assert.equal(r.ok, false, pelaku);
  }
  assert.equal((await baris("ana")).nama_lengkap, "Ana Rahma");
});

test("Admin dapat mengubah profil siapa pun", async () => {
  assert.equal((await ubahProfil(pool, aktor.admin, id.ana, data({ email: "ana.baru@ssi.co.id" }))).ok, true);
  assert.equal((await baris("ana")).email, "ana.baru@ssi.co.id");
  assert.equal((await ubahProfil(pool, aktor.admin, id.hrd, data({ email: "hrd.baru@ssi.co.id" }))).ok, true);
  assert.equal(bolehUbahProfil(aktor.admin, id.ana), true);
  assert.equal(bolehUbahProfil(aktor.ana, id.budi), false);
  assert.equal(bolehUbahProfil(aktor.ana, id.ana), true);
});

test("ganti role lewat form profil oleh non-admin ditolak, termasuk menaikkan diri sendiri jadi admin", async () => {
  for (const pelaku of ["ana", "ketua.flm", "hrd"]) {
    const r = await ubahProfil(pool, aktor[pelaku], id[pelaku], data({ email: `${pelaku}@baru.id`, role: "admin" }));
    assert.equal(r.ok, false, pelaku);
    assert.match(r.pesan, /Admin/);
  }
  const ana = await baris("ana");
  assert.equal(ana.role, "karyawan"); assert.equal(ana.nama_lengkap, "Ana Rahma");   // seluruh perubahan dibatalkan
});

test("non-admin boleh mengubah username sendiri selama format sah dan unik", async () => {
  assert.equal((await ubahProfil(pool, aktor.ana, id.ana, data({ role: "karyawan", username: "ana" }))).ok, true);
  const r = await ubahProfil(pool, aktor.ana, id.ana, data({ username: "ana.baru" }));
  assert.equal(r.ok, true);
  assert.equal((await baris("ana")).username, "ana.baru");
});

test("Admin dapat mengganti role user lain, tetapi bukan role dirinya sendiri atau ketua yang masih memimpin divisi", async () => {
  assert.equal((await ubahProfil(pool, aktor.admin, id.cici, data({ email: "c@ssi.id", role: "hrd" }))).ok, true);
  assert.equal((await baris("cici")).role, "hrd");
  const diri = await ubahProfil(pool, aktor.admin, id.admin, data({ email: "a@ssi.id", role: "karyawan" }));
  assert.equal(diri.ok, false);
  const ketua = await ubahProfil(pool, aktor.admin, id["ketua.cpc"], data({ email: "k@ssi.id", role: "karyawan" }));
  assert.equal(ketua.ok, false); assert.match(ketua.pesan, /memimpin divisi CPC/);
  assert.equal((await baris("ketua.cpc")).role, "ketua_divisi");
  assert.equal((await ubahProfil(pool, aktor.admin, id.cici, data({ email: "c2@ssi.id", role: "super" }))).ok, false);
});

test("validasi: nama, email, telepon, dan duplikat email memberi pesan jelas; tidak ada yang tersimpan", async () => {
  const cek = async (o, re) => {
    const r = await ubahProfil(pool, aktor.ana, id.ana, data(o));
    assert.equal(r.ok, false, JSON.stringify(o)); assert.match(r.pesan, re);
  };
  await cek({ nama_lengkap: "  " }, /Nama/);
  await cek({ nama_lengkap: "x".repeat(101) }, /Nama/);
  await cek({ email: "bukan-email" }, /email/i);
  await cek({ telepon: "abc" }, /telepon/i);
  await cek({ telepon: "1".repeat(31) }, /telepon/i);
  await cek({ email: "BUDI@ssi.co.id" }, /sudah terdaftar/);
  assert.equal((await baris("ana")).nama_lengkap, "Ana Rahma");
  assert.equal((await ubahProfil(pool, aktor.ana, id.ana, data({ email: "ANA@ssi.co.id", telepon: "", alamat: "" }))).ok, true);   // email sendiri, kolom opsional boleh kosong
  assert.equal((await baris("ana")).telepon, null);
});

test("id tidak valid atau user terhapus → pesan tidak ditemukan, bukan error", async () => {
  for (const bad of ["abc", "1e3", -1, null, 999999]) assert.equal((await ubahProfil(pool, aktor.admin, bad, data())).ok, false, String(bad));
  await q("UPDATE users SET deleted_at=now(), aktif=false WHERE id=$1", [id.ana]);
  const r = await ubahProfil(pool, aktor.admin, id.ana, data());
  assert.equal(r.ok, false); assert.match(r.pesan, /tidak ditemukan/);
});

test("ubahFoto: pemilik dan Admin boleh, orang lain ditolak; mengembalikan kunci lama; null menghapus", async () => {
  assert.deepEqual(await ubahFoto(pool, aktor.ana, id.ana, "foto-satu.jpg"), { ok: true, lama: null });
  assert.equal((await baris("ana")).foto_key, "foto-satu.jpg");
  assert.deepEqual(await ubahFoto(pool, aktor.admin, id.ana, "foto-dua.png"), { ok: true, lama: "foto-satu.jpg" });
  for (const pelaku of ["budi", "ketua.flm", "hrd"]) assert.equal((await ubahFoto(pool, aktor[pelaku], id.ana, "foto-jahat.jpg")).ok, false, pelaku);
  assert.equal((await baris("ana")).foto_key, "foto-dua.png");
  assert.deepEqual(await ubahFoto(pool, aktor.ana, id.ana, null), { ok: true, lama: "foto-dua.png" });
  assert.equal((await baris("ana")).foto_key, null);
  assert.equal((await ubahFoto(pool, aktor.admin, 999999, "foto-x.jpg")).ok, false);
});

test("ambilFotoUntuk: diri sendiri, Admin, HRD, dan satu divisi boleh; divisi lain ditolak", async () => {
  await ubahFoto(pool, aktor.ana, id.ana, "foto-ana.jpg");
  for (const pelaku of ["ana", "admin", "hrd", "budi", "ketua.flm"]) {
    const f = await ambilFotoUntuk(pool, aktor[pelaku], id.ana);
    assert.deepEqual(f, { storage_key: "foto-ana.jpg", mime: "image/jpeg" }, pelaku);
  }
  for (const pelaku of ["eka", "ketua.cpc", "fajar"]) assert.equal(await ambilFotoUntuk(pool, aktor[pelaku], id.ana), null, pelaku);
});

test("ambilFotoUntuk: user tanpa foto, id ngawur, user terhapus, dan kunci tak dikenal → null", async () => {
  assert.equal(await ambilFotoUntuk(pool, aktor.admin, id.ana), null);
  for (const bad of ["abc", "../1", null, 999999]) assert.equal(await ambilFotoUntuk(pool, aktor.admin, bad), null, String(bad));
  await q("UPDATE users SET foto_key='../../etc/passwd' WHERE id=$1", [id.ana]);
  assert.equal(await ambilFotoUntuk(pool, aktor.admin, id.ana), null);
  await q("UPDATE users SET foto_key='foto-a.jpg', deleted_at=now(), aktif=false WHERE id=$1", [id.ana]);
  assert.equal(await ambilFotoUntuk(pool, aktor.admin, id.ana), null);
});
