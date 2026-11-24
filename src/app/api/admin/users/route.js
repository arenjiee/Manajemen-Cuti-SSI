import bcrypt from "bcryptjs";
import pool from "@/lib/db";
import { withRole } from "@/lib/with-role";
import { ok, fail, readBody, parseIdList, s } from "@/lib/http";
import { daftarUser, buatUser, hapusUser } from "@/lib/queries/users";

export const GET = withRole(["admin"], async ({ request }) => {
  const q = new URL(request.url).searchParams;
  const get = (k) => q.get(k) || undefined;
  const filter = {
    q: get("q"), role: get("role"), divisiId: get("divisiId"), aktif: get("aktif"),
    masaKerja: get("masaKerja"), urut: get("urut"), arah: get("arah"),
  };
  return ok({ data: await daftarUser(pool, filter) });
});

export const POST = withRole(["admin"], async ({ request }) => {
  const b = await readBody(request);
  const password = String(b.password ?? "");
  if (password.length < 6) return fail("Password minimal 6 karakter.");

  const kuotaRaw = s(b.kuota_awal);
  const r = await buatUser(pool, {
    username: s(b.username),
    email: s(b.email),
    password_hash: await bcrypt.hash(password, 10),
    nama_lengkap: s(b.nama_lengkap),
    role: s(b.role),
    tanggal_bergabung: s(b.tanggal_bergabung),
    kuota_awal: kuotaRaw === "" ? 12 : Number(kuotaRaw),
    telepon: s(b.telepon) || null,
  });
  return r.ok ? ok({ id: r.id }, 201) : fail(r.pesan);
});

export const DELETE = withRole(["admin"], async ({ request }) => {
  const b = await readBody(request);
  const ids = parseIdList(b.ids ?? b.id);
  if (ids.length === 0) return fail("ID tidak valid.");

  let sukses = 0;
  const gagal = [];
  for (const id of ids) {
    const r = await hapusUser(pool, id);
    if (r.ok) sukses++;
    else gagal.push(r.pesan);
  }

  if (sukses === 0) return fail(gagal[0] || "Semua pengguna yang dipilih gagal dihapus.");
  if (ids.length === 1) return ok({ message: "Pengguna berhasil dihapus." });

  let message = `${sukses} pengguna berhasil dihapus.`;
  if (gagal.length > 0) message += ` (${gagal.length} dilewati: ${gagal[0]})`;
  return ok({ message, sukses, dilewati: gagal.length });
});
