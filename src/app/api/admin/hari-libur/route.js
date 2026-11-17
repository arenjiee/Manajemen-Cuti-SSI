import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { guardApi } from "@/lib/guard";
import { daftarHariLibur, buatHariLibur } from "@/lib/queries/hari-libur";

const parseForm = (body) => ({
  tanggal: String(body.tanggal ?? "").trim(),
  keterangan: String(body.keterangan ?? "").trim(),
  jenis: String(body.jenis ?? "").trim(),
});

export async function GET(request) {
  const g = await guardApi(null, request);
  if (g.error) return g.error;

  const url = new URL(request.url);
  const tahun = url.searchParams.get("tahun") || undefined;
  const data = await daftarHariLibur(pool, { tahun });
  return NextResponse.json({ ok: true, data });
}

export async function POST(request) {
  const g = await guardApi(["admin"], request);
  if (g.error) return g.error;

  let raw = {};
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    raw = await request.json().catch(() => ({}));
  } else {
    const fd = await request.formData().catch(() => null);
    if (fd) {
      raw = {
        tanggal: fd.get("tanggal"),
        keterangan: fd.get("keterangan"),
        jenis: fd.get("jenis"),
      };
    }
  }

  const r = await buatHariLibur(pool, parseForm(raw));
  if (!r.ok) {
    return NextResponse.json({ ok: false, message: r.pesan }, { status: 400 });
  }

  return NextResponse.json({ ok: true, id: r.id }, { status: 201 });
}

