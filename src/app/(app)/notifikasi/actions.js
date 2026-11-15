"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import pool from "@/lib/db";
import { requireRole } from "@/lib/guard";
import { tautanInternal } from "@/lib/tautan";
import { tandaiDibaca, tandaiSemuaDibaca } from "@/lib/queries/riwayat";

// Menandai dibaca lalu membawa user ke halaman terkait (jika ada). Hanya notifikasi milik sendiri yang bisa diproses.
export async function bukaNotifikasiAction(fd) {
  const user = await requireRole();
  const r = await tandaiDibaca(pool, user.id, String(fd.get("id") ?? ""));
  revalidatePath("/", "layout");
  const tujuan = r.ok ? tautanInternal(r.link) : null;
  redirect(tujuan ?? "/notifikasi");
}

export async function tandaiSemuaAction() {
  const user = await requireRole();
  await tandaiSemuaDibaca(pool, user.id);
  revalidatePath("/", "layout");
  redirect("/notifikasi");
}
