import { test } from "node:test";
import assert from "node:assert/strict";
import { deteksiMime, ekstensiDari } from "./lampiran-file.js";

test("deteksiMime membaca tanda tangan berkas, bukan nama atau tipe klaim", () => {
  assert.equal(deteksiMime(Buffer.from("%PDF-1.4\n...")), "application/pdf");
  assert.equal(deteksiMime(Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0])), "image/jpeg");
  assert.equal(deteksiMime(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])), "image/png");
});

test("berkas lain (skrip, zip, kosong) ditolak", () => {
  assert.equal(deteksiMime(Buffer.from("<script>alert(1)</script>")), null);
  assert.equal(deteksiMime(Buffer.from([0x50, 0x4b, 0x03, 0x04])), null);
  assert.equal(deteksiMime(Buffer.alloc(0)), null);
});

test("ekstensiDari", () => {
  assert.equal(ekstensiDari("application/pdf"), ".pdf");
  assert.equal(ekstensiDari("image/jpeg"), ".jpg");
  assert.equal(ekstensiDari("image/png"), ".png");
  assert.equal(ekstensiDari("text/html"), "");
});
