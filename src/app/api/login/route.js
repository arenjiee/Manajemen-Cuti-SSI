import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { autentikasi } from "@/lib/auth-core";
import { buatToken, COOKIE_NAME } from "@/lib/session";
import { originValid } from "@/lib/origin";
import { buatPembatas } from "@/lib/rate-limit";
import { ipKlien } from "@/lib/klien-ip";

const globalRef = globalThis;
const perAkun = globalRef.__leavesyncLoginAkun ?? (globalRef.__leavesyncLoginAkun = buatPembatas({ maks: 5, jendelaMs: 15 * 60 * 1000 }));
const perIp = globalRef.__leavesyncLoginIp ?? (globalRef.__leavesyncLoginIp = buatPembatas({ maks: 30, jendelaMs: 15 * 60 * 1000 }));

export async function POST(request) {
  if (!originValid(request.headers.get("origin"), request.headers.get("host"))) {
    return NextResponse.json({ message: "Permintaan tidak valid" }, { status: 403 });
  }
  const mentah = await request.json().catch(() => null);
  const body = mentah && typeof mentah === "object" ? mentah : {};
  const ip = ipKlien(request.headers);
  const kunciAkun = `${ip}|${String(body.identifier ?? "").trim().toLowerCase().slice(0, 100)}`;
  const tunggu = Math.max(perAkun.sisaTungguMs(kunciAkun), perIp.sisaTungguMs(ip));
  if (tunggu > 0) {
    return NextResponse.json(
      { message: `Terlalu banyak percobaan login. Coba lagi dalam ${Math.ceil(tunggu / 60000)} menit.` },
      { status: 429, headers: { "Retry-After": String(Math.ceil(tunggu / 1000)) } }
    );
  }
  const user = await autentikasi(pool, body.identifier, body.password);
  if (!user) {
    perAkun.catatGagal(kunciAkun);
    perIp.catatGagal(ip);
    return NextResponse.json({ message: "Email/username atau password salah" }, { status: 401 });
  }
  perAkun.hapus(kunciAkun);
  const { token, maxAge } = await buatToken(user.id, Boolean(body.remember));
  const res = NextResponse.json({ message: "Login berhasil" });
  res.cookies.set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production" && process.env.COOKIE_SECURE !== "false",
    path: "/",
    ...(maxAge ? { maxAge } : {}),
  });
  return res;
}
