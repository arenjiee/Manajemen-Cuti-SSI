import { test } from "node:test";
import assert from "node:assert/strict";
import { formatTanggal, formatHari, formatRentang, formatUkuran } from "./format.js";

test("formatTanggal dari string YYYY-MM-DD tanpa pergeseran zona", () => {
  assert.equal(formatTanggal("2026-11-09"), "9 Nov 2026");
  assert.equal(formatTanggal("2026-01-01"), "1 Jan 2026");
  assert.equal(formatTanggal(null), "-");
});
test("formatHari memakai koma desimal", () => {
  assert.equal(formatHari(0.5), "0,5");
  assert.equal(formatHari(3), "3");
  assert.equal(formatHari(11.5), "11,5");
});
test("formatRentang", () => {
  assert.equal(formatRentang("2026-11-09", "2026-11-09"), "9 Nov 2026");
  assert.equal(formatRentang("2026-11-09", "2026-11-13"), "9 Nov 2026 – 13 Nov 2026");
});

test("formatUkuran memakai B, KB, dan MB", () => {
  assert.equal(formatUkuran(0), "-");
  assert.equal(formatUkuran(null), "-");
  assert.equal(formatUkuran(512), "512 B");
  assert.equal(formatUkuran(1024), "1 KB");
  assert.equal(formatUkuran(1536), "2 KB");
  assert.equal(formatUkuran(1024 * 1024), "1.0 MB");
  assert.equal(formatUkuran(2 * 1024 * 1024), "2.0 MB");
});

test("formatWaktu memakai zona Asia/Makassar", async () => {
  const { formatWaktu } = await import("./format.js");
  assert.equal(formatWaktu(new Date("2026-11-09T06:05:00Z")), "9 Nov 2026, 14.05");
  assert.equal(formatWaktu(null), "-");
});
