import { test } from "node:test";
import assert from "node:assert/strict";
import { originValid } from "./origin.js";

test("Origin asing ditolak; sama atau kosong diterima", () => {
  assert.equal(originValid("https://evil.com", "localhost:3000"), false);
  assert.equal(originValid("http://localhost:3000", "localhost:3000"), true);
  assert.equal(originValid(null, "localhost:3000"), true);
  assert.equal(originValid("bukan-url", "localhost:3000"), false);
});
