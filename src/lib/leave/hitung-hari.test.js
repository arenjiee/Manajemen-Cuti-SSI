import { test } from "node:test";
import assert from "node:assert/strict";
import { hariKerjaDalamRentang, hitungTotalHari } from "./hitung-hari.js";

const tanpaLibur = new Set();

test("Senin-Jumat = 5 hari; Jumat-Senin = 2 hari", () => {
  assert.equal(hitungTotalHari("2026-03-02", "2026-03-06", tanpaLibur, false), 5);
  assert.equal(hitungTotalHari("2026-03-06", "2026-03-09", tanpaLibur, false), 2);
});

test("hari libur dikurangi", () => {
  assert.equal(hitungTotalHari("2026-03-02", "2026-03-06", new Set(["2026-03-04"]), false), 4);
});

test("rentang seluruhnya akhir pekan = 0 (Review Focus 1)", () => {
  assert.equal(hitungTotalHari("2026-03-07", "2026-03-08", tanpaLibur, false), 0);
});

test("rentang seluruhnya hari libur = 0", () => {
  assert.equal(hitungTotalHari("2026-03-04", "2026-03-04", new Set(["2026-03-04"]), false), 0);
});

test("setengah hari: 0,5 di hari kerja; 0 di akhir pekan atau hari libur (Review Focus 1)", () => {
  assert.equal(hitungTotalHari("2026-03-02", "2026-03-02", tanpaLibur, true), 0.5);
  assert.equal(hitungTotalHari("2026-03-07", "2026-03-07", tanpaLibur, true), 0);
  assert.equal(hitungTotalHari("2026-03-04", "2026-03-04", new Set(["2026-03-04"]), true), 0);
});

test("lintas tahun: 30 Des 2026 - 4 Jan 2027 dengan libur 1 Jan = 3", () => {
  assert.equal(hitungTotalHari("2026-12-30", "2027-01-04", new Set(["2027-01-01"]), false), 3);
});

test("hariKerjaDalamRentang mengembalikan daftar tanggal kerja", () => {
  assert.deepEqual(hariKerjaDalamRentang("2026-03-06", "2026-03-09", tanpaLibur), ["2026-03-06", "2026-03-09"]);
});
