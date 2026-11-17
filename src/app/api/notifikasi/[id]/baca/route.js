import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import pool from "@/lib/db";
import { guardApi } from "@/lib/guard";
import { tandaiDibaca } from "@/lib/queries/riwayat";
import { tautanInternal } from "@/lib/tautan";

export async function POST(request, { params }) {
  const g = await guardApi(null, request);
  if (g.error) return g.error;

  const { id } = await params;
  const r = await tandaiDibaca(pool, g.user.id, String(id));
  revalidatePath("/", "layout");

  const acceptsHtml = request.headers.get("accept")?.includes("text/html");
  if (acceptsHtml) {
    const tujuan = r.ok ? tautanInternal(r.link) : null;
    return NextResponse.redirect(new URL(tujuan ?? "/notifikasi", request.url), 303);
  }

  return NextResponse.json({ ok: true, link: r.ok ? r.link : null });
}

