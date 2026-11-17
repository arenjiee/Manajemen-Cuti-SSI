import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";
import { guardApi } from "@/lib/guard";
import { daftarUser, buatUser } from "@/lib/queries/users";

export async function GET(request) {
  const g = await guardApi(["admin"], request);
  if (g.error) return g.error;

  const url = new URL(request.url);
  const filter = {
    q: url.searchParams.get("q") || undefined,
    role: url.searchParams.get("role") || undefined,
    divisiId: url.searchParams.get("divisiId") || undefined,
    aktif: url.searchParams.get("aktif") || undefined,
    masaKerja: url.searchParams.get("masaKerja") || undefined,
    urut: url.searchParams.get("urut") || undefined,
  };

  const data = await daftarUser(pool, filter);
  return NextResponse.json({ ok: true, data });
}

export async function POST(request) {
  const g = await guardApi(["admin"], request);
  if (g.error) return g.error;

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
        password: fd.get("password"),
        nama_lengkap: fd.get("nama_lengkap"),
        role: fd.get("role"),
        tanggal_bergabung: fd.get("tanggal_bergabung"),
        kuota_awal: fd.get("kuota_awal"),
        telepon: fd.get("telepon"),
      };
    }
  }

  const s = (v) => String(v ?? "").trim();
  const password = String(body.password ?? "");
  if (password.length < 6) {
    return NextResponse.json({ ok: false, message: "Password minimal 6 karakter." }, { status: 400 });
  }

  const kuotaRaw = s(body.kuota_awal);
  const r = await buatUser(pool, {
    username: s(body.username),
    email: s(body.email),
    password_hash: await bcrypt.hash(password, 10),
    nama_lengkap: s(body.nama_lengkap),
    role: s(body.role),
    tanggal_bergabung: s(body.tanggal_bergabung),
    kuota_awal: kuotaRaw === "" ? 12 : Number(kuotaRaw),
    telepon: s(body.telepon) || null,
  });

  if (!r.ok) {
    return NextResponse.json({ ok: false, message: r.pesan }, { status: 400 });
  }

  return NextResponse.json({ ok: true, id: r.id }, { status: 201 });
}

