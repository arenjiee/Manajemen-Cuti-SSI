import { readFileSync, mkdirSync, copyFileSync, readdirSync } from "node:fs";
import pg from "pg";

// Sumber data dummy yang sama dengan panduan pgAdmin: db/seed_data_baru.sql
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
try {
  await pool.query("DROP SCHEMA public CASCADE; CREATE SCHEMA public;");
  await pool.query(readFileSync(new URL("../db/schema.sql", import.meta.url), "utf8"));
  await pool.query(readFileSync(new URL("../db/seed_data_baru.sql", import.meta.url), "utf8"));
  mkdirSync("uploads", { recursive: true });
  for (const f of readdirSync("seed/lampiran")) copyFileSync(`seed/lampiran/${f}`, `uploads/${f}`);
  const r = await pool.query("SELECT role, count(*)::int FROM users GROUP BY role ORDER BY role");
  console.table(r.rows);
  console.log("Seed selesai. Semua akun memakai password: password123");
} finally {
  await pool.end();
}
