import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { guardApi } from "@/lib/guard";
import { hapusHariLibur } from "@/lib/queries/hari-libur";
import { parseId } from "@/lib/id";

export async function POST(request) {
  const g = await guardApi(["admin"], request);
  if (g.error) return g.error;

  let ids = [];
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const body = await request.json().catch(() => ({}));
    if (Array.isArray(body.ids)) {
      ids = body.ids.map(parseId).filter((x) => x != null);
    } else if (body.id != null) {
      const parsed = parseId(body.id);
      if (parsed != null) ids = [parsed];
    }
  } else {
    const fd = await request.formData().catch(() => null);
    if (fd) {
      const rawIds = [...fd.getAll("ids"), ...fd.getAll("id")];
      if (rawIds.length > 0) {
        ids = rawIds
          .flatMap((x) => String(x).split(","))
          .map(parseId)
          .filter((x) => x != null);
      }
    }
  }

  ids = [...new Set(ids)];

  for (const id of ids) {
    await hapusHariLibur(pool, id);
  }

  const acceptsHtml = request.headers.get("accept")?.includes("text/html");
  if (acceptsHtml) {
    return NextResponse.redirect(new URL("/admin/hari-libur", request.url), 303);
  }

  const pesan = ids.length > 1 ? `${ids.length} hari libur berhasil dihapus.` : "Hari libur berhasil dihapus.";
  return NextResponse.json({ ok: true, message: pesan });
}

