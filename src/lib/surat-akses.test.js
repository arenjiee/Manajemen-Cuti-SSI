import { test } from "node:test";
import assert from "node:assert/strict";
import { bolehUnduhSurat } from "./surat-akses.js";

const p = (o = {}) => ({ status: "Approved", pengaju_id: 4, ...o });

test("surat hanya untuk pengajuan Approved", () => {
  for (const status of ["Pending", "Approved by Leader", "Rejected", "Cancelled"]) {
    assert.equal(bolehUnduhSurat({ id: 4, role: "karyawan" }, p({ status })), false);
  }
  assert.equal(bolehUnduhSurat({ id: 4, role: "karyawan" }, p()), true);
});

test("surat boleh diunduh pengaju, HRD, Admin; tidak oleh karyawan lain atau ketua divisi lain", () => {
  assert.equal(bolehUnduhSurat({ id: 2, role: "hrd" }, p()), true);
  assert.equal(bolehUnduhSurat({ id: 1, role: "admin" }, p()), true);
  assert.equal(bolehUnduhSurat({ id: 5, role: "karyawan" }, p()), false);
  assert.equal(bolehUnduhSurat({ id: 3, role: "ketua_divisi" }, p()), false);
});
