import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { guardApi } from "@/lib/guard";
import { simulasiPengajuan } from "@/lib/queries/simulasi";

export async function POST(request) {
  const g = await guardApi(["karyawan", "ketua_divisi"], request);
  if (g.error) return g.error;

  let body = {};
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    body = await request.json().catch(() => ({}));
  } else {
    const fd = await request.formData().catch(() => null);
    if (fd) {
      body = {
        jenisId: fd.get("jenisId"),
        mulai: fd.get("mulai"),
        selesai: fd.get("selesai"),
        setengahHari: fd.get("setengahHari") === "on" || fd.get("setengahHari") === "true",
        handoverId: fd.get("handoverId"),
      };
    }
  }

  const s = (v) => String(v ?? "").trim();
  const num = (v) => (v != null && v !== "" && !Number.isNaN(Number(v)) ? Number(v) : null);

  const hasil = await simulasiPengajuan(pool, g.user.id, {
    jenisId: num(body.jenisId),
    mulai: s(body.mulai),
    selesai: s(body.selesai),
    setengahHari: Boolean(body.setengahHari),
    handoverId: num(body.handoverId),
  });

  return NextResponse.json(hasil);
}

