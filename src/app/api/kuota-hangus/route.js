import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { guardApi } from "@/lib/guard";
import { daftarKuotaHangus } from "@/lib/queries/kuota-hangus";
import { ambangValid } from "@/lib/leave/kuota-hangus";

export async function GET(request) {
  const g = await guardApi(["admin", "hrd"], request);
  if (g.error) return g.error;

  const url = new URL(request.url);
  const ambang = ambangValid(url.searchParams.get("ambang"));
  const data = await daftarKuotaHangus(pool, { ambang });

  return NextResponse.json({ ok: true, data });
}

