"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import pool from "@/lib/db";
import { requireRole } from "@/lib/guard";
import { ubahBatasKapasitas } from "@/lib/queries/kapasitas";

const PERAN = ["admin", "hrd"];
const s = (fd, k) => String(fd.get(k) ?? "").trim();

export async function ubahBatasAction(_prev, fd) {
  await requireRole(PERAN);
  const r = await ubahBatasKapasitas(pool, s(fd, "divisiId"), s(fd, "batas"));
  if (!r.ok) return { pesan: r.pesan };
  revalidatePath("/kapasitas");
  redirect(`/kapasitas?bulan=${encodeURIComponent(s(fd, "bulan"))}&ok=batas`);
}
