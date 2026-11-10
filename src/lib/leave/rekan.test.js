import { test } from "node:test";
import assert from "node:assert/strict";
import { kandidatRekan } from "./rekan.js";

const anggota = [
  { id: 1, aktif: true, pengajuanAktif: [] },
  { id: 2, aktif: true, pengajuanAktif: [] },
  { id: 3, aktif: true, pengajuanAktif: [{ mulai: "2026-11-16", selesai: "2026-11-17" }] },
  { id: 4, aktif: false, pengajuanAktif: [] },
];

test("kandidat: bukan diri sendiri, aktif, tidak sedang cuti pada rentang", () => {
  assert.deepEqual(kandidatRekan(anggota, 1, "2026-11-16", "2026-11-18"), [2]);
  assert.deepEqual(kandidatRekan(anggota, 1, "2026-11-20", "2026-11-21"), [2, 3]);
});

test("divisi hanya satu anggota: tidak ada kandidat (Review Focus 5)", () => {
  assert.deepEqual(kandidatRekan([anggota[0]], 1, "2026-11-16", "2026-11-18"), []);
});
