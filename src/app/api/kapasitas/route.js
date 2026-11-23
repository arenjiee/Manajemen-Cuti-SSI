import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { guardApi } from "@/lib/guard";
import { petaKapasitas, ubahPersenKapasitas } from "@/lib/queries/kapasitas";
import { rentangBulan } from "@/lib/periode";
import { hariIni } from "@/lib/leave/tanggal";

export async function GET(request) {
  const g = await guardApi(["admin", "hrd"], request);
  if (g.error) return g.error;

  const url = new URL(request.url);
  const bulan = url.searchParams.get("bulan") || hariIni().slice(0, 7);
  const { dari, sampai } = rentangBulan(`${bulan}-01`);

  const data = await petaKapasitas(pool, { dari, sampai });
  return NextResponse.json({ ok: true, data });
}

export async function POST(request) {
  return handleUpdate(request);
}

export async function PUT(request) {
  return handleUpdate(request);
}

async function handleUpdate(request) {
  const g = await guardApi(["admin", "hrd"], request);
  if (g.error) return g.error;

  let body = {};
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    body = await request.json().catch(() => ({}));
  } else {
    const fd = await request.formData().catch(() => null);
    if (fd) {
      body = {
        divisiId: fd.get("divisiId"),
        persen: fd.get("persen"),
        bulan: fd.get("bulan"),
      };
    }
  }

  const s = (v) => String(v ?? "").trim();
  const r = await ubahPersenKapasitas(pool, s(body.divisiId), s(body.persen));

  if (!r.ok) {
    return NextResponse.json({ ok: false, message: r.pesan }, { status: 400 });
  }

  const acceptsHtml = request.headers.get("accept")?.includes("text/html");
  if (acceptsHtml) {
    const bulanParam = body.bulan ? `?bulan=${encodeURIComponent(body.bulan)}&ok=batas` : "?ok=batas";
    return NextResponse.redirect(new URL(`/kapasitas${bulanParam}`, request.url), 303);
  }

  return NextResponse.json({ ok: true, message: "Kapasitas tim berhasil disimpan." });
}

