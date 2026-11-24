import pool from "@/lib/db";
import { withRole } from "@/lib/with-role";
import { ok, fail, readBody, parseIdList } from "@/lib/http";
import { parseId } from "@/lib/id";
import { tambahAnggota, keluarkanAnggota, keluarkanKetua } from "@/lib/queries/divisi";

// POST   /api/admin/divisi/[id]/anggota   body: { userId }    -> tambah satu anggota
// DELETE /api/admin/divisi/[id]/anggota   body: { userId }    -> keluarkan satu/banyak (userId bisa berulang)

export const POST = withRole(["admin"], async ({ request, params }) => {
  const divisiId = parseId(params.id);
  if (divisiId == null) return fail("ID divisi tidak valid.");

  const [userId] = parseIdList((await readBody(request)).userId);
  if (userId == null) return fail("User ID tidak valid.");

  const r = await tambahAnggota(pool, divisiId, userId);
  return r.ok ? ok({ message: "Anggota berhasil ditambahkan." }) : fail(r.pesan);
});

export const DELETE = withRole(["admin"], async ({ request, params }) => {
  const divisiId = parseId(params.id);
  if (divisiId == null) return fail("ID divisi tidak valid.");

  const b = await readBody(request);
  const userIds = parseIdList(b.userId ?? b.userIds ?? b.ids);
  if (userIds.length === 0) return fail("User ID tidak valid.");

  let sukses = 0;
  let adaKetua = false;
  const gagal = [];

  for (const userId of userIds) {
    const u = (
      await pool.query(
        "SELECT role, divisi_id FROM users WHERE id=$1 AND deleted_at IS NULL",
        [userId]
      )
    ).rows[0];

    if (!u || u.divisi_id !== divisiId) {
      gagal.push("Pengguna bukan anggota divisi ini.");
      continue;
    }

    const isKetua = u.role === "ketua_divisi";
    const r = isKetua ? await keluarkanKetua(pool, divisiId) : await keluarkanAnggota(pool, userId);
    if (r.ok) {
      sukses++;
      if (isKetua) adaKetua = true;
    } else {
      gagal.push(r.pesan);
    }
  }

  if (sukses === 0) return fail(gagal[0] || "Gagal mengeluarkan anggota.");

  let message;
  if (userIds.length === 1) {
    message = adaKetua ? "Ketua divisi berhasil dikeluarkan." : "Anggota berhasil dikeluarkan.";
  } else {
    message = `${sukses} anggota berhasil dikeluarkan.`;
    if (gagal.length > 0) message += ` (${gagal.length} dilewati: ${gagal[0]})`;
  }
  return ok({ message, sukses, dilewati: gagal.length });
});
