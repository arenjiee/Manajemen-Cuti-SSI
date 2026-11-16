"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import pool from "@/lib/db";
import { requireRole } from "@/lib/guard";
import { kirimPengingat } from "@/lib/queries/kuota-hangus";
import { ambangValid } from "@/lib/leave/kuota-hangus";

export async function kirimPengingatAction(fd) {
  await requireRole(["admin", "hrd"]);
  const ambang = ambangValid(fd.get("ambang"));
  const ids = fd.getAll("ids").map(String);
  const r = await kirimPengingat(pool, ids, { ambang });
  revalidatePath("/kuota-hangus");
  redirect(`/kuota-hangus?ambang=${ambang}&terkirim=${r.terkirim}&dilewati=${r.dilewati}`);
}
