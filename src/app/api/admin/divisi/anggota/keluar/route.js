import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { guardApi } from "@/lib/guard";
import { keluarkanAnggota, keluarkanKetua } from "@/lib/queries/divisi";
import { parseId } from "@/lib/id";

export async function POST(request) {
  const g = await guardApi(["admin"], request);
  if (g.error) return g.error;

  let userId = null;
  let divisiId = null;
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const body = await request.json().catch(() => ({}));
    userId = parseId(body.userId);
    divisiId = parseId(body.divisiId);
  } else {
    const fd = await request.formData().catch(() => null);
    userId = parseId(fd?.get("userId"));
    divisiId = parseId(fd?.get("divisiId"));
  }

  if (userId == null) {
    return NextResponse.json({ ok: false, message: "User ID tidak valid." }, { status: 400 });
  }

  const u = (await pool.query("SELECT role FROM users WHERE id=$1 AND deleted_at IS NULL", [userId])).rows[0];
  let r;
  if (u?.role === "ketua_divisi" && divisiId) {
    r = await keluarkanKetua(pool, divisiId);
  } else {
    r = await keluarkanAnggota(pool, userId);
  }

  if (!r.ok) {
    return NextResponse.json({ ok: false, message: r.pesan }, { status: 400 });
  }

  const acceptsHtml = request.headers.get("accept")?.includes("text/html");
  if (acceptsHtml) {
    return NextResponse.redirect(new URL(divisiId ? `/admin/divisi/${divisiId}` : "/admin/divisi", request.url), 303);
  }

  return NextResponse.json({ ok: true, message: u?.role === "ketua_divisi" ? "Ketua divisi berhasil dikeluarkan." : "Anggota berhasil dikeluarkan." });
}

