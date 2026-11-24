import pool from "@/lib/db";
import { withRole } from "@/lib/with-role";
import { ok, fail, readBody } from "@/lib/http";
import { parseJenis } from "@/lib/parsers";
import { daftarJenis, buatJenis } from "@/lib/queries/jenis-cuti";

export const GET = withRole(null, async () => ok({ data: await daftarJenis(pool) }));

export const POST = withRole(["admin"], async ({ request }) => {
  const r = await buatJenis(pool, parseJenis(await readBody(request)));
  return r.ok ? ok({ id: r.id }, 201) : fail(r.pesan);
});
