import test from "node:test";
import assert from "node:assert/strict";
import { ringkasanShell } from "./shell.js";

// Mock DB helper
function buatMockDb(handlers) {
  let panggil = 0;
  return {
    query: async (sql, params) => {
      const h = handlers[panggil++];
      if (!h) throw new Error(`Query tak terduga #${panggil}: ${sql}`);
      return typeof h === "function" ? h(sql, params) : h;
    },
  };
}

test("ringkasanShell: admin mengembalikan totalAktif dan pengajuanMenunggu", async () => {
  const db = buatMockDb([
    { rows: [{ n: 12 }] }, // users
    { rows: [{ n: 3 }] },  // pengajuan
  ]);

  const res = await ringkasanShell(db, { id: 1, role: "admin" }, { hari: "2026-04-10" });
  assert.equal(res.role, "admin");
  assert.equal(res.totalAktif, 12);
  assert.equal(res.pengajuanMenunggu, 3);
});

test("ringkasanShell: hrd mengembalikan menungguFinal dan jumlahOrangCuti", async () => {
  const db = buatMockDb([
    { rows: [{ n: 4 }] }, // final
    { rows: [{ n: 2 }] }, // cuti
  ]);

  const res = await ringkasanShell(db, { id: 2, role: "hrd" }, { hari: "2026-04-10" });
  assert.equal(res.role, "hrd");
  assert.equal(res.menungguFinal, 4);
  assert.equal(res.jumlahOrangCuti, 2);
});

test("ringkasanShell: ketua_divisi tanpa divisi mengembalikan 0 aman", async () => {
  const db = buatMockDb([
    { rows: [{ id: 3, divisi_id: null }] },
  ]);

  const res = await ringkasanShell(db, { id: 3, role: "ketua_divisi" }, { hari: "2026-04-10" });
  assert.equal(res.role, "ketua_divisi");
  assert.equal(res.divisiNama, null);
  assert.equal(res.menungguVerifikasi, 0);
  assert.equal(res.anggotaCutiMingguIni, 0);
});

test("ringkasanShell: ketua_divisi dengan divisi mengembalikan metrik", async () => {
  const db = buatMockDb([
    { rows: [{ id: 4, divisi_id: 10 }] }, // user info
    { rows: [{ nama: "Divisi IT" }] },     // nama divisi
    { rows: [{ n: 2 }] },                  // antre
    { rows: [{ n: 1 }] },                  // cuti
  ]);

  const res = await ringkasanShell(db, { id: 4, role: "ketua_divisi" }, { hari: "2026-04-10" });
  assert.equal(res.role, "ketua_divisi");
  assert.equal(res.divisiNama, "Divisi IT");
  assert.equal(res.menungguVerifikasi, 2);
  assert.equal(res.anggotaCutiMingguIni, 1);
});

test("ringkasanShell: karyawan mengembalikan menunggu", async () => {
  const db = buatMockDb([
    { rows: [{ n: 1 }] },
  ]);

  const res = await ringkasanShell(db, { id: 5, role: "karyawan" }, { hari: "2026-04-10" });
  assert.equal(res.role, "karyawan");
  assert.equal(res.menunggu, 1);
});
