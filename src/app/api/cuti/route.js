import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { guardApi } from "@/lib/guard";
import { simpanPengajuan } from "@/lib/queries/pengajuan";
import { riwayat } from "@/lib/queries/riwayat";

export async function GET(request) {
  const g = await guardApi(null, request);
  if (g.error) return g.error;

  const url = new URL(request.url);
  const filter = {
    status: url.searchParams.get("status") || undefined,
    jenisId: url.searchParams.get("jenisId") || undefined,
    tahun: url.searchParams.get("tahun") || undefined,
    q: url.searchParams.get("q") || undefined,
    divisiId: url.searchParams.get("divisiId") || undefined,
    urut: url.searchParams.get("urut") || undefined,
  };

  const data = await riwayat(pool, g.user, filter);
  return NextResponse.json({ ok: true, data });
}

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
        alasan: fd.get("alasan"),
        handoverId: fd.get("handoverId"),
        catatanTugas: fd.get("catatanTugas"),
        alamatCuti: fd.get("alamatCuti"),
        nomorDarurat: fd.get("nomorDarurat"),
        lampiranId: fd.get("lampiranId"),
      };
    }
  }

  const s = (v) => String(v ?? "").trim();
  const num = (v) => (v != null && v !== "" && !Number.isNaN(Number(v)) ? Number(v) : null);

  const input = {
    jenisId: num(body.jenisId),
    mulai: s(body.mulai),
    selesai: s(body.selesai),
    setengahHari: Boolean(body.setengahHari),
    alasan: s(body.alasan),
    handoverId: num(body.handoverId),
    catatanTugas: s(body.catatanTugas),
    alamatCuti: s(body.alamatCuti),
    nomorDarurat: s(body.nomorDarurat),
  };

  const lampiranId = num(body.lampiranId);

  const r = await simpanPengajuan(pool, g.user.id, input, lampiranId);
  if (!r.ok) {
    return NextResponse.json(
      { ok: false, message: r.pesan, kode: r.kode },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true, id: r.id }, { status: 201 });
}

