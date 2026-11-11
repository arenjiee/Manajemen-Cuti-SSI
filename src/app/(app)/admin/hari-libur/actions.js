"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import pool from "@/lib/db";
import { requireRole } from "@/lib/guard";
import { buatHariLibur, ubahHariLibur, hapusHariLibur } from "@/lib/queries/hari-libur";

const dari = (fd) => ({ tanggal: String(fd.get("tanggal") ?? ""), keterangan: String(fd.get("keterangan") ?? ""), jenis: String(fd.get("jenis") ?? "") });

export async function buatLiburAction(_prev, fd) {
  await requireRole(["admin"]);
  const r = await buatHariLibur(pool, dari(fd));
  if (!r.ok) return { pesan: r.pesan };
  revalidatePath("/admin/hari-libur");
  redirect("/admin/hari-libur");
}

export async function ubahLiburAction(_prev, fd) {
  await requireRole(["admin"]);
  const id = Number(fd.get("id"));
  if (!Number.isInteger(id)) return { pesan: "ID tidak valid." };
  const r = await ubahHariLibur(pool, id, dari(fd));
  if (!r.ok) return { pesan: r.pesan };
  revalidatePath("/admin/hari-libur");
  redirect("/admin/hari-libur");
}

export async function hapusLiburAction(fd) {
  await requireRole(["admin"]);
  const id = Number(fd.get("id"));
  if (Number.isInteger(id)) await hapusHariLibur(pool, id);
  revalidatePath("/admin/hari-libur");
  redirect("/admin/hari-libur");
}
