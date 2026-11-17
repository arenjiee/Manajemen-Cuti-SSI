import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { guardApi } from "@/lib/guard";
import { ambilUser, ubahUser, hapusUser } from "@/lib/queries/users";
import { parseId } from "@/lib/id";

export async function GET(request, { params }) {
  const g = await guardApi(["admin"], request);
  if (g.error) return g.error;

  const { id } = await params;
  const n = parseId(id);
  if (n == null) {
    return NextResponse.json({ ok: false, message: "ID tidak valid." }, { status: 400 });
  }

  const user = await ambilUser(pool, n);
  if (!user) {
    return NextResponse.json({ ok: false, message: "Pengguna tidak ditemukan." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, data: user });
}

export async function POST(request, { params }) {
  // Support POST for form submissions updating user
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
        username: fd.get("username"),
        email: fd.get("email"),
        nama_lengkap: fd.get("nama_lengkap"),
        role: fd.get("role"),
        aktif: fd.get("aktif") === "on" || fd.get("aktif") === "true",
        kuota_awal: fd.get("kuota_awal"),
      };
    }
  }

  const s = (v) => String(v ?? "").trim();
  const role = s(body.role);
  const aktif = Boolean(body.aktif);

  if (id === g.user.id && (role !== "admin" || !aktif)) {
    return NextResponse.json(
      { ok: false, message: "Anda tidak dapat mengubah role atau menonaktifkan akun Anda sendiri." },
      { status: 400 }
    );
  }

  const r = await ubahUser(pool, id, {
    username: s(body.username),
    email: s(body.email),
    nama_lengkap: s(body.nama_lengkap),
    role,
    aktif,
    kuota_awal: body.kuota_awal,
  });

  if (!r.ok) {
    return NextResponse.json({ ok: false, message: r.pesan }, { status: 400 });
  }

  return NextResponse.json({ ok: true, message: "Data pengguna berhasil diperbarui." });
}

export async function DELETE(request, { params }) {
  const g = await guardApi(["admin"], request);
  if (g.error) return g.error;

  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (id == null) {
    return NextResponse.json({ ok: false, message: "ID tidak valid." }, { status: 400 });
  }

  const r = await hapusUser(pool, id);
  if (!r.ok) {
    return NextResponse.json({ ok: false, message: r.pesan }, { status: 400 });
  }

  return NextResponse.json({ ok: true, message: "Pengguna berhasil dihapus." });
}

