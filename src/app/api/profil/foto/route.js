import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import pool from "@/lib/db";
import { guardApi } from "@/lib/guard";
import { ubahFoto } from "@/lib/queries/profil";
import { hapusFotoLama } from "@/lib/upload-fs";
import { parseId } from "@/lib/id";

export async function POST(request) {
  return handleHapusFoto(request);
}

export async function DELETE(request) {
  return handleHapusFoto(request);
}

async function handleHapusFoto(request) {
  const g = await guardApi(null, request);
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

  const id = idRaw ? parseId(idRaw) : g.user.id;
  if (id == null) {
    return NextResponse.json({ ok: false, message: "ID tidak valid." }, { status: 400 });
  }

  const r = await ubahFoto(pool, g.user, id, null);
  if (r.ok && r.lama) {
    await hapusFotoLama(r.lama);
  }

  revalidatePath("/profil");

  const acceptsHtml = request.headers.get("accept")?.includes("text/html");
  if (acceptsHtml) {
    const p = new URLSearchParams();
    if (id !== g.user.id) p.set("id", String(id));
    if (r.ok) p.set("ok", "foto");
    const q = p.toString();
    return NextResponse.redirect(new URL(q ? `/profil?${q}` : "/profil", request.url), 303);
  }

  return NextResponse.json({ ok: r.ok, message: r.ok ? "Foto profil berhasil dihapus." : "Gagal menghapus foto." });
}

