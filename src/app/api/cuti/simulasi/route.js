import pool from "@/lib/db";
import { withRole } from "@/lib/with-role";
import { readBody, bool, num, s } from "@/lib/http";
import { simulasiPengajuan } from "@/lib/queries/simulasi";

export const POST = withRole(["karyawan", "ketua_divisi"], async ({ request, user }) => {
  const b = await readBody(request);
  const hasil = await simulasiPengajuan(pool, user.id, {
    jenisId: num(b.jenisId),
    mulai: s(b.mulai),
    selesai: s(b.selesai),
    setengahHari: bool(b.setengahHari),
    handoverId: num(b.handoverId),
  });
  return Response.json(hasil);
});
