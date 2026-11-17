import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { guardApi } from "@/lib/guard";
import { daftarJenis, buatJenis } from "@/lib/queries/jenis-cuti";

const parseForm = (body) => ({
  nama: String(body.nama ?? "").trim(),
  kuotaHari: body.kuotaHari !== "" && body.kuotaHari != null ? Number(body.kuotaHari) : null,
  batasPengajuanHari: body.batasPengajuanHari === "" || body.batasPengajuanHari == null ? NaN : Number(body.batasPengajuanHari),
  wajibLampiran: body.wajibLampiran === true || body.wajibLampiran === "on" || body.wajibLampiran === "true",
  potongKuota: body.potongKuota === true || body.potongKuota === "on" || body.potongKuota === "true",
  aktif: body.aktif != null ? (body.aktif === true || body.aktif === "on" || body.aktif === "true") : true,
});

export async function GET(request) {
  const g = await guardApi(null, request);
  if (g.error) return g.error;

  const data = await daftarJenis(pool);
  return NextResponse.json({ ok: true, data });
}

export async function POST(request) {
  const g = await guardApi(["admin"], request);
  if (g.error) return g.error;

  let raw = {};
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    raw = await request.json().catch(() => ({}));
  } else {
    const fd = await request.formData().catch(() => null);
    if (fd) {
      raw = {
        nama: fd.get("nama"),
        kuotaHari: fd.get("kuotaHari"),
        batasPengajuanHari: fd.get("batasPengajuanHari"),
        wajibLampiran: fd.get("wajibLampiran"),
        potongKuota: fd.get("potongKuota"),
        aktif: fd.get("aktif"),
      };
    }
  }

  const r = await buatJenis(pool, parseForm(raw));
  if (!r.ok) {
    return NextResponse.json({ ok: false, message: r.pesan }, { status: 400 });
  }

  return NextResponse.json({ ok: true, id: r.id }, { status: 201 });
}

