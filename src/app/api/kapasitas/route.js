import pool from "@/lib/db";
import { withRole } from "@/lib/with-role";
import { ok, fail, readBody, s } from "@/lib/http";
import { petaKapasitas, ubahPersenKapasitas } from "@/lib/queries/kapasitas";
import { rentangBulan } from "@/lib/periode";
import { hariIni } from "@/lib/leave/tanggal";

export const GET = withRole(["admin", "hrd"], async ({ request }) => {
  const bulan = new URL(request.url).searchParams.get("bulan") || hariIni().slice(0, 7);
  const { dari, sampai } = rentangBulan(`${bulan}-01`);
  return ok({ data: await petaKapasitas(pool, { dari, sampai }) });
});

export const PUT = withRole(["admin", "hrd"], async ({ request }) => {
  const b = await readBody(request);
  const r = await ubahPersenKapasitas(pool, s(b.divisiId), s(b.persen));
  return r.ok ? ok({ message: "Kapasitas tim berhasil disimpan." }) : fail(r.pesan);
});
