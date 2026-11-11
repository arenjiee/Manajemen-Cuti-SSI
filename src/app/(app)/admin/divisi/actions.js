"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import pool from "@/lib/db";
import { requireRole } from "@/lib/guard";
import { buatDivisi, ubahDivisi, hapusDivisi, tambahAnggota, keluarkanAnggota } from "@/lib/queries/divisi";

const s = (fd, k) => String(fd.get(k) ?? "").trim();
const num = (fd, k) => (fd.get(k) ? Number(fd.get(k)) : null);
const balik = (id, error) => redirect(`/admin/divisi/${id}${error ? `?error=${encodeURIComponent(error)}` : ""}`);

export async function buatDivisiAction(_prev, fd) {
  await requireRole(["admin"]);
  const r = await buatDivisi(pool, { nama: s(fd, "nama"), deskripsi: s(fd, "deskripsi"), ketuaId: num(fd, "ketuaId") });
  if (!r.ok) return { pesan: r.pesan };
  revalidatePath("/admin/divisi");
  redirect(`/admin/divisi/${r.id}`);
}

export async function ubahDivisiAction(_prev, fd) {
  await requireRole(["admin"]);
  const id = Number(fd.get("id"));
  if (!Number.isInteger(id)) return { pesan: "ID tidak valid." };
  const r = await ubahDivisi(pool, id, { nama: s(fd, "nama"), deskripsi: s(fd, "deskripsi"), ketuaId: num(fd, "ketuaId") });
  if (!r.ok) return { pesan: r.pesan };
  revalidatePath("/admin/divisi");
  redirect(`/admin/divisi/${id}`);
}

export async function hapusDivisiAction(fd) {
  await requireRole(["admin"]);
  const id = Number(fd.get("id"));
  const r = Number.isInteger(id) ? await hapusDivisi(pool, id) : { ok: false, pesan: "ID tidak valid." };
  revalidatePath("/admin/divisi");
  if (r.ok) redirect("/admin/divisi");
  balik(id, r.pesan);
}

export async function tambahAnggotaAction(fd) {
  await requireRole(["admin"]);
  const id = Number(fd.get("divisiId"));
  const r = await tambahAnggota(pool, id, Number(fd.get("userId")));
  revalidatePath(`/admin/divisi/${id}`);
  balik(id, r.ok ? null : r.pesan);
}

export async function keluarkanAnggotaAction(fd) {
  await requireRole(["admin"]);
  const id = Number(fd.get("divisiId"));
  const r = await keluarkanAnggota(pool, Number(fd.get("userId")));
  revalidatePath(`/admin/divisi/${id}`);
  balik(id, r.ok ? null : r.pesan);
}
