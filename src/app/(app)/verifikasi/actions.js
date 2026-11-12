"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import pool from "@/lib/db";
import { requireRole } from "@/lib/guard";
import { putuskan } from "@/lib/queries/approval";

export async function putuskanLeaderAction(_prev, fd) {
  const user = await requireRole(["ketua_divisi"]);
  const r = await putuskan(pool, {
    pengajuanId: String(fd.get("id") ?? ""),
    approverId: user.id,
    tahap: "leader",
    keputusan: String(fd.get("keputusan") ?? ""),
    catatan: String(fd.get("catatan") ?? ""),
  });
  if (!r.ok) return { pesan: r.pesan };
  revalidatePath("/verifikasi");
  redirect("/verifikasi");
}
