import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { testPool, resetDb } from "../helpers/db.js";

const pool = testPool();
before(() => resetDb(pool));
after(() => pool.end());

const user = (email, extra = "") =>
  pool.query(
    `INSERT INTO users (username, email, password_hash, nama_lengkap, role, tanggal_bergabung ${extra ? "," + extra.split("=")[0] : ""})
     VALUES ($1, $2, 'x', 'N', 'karyawan', '2024-01-01' ${extra ? ", " + extra.split("=")[1] : ""}) RETURNING id`,
    [email.split("@")[0], email]
  );

test("email duplikat aktif ditolak", async () => {
  await user("a@x.com");
  await assert.rejects(user("a@x.com"), /unique|duplicate/i);
});

test("email milik user terhapus boleh dipakai ulang", async () => {
  const r = await pool.query(
    `INSERT INTO users (username,email,password_hash,nama_lengkap,role,tanggal_bergabung,deleted_at)
     VALUES ('b','b@x.com','x','N','karyawan','2024-01-01', now()) RETURNING id`
  );
  assert.ok(r.rows[0].id);
  await user("b@x.com");
});

test("ketua_id ganda di dua divisi ditolak", async () => {
  const { rows } = await pool.query(
    `INSERT INTO users (username,email,password_hash,nama_lengkap,role,tanggal_bergabung)
     VALUES ('k','k@x.com','x','K','ketua_divisi','2024-01-01') RETURNING id`
  );
  await pool.query("INSERT INTO divisi (nama, ketua_id) VALUES ('D1', $1)", [rows[0].id]);
  await assert.rejects(pool.query("INSERT INTO divisi (nama, ketua_id) VALUES ('D2', $1)", [rows[0].id]), /unique|duplicate/i);
});

async function pengajuan(mulai, selesai, setengah) {
  const u = await user(`p${Math.random()}@x.com`);
  const j = await pool.query(`INSERT INTO jenis_cuti (nama, kode, is_system, potong_kuota) VALUES ('J'||random(), NULL, false, true) RETURNING id`);
  return pool.query(
    `INSERT INTO pengajuan_cuti (pengaju_id, jenis_id, tanggal_mulai, tanggal_selesai, setengah_hari, total_hari, alasan, status, tahap)
     VALUES ($1,$2,$3,$4,$5,1,'a','Pending','leader')`,
    [u.rows[0].id, j.rows[0].id, mulai, selesai, setengah]
  );
}

test("setengah hari dengan mulai != selesai ditolak", async () => {
  await assert.rejects(pengajuan("2026-03-02", "2026-03-03", true), /check/i);
});

test("selesai < mulai ditolak", async () => {
  await assert.rejects(pengajuan("2026-03-03", "2026-03-02", false), /check/i);
});

test("pengajuan valid tersimpan", async () => {
  await pengajuan("2026-03-02", "2026-03-03", false);
});
