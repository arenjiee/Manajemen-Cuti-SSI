import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import { testPool, resetDb } from "../helpers/db.js";
import { autentikasi, bacaSessionUser } from "../../src/lib/auth-core.js";
import { buatToken } from "../../src/lib/session.js";

const pool = testPool();
let id;
before(async () => {
  await resetDb(pool);
  const hash = await bcrypt.hash("rahasia123", 4);
  const r = await pool.query(
    `INSERT INTO users (username,email,password_hash,nama_lengkap,role,tanggal_bergabung)
     VALUES ('Budi','budi@ssi.co.id',$1,'Budi','karyawan','2022-01-01') RETURNING id`, [hash]);
  id = r.rows[0].id;
});
after(() => pool.end());

test("login dengan email atau username, tidak peka huruf besar", async () => {
  assert.equal((await autentikasi(pool, "BUDI@ssi.co.id", "rahasia123")).id, id);
  assert.equal((await autentikasi(pool, "budi", "rahasia123")).id, id);
});

test("hasil dibersihkan dari password_hash", async () => {
  const u = await autentikasi(pool, "budi", "rahasia123");
  assert.equal("password_hash" in u, false);
});

test("password salah dan email tak dikenal sama-sama null", async () => {
  assert.equal(await autentikasi(pool, "budi", "salah"), null);
  assert.equal(await autentikasi(pool, "tidakada@x.com", "rahasia123"), null);
});

test("user nonaktif atau terhapus tidak bisa login", async () => {
  await pool.query("UPDATE users SET aktif=false WHERE id=$1", [id]);
  assert.equal(await autentikasi(pool, "budi", "rahasia123"), null);
  await pool.query("UPDATE users SET aktif=true WHERE id=$1", [id]);
});

test("session: role dibaca dari DB, perubahan langsung berlaku", async () => {
  const { token } = await buatToken(id, false);
  assert.equal((await bacaSessionUser(pool, token)).role, "karyawan");
  await pool.query("UPDATE users SET role='hrd' WHERE id=$1", [id]);
  assert.equal((await bacaSessionUser(pool, token)).role, "hrd");
  await pool.query("UPDATE users SET role='karyawan' WHERE id=$1", [id]);
});

test("session: user dinonaktifkan atau dihapus setelah login → null", async () => {
  const { token } = await buatToken(id, false);
  await pool.query("UPDATE users SET aktif=false WHERE id=$1", [id]);
  assert.equal(await bacaSessionUser(pool, token), null);
  await pool.query("UPDATE users SET aktif=true, deleted_at=now() WHERE id=$1", [id]);
  assert.equal(await bacaSessionUser(pool, token), null);
});
