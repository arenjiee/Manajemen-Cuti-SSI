import pool from "@/lib/db";
import { withRole } from "@/lib/with-role";
import { ok, fail, readBody } from "@/lib/http";
import { parseId } from "@/lib/id";
import { parseHariLibur } from "@/lib/parsers";
import { ubahHariLibur, hapusHariLibur } from "@/lib/queries/hari-libur";

export const GET = withRole(null, async ({ params }) => {
  const id = parseId(params.id);
  if (id == null) return fail("ID tidak valid.");
  const h = (await pool.query("SELECT * FROM hari_libur WHERE id=$1", [id])).rows[0];
  return h ? ok({ data: h }) : fail("Hari libur tidak ditemukan.", 404);
});

export const PUT = withRole(["admin"], async ({ request, params }) => {
  const id = parseId(params.id);
  if (id == null) return fail("ID tidak valid.");
  const r = await ubahHariLibur(pool, id, parseHariLibur(await readBody(request)));
  return r.ok ? ok({ message: "Hari libur berhasil diperbarui." }) : fail(r.pesan);
});

export const DELETE = withRole(["admin"], async ({ params }) => {
  const id = parseId(params.id);
  if (id == null) return fail("ID tidak valid.");
  await hapusHariLibur(pool, id);
  return ok({ message: "Hari libur berhasil dihapus." });
});
