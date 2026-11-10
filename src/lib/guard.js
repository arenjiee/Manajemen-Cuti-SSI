import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import pool from "./db.js";
import { COOKIE_NAME } from "./session.js";
import { bacaSessionUser } from "./auth-core.js";
import { originValid } from "./origin.js";

export const getUser = cache(async () => {
  const store = await cookies();
  return bacaSessionUser(pool, store.get(COOKIE_NAME)?.value);
});

// Untuk halaman dan Server Action: tanpa sesi -> /login, role salah -> /dashboard.
export async function requireRole(roles) {
  const user = await getUser();
  if (!user) redirect("/login");
  if (roles && !roles.includes(user.role)) redirect("/dashboard");
  return user;
}

// Untuk Route Handler: mengembalikan { user } atau { error: Response }.
export async function guardApi(roles, request) {
  if (request && request.method !== "GET" && request.method !== "HEAD") {
    if (!originValid(request.headers.get("origin"), request.headers.get("host"))) {
      return { error: Response.json({ message: "Permintaan tidak valid" }, { status: 403 }) };
    }
  }
  const user = await getUser();
  if (!user) return { error: Response.json({ message: "Belum login" }, { status: 401 }) };
  if (roles && !roles.includes(user.role)) return { error: Response.json({ message: "Tidak diizinkan" }, { status: 403 }) };
  return { user };
}
