import { test } from "node:test";
import assert from "node:assert/strict";
import { tanggalValid, hariIni, tambahHari, selisihHari, hariDalamRentang, adalahAkhirPekan, jamValid, selisihMenit } from "./tanggal.js";

test("tanggalValid menolak tanggal mustahil dan format salah", () => {
  assert.equal(tanggalValid("2026-02-28"), true);
  assert.equal(tanggalValid("2026-02-31"), false);
  assert.equal(tanggalValid("2026-2-3"), false);
  assert.equal(tanggalValid("abc"), false);
  assert.equal(tanggalValid(null), false);
  assert.equal(tanggalValid(undefined), false);
});

test("hariIni memakai zona Asia/Makassar (UTC+8)", () => {
  assert.equal(hariIni(new Date("2026-11-09T17:00:00Z")), "2026-11-10");
  assert.equal(hariIni(new Date("2026-11-09T15:59:00Z")), "2026-11-09");
});

test("tambahHari dan selisihHari melewati pergantian tahun", () => {
  assert.equal(tambahHari("2026-12-31", 1), "2027-01-01");
  assert.equal(tambahHari("2026-03-01", -1), "2026-02-28");
  assert.equal(selisihHari("2026-03-02", "2026-03-09"), 7);
});

test("hariDalamRentang inklusif; rentang terbalik kosong", () => {
  assert.deepEqual(hariDalamRentang("2026-03-02", "2026-03-04"), ["2026-03-02", "2026-03-03", "2026-03-04"]);
  assert.deepEqual(hariDalamRentang("2026-03-04", "2026-03-02"), []);
});

test("adalahAkhirPekan", () => {
  assert.equal(adalahAkhirPekan("2026-03-07"), true);
  assert.equal(adalahAkhirPekan("2026-03-08"), true);
  assert.equal(adalahAkhirPekan("2026-03-02"), false);
});

test("jamValid menerima HH:mm (dan HH:mm:ss) yang wajar", () => {
  assert.equal(jamValid("08:00"), true);
  assert.equal(jamValid("23:59"), true);
  assert.equal(jamValid("08:00:30"), true);
  assert.equal(jamValid("24:00"), false);
  assert.equal(jamValid("8.00"), false);
  assert.equal(jamValid("08:60"), false);
  assert.equal(jamValid(null), false);
});

test("selisihMenit menghitung selisih waktu", () => {
  assert.equal(selisihMenit("08:00", "12:00"), 240);
  assert.equal(selisihMenit("08:00", "12:30"), 270);
  assert.equal(selisihMenit("13:00", "09:00"), -240);
  assert.equal(selisihMenit("08:15:30", "09:45:00"), 90);
});
