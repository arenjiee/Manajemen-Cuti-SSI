import { test, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { testPool, resetDb } from "../helpers/db.js";
import { seed } from "../../scripts/seed.mjs";
import { riwayat, notifikasiUser, jumlahBelumDibaca, tandaiDibaca, tandaiSemuaDibaca } from "../../src/lib/queries/riwayat.js";

const pool = testPool();
const q = (s, p) => pool.query(s, p);
let id = {}, aktor = {};

beforeEach(async () => {
  await resetDb(pool);
  await seed(pool);
  const r = await q("SELECT id, username, role, divisi_id FROM users");
  id = Object.fromEntries(r.rows.map((x) => [x.username, x.id]));
  aktor = Object.fromEntries(r.rows.map((x) => [x.username, { id: x.id, role: x.role, divisi_id: x.divisi_id }]));
});
after(() => pool.end());

const namaPengaju = async (user, f) => (await riwayat(pool, user, f)).map((r) => r.pengaju_nama);
const urut = (a) => [...a].sort();

test("cakupan karyawan: hanya pengajuan miliknya, apa pun filternya", async () => {
  assert.deepEqual(await namaPengaju(aktor.ana), ["Ana Rahma"]);
  assert.deepEqual(await namaPengaju(aktor.budi), []);
  assert.deepEqual(await namaPengaju(aktor.ana, { q: "budi", divisiId: String(aktor.budi.divisi_id) }), ["Ana Rahma"]);   // pencarian nama & filter divisi tidak membuka data orang lain
});

test("cakupan ketua divisi: seluruh pengajuan divisinya (termasuk miliknya), tidak ada divisi lain", async () => {
  assert.deepEqual(urut(await namaPengaju(aktor["ketua.cpc"])), ["Eka Putri", "Hana Lestari", "Ivan Saputra", "Kirana Ketua CPC"]);
  assert.deepEqual(urut(await namaPengaju(aktor["ketua.cit"])), ["Fajar Nugraha", "Gita Permata", "Kurnia Ketua CIT"]);
  assert.deepEqual(urut(await namaPengaju(aktor["ketua.flm"])), ["Ana Rahma", "Dedi Kurniawan"]);
});

test("cakupan ketua divisi: filter divisi dari URL tidak bisa melebarkan cakupan", async () => {
  const dFlm = String(aktor.ana.divisi_id);
  assert.deepEqual(urut(await namaPengaju(aktor["ketua.cpc"], { divisiId: dFlm })), ["Eka Putri", "Hana Lestari", "Ivan Saputra", "Kirana Ketua CPC"]);
});

test("ketua tanpa divisi hanya melihat pengajuannya sendiri dan tidak crash", async () => {
  await q("UPDATE users SET divisi_id=NULL WHERE id=$1", [id["ketua.cit"]]);
  assert.deepEqual(await namaPengaju({ ...aktor["ketua.cit"], divisi_id: null }), ["Kurnia Ketua CIT"]);
  assert.deepEqual(await namaPengaju({ ...aktor["ketua.flm"], divisi_id: null }), []);
});

test("cakupan HRD dan Admin: semua pengajuan; role asing atau tanpa user → kosong", async () => {
  assert.equal((await riwayat(pool, aktor.hrd)).length, 9);
  assert.equal((await riwayat(pool, aktor.admin)).length, 9);
  for (const bad of [{ id: 1, role: "hacker" }, { id: 1 }, null, undefined]) assert.deepEqual(await riwayat(pool, bad), [], JSON.stringify(bad));
});

test("setiap baris memuat nama pengaju, divisi, jenis, status, tahap, dan periode", async () => {
  const [r] = await riwayat(pool, aktor.ana);
  assert.equal(r.pengaju_nama, "Ana Rahma"); assert.equal(r.divisi_nama, "FLM"); assert.equal(r.jenis_nama, "Cuti Tahunan");
  assert.equal(r.status, "Approved"); assert.equal(r.tahap, "hrd"); assert.equal(r.tanggal_mulai, "2026-11-18"); assert.equal(r.total_hari, 1);
});

test("filter status: valid dipakai, nilai ngawur atau array diabaikan", async () => {
  assert.deepEqual(urut(await namaPengaju(aktor.hrd, { status: "Rejected" })), ["Fajar Nugraha", "Ivan Saputra"]);
  assert.equal((await riwayat(pool, aktor.hrd, { status: "Ngawur" })).length, 9);
  assert.equal((await riwayat(pool, aktor.hrd, { status: ["Rejected", "Approved"] })).length, 9);
  assert.deepEqual(urut(await namaPengaju(aktor["ketua.cpc"], { status: "Pending" })), ["Eka Putri", "Kirana Ketua CPC"]);   // filter berpadu dengan cakupan
});

test("filter jenis, tahun, divisi (HRD/Admin), dan pencarian nama", async () => {
  assert.deepEqual(await namaPengaju(aktor.hrd, { jenisId: "2" }), ["Hana Lestari"]);
  assert.equal((await riwayat(pool, aktor.hrd, { jenisId: "abc" })).length, 9);
  assert.equal((await riwayat(pool, aktor.hrd, { tahun: "2026" })).length, 9);
  assert.equal((await riwayat(pool, aktor.hrd, { tahun: "2025" })).length, 0);
  assert.equal((await riwayat(pool, aktor.hrd, { tahun: "abc" })).length, 9);
  assert.deepEqual(urut(await namaPengaju(aktor.admin, { divisiId: String(aktor.ana.divisi_id) })), ["Ana Rahma", "Dedi Kurniawan"]);
  assert.deepEqual(urut(await namaPengaju(aktor.hrd, { q: "ANA" })), ["Ana Rahma", "Hana Lestari", "Kirana Ketua CPC"]);
  assert.deepEqual(await namaPengaju(aktor.hrd, { q: "  " }), await namaPengaju(aktor.hrd, {}));
});

test("pencarian nama memperlakukan % dan _ sebagai karakter biasa dan kebal injeksi SQL", async () => {
  assert.equal((await riwayat(pool, aktor.hrd, { q: "%" })).length, 0);
  assert.equal((await riwayat(pool, aktor.hrd, { q: "_" })).length, 0);
  assert.equal((await riwayat(pool, aktor.hrd, { q: "'; DROP TABLE pengajuan_cuti; --" })).length, 0);
  assert.equal((await riwayat(pool, aktor.hrd)).length, 9);
});

test("sortir: terbaru (default), tanggal mulai, dan nama pengaju; nilai ngawur memakai default", async () => {
  const ids = (await riwayat(pool, aktor.hrd)).map((r) => r.id);
  assert.deepEqual(ids, [...ids].sort((a, b) => b - a));
  const mulai = await riwayat(pool, aktor.hrd, { urut: "mulai" });
  assert.equal(mulai[0].tanggal_mulai, "2026-12-14");
  assert.deepEqual(mulai.map((r) => r.tanggal_mulai), mulai.map((r) => r.tanggal_mulai).sort().reverse());
  const nama = await namaPengaju(aktor.hrd, { urut: "pengaju" });
  assert.deepEqual(nama, [...nama].sort());
  assert.deepEqual((await riwayat(pool, aktor.hrd, { urut: "id; DROP TABLE users" })).map((r) => r.id), ids);
});

test("riwayat tetap utuh walau pengajunya sudah dihapus (soft delete)", async () => {
  await q("UPDATE users SET deleted_at=now(), aktif=false WHERE id=$1", [id.eka]);
  assert.ok((await namaPengaju(aktor.hrd)).includes("Eka Putri"));
  assert.ok((await namaPengaju(aktor["ketua.cpc"])).includes("Eka Putri"));
});

// ---------- notifikasi ----------
const notif = (user, pesan, { dibaca = false, link = null } = {}) =>
  q("INSERT INTO notifications (user_id,tipe,pesan,link,dibaca) VALUES ($1,'keputusan',$2,$3,$4) RETURNING id", [id[user], pesan, link, dibaca]).then((r) => r.rows[0].id);

test("notifikasiUser: hanya milik user itu, terbaru dulu; filter belum dibaca", async () => {
  const a1 = await notif("ana", "satu", { dibaca: true }), a2 = await notif("ana", "dua", { link: "/cuti/1" });
  await notif("budi", "milik budi");
  const semua = await notifikasiUser(pool, id.ana);
  assert.deepEqual(semua.map((n) => n.id), [a2, a1]);
  assert.deepEqual(Object.keys(semua[0]).sort(), ["created_at", "dibaca", "id", "link", "pesan", "tipe"]);
  assert.deepEqual((await notifikasiUser(pool, id.ana, { hanyaBelum: true })).map((n) => n.id), [a2]);
  assert.equal((await notifikasiUser(pool, id.cici)).length, 1);   // notifikasi handover dari seed
  assert.deepEqual(await notifikasiUser(pool, id.eka), []);
  assert.deepEqual(await notifikasiUser(pool, "abc"), []);
});

test("jumlahBelumDibaca menghitung hanya milik sendiri yang belum dibaca", async () => {
  await notif("ana", "a", { dibaca: true }); await notif("ana", "b"); await notif("ana", "c"); await notif("budi", "d");
  assert.equal(await jumlahBelumDibaca(pool, id.ana), 2);
  assert.equal(await jumlahBelumDibaca(pool, id.eka), 0);
  assert.equal(await jumlahBelumDibaca(pool, "abc"), 0);
});

test("tandaiDibaca: milik sendiri berhasil dan mengembalikan tautan; idempoten", async () => {
  const n = await notif("ana", "x", { link: "/cuti/7" });
  assert.deepEqual(await tandaiDibaca(pool, id.ana, n), { ok: true, link: "/cuti/7" });
  assert.equal((await q("SELECT dibaca FROM notifications WHERE id=$1", [n])).rows[0].dibaca, true);
  assert.deepEqual(await tandaiDibaca(pool, id.ana, n), { ok: true, link: "/cuti/7" });
});

test("tandaiDibaca: notifikasi milik orang lain ditolak dan tidak berubah; id ngawur tidak melempar", async () => {
  const n = await notif("ana", "rahasia ana", { link: "/cuti/7" });
  const r = await tandaiDibaca(pool, id.budi, n);
  assert.equal(r.ok, false); assert.match(r.pesan, /tidak ditemukan/);
  assert.equal((await q("SELECT dibaca FROM notifications WHERE id=$1", [n])).rows[0].dibaca, false);
  for (const bad of ["abc", "1e3", -1, 0, null, undefined, 999999, "1; DROP TABLE notifications"]) assert.equal((await tandaiDibaca(pool, id.ana, bad)).ok, false, String(bad));
});

test("tandaiSemuaDibaca hanya menyentuh notifikasi milik sendiri", async () => {
  await notif("ana", "a"); await notif("ana", "b"); const b = await notif("budi", "c");
  assert.deepEqual(await tandaiSemuaDibaca(pool, id.ana), { ok: true, jumlah: 2 });
  assert.equal(await jumlahBelumDibaca(pool, id.ana), 0);
  assert.equal((await q("SELECT dibaca FROM notifications WHERE id=$1", [b])).rows[0].dibaca, false);
  assert.deepEqual(await tandaiSemuaDibaca(pool, id.ana), { ok: true, jumlah: 0 });
});
