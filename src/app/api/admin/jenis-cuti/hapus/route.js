import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { guardApi } from "@/lib/guard";
import { hapusJenis } from "@/lib/queries/jenis-cuti";
import { parseId } from "@/lib/id";

export async function POST(request) {
  const g = await guardApi(["admin"], request);
  if (g.error) return g.error;

  let idRaw = null;
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const body = await request.json().catch(() => ({}));
    idRaw = body.id;
  } else {
    const fd = await request.formData().catch(() => null);
    idRaw = fd?.get("id");
  }

  const id = parseId(idRaw);
  if (id == null) {
    return NextResponse.json({ ok: false, message: "ID tidak valid." }, { status: 400 });
  }

  const r = await hapusJenis(pool, id);
  if (!r.ok) {
    return NextResponse.json({ ok: false, message: r.pesan }, { status: 400 });
  }

  const acceptsHtml = request.headers.get("accept")?.includes("text/html");
  if (acceptsHtml) {
    return NextResponse.redirect(new URL("/admin/jenis-cuti", request.url), 303);
  }

  return NextResponse.json({ ok: true, message: "Jenis cuti berhasil dihapus." });
}

