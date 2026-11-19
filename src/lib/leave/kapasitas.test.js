import { test } from "node:test";
import assert from "node:assert/strict";
import { cekKapasitas, hitungBatasHarian } from "./kapasitas.js";

test("hitungBatasHarian: rumus floor(persen * anggota / 100) dengan minimum 1", () => {
  // 10% dari 8 orang = 0.8 -> floor = 0 -> minimum 1
  assert.equal(hitungBatasHarian(10, 8), 1);
  // 25% dari 10 orang = 2.5 -> floor = 2
  assert.equal(hitungBatasHarian(25, 10), 2);
  // 34% dari 6 orang = 2.04 -> floor = 2
  assert.equal(hitungBatasHarian(34, 6), 2);
  // 20% dari 5 orang = 1
  assert.equal(hitungBatasHarian(20, 5), 1);
  // 20% dari 10 orang = 2
  assert.equal(hitungBatasHarian(20, 10), 2);
  // 20% dari 15 orang = 3
  assert.equal(hitungBatasHarian(20, 15), 3);
  // divisi kosong (0 orang) tetap minimal 1
  assert.equal(hitungBatasHarian(20, 0), 1);
  // input string / tidak valid tetap aman
  assert.equal(hitungBatasHarian("25", "8"), 2);
  assert.equal(hitungBatasHarian(null, null), 1);
});

test("cekKapasitas melaporkan tanggal penuh pertama", () => {
  const okupansi = new Map([["2026-11-17", 2], ["2026-11-18", 1]]);
  const r = cekKapasitas({ hariKerja: ["2026-11-16", "2026-11-17", "2026-11-18"], okupansi, batas: 2 });
  assert.deepEqual(r, { ok: false, tanggalPenuh: "2026-11-17", terisi: 2, batas: 2 });
});

test("cekKapasitas lolos jika okupansi + 1 <= batas", () => {
  const okupansi = new Map([["2026-11-17", 1]]);
  assert.deepEqual(cekKapasitas({ hariKerja: ["2026-11-17"], okupansi, batas: 2 }), { ok: true });
  assert.deepEqual(cekKapasitas({ hariKerja: [], okupansi, batas: 1 }), { ok: true });
});
