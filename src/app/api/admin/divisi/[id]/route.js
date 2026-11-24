import pool from "@/lib/db";
import { withRole } from "@/lib/with-role";
import { ok, fail, readBody, s, num } from "@/lib/http";
import { parseId } from "@/lib/id";
import { ambilDivisi, ubahDivisi, hapusDivisi } from "@/lib/queries/divisi";

export const GET = withRole(["admin", "hrd"], async ({ params }) => {
  const id = parseId(params.id);
  if (id == null) return fail("ID tidak valid.");
  const divisi = await ambilDivisi(pool, id);
  return divisi ? ok({ data: divisi }) : fail("Divisi tidak ditemukan.", 404);
});

export const PUT = withRole(["admin"], async ({ request, params }) => {
  const id = parseId(params.id);
  if (id == null) return fail("ID tidak valid.");
  const b = await readBody(request);
  const r = await ubahDivisi(pool, id, {
    nama: s(b.nama),
    deskripsi: s(b.deskripsi),
    ketuaId: num(b.ketuaId),
  });
  return r.ok ? ok({ message: "Divisi berhasil diperbarui." }) : fail(r.pesan);
});

export const DELETE = withRole(["admin"], async ({ params }) => {
  const id = parseId(params.id);
  if (id == null) return fail("ID tidak valid.");
  const r = await hapusDivisi(pool, id);
  return r.ok ? ok({ message: "Divisi berhasil dihapus." }) : fail(r.pesan);
});
