import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { guardApi } from "@/lib/guard";
import { tambahAnggota } from "@/lib/queries/divisi";
import { parseId } from "@/lib/id";

export async function POST(request, { params }) {
  const g = await guardApi(["admin"], request);
  if (g.error) return g.error;

  const { id: rawId } = await params;
  const divisiId = parseId(rawId);
  if (divisiId == null) {
    return NextResponse.json({ ok: false, message: "ID divisi tidak valid." }, { status: 400 });
  }

  let userId = null;
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const body = await request.json().catch(() => ({}));
    userId = parseId(body.userId);
  } else {
    const fd = await request.formData().catch(() => null);
    userId = parseId(fd?.get("userId"));
  }

  if (userId == null) {
    return NextResponse.json({ ok: false, message: "User ID tidak valid." }, { status: 400 });
  }

  const r = await tambahAnggota(pool, divisiId, userId);
  if (!r.ok) {
    return NextResponse.json({ ok: false, message: r.pesan }, { status: 400 });
  }

  const acceptsHtml = request.headers.get("accept")?.includes("text/html");
  if (acceptsHtml) {
    return NextResponse.redirect(new URL(`/admin/divisi/${divisiId}`, request.url), 303);
  }

  return NextResponse.json({ ok: true, message: "Anggota berhasil ditambahkan." });
}
