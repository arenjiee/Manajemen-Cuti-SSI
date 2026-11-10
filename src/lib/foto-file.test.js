import { test } from "node:test";
import assert from "node:assert/strict";
import { validasiFoto, kunciFoto, mimeDariKunci, FOTO_MAKS } from "./foto-file.js";

const JPG = [0xff, 0xd8, 0xff, 0xe0, 0, 0];
const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a];
const PDF = [0x25, 0x50, 0x44, 0x46, 0x2d];
const buf = (head, total = head.length) => { const b = Buffer.alloc(total); Buffer.from(head).copy(b); return b; };

test("validasiFoto menerima JPG dan PNG berdasarkan isi berkas, bukan nama atau ekstensi", () => {
  assert.deepEqual(validasiFoto(buf(JPG)), { ok: true, mime: "image/jpeg" });
  assert.deepEqual(validasiFoto(buf(PNG)), { ok: true, mime: "image/png" });
});

test("validasiFoto menolak PDF, teks, berkas kosong, dan yang lebih dari 2 MB", () => {
  assert.equal(validasiFoto(buf(PDF)).ok, false);
  assert.match(validasiFoto(buf(PDF)).pesan, /JPG atau PNG/);
  assert.equal(validasiFoto(Buffer.from("<svg onload=alert(1)>")).ok, false);
  assert.equal(validasiFoto(Buffer.alloc(0)).ok, false);
  assert.equal(validasiFoto(null).ok, false);
  assert.equal(FOTO_MAKS, 2 * 1024 * 1024);
  assert.equal(validasiFoto(buf(JPG, FOTO_MAKS)).ok, true);          // tepat 2 MB masih boleh
  const besar = validasiFoto(buf(JPG, FOTO_MAKS + 1));
  assert.equal(besar.ok, false);
  assert.match(besar.pesan, /2 MB/);
});

test("kunciFoto berawalan foto- dan mimeDariKunci hanya mengenali kunci foto yang sah", () => {
  assert.equal(kunciFoto("abc-123", "image/png"), "foto-abc-123.png");
  assert.equal(kunciFoto("abc-123", "image/jpeg"), "foto-abc-123.jpg");
  assert.equal(mimeDariKunci("foto-abc.jpg"), "image/jpeg");
  assert.equal(mimeDariKunci("foto-abc.png"), "image/png");
  for (const buruk of ["foto-abc.pdf", "abc.jpg", "../foto-abc.jpg", "", null, undefined]) assert.equal(mimeDariKunci(buruk), null, String(buruk));
});
