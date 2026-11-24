import { revalidatePath } from "next/cache";
import pool from "@/lib/db";
import { withRole } from "@/lib/with-role";
import { ok, fail, readBody, s } from "@/lib/http";
import { parseId } from "@/lib/id";
import { ambilProfil, ubahProfil, bolehUbahProfil } from "@/lib/queries/profil";

export const GET = withRole(null, async ({ request, user }) => {
  const raw = new URL(request.url).searchParams.get("id");
  const targetId = raw ? parseId(raw) : user.id;
  if (targetId == null || !bolehUbahProfil(user, targetId)) return fail("Pengguna tidak ditemukan.", 404);

  const data = await ambilProfil(pool, targetId);
  return data ? ok({ data }) : fail("Pengguna tidak ditemukan.", 404);
});

export const PUT = withRole(null, async ({ request, user }) => {
  const b = await readBody(request);
  const id = b.id ? parseId(b.id) : user.id;
  if (id == null) return fail("ID tidak valid.");

  const data = {
    nama_lengkap: s(b.nama_lengkap),
    email: s(b.email),
    telepon: s(b.telepon),
    alamat: s(b.alamat),
  };
  if (b.username !== undefined) data.username = s(b.username);
  if (b.role !== undefined) data.role = s(b.role);

  const r = await ubahProfil(pool, user, id, data);
  if (!r.ok) return fail(r.pesan);

  revalidatePath("/", "layout");
  return ok({ message: "Profil berhasil disimpan." });
});
