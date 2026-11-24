import pool from "@/lib/db";
import { withRole } from "@/lib/with-role";
import { ok, fail, readBody } from "@/lib/http";
import { parseId } from "@/lib/id";
import { parseJenis } from "@/lib/parsers";
import { ambilJenis, ubahJenis, hapusJenis } from "@/lib/queries/jenis-cuti";

export const GET = withRole(null, async ({ params }) => {
  const id = parseId(params.id);
  if (id == null) return fail("ID tidak valid.");
  const data = await ambilJenis(pool, id);
  return data ? ok({ data }) : fail("Jenis cuti tidak ditemukan.", 404);
});

export const PUT = withRole(["admin"], async ({ request, params }) => {
  const id = parseId(params.id);
  if (id == null) return fail("ID tidak valid.");
  const r = await ubahJenis(pool, id, parseJenis(await readBody(request)));
  return r.ok ? ok({ message: "Jenis cuti berhasil diperbarui." }) : fail(r.pesan);
});

export const DELETE = withRole(["admin"], async ({ params }) => {
  const id = parseId(params.id);
  if (id == null) return fail("ID tidak valid.");
  const r = await hapusJenis(pool, id);
  return r.ok ? ok({ message: "Jenis cuti berhasil dihapus." }) : fail(r.pesan);
});
