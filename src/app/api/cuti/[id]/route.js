import pool from "@/lib/db";
import { withRole } from "@/lib/with-role";
import { ok, fail } from "@/lib/http";
import { detailPengajuan } from "@/lib/queries/detail";

export const GET = withRole(null, async ({ params, user }) => {
  const data = await detailPengajuan(pool, params.id, user);
  return data ? ok({ data }) : fail("Pengajuan tidak ditemukan atau tidak memiliki akses.", 404);
});
