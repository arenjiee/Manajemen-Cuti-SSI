import { revalidatePath } from "next/cache";
import pool from "@/lib/db";
import { withRole } from "@/lib/with-role";
import { fail, readBody, wantsHtml, redirect303 } from "@/lib/http";
import { parseId } from "@/lib/id";
import { ubahFoto } from "@/lib/queries/profil";
import { hapusFotoLama } from "@/lib/upload-fs";

// Hapus foto profil. POST dipertahankan karena <form method="POST"> bawaan di halaman profil tidak bisa DELETE.
const handler = withRole(null, async ({ request, user }) => {
  const b = await readBody(request);
  const id = b.id ? parseId(b.id) : user.id;
  if (id == null) return fail("ID tidak valid.");

  const r = await ubahFoto(pool, user, id, null);
  if (r.ok && r.lama) await hapusFotoLama(r.lama);
  revalidatePath("/profil");

  if (wantsHtml(request)) {
    const p = new URLSearchParams();
    if (id !== user.id) p.set("id", String(id));
    if (r.ok) p.set("ok", "foto");
    const q = p.toString();
    return redirect303(request, q ? `/profil?${q}` : "/profil");
  }
  return Response.json({ ok: r.ok, message: r.ok ? "Foto profil berhasil dihapus." : "Gagal menghapus foto." });
});

export const POST = handler;
export const DELETE = handler;
