import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { guardApi } from "@/lib/guard";
import { ubahHariLibur, hapusHariLibur } from "@/lib/queries/hari-libur";
import { parseId } from "@/lib/id";

const parseForm = (body) => ({
  tanggal: String(body.tanggal ?? "").trim(),
  keterangan: String(body.keterangan ?? "").trim(),
  jenis: String(body.jenis ?? "").trim(),
});

export async function GET(request, { params }) {
  const g = await guardApi(null, request);
  if (g.error) return g.error;

  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (id == null) {
    return NextResponse.json({ ok: false, message: "ID tidak valid." }, { status: 400 });
  }

  const h = (await pool.query("SELECT * FROM hari_libur WHERE id=$1", [id])).rows[0];
  if (!h) {
    return NextResponse.json({ ok: false, message: "Hari libur tidak ditemukan." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, data: h });
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

  let raw = {};
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    raw = await request.json().catch(() => ({}));
  } else {
    const fd = await request.formData().catch(() => null);
    if (fd) {
      raw = {
        tanggal: fd.get("tanggal"),
        keterangan: fd.get("keterangan"),
        jenis: fd.get("jenis"),
      };
    }
  }

  const r = await ubahHariLibur(pool, id, parseForm(raw));
  if (!r.ok) {
    return NextResponse.json({ ok: false, message: r.pesan }, { status: 400 });
  }

  return NextResponse.json({ ok: true, message: "Hari libur berhasil diperbarui." });
}

export async function DELETE(request, { params }) {
  const g = await guardApi(["admin"], request);
  if (g.error) return g.error;

  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (id == null) {
    return NextResponse.json({ ok: false, message: "ID tidak valid." }, { status: 400 });
  }

  await hapusHariLibur(pool, id);
  return NextResponse.json({ ok: true, message: "Hari libur berhasil dihapus." });
}

