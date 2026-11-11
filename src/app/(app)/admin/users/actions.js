"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";
import { requireRole } from "@/lib/guard";
import { buatUser, ubahUser, hapusUser } from "@/lib/queries/users";

const s = (fd, k) => String(fd.get(k) ?? "").trim();

export async function buatUserAction(_prev, fd) {
  await requireRole(["admin"]);
  const password = String(fd.get("password") ?? "");
  if (password.length < 6) return { pesan: "Password minimal 6 karakter." };
  const r = await buatUser(pool, {
    username: s(fd, "username"), email: s(fd, "email"), password_hash: await bcrypt.hash(password, 10),
    nama_lengkap: s(fd, "nama_lengkap"), role: s(fd, "role"), tanggal_bergabung: s(fd, "tanggal_bergabung"),
    kuota_awal: s(fd, "kuota_awal") === "" ? 12 : Number(s(fd, "kuota_awal")), telepon: s(fd, "telepon") || null,
  });
  if (!r.ok) return { pesan: r.pesan };
  revalidatePath("/admin/users");
  redirect("/admin/users");
}

export async function ubahUserAction(_prev, fd) {
  const admin = await requireRole(["admin"]);
  const id = Number(fd.get("id"));
  if (!Number.isInteger(id)) return { pesan: "ID tidak valid." };
  const role = s(fd, "role");
  const aktif = fd.get("aktif") === "on";
  if (id === admin.id && (role !== "admin" || !aktif)) return { pesan: "Anda tidak dapat mengubah role atau menonaktifkan akun Anda sendiri." };
  const r = await ubahUser(pool, id, { username: s(fd, "username"), email: s(fd, "email"), nama_lengkap: s(fd, "nama_lengkap"), role, aktif });
  if (!r.ok) return { pesan: r.pesan };
  revalidatePath("/admin/users");
  redirect("/admin/users");
}

export async function hapusUserAction(fd) {
  await requireRole(["admin"]);
  const id = Number(fd.get("id"));
  const r = Number.isInteger(id) ? await hapusUser(pool, id) : { ok: false, pesan: "ID tidak valid." };
  revalidatePath("/admin/users");
  redirect(r.ok ? "/admin/users" : `/admin/users?error=${encodeURIComponent(r.pesan)}`);
}
