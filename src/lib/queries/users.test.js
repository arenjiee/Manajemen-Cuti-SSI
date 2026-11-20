import test from "node:test";
import assert from "node:assert/strict";
import { buatUser, ubahUser, hapusUser, cekUsername } from "./users.js";

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

test("cekUsername: validasi huruf, angka, minus, underscore, titik, 3-50 karakter", () => {
  assert.equal(cekUsername("budi"), null);
  assert.equal(cekUsername("budi.santoso"), null);
  assert.equal(cekUsername("budi_123"), null);
  assert.equal(cekUsername("budi-ssi"), null);

  assert.match(cekUsername(""), /wajib diisi/);
  assert.match(cekUsername("ab"), /3–50/);
  assert.match(cekUsername("budi@ssi.co.id"), /hanya boleh/);
  assert.match(cekUsername("budi santoso"), /hanya boleh/);
});

test("buatUser: tolak role admin", async () => {
  const db = buatMockDb([]);
  const r = await buatUser(db, {
    username: "admin2",
    email: "admin2@ssi.co.id",
    password_hash: "hash",
    nama_lengkap: "Admin Kedua",
    role: "admin",
    tanggal_bergabung: "2026-01-01",
    kuota_awal: 12,
  });
  assert.equal(r.ok, false);
  assert.match(r.pesan, /Role Admin tidak dapat dibuat/);
});

test("buatUser: tolak kuota di bawah 12 hari", async () => {
  const db = buatMockDb([]);
  const r = await buatUser(db, {
    username: "karyawan.baru",
    email: "baru@ssi.co.id",
    password_hash: "hash",
    nama_lengkap: "Karyawan Baru",
    role: "karyawan",
    tanggal_bergabung: "2026-01-01",
    kuota_awal: 11.5,
  });
  assert.equal(r.ok, false);
  assert.match(r.pesan, /minimal 12 hari/);
});

test("ubahUser: tolak promosi ke admin dan demosi admin utama", async () => {
  // 1. Promosi ke admin
  const db1 = buatMockDb([
    { rows: [{ role: "karyawan", username: "karyawan1" }] },
  ]);
  const r1 = await ubahUser(db1, 10, {
    username: "karyawan1",
    email: "karyawan1@ssi.co.id",
    nama_lengkap: "Karyawan Satu",
    role: "admin",
    aktif: true,
  });
  assert.equal(r1.ok, false);
  assert.match(r1.pesan, /Role Admin tidak dapat diberikan/);

  // 2. Demosi admin utama
  const db2 = buatMockDb([
    { rows: [{ role: "admin", username: "admin" }] },
  ]);
  const r2 = await ubahUser(db2, 1, {
    username: "admin",
    email: "admin@ssi.co.id",
    nama_lengkap: "Admin Utama",
    role: "karyawan",
    aktif: true,
  });
  assert.equal(r2.ok, false);
  assert.match(r2.pesan, /Admin utama/);
});

test("hapusUser: tolak hapus admin", async () => {
  const db = buatMockDb([
    { rows: [{ role: "admin" }] },
  ]);
  const r = await hapusUser(db, 1);
  assert.equal(r.ok, false);
  assert.match(r.pesan, /Admin tidak dapat dihapus/);
});

test("hapusUser: izinkan hapus HRD jika masih ada HRD lain", async () => {
  const db = buatMockDb([
    { rows: [{ role: "hrd" }] }, // u
    { rows: [{ n: 1 }] },       // HRD lain aktif
    { rows: [] },               // memimpin divisi (null)
    { rows: [{ n: 0 }] },       // pengajuan cuti berjalan = 0
    { rowCount: 1 },            // UPDATE soft delete
  ]);
  const r = await hapusUser(db, 2);
  assert.equal(r.ok, true);
});

test("hapusUser: tolak hapus HRD terakhir", async () => {
  const db = buatMockDb([
    { rows: [{ role: "hrd" }] }, // u
    { rows: [{ n: 0 }] },       // tidak ada HRD lain aktif
  ]);
  const r = await hapusUser(db, 2);
  assert.equal(r.ok, false);
  assert.match(r.pesan, /HRD terakhir tidak dapat dihapus/);
});
