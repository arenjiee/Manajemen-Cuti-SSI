import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { autentikasi } from "@/lib/auth-core";
import { buatToken, COOKIE_NAME } from "@/lib/session";
import { originValid } from "@/lib/origin";

export async function POST(request) {
  if (!originValid(request.headers.get("origin"), request.headers.get("host"))) {
    return NextResponse.json({ message: "Permintaan tidak valid" }, { status: 403 });
  }
  const body = await request.json().catch(() => ({}));
  const user = await autentikasi(pool, body.identifier, body.password);
  if (!user) {
    return NextResponse.json({ message: "Email/username atau password salah" }, { status: 401 });
  }
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
