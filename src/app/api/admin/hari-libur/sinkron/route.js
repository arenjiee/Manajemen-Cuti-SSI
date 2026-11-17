import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { guardApi } from "@/lib/guard";
import { sinkronkanHariLibur } from "@/lib/liburin";

export async function POST(request) {
  const g = await guardApi(["admin"], request);
  if (g.error) return g.error;

  let tahun = new Date().getFullYear();
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const body = await request.json().catch(() => ({}));
    if (body.tahun) tahun = Number(body.tahun);
  } else {
    const fd = await request.formData().catch(() => null);
    if (fd && fd.get("tahun")) {
      tahun = Number(fd.get("tahun"));
    }
  }

  if (!Number.isInteger(tahun) || tahun < 2000 || tahun > 2100) {
    return NextResponse.json({ ok: false, pesan: "Tahun tidak valid." }, { status: 400 });
  }

  const hasil = await sinkronkanHariLibur(pool, tahun);
  if (!hasil.ok) {
    return NextResponse.json({ ok: false, pesan: hasil.pesan }, { status: 400 });
  }

  return NextResponse.json(hasil);
}
