import pool from "@/lib/db";
import { withRole } from "@/lib/with-role";
import { ok, fail, readBody, parseIdList } from "@/lib/http";
import { parseHariLibur } from "@/lib/parsers";
import { daftarHariLibur, buatHariLibur, hapusHariLibur } from "@/lib/queries/hari-libur";

export const GET = withRole(null, async ({ request }) => {
  const tahun = new URL(request.url).searchParams.get("tahun") || undefined;
  return ok({ data: await daftarHariLibur(pool, { tahun }) });
});

export const POST = withRole(["admin"], async ({ request }) => {
  const r = await buatHariLibur(pool, parseHariLibur(await readBody(request)));
  return r.ok ? ok({ id: r.id }, 201) : fail(r.pesan);
});

export const DELETE = withRole(["admin"], async ({ request }) => {
  const b = await readBody(request);
  const ids = parseIdList(b.ids ?? b.id);
  if (ids.length === 0) return fail("ID tidak valid.");
  for (const id of ids) await hapusHariLibur(pool, id);
  return ok({ message: ids.length > 1 ? `${ids.length} hari libur berhasil dihapus.` : "Hari libur berhasil dihapus." });
});
