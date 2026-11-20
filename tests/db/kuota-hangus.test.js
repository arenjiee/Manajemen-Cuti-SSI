import { test, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { testPool, resetDb } from "../helpers/db.js";
import { daftarKuotaHangus, kirimPengingat, muatPengaturanHangus } from "../../src/lib/queries/kuota-hangus.js";

const pool = testPool();
const q = (s, p) => pool.query(s, p);
after(() => pool.end());

let uSenior, uCutiBanyak, uBaru, uNonaktif, jenisTahunan;

beforeEach(async () => {
  await resetDb(pool);

  // Buat jenis cuti tahunan
  const rJ = await q(
    "INSERT INTO jenis_cuti (nama, kode, is_system, kuota_hari, potong_kuota) VALUES ('Cuti Tahunan', 'tahunan', true, 12, true) RETURNING id"
  );
  jenisTahunan = rJ.rows[0].id;

  // Senior: bergabung 2022, kuota 12, belum cuti (sisa 12)
  uSenior = (await q(
    `INSERT INTO users (username, email, password_hash, nama_lengkap, role, tanggal_bergabung, kuota_awal)
     VALUES ('senior', 'senior@ssi.co.id', 'x', 'Senior Karyawan', 'karyawan', '2022-01-01', 12) RETURNING id`
  )).rows[0].id;

  // Cuti banyak: bergabung 2022, kuota 12, ambil cuti 5 hari (sisa 7)
  uCutiBanyak = (await q(
    `INSERT INTO users (username, email, password_hash, nama_lengkap, role, tanggal_bergabung, kuota_awal)
     VALUES ('rajincuti', 'rajin@ssi.co.id', 'x', 'Rajin Cuti', 'karyawan', '2022-01-01', 12) RETURNING id`
  )).rows[0].id;
  await q(
    `INSERT INTO pengajuan_cuti (pengaju_id, jenis_id, tanggal_mulai, tanggal_selesai, total_hari, alasan, status, tahap)
     VALUES ($1, $2, '2026-03-02', '2026-03-06', 5, 'Liburan', 'Approved', 'hrd')`,
    [uCutiBanyak, jenisTahunan]
  );

  // Karyawan baru: masa kerja < 1 tahun (bergabung Juni 2026)
  uBaru = (await q(
    `INSERT INTO users (username, email, password_hash, nama_lengkap, role, tanggal_bergabung, kuota_awal)
     VALUES ('baru', 'baru@ssi.co.id', 'x', 'Baru Masuk', 'karyawan', '2026-06-01', 12) RETURNING id`
  )).rows[0].id;

  // Karyawan nonaktif
  uNonaktif = (await q(
    `INSERT INTO users (username, email, password_hash, nama_lengkap, role, tanggal_bergabung, kuota_awal, aktif)
     VALUES ('nonaktif', 'nonaktif@ssi.co.id', 'x', 'Nonaktif', 'karyawan', '2022-01-01', 12, false) RETURNING id`
  )).rows[0].id;
});

test("muatPengaturanHangus membaca ambang dan bulanMulai dari tabel pengaturan", async () => {
  const p = await muatPengaturanHangus(pool);
  assert.equal(p.ambang, 8);
  assert.equal(p.bulanMulai, 9);

  await q("UPDATE pengaturan SET value='10' WHERE key='ambang_kuota_hangus'");
  await q("UPDATE pengaturan SET value='10' WHERE key='bulan_mulai_peringatan'");
  const p2 = await muatPengaturanHangus(pool);
  assert.equal(p2.ambang, 10);
  assert.equal(p2.bulanMulai, 10);
});

test("daftarKuotaHangus: di luar periode peringatan (sebelum bulanMulai) kosong dan aktif=false", async () => {
  const d = await daftarKuotaHangus(pool, { hari: "2026-08-15" });
  assert.equal(d.aktif, false);
  assert.deepEqual(d.rows, []);
});

test("daftarKuotaHangus: di dalam periode peringatan hanya menampilkan sisa >= ambang, tanpa karyawan baru atau nonaktif", async () => {
  const d = await daftarKuotaHangus(pool, { hari: "2026-11-20" });
  assert.equal(d.aktif, true);
  assert.equal(d.ambang, 8);

  const ids = d.rows.map((r) => r.id);
  assert.ok(ids.includes(uSenior), "Senior sisa 12 harus muncul");
  assert.ok(!ids.includes(uCutiBanyak), "Cuti banyak sisa 7 (< 8) tidak boleh muncul");
  assert.ok(!ids.includes(uBaru), "Karyawan < 1 tahun tidak boleh muncul");
  assert.ok(!ids.includes(uNonaktif), "Karyawan nonaktif tidak boleh muncul");
});

test("daftarKuotaHangus: ambang kustom dihormati", async () => {
  const d = await daftarKuotaHangus(pool, { hari: "2026-11-20", ambang: 5 });
  const ids = d.rows.map((r) => r.id);
  assert.ok(ids.includes(uSenior));
  assert.ok(ids.includes(uCutiBanyak), "Dengan ambang 5, sisa 7 ikut muncul");
});

test("kirimPengingat: di luar periode tidak mengirim dan dilewati", async () => {
  const r = await kirimPengingat(pool, [uSenior], { hari: "2026-08-15" });
  assert.equal(r.aktif, false);
  assert.equal(r.terkirim, 0);

  const notif = (await q("SELECT count(*)::int n FROM notifications WHERE user_id=$1", [uSenior])).rows[0].n;
  assert.equal(notif, 0);
});

test("kirimPengingat: di dalam periode berhasil mengirim, jeda 7 hari mencegah spam", async () => {
  const r1 = await kirimPengingat(pool, [uSenior, uCutiBanyak], { hari: "2026-11-20" });
  assert.equal(r1.aktif, true);
  assert.equal(r1.terkirim, 1, "Hanya uSenior (sisa >= 8) yang berisiko");

  const notif = (await q("SELECT tipe, pesan, link FROM notifications WHERE user_id=$1", [uSenior])).rows[0];
  assert.equal(notif.tipe, "pengingat");
  assert.match(notif.pesan, /Sisa Cuti Tahunan Anda 12 hari/);
  assert.equal(notif.link, "/cuti/ajukan");

  // Kirim lagi langsung -> kena cooldown 7 hari
  const r2 = await kirimPengingat(pool, [uSenior], { hari: "2026-11-20" });
  assert.equal(r2.terkirim, 0);
  assert.equal(r2.dilewati, 1);
});
