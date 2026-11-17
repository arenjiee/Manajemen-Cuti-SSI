import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { guardApi } from "@/lib/guard";
import { notifikasiUser, jumlahBelumDibaca } from "@/lib/queries/riwayat";

export async function GET(request) {
  const g = await guardApi(null, request);
  if (g.error) return g.error;

  const url = new URL(request.url);
  const hanyaBelum = url.searchParams.get("tampil") === "belum";

  const [rows, belum] = await Promise.all([
    notifikasiUser(pool, g.user.id, { hanyaBelum }),
    jumlahBelumDibaca(pool, g.user.id),
  ]);

  return NextResponse.json({ ok: true, data: rows, belumDibaca: belum });
}

