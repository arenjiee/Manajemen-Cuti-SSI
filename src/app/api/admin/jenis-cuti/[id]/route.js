import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { guardApi } from "@/lib/guard";
import { ambilJenis, ubahJenis, hapusJenis } from "@/lib/queries/jenis-cuti";
import { parseId } from "@/lib/id";

const parseForm = (body) => ({
  nama: String(body.nama ?? "").trim(),
  kuotaHari: body.kuotaHari !== "" && body.kuotaHari != null ? Number(body.kuotaHari) : null,
  batasPengajuanHari: body.batasPengajuanHari === "" || body.batasPengajuanHari == null ? NaN : Number(body.batasPengajuanHari),
  wajibLampiran: body.wajibLampiran === true || body.wajibLampiran === "on" || body.wajibLampiran === "true",
  potongKuota: body.potongKuota === true || body.potongKuota === "on" || body.potongKuota === "true",
  aktif: body.aktif != null ? (body.aktif === true || body.aktif === "on" || body.aktif === "true") : true,
});

export async function GET(request, { params }) {
  const g = await guardApi(null, request);
  if (g.error) return g.error;

  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (id == null) {
    return NextResponse.json({ ok: false, message: "ID tidak valid." }, { status: 400 });
  }

  const data = await ambilJenis(pool, id);
  if (!data) {
    return NextResponse.json({ ok: false, message: "Jenis cuti tidak ditemukan." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, data });
}

export async function POST(request, { params }) {
  return handleUpdate(request, params);
}

export async function PUT(request, { params }) {
  return handleUpdate(request, params);
}

async function handleUpdate(request, params) {
  const g = await guardApi(["admin"], request);
  if (g.error) return g.error;

  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (id == null) {
    return NextResponse.json({ ok: false, message: "ID tidak valid." }, { status: 400 });
  }

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

  const r = await ubahJenis(pool, id, parseForm(raw));
  if (!r.ok) {
    return NextResponse.json({ ok: false, message: r.pesan }, { status: 400 });
  }

  return NextResponse.json({ ok: true, message: "Jenis cuti berhasil diperbarui." });
}

export async function DELETE(request, { params }) {
  const g = await guardApi(["admin"], request);
  if (g.error) return g.error;

  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (id == null) {
    return NextResponse.json({ ok: false, message: "ID tidak valid." }, { status: 400 });
  }

  const r = await hapusJenis(pool, id);
  if (!r.ok) {
    return NextResponse.json({ ok: false, message: r.pesan }, { status: 400 });
  }

  return NextResponse.json({ ok: true, message: "Jenis cuti berhasil dihapus." });
}

