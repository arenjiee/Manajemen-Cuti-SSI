import test from "node:test";
import assert from "node:assert/strict";
import { ubahProfil } from "./profil.js";

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

test("ubahProfil: pengguna biasa boleh mengubah username sendiri dengan format sah", async () => {
  const db = buatMockDb([
    { rows: [{ role: "karyawan", username: "budi.lama" }] },
    { rowCount: 1 }, // update
  ]);

  const actor = { id: 10, role: "karyawan" };
  const r = await ubahProfil(db, actor, 10, {
    nama_lengkap: "Budi Santoso",
    email: "budi@ssi.co.id",
    username: "budi.baru",
  });
  assert.equal(r.ok, true);
});

test("ubahProfil: tolak format username tidak sah", async () => {
  const db = buatMockDb([
    { rows: [{ role: "karyawan", username: "budi.lama" }] },
  ]);

  const actor = { id: 10, role: "karyawan" };
  const r = await ubahProfil(db, actor, 10, {
    nama_lengkap: "Budi Santoso",
    email: "budi@ssi.co.id",
    username: "budi@email.com",
  });
  assert.equal(r.ok, false);
  assert.match(r.pesan, /Username 3–50/);
});

test("ubahProfil: tolak promosi ke admin", async () => {
  const db = buatMockDb([
    { rows: [{ role: "karyawan", username: "budi" }] },
  ]);

  const admin = { id: 1, role: "admin" };
  const r = await ubahProfil(db, admin, 10, {
    nama_lengkap: "Budi Santoso",
    email: "budi@ssi.co.id",
    role: "admin",
  });
  assert.equal(r.ok, false);
  assert.match(r.pesan, /Role Admin tidak dapat diberikan/);
});
