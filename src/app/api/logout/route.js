import { NextResponse } from "next/server";
import { COOKIE_NAME } from "@/lib/session";
import { originValid } from "@/lib/origin";

export async function POST(request) {
  if (!originValid(request.headers.get("origin"), request.headers.get("host"))) {
    return NextResponse.json({ message: "Permintaan tidak valid" }, { status: 403 });
  }
  const res = NextResponse.json({ message: "Logout berhasil" });
  res.cookies.set({ name: COOKIE_NAME, value: "", path: "/", maxAge: 0 });
  return res;
}
