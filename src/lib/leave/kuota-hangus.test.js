import { test } from "node:test";
import assert from "node:assert/strict";
import { hariKerjaTersisa, risikoHangus, ambangValid, AMBANG_DEFAULT } from "./kuota-hangus.js";

test("hariKerjaTersisa menghitung sampai 31 Des tanpa akhir pekan dan libur", () => {
  assert.equal(hariKerjaTersisa("2026-12-28", new Set()), 4);
  assert.equal(hariKerjaTersisa("2026-12-28", new Set(["2026-12-31"])), 3);
  assert.equal(hariKerjaTersisa("2026-12-31", new Set()), 1);
});

test("risikoHangus: pasti jika sisa melebihi hari kerja tersisa", () => {
  assert.equal(risikoHangus(8, 4), "pasti");
  assert.equal(risikoHangus(6, 20), "waspada");
  assert.equal(risikoHangus(4.5, 20), null);
  assert.equal(risikoHangus(0, 20), null);
  assert.equal(risikoHangus(-1, 20), null);
});

test("risikoHangus menghormati ambang kustom", () => {
  assert.equal(risikoHangus(3, 20, 3), "waspada");
  assert.equal(risikoHangus(2.5, 20, 3), null);
});

test("ambangValid menolak nilai ngawur", () => {
  assert.equal(ambangValid("abc"), AMBANG_DEFAULT);
  assert.equal(ambangValid("-2"), AMBANG_DEFAULT);
  assert.equal(ambangValid("9999"), AMBANG_DEFAULT);
  assert.equal(ambangValid("7"), 7);
  assert.equal(ambangValid(undefined), AMBANG_DEFAULT);
});
