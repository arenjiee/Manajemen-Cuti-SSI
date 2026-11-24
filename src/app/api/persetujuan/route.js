import pool from "@/lib/db";
import { withRole } from "@/lib/with-role";
import { ok, fail, readBody } from "@/lib/http";
import { antreanHrd, muatPeringatanHrd, putuskan } from "@/lib/queries/approval";

export const GET = withRole(["hrd"], async () => {
  const antre = await antreanHrd(pool);
  const peringatan = await Promise.all(antre.map((p) => muatPeringatanHrd(pool, p.id)));
  return ok({ data: antre.map((p, i) => ({ ...p, peringatan: peringatan[i] })) });
});

export const POST = withRole(["hrd"], async ({ request, user }) => {
  const b = await readBody(request);
  const r = await putuskan(pool, {
    pengajuanId: String(b.id ?? ""),
    approverId: user.id,
    tahap: "hrd",
    keputusan: String(b.keputusan ?? ""),
    catatan: String(b.catatan ?? ""),
  });
  return r.ok ? ok({ message: "Keputusan berhasil disimpan." }) : fail(r.pesan);
});
