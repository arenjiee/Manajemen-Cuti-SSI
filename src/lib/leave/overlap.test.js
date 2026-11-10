import { test } from "node:test";
import assert from "node:assert/strict";
import { adaOverlap } from "./overlap.js";

const aktif = [{ mulai: "2026-11-10", selesai: "2026-11-12" }];

test("overlap bersifat inklusif di kedua ujung", () => {
  assert.equal(adaOverlap("2026-11-12", "2026-11-14", aktif), true);
  assert.equal(adaOverlap("2026-11-08", "2026-11-10", aktif), true);
  assert.equal(adaOverlap("2026-11-13", "2026-11-14", aktif), false);
  assert.equal(adaOverlap("2026-11-08", "2026-11-09", aktif), false);
  assert.equal(adaOverlap("2026-11-01", "2026-11-30", aktif), true);
  assert.equal(adaOverlap("2026-11-01", "2026-11-30", []), false);
});
