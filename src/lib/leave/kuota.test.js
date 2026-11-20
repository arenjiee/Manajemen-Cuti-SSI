import { test } from "node:test";
import assert from "node:assert/strict";
import { sisaKuota } from "./kuota.js";

test("sisaKuota desimal tanpa galat floating", () => {
  assert.equal(sisaKuota(12, 11.5), 0.5);
  assert.equal(sisaKuota(12, 0.1 + 0.2), 11.7);
  assert.equal(sisaKuota(12, 12), 0);
});

test("sisaKuota tidak pernah minus, minimal 0", () => {
  assert.equal(sisaKuota(12, 15), 0);
  assert.equal(sisaKuota(12, 12.5), 0);
});
