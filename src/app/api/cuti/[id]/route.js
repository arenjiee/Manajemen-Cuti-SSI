import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { guardApi } from "@/lib/guard";
import { detailPengajuan } from "@/lib/queries/detail";

export async function GET(request, { params }) {
  const g = await guardApi(null, request);
  if (g.error) return g.error;

  const { id } = await params;
  const data = await detailPengajuan(pool, id, g.user);

  if (!data) {
    return NextResponse.json(
      { ok: false, message: "Pengajuan tidak ditemukan atau tidak memiliki akses." },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true, data });
}

