import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { guardApi } from "@/lib/guard";
import { approveBanyak } from "@/lib/queries/approval";

export async function POST(request) {
  const g = await guardApi(["hrd"], request);
  if (g.error) return g.error;

  let ids = [];
  const contentType = request.headers.get("content-type") || "";
  const acceptsHtml = request.headers.get("accept")?.includes("text/html");

  if (contentType.includes("application/json")) {
    const body = await request.json().catch(() => ({}));
    ids = Array.isArray(body.ids) ? body.ids.map(String) : [];
  } else {
    const fd = await request.formData().catch(() => null);
    if (fd) {
      ids = fd.getAll("ids").map(String);
    }
  }

  if (ids.length === 0) {
    if (acceptsHtml) {
      return NextResponse.redirect(new URL("/persetujuan?ok=0&lewat=0", request.url), 303);
    }
    return NextResponse.json({ ok: true, berhasil: 0, dilewati: 0 });
  }

  const r = await approveBanyak(pool, g.user.id, ids);

  if (acceptsHtml) {
    return NextResponse.redirect(
      new URL(`/persetujuan?ok=${r.berhasil.length}&lewat=${r.dilewati.length}`, request.url),
      303
    );
  }

  return NextResponse.json({
    ok: true,
    berhasil: r.berhasil.length,
    dilewati: r.dilewati.length,
  });
}
