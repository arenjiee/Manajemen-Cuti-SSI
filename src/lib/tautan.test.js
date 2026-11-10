import { test } from "node:test";
import assert from "node:assert/strict";
import { tautanInternal } from "./tautan.js";

test("tautanInternal hanya meneruskan path internal yang aman", () => {
  for (const ok of ["/cuti/5", "/verifikasi", "/persetujuan", "/profil?id=3&ok=1", "/cuti/5#timeline", "/"]) assert.equal(tautanInternal(ok), ok, ok);
});

test("tautanInternal menolak URL eksternal, protocol-relative, skema berbahaya, dan trik backslash/spasi", () => {
  for (const buruk of ["//evil.example", "https://evil.example", "http://evil.example/cuti/1", "javascript:alert(1)", "/\\evil.example", "\\\\evil.example",
    "/\t/evil.example", "/\n/evil.example", " /cuti/1", "cuti/1", "", null, undefined, 5, {}, "/" + "a".repeat(200)]) {
    assert.equal(tautanInternal(buruk), null, JSON.stringify(buruk));
  }
});
