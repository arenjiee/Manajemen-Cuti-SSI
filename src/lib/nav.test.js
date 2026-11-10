import { test } from "node:test";
import assert from "node:assert/strict";
import { menuUntukRole } from "./nav.js";

const hrefs = (role) => menuUntukRole(role).map((m) => m.href);

test("menu dibatasi per role", () => {
  assert.ok(hrefs("admin").includes("/admin/users"));
  assert.ok(!hrefs("karyawan").includes("/admin/users"));
  assert.ok(hrefs("karyawan").includes("/cuti/ajukan"));
  assert.ok(!hrefs("hrd").includes("/cuti/ajukan"));
  assert.ok(!hrefs("admin").includes("/cuti/ajukan"));
  assert.ok(hrefs("ketua_divisi").includes("/verifikasi"));
  assert.ok(hrefs("ketua_divisi").includes("/cuti/ajukan"));
  assert.ok(hrefs("hrd").includes("/persetujuan"));
  assert.ok(!hrefs("karyawan").includes("/persetujuan"));
});

test("semua role punya dashboard, riwayat, dan profil; role asing kosong", () => {
  for (const r of ["admin", "karyawan", "ketua_divisi", "hrd"]) {
    for (const h of ["/dashboard", "/riwayat", "/profil"]) assert.ok(hrefs(r).includes(h), `${r} ${h}`);
  }
  assert.deepEqual(menuUntukRole("hacker"), []);
});
