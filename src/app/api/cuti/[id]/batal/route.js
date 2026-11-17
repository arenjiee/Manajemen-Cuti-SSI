import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { guardApi } from "@/lib/guard";
import { batalkanPengajuan } from "@/lib/queries/pengajuan";

export async function POST(request, { params }) {
  const g = await guardApi(["karyawan", "ketua_divisi"], request);
  if (g.error) return g.error;

  const { id } = await params;
  let alasan = "";
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const body = await request.json().catch(() => ({}));
    alasan = String(body.alasan ?? "").trim();
  } else {
    const fd = await request.formData().catch(() => null);
    alasan = String(fd?.get("alasan") ?? "").trim();
  }

  const r = await batalkanPengajuan(pool, id, g.user.id, alasan);
  if (!r.ok) {
    return NextResponse.json({ ok: false, message: r.pesan }, { status: 400 });
  }

  return NextResponse.json({ ok: true, message: "Pengajuan cuti berhasil dibatalkan." });
}

