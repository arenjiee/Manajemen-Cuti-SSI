import pool from "@/lib/db";
import { withRole } from "@/lib/with-role";
import { ok } from "@/lib/http";
import { daftarKuotaHangus } from "@/lib/queries/kuota-hangus";
import { ambangValid } from "@/lib/leave/kuota-hangus";

export const GET = withRole(["admin", "hrd"], async ({ request }) => {
  const raw = new URL(request.url).searchParams.get("ambang");
  const ambang = raw !== null && raw !== "" ? ambangValid(raw) : undefined;
  return ok({ data: await daftarKuotaHangus(pool, { ambang }) });
});
