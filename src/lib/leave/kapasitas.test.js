import { test } from "node:test";
import assert from "node:assert/strict";
import { batasHarian, cekKapasitas } from "./kapasitas.js";

test("batasHarian: minimum 1 dan pembulatan ke bawah", () => {
  assert.equal(batasHarian(10, 8), 1);
  assert.equal(batasHarian(25, 10), 2);
  assert.equal(batasHarian(34, 6), 2);
  assert.equal(batasHarian(0, 6), 1);
  assert.equal(batasHarian(100, 4), 4);
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
