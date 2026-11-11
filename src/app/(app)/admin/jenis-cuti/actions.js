"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import pool from "@/lib/db";
import { requireRole } from "@/lib/guard";
import { buatJenis, ubahJenis, hapusJenis } from "@/lib/queries/jenis-cuti";

const dari = (fd) => ({
  nama: String(fd.get("nama") ?? ""),
  kuotaHari: fd.get("kuotaHari") ? Number(fd.get("kuotaHari")) : null,
  batasPengajuanHari: fd.get("batasPengajuanHari") === "" || fd.get("batasPengajuanHari") == null ? NaN : Number(fd.get("batasPengajuanHari")),
  wajibLampiran: fd.get("wajibLampiran") === "on",
  potongKuota: fd.get("potongKuota") === "on",
  aktif: fd.get("aktif") !== null ? fd.get("aktif") === "on" : true,
});

export async function buatJenisAction(_prev, fd) {
  await requireRole(["admin"]);
  const r = await buatJenis(pool, dari(fd));
  if (!r.ok) return { pesan: r.pesan };
  revalidatePath("/admin/jenis-cuti");
  redirect("/admin/jenis-cuti");
}

export async function ubahJenisAction(_prev, fd) {
  await requireRole(["admin"]);
  const id = Number(fd.get("id"));
  if (!Number.isInteger(id)) return { pesan: "ID tidak valid." };
  const r = await ubahJenis(pool, id, dari(fd));
  if (!r.ok) return { pesan: r.pesan };
  revalidatePath("/admin/jenis-cuti");
  redirect("/admin/jenis-cuti");
}

export async function hapusJenisAction(fd) {
  await requireRole(["admin"]);
  const id = Number(fd.get("id"));
  const r = Number.isInteger(id) ? await hapusJenis(pool, id) : { ok: false, pesan: "ID tidak valid." };
  revalidatePath("/admin/jenis-cuti");
  redirect(r.ok ? "/admin/jenis-cuti" : `/admin/jenis-cuti?error=${encodeURIComponent(r.pesan)}`);
}
