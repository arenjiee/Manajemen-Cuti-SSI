// Jalankan fn dalam transaksi. Jika db sudah berupa client (tanpa connect), pakai apa adanya.
export async function denganTransaksi(db, fn) {
  if (typeof db.connect !== "function") return fn(db);
  const c = await db.connect();
  try {
    await c.query("BEGIN");
    const r = await fn(c);
    await c.query("COMMIT");
    return r;
  } catch (e) {
    await c.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    c.release();
  }
}

export const HARI_INI_SQL = "(now() AT TIME ZONE 'Asia/Makassar')::date";
