import { test } from "node:test";
import assert from "node:assert/strict";
import { buatPembatas } from "./rate-limit.js";

test("diblokir setelah maks kegagalan, bebas lagi setelah jendela lewat", () => {
  let t = 1000;
  const p = buatPembatas({ maks: 3, jendelaMs: 60000, sekarang: () => t });
  for (let i = 0; i < 2; i++) p.catatGagal("a");
  assert.equal(p.sisaTungguMs("a"), 0);
  p.catatGagal("a");
  assert.equal(p.sisaTungguMs("a"), 60000);
  t += 30000;
  assert.equal(p.sisaTungguMs("a"), 30000);
  t += 30000;
  assert.equal(p.sisaTungguMs("a"), 0);
});

test("kunci berbeda tidak saling memengaruhi dan hapus mereset", () => {
  const p = buatPembatas({ maks: 1, jendelaMs: 1000, sekarang: () => 0 });
  p.catatGagal("a");
  assert.ok(p.sisaTungguMs("a") > 0);
  assert.equal(p.sisaTungguMs("b"), 0);
  p.hapus("a");
  assert.equal(p.sisaTungguMs("a"), 0);
});

test("jendela baru dimulai setelah jendela lama habis", () => {
  let t = 0;
  const p = buatPembatas({ maks: 2, jendelaMs: 100, sekarang: () => t });
  p.catatGagal("a"); p.catatGagal("a");
  t = 150;
  p.catatGagal("a");
  assert.equal(p.sisaTungguMs("a"), 0);
});
