import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { testPool, resetDb } from "../helpers/db.js";
import { daftarJenisAktif, buatJenis, ubahJenis, hapusJenis } from "../../src/lib/queries/jenis-cuti.js";
import { buatHariLibur, hapusHariLibur, muatHariLibur, daftarHariLibur } from "../../src/lib/queries/hari-libur.js";

const pool = testPool();
after(() => pool.end());
before(() => {});
beforeEach(async () => {
  await resetDb(pool);
  await pool.query(`INSERT INTO jenis_cuti (nama,kode,is_system,kuota_hari,batas_pengajuan_hari,wajib_lampiran,potong_kuota) VALUES
    ('Cuti Tahunan','tahunan',true,NULL,3,false,true),('Cuti Sakit','sakit',true,NULL,-3,true,false)`);
});

test("daftarJenisAktif mengembalikan bentuk camelCase yang dipakai validasi", async () => {
  const [t] = await daftarJenisAktif(pool);
  assert.deepEqual(
    { kode: t.kode, kuotaHari: t.kuotaHari, batasPengajuanHari: t.batasPengajuanHari, wajibLampiran: t.wajibLampiran, potongKuota: t.potongKuota, isSystem: t.isSystem },
    { kode: "tahunan", kuotaHari: null, batasPengajuanHari: 3, wajibLampiran: false, potongKuota: true, isSystem: true }
  );
});

test("jenis baru dengan kuota, lampiran, dan potong kuota tersimpan dan terbaca", async () => {
  const r = await buatJenis(pool, { nama: "Cuti Menikah", kuotaHari: 3, batasPengajuanHari: 7, wajibLampiran: true, potongKuota: false });
  assert.equal(r.ok, true);
  const j = (await daftarJenisAktif(pool)).find((x) => x.nama === "Cuti Menikah");
  assert.deepEqual([j.kuotaHari, j.batasPengajuanHari, j.wajibLampiran, j.potongKuota, j.isSystem, j.kode], [3, 7, true, false, false, null]);
});

test("buatJenis: nama wajib dan unik; kuota negatif ditolak", async () => {
  assert.equal((await buatJenis(pool, { nama: " ", batasPengajuanHari: 0 })).ok, false);
  assert.equal((await buatJenis(pool, { nama: "Cuti Tahunan", batasPengajuanHari: 0 })).ok, false);
  assert.equal((await buatJenis(pool, { nama: "X", kuotaHari: -1, batasPengajuanHari: 0 })).ok, false);
});

test("jenis sistem: aturan boleh diubah, tidak boleh dihapus; Tahunan wajib tetap potong kuota", async () => {
  const [t, s] = await daftarJenisAktif(pool);
  assert.equal((await ubahJenis(pool, t.id, { nama: "Cuti Tahunan", kuotaHari: null, batasPengajuanHari: 5, wajibLampiran: false, potongKuota: true, aktif: true })).ok, true);
  assert.equal((await daftarJenisAktif(pool))[0].batasPengajuanHari, 5);
  assert.equal((await ubahJenis(pool, t.id, { nama: "Cuti Tahunan", kuotaHari: null, batasPengajuanHari: 5, wajibLampiran: false, potongKuota: false, aktif: true })).ok, false);
  assert.equal((await ubahJenis(pool, s.id, { nama: "Cuti Sakit", kuotaHari: null, batasPengajuanHari: -3, wajibLampiran: true, potongKuota: false, aktif: false })).ok, false);
  assert.equal((await hapusJenis(pool, s.id)).ok, false);
});

test("hapusJenis: jenis kustom tanpa pengajuan dihapus; yang sudah dipakai dinonaktifkan", async () => {
  const a = (await buatJenis(pool, { nama: "A", batasPengajuanHari: 0 })).id;
  const b = (await buatJenis(pool, { nama: "B", batasPengajuanHari: 0 })).id;
  await pool.query(`INSERT INTO users (username,email,password_hash,nama_lengkap,role,tanggal_bergabung) VALUES ('u','u@x.id','x','U','karyawan','2022-01-01')`);
  await pool.query(`INSERT INTO pengajuan_cuti (pengaju_id,jenis_id,tanggal_mulai,tanggal_selesai,total_hari,alasan,status,tahap) VALUES (1,$1,'2026-12-07','2026-12-07',1,'a','Approved','hrd')`, [b]);
  assert.deepEqual(await hapusJenis(pool, a), { ok: true });
  assert.deepEqual(await hapusJenis(pool, b), { ok: true, dinonaktifkan: true });
  const nama = (await daftarJenisAktif(pool)).map((x) => x.nama);
  assert.ok(!nama.includes("A") && !nama.includes("B"));
});

test("hari libur: tanggal duplikat dan tidak valid ditolak; muat sebagai Set YYYY-MM-DD", async () => {
  assert.equal((await buatHariLibur(pool, { tanggal: "2026-12-25", keterangan: "Natal", jenis: "nasional" })).ok, true);
  assert.equal((await buatHariLibur(pool, { tanggal: "2026-12-25", keterangan: "Dobel", jenis: "nasional" })).ok, false);
  assert.equal((await buatHariLibur(pool, { tanggal: "2026-02-31", keterangan: "Salah", jenis: "nasional" })).ok, false);
  assert.equal((await buatHariLibur(pool, { tanggal: "2026-12-24", keterangan: "", jenis: "cuti_bersama" })).ok, false);
  await buatHariLibur(pool, { tanggal: "2027-01-01", keterangan: "Tahun Baru", jenis: "nasional" });
  const semua = await muatHariLibur(pool, {});
  assert.ok(semua instanceof Set);
  assert.deepEqual([...semua].sort(), ["2026-12-25", "2027-01-01"]);
  assert.deepEqual([...(await muatHariLibur(pool, { dari: "2026-12-01", sampai: "2026-12-31" }))], ["2026-12-25"]);
  const id = (await daftarHariLibur(pool, {}))[0].id;
  assert.equal((await hapusHariLibur(pool, id)).ok, true);
});
