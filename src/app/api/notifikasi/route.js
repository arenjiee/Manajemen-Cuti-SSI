import pool from "@/lib/db";
import { withRole } from "@/lib/with-role";
import { ok } from "@/lib/http";
import { notifikasiUser, jumlahBelumDibaca } from "@/lib/queries/riwayat";

export const GET = withRole(null, async ({ request, user }) => {
  const hanyaBelum = new URL(request.url).searchParams.get("tampil") === "belum";
  const [rows, belum] = await Promise.all([
    notifikasiUser(pool, user.id, { hanyaBelum }),
    jumlahBelumDibaca(pool, user.id),
  ]);
  return ok({ data: rows, belumDibaca: belum });
});
