import "../../src/lib/pg-types.js";
import { readFileSync } from "node:fs";
import pg from "pg";

export function testPool() {
  return new pg.Pool({ connectionString: process.env.DATABASE_URL_TEST });
}

export async function resetDb(pool) {
  await pool.query("DROP SCHEMA public CASCADE; CREATE SCHEMA public;");
  await pool.query(readFileSync(new URL("../../db/schema.sql", import.meta.url), "utf8"));
}
