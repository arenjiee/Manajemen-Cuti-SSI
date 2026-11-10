import pg from "pg";
import "./pg-types.js";

const globalRef = globalThis;
const pool = globalRef.__smckPool ?? new pg.Pool({ connectionString: process.env.DATABASE_URL });
if (process.env.NODE_ENV !== "production") globalRef.__smckPool = pool;

export default pool;
