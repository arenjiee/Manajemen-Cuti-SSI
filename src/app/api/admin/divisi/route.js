import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { guardApi } from "@/lib/guard";
import { daftarDivisi, buatDivisi } from "@/lib/queries/divisi";

export async function GET(request) {
  const g = await guardApi(["admin", "hrd"], request);
  if (g.error) return g.error;

  const data = await daftarDivisi(pool, {});
  return NextResponse.json({ ok: true, data });
}

export async function POST(request) {
  const g = await guardApi(["admin"], request);
  if (g.error) return g.error;

  let body = {};
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    body = await request.json().catch(() => ({}));
  } else {
    const fd = await request.formData().catch(() => null);
    if (fd) {
      body = {
        nama: fd.get("nama"),
        deskripsi: fd.get("deskripsi"),
        ketuaId: fd.get("ketuaId"),
      };
    }
  }

  const s = (v) => String(v ?? "").trim();
  const num = (v) => (v != null && v !== "" && !Number.isNaN(Number(v)) ? Number(v) : null);

  const r = await buatDivisi(pool, {
    nama: s(body.nama),
    deskripsi: s(body.deskripsi),
    ketuaId: num(body.ketuaId),
  });

  if (!r.ok) {
    return NextResponse.json({ ok: false, message: r.pesan }, { status: 400 });
  }

  return NextResponse.json({ ok: true, id: r.id }, { status: 201 });
}

