import { test } from "node:test";
import assert from "node:assert/strict";
import { buatToken, bacaToken } from "./session.js";

test("token valid dibaca balik menjadi userId", async () => {
  const { token } = await buatToken(42, false);
  assert.equal(await bacaToken(token), 42);
});

test("token dirusak, kosong, atau kedaluwarsa menghasilkan null", async () => {
  const { token } = await buatToken(42, false);
  assert.equal(await bacaToken(token.slice(0, -3) + "abc"), null);
  assert.equal(await bacaToken(""), null);
  assert.equal(await bacaToken(undefined), null);
  const lama = await buatToken(42, false, { ttlDetik: -10 });
  assert.equal(await bacaToken(lama.token), null);
});

test("Remember Me: maxAge 30 hari; tanpa itu cookie sesi (tanpa maxAge)", async () => {
  assert.equal((await buatToken(1, true)).maxAge, 30 * 24 * 3600);
  assert.equal((await buatToken(1, false)).maxAge, undefined);
});
