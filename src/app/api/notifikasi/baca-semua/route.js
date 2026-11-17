import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import pool from "@/lib/db";
import { guardApi } from "@/lib/guard";
import { tandaiSemuaDibaca } from "@/lib/queries/riwayat";

export async function POST(request) {
  const g = await guardApi(null, request);
  if (g.error) return g.error;

  await tandaiSemuaDibaca(pool, g.user.id);
  revalidatePath("/", "layout");

  const acceptsHtml = request.headers.get("accept")?.includes("text/html");
  if (acceptsHtml) {
    return NextResponse.redirect(new URL("/notifikasi", request.url), 303);
  }

  return NextResponse.json({ ok: true, message: "Semua notifikasi ditandai dibaca." });
}

