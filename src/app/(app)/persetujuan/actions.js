"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import pool from "@/lib/db";
import { requireRole } from "@/lib/guard";
import { putuskan, approveBanyak } from "@/lib/queries/approval";

export async function putuskanHrdAction(_prev, fd) {
  const user = await requireRole(["hrd"]);
  const r = await putuskan(pool, {
    pengajuanId: String(fd.get("id") ?? ""),
    approverId: user.id,
    tahap: "hrd",
    keputusan: String(fd.get("keputusan") ?? ""),
    catatan: String(fd.get("catatan") ?? ""),
  });
  if (!r.ok) return { pesan: r.pesan };
  revalidatePath("/persetujuan");
  redirect("/persetujuan");
}

export async function approveBanyakAction(fd) {
  const user = await requireRole(["hrd"]);
  const ids = fd.getAll("ids").map(String);
  if (ids.length === 0) redirect("/persetujuan?ok=0&lewat=0");
  const r = await approveBanyak(pool, user.id, ids);
  revalidatePath("/persetujuan");
  redirect(`/persetujuan?ok=${r.berhasil.length}&lewat=${r.dilewati.length}`);
}
