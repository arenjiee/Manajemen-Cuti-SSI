import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import pool from "@/lib/db";
import { guardApi } from "@/lib/guard";
import { ambilProfil, ubahProfil, bolehUbahProfil } from "@/lib/queries/profil";
import { parseId } from "@/lib/id";

export async function GET(request) {
  const g = await guardApi(null, request);
  if (g.error) return g.error;

  const url = new URL(request.url);
  const targetId = url.searchParams.get("id") ? parseId(url.searchParams.get("id")) : g.user.id;

  if (targetId == null || !bolehUbahProfil(g.user, targetId)) {
    return NextResponse.json({ ok: false, message: "Pengguna tidak ditemukan." }, { status: 404 });
  }

  const data = await ambilProfil(pool, targetId);
  if (!data) {
    return NextResponse.json({ ok: false, message: "Pengguna tidak ditemukan." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, data });
}

export async function POST(request) {
  return handleUpdate(request);
}

export async function PUT(request) {
  return handleUpdate(request);
}

async function handleUpdate(request) {
  const g = await guardApi(null, request);
  if (g.error) return g.error;

  let body = {};
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    body = await request.json().catch(() => ({}));
  } else {
    const fd = await request.formData().catch(() => null);
    if (fd) {
      body = {
        id: fd.get("id"),
        nama_lengkap: fd.get("nama_lengkap"),
        email: fd.get("email"),
        telepon: fd.get("telepon"),
        alamat: fd.get("alamat"),
        username: fd.has("username") ? fd.get("username") : undefined,
        role: fd.has("role") ? fd.get("role") : undefined,
      };
    }
  }

  const s = (v) => String(v ?? "").trim();
  const id = body.id ? parseId(body.id) : g.user.id;
  if (id == null) {
    return NextResponse.json({ ok: false, message: "ID tidak valid." }, { status: 400 });
  }

  const data = {
    nama_lengkap: s(body.nama_lengkap),
    email: s(body.email),
    telepon: s(body.telepon),
    alamat: s(body.alamat),
  };
  if (body.username !== undefined) data.username = s(body.username);
  if (body.role !== undefined) data.role = s(body.role);

  const r = await ubahProfil(pool, g.user, id, data);
  if (!r.ok) {
    return NextResponse.json({ ok: false, message: r.pesan }, { status: 400 });
  }

  revalidatePath("/", "layout");

  const acceptsHtml = request.headers.get("accept")?.includes("text/html");
  if (acceptsHtml) {
    const p = new URLSearchParams();
    if (id !== g.user.id) p.set("id", String(id));
    p.set("ok", "profil");
    return NextResponse.redirect(new URL(`/profil?${p.toString()}`, request.url), 303);
  }

  return NextResponse.json({ ok: true, message: "Profil berhasil disimpan." });
}

