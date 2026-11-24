import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import pool from "@/lib/db";
import { guardApi } from "@/lib/guard";
import { LAMPIRAN_MAKS } from "@/lib/leave/validasi";
import { deteksiMime, ekstensiDari } from "@/lib/lampiran-file";
import { simpanMetaLampiran } from "@/lib/queries/lampiran";

export async function POST(request) {
  const g = await guardApi(["karyawan", "ketua_divisi"], request);
  if (g.error) return g.error;

  const form = await request.formData().catch(() => null);
  const berkas = form?.get("berkas");
  if (!berkas || typeof berkas === "string") return NextResponse.json({ message: "Berkas tidak ditemukan." }, { status: 400 });
  if (berkas.size > LAMPIRAN_MAKS) return NextResponse.json({ message: "Ukuran berkas maksimal 2 MB." }, { status: 413 });

  const buf = Buffer.from(await berkas.arrayBuffer());
  const mime = deteksiMime(buf);
  if (mime !== "application/pdf") return NextResponse.json({ message: "Berkas harus berformat PDF." }, { status: 415 });

  const storageKey = `${randomUUID()}${ekstensiDari(mime)}`;

  const id = await simpanMetaLampiran(pool, g.user.id, {
    nama_asli: String(berkas.name ?? "lampiran").slice(0, 200),
    mime,
    ukuran: buf.length,
    storage_key: storageKey,
    data: buf,
  });
  return NextResponse.json({ id, nama: berkas.name, mime, ukuran: buf.length }, { status: 201 });
}
