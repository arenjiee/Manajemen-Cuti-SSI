import { test } from "node:test";
import assert from "node:assert/strict";
import { rentangMinggu, rentangBulan, labelBulan } from "./periode.js";

test("rentangMinggu: Senin sampai Minggu, dari hari mana pun dalam minggu itu", () => {
  const minggu = { dari: "2026-11-09", sampai: "2026-11-15" };
  for (const h of ["2026-11-09", "2026-11-10", "2026-11-14", "2026-11-15"]) assert.deepEqual(rentangMinggu(h), minggu, h);
  assert.deepEqual(rentangMinggu("2026-11-16"), { dari: "2026-11-16", sampai: "2026-11-22" });
});

test("rentangMinggu melewati pergantian bulan dan tahun", () => {
  assert.deepEqual(rentangMinggu("2026-12-31"), { dari: "2026-12-28", sampai: "2027-01-03" });
  assert.deepEqual(rentangMinggu("2026-03-01"), { dari: "2026-02-23", sampai: "2026-03-01" });
});

test("rentangBulan: tanggal 1 sampai hari terakhir, termasuk Februari kabisat dan Desember", () => {
  assert.deepEqual(rentangBulan("2026-11-10"), { dari: "2026-11-01", sampai: "2026-11-30" });
  assert.deepEqual(rentangBulan("2026-02-15"), { dari: "2026-02-01", sampai: "2026-02-28" });
  assert.deepEqual(rentangBulan("2028-02-01"), { dari: "2028-02-01", sampai: "2028-02-29" });
  assert.deepEqual(rentangBulan("2026-12-31"), { dari: "2026-12-01", sampai: "2026-12-31" });
});

test("labelBulan memakai nama bulan Indonesia", () => {
  assert.equal(labelBulan("2026-11-10"), "November 2026");
  assert.equal(labelBulan("2026-08-17"), "Agustus 2026");
});
