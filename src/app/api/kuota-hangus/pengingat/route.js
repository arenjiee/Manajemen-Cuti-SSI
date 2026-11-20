import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { guardApi } from "@/lib/guard";
import { kirimPengingat } from "@/lib/queries/kuota-hangus";
import { ambangValid } from "@/lib/leave/kuota-hangus";

export async function POST(request) {
  const g = await guardApi(["admin", "hrd"], request);
  if (g.error) return g.error;

  let ids = [];
  let ambangRaw = null;
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const body = await request.json().catch(() => ({}));
    ids = Array.isArray(body.ids) ? body.ids.map(String) : [];
    ambangRaw = body.ambang;
  } else {
    const fd = await request.formData().catch(() => null);
    if (fd) {
      ids = fd.getAll("ids").map(String);
      ambangRaw = fd.get("ambang");
    }
  }

  const ambang = ambangRaw !== null && ambangRaw !== "" && ambangRaw !== undefined ? ambangValid(ambangRaw) : undefined;
  const r = await kirimPengingat(pool, ids, { ambang });

  const acceptsHtml = request.headers.get("accept")?.includes("text/html");
  if (acceptsHtml) {
    const qAmbang = ambang ? `ambang=${ambang}&` : "";
    return NextResponse.redirect(
      new URL(`/kuota-hangus?${qAmbang}terkirim=${r.terkirim}&dilewati=${r.dilewati}`, request.url),
      303
    );
  }

  return NextResponse.json({
    ok: true,
    terkirim: r.terkirim,
    dilewati: r.dilewati,
  });
}

