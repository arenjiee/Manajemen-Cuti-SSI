import pool from "@/lib/db";
import { withRole } from "@/lib/with-role";
import { ok, fail, readBody } from "@/lib/http";
import { antreanLeader, putuskan } from "@/lib/queries/approval";

export const GET = withRole(["ketua_divisi"], async ({ user }) => {
  return ok({ data: await antreanLeader(pool, user) });
});

export const POST = withRole(["ketua_divisi"], async ({ request, user }) => {
  const b = await readBody(request);
  const r = await putuskan(pool, {
    pengajuanId: String(b.id ?? ""),
    approverId: user.id,
    tahap: "leader",
    keputusan: String(b.keputusan ?? ""),
    catatan: String(b.catatan ?? ""),
  });
  return r.ok ? ok({ message: "Verifikasi berhasil disimpan." }) : fail(r.pesan);
});
