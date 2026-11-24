import pool from "@/lib/db";
import { withRole } from "@/lib/with-role";
import { ok, fail, readBody, bool, s } from "@/lib/http";
import { parseId } from "@/lib/id";
import { ambilUser, ubahUser, hapusUser } from "@/lib/queries/users";

export const GET = withRole(["admin"], async ({ params }) => {
  const id = parseId(params.id);
  if (id == null) return fail("ID tidak valid.");
  const data = await ambilUser(pool, id);
  return data ? ok({ data }) : fail("Pengguna tidak ditemukan.", 404);
});

export const PUT = withRole(["admin"], async ({ request, params, user }) => {
  const id = parseId(params.id);
  if (id == null) return fail("ID tidak valid.");

  const b = await readBody(request);
  const role = s(b.role);
  const aktif = bool(b.aktif);

  if (id === user.id && (role !== "admin" || !aktif)) {
    return fail("Anda tidak dapat mengubah role atau menonaktifkan akun Anda sendiri.");
  }

  const r = await ubahUser(pool, id, {
    username: s(b.username),
    email: s(b.email),
    nama_lengkap: s(b.nama_lengkap),
    role,
    aktif,
    kuota_awal: b.kuota_awal,
  });
  return r.ok ? ok({ message: "Data pengguna berhasil diperbarui." }) : fail(r.pesan);
});

export const DELETE = withRole(["admin"], async ({ params }) => {
  const id = parseId(params.id);
  if (id == null) return fail("ID tidak valid.");
  const r = await hapusUser(pool, id);
  return r.ok ? ok({ message: "Pengguna berhasil dihapus." }) : fail(r.pesan);
});
