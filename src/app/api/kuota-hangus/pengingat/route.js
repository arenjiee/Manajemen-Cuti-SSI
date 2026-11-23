import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { guardApi } from "@/lib/guard";
import { kirimPengingat } from "@/lib/queries/kuota-hangus";
import { ambangValid, JEDA_PENGINGAT_HARI } from "@/lib/leave/kuota-hangus";

const PESAN_KOSONG = "Belum ada karyawan yang dipilih.";

function pesanHasil({ terkirim, dilewati }) {
  if (terkirim === 0 && dilewati === 0) return PESAN_KOSONG;
  const alasan = `karena sudah diingatkan dalam ${JEDA_PENGINGAT_HARI} hari terakhir atau sudah tidak berisiko`;
  if (terkirim === 0) return `Tidak ada pengingat yang dikirim. ${dilewati} karyawan dilewati ${alasan}.`;
  if (dilewati === 0) return `${terkirim} pengingat berhasil dikirim.`;
  return `${terkirim} pengingat berhasil dikirim. ${dilewati} dilewati ${alasan}.`;
}

export async function POST(request) {
  const g = await guardApi(["admin", "hrd"], request);
  if (g.error) return g.error;

  let ids = [];
  let ambangRaw = null;
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const body = await request.json().catch(() => ({}));
    ids = Array.isArray(body.ids) ? body.ids.map(String) : [];
    ambangRaw = body.ambang;
  } else {
    const fd = await request.formData().catch(() => null);
    if (fd) {
      ids = fd.getAll("ids").map(String);
      ambangRaw = fd.get("ambang");
    }
  }

  const ambang = ambangRaw !== null && ambangRaw !== "" && ambangRaw !== undefined ? ambangValid(ambangRaw) : undefined;
  const r = await kirimPengingat(pool, ids, { ambang });

  const acceptsHtml = request.headers.get("accept")?.includes("text/html");
  if (acceptsHtml) {
    const qAmbang = ambang ? `ambang=${ambang}&` : "";
    return NextResponse.redirect(
      new URL(`/kuota-hangus?${qAmbang}terkirim=${r.terkirim}&dilewati=${r.dilewati}`, request.url),
      303
    );
  }

  return NextResponse.json({
    ok: true,
    terkirim: r.terkirim,
    dilewati: r.dilewati,
    message: pesanHasil(r),
  });
}

