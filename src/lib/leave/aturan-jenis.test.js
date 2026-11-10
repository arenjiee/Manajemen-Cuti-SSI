import { test } from "node:test";
import assert from "node:assert/strict";
import { cekAturanJenis } from "./aturan-jenis.js";

const tahunan = { kode: "tahunan", nama: "Cuti Tahunan", batasPengajuanHari: 3 };
const sakit = { kode: "sakit", nama: "Cuti Sakit", batasPengajuanHari: -3 };
const hariIni = "2026-11-09";

test("Tahunan: H-2 ditolak, H-3 lolos", () => {
  assert.match(cekAturanJenis({ jenis: tahunan, mulai: "2026-11-11", hariIni, tanggalBergabung: "2022-01-01" }), /H-3/);
  assert.equal(cekAturanJenis({ jenis: tahunan, mulai: "2026-11-12", hariIni, tanggalBergabung: "2022-01-01" }), null);
});

test("Tahunan: masa kerja < 1 tahun ditolak, tepat 1 tahun lolos", () => {
  assert.match(cekAturanJenis({ jenis: tahunan, mulai: "2026-12-01", hariIni, tanggalBergabung: "2026-06-01" }), /1 tahun/);
  assert.equal(cekAturanJenis({ jenis: tahunan, mulai: "2026-12-01", hariIni, tanggalBergabung: "2025-11-09" }), null);
});

test("Sakit: mundur 3 hari lolos, 4 hari ditolak, masa kerja tidak relevan", () => {
  assert.equal(cekAturanJenis({ jenis: sakit, mulai: "2026-11-06", hariIni, tanggalBergabung: "2026-10-01" }), null);
  assert.match(cekAturanJenis({ jenis: sakit, mulai: "2026-11-05", hariIni, tanggalBergabung: "2026-10-01" }), /3 hari/);
  assert.equal(cekAturanJenis({ jenis: sakit, mulai: "2026-11-09", hariIni, tanggalBergabung: "2026-10-01" }), null);
});
