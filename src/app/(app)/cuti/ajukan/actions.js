"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import pool from "@/lib/db";
import { requireRole } from "@/lib/guard";
import { simpanPengajuan, batalkanPengajuan } from "@/lib/queries/pengajuan";

const s = (fd, k) => String(fd.get(k) ?? "").trim();
const angka = (fd, k) => (fd.get(k) ? Number(fd.get(k)) : null);

export async function ajukanCutiAction(_prev, fd) {
  const user = await requireRole(["karyawan", "ketua_divisi"]);
  const r = await simpanPengajuan(
    pool,
    user.id,
    {
      jenisId: angka(fd, "jenisId"),
      mulai: s(fd, "mulai"),
      selesai: s(fd, "selesai"),
      setengahHari: fd.get("setengahHari") === "on",
      alasan: s(fd, "alasan"),
      handoverId: angka(fd, "handoverId"),
      catatanTugas: s(fd, "catatanTugas"),
      alamatCuti: s(fd, "alamatCuti"),
      nomorDarurat: s(fd, "nomorDarurat"),
    },
    angka(fd, "lampiranId")
  );
  if (!r.ok) return { pesan: r.pesan };
  revalidatePath("/cuti");
  redirect(`/cuti/${r.id}`);
}

export async function batalkanCutiAction(_prev, fd) {
  const user = await requireRole(["karyawan", "ketua_divisi"]);
  const id = Number(fd.get("id"));
  const r = await batalkanPengajuan(pool, id, user.id, s(fd, "alasan"));
  if (!r.ok) return { pesan: r.pesan };
  revalidatePath("/cuti");
  redirect(`/cuti/${id}`);
}
