"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import pool from "@/lib/db";
import { requireRole } from "@/lib/guard";
import { parseId } from "@/lib/id";
import { ubahProfil, ubahFoto } from "@/lib/queries/profil";
import { hapusFotoLama } from "@/lib/upload-fs";

const s = (fd, k) => String(fd.get(k) ?? "").trim();
const tujuan = (user, id, ok) => {
  const p = new URLSearchParams();
  if (id !== user.id) p.set("id", String(id));
  if (ok) p.set("ok", ok);
  const q = p.toString();
  return q ? `/profil?${q}` : "/profil";
};

export async function ubahProfilAction(_prev, fd) {
  const user = await requireRole();
  const id = parseId(s(fd, "id"));
  if (id == null) return { pesan: "ID tidak valid." };
  const data = { nama_lengkap: s(fd, "nama_lengkap"), email: s(fd, "email"), telepon: s(fd, "telepon"), alamat: s(fd, "alamat") };
  // Hanya diteruskan jika field-nya ada di form; query tetap menolak jika pengirimnya bukan Admin.
  if (fd.has("username")) data.username = s(fd, "username");
  if (fd.has("role")) data.role = s(fd, "role");
  const r = await ubahProfil(pool, user, id, data);
  if (!r.ok) return { pesan: r.pesan };
  revalidatePath("/", "layout");   // nama di sidebar ikut berubah
  redirect(tujuan(user, id, "profil"));
}

export async function hapusFotoAction(fd) {
  const user = await requireRole();
  const id = parseId(s(fd, "id"));
  const r = id == null ? { ok: false } : await ubahFoto(pool, user, id, null);
  if (r.ok) await hapusFotoLama(r.lama);
  revalidatePath("/profil");
  redirect(tujuan(user, id ?? user.id, r.ok ? "foto" : null));
}
