import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { guardApi } from "@/lib/guard";
import { antreanLeader, putuskan } from "@/lib/queries/approval";

export async function GET(request) {
  const g = await guardApi(["ketua_divisi"], request);
  if (g.error) return g.error;

  const data = await antreanLeader(pool, g.user);
  return NextResponse.json({ ok: true, data });
}

export async function POST(request) {
  const g = await guardApi(["ketua_divisi"], request);
  if (g.error) return g.error;

  let body = {};
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    body = await request.json().catch(() => ({}));
  } else {
    const fd = await request.formData().catch(() => null);
    if (fd) {
      body = {
        id: fd.get("id"),
        keputusan: fd.get("keputusan"),
        catatan: fd.get("catatan"),
      };
    }
  }

  const r = await putuskan(pool, {
    pengajuanId: String(body.id ?? ""),
    approverId: g.user.id,
    tahap: "leader",
    keputusan: String(body.keputusan ?? ""),
    catatan: String(body.catatan ?? ""),
  });

  if (!r.ok) {
    return NextResponse.json({ ok: false, message: r.pesan }, { status: 400 });
  }

  return NextResponse.json({ ok: true, message: "Verifikasi berhasil disimpan." });
}

