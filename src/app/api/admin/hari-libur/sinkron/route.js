import pool from "@/lib/db";
import { withRole } from "@/lib/with-role";
import { ok, fail, readBody } from "@/lib/http";
import { sinkronkanHariLibur } from "@/lib/liburin";

export const POST = withRole(["admin"], async ({ request }) => {
  const b = await readBody(request);
  const tahun = b.tahun ? Number(b.tahun) : new Date().getFullYear();
  if (!Number.isInteger(tahun) || tahun < 2000 || tahun > 2100) return fail("Tahun tidak valid.");

  const hasil = await sinkronkanHariLibur(pool, tahun);
  return hasil.ok ? ok(hasil) : fail(hasil.pesan);
});
