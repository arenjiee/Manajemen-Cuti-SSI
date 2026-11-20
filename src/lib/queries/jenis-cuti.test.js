import test from "node:test";
import assert from "node:assert/strict";
import { ubahJenis } from "./jenis-cuti.js";

const TAHUNAN = {
  id: 1, nama: "Cuti Tahunan", kode: "tahunan", is_system: true, kuota_hari: "12.0",
  batas_pengajuan_hari: 3, wajib_lampiran: false, potong_kuota: true, aktif: true,
};
const MENIKAH = {
  id: 3, nama: "Cuti Menikah", kode: null, is_system: false, kuota_hari: "3.0",
  batas_pengajuan_hari: 7, wajib_lampiran: true, potong_kuota: false, aktif: true,
};

function dbRekam(lama) {
  const q = [];
  const db = {
    query: async (sql, params) => {
      q.push({ sql, params });
      if (sql.startsWith("SELECT * FROM jenis_cuti")) return { rows: [lama] };
      return { rowCount: 1 };
    },
  };
  return { db, q };
}

const kirim = (kuotaHari, extra = {}) => ({
  nama: "X", kuotaHari, batasPengajuanHari: 3, wajibLampiran: false, potongKuota: true, aktif: true, ...extra,
});

test("ubahJenis: kuota Cuti Tahunan di bawah 12 ditolak", async () => {
  const { db } = dbRekam(TAHUNAN);
  const r = await ubahJenis(db, 1, kirim(11.5, { nama: "Cuti Tahunan" }));
  assert.equal(r.ok, false);
  assert.match(r.pesan, /minimal 12 hari/);
});

test("ubahJenis: kuota Cuti Tahunan kosong ditolak", async () => {
  const { db } = dbRekam(TAHUNAN);
  const r = await ubahJenis(db, 1, kirim(null, { nama: "Cuti Tahunan" }));
  assert.equal(r.ok, false);
  assert.match(r.pesan, /wajib diisi/);
});

test("ubahJenis: kuota Cuti Tahunan 15 menyinkronkan kuota_awal semua pengguna", async () => {
  const { db, q } = dbRekam(TAHUNAN);
  const r = await ubahJenis(db, 1, kirim(15, { nama: "Cuti Tahunan" }));
  assert.equal(r.ok, true);
  const sync = q.find((x) => x.sql.includes("UPDATE users SET kuota_awal"));
  assert.ok(sync, "harus ada UPDATE users kuota_awal");
  assert.equal(Number(sync.params[0]), 15);
});

test("ubahJenis: jenis non-tahunan boleh kuota < 12 dan tidak menyinkronkan pengguna", async () => {
  const { db, q } = dbRekam(MENIKAH);
  const r = await ubahJenis(db, 3, kirim(3, { nama: "Cuti Menikah", potongKuota: false }));
  assert.equal(r.ok, true);
  assert.equal(q.some((x) => x.sql.includes("UPDATE users")), false);
});