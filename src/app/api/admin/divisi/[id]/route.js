import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { guardApi } from "@/lib/guard";
import { ambilDivisi, ubahDivisi } from "@/lib/queries/divisi";
import { parseId } from "@/lib/id";

export async function GET(request, { params }) {
  const g = await guardApi(["admin", "hrd"], request);
  if (g.error) return g.error;

  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (id == null) {
    return NextResponse.json({ ok: false, message: "ID tidak valid." }, { status: 400 });
  }

  const divisi = await ambilDivisi(pool, id);
  if (!divisi) {
    return NextResponse.json({ ok: false, message: "Divisi tidak ditemukan." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, data: divisi });
}

export async function POST(request, { params }) {
  return handleUpdate(request, params);
}

export async function PUT(request, { params }) {
  return handleUpdate(request, params);
}

async function handleUpdate(request, params) {
  const g = await guardApi(["admin"], request);
  if (g.error) return g.error;

  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (id == null) {
    return NextResponse.json({ ok: false, message: "ID tidak valid." }, { status: 400 });
  }

  let body = {};
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    body = await request.json().catch(() => ({}));
  } else {
    const fd = await request.formData().catch(() => null);
    if (fd) {
      body = {
        nama: fd.get("nama"),
        deskripsi: fd.get("deskripsi"),
        ketuaId: fd.get("ketuaId"),
      };
    }
  }

  const s = (v) => String(v ?? "").trim();
  const num = (v) => (v != null && v !== "" && !Number.isNaN(Number(v)) ? Number(v) : null);

  const r = await ubahDivisi(pool, id, {
    nama: s(body.nama),
    deskripsi: s(body.deskripsi),
    ketuaId: num(body.ketuaId),
  });

  if (!r.ok) {
    return NextResponse.json({ ok: false, message: r.pesan }, { status: 400 });
  }

  return NextResponse.json({ ok: true, message: "Divisi berhasil diperbarui." });
}
