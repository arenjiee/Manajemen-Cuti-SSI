import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import pool from "@/lib/db";
import { guardApi } from "@/lib/guard";
import { parseId } from "@/lib/id";
import { FOTO_MAKS, validasiFoto, kunciFoto } from "@/lib/foto-file";
import { dirUpload, hapusFotoLama } from "@/lib/upload-fs";
import { bolehUbahProfil, ubahFoto } from "@/lib/queries/profil";

const pesan = (message, status) => NextResponse.json({ message }, { status });

export async function POST(request) {
  const g = await guardApi(null, request);
  if (g.error) return g.error;

  const form = await request.formData().catch(() => null);
  const berkas = form?.get("berkas");
  if (!berkas || typeof berkas === "string") return pesan("Berkas tidak ditemukan.", 400);

  const rawTarget = form.get("userId");
  const target = rawTarget == null || rawTarget === "" ? g.user.id : parseId(String(rawTarget));
  if (target == null) return pesan("Pengguna tidak valid.", 400);
  if (!bolehUbahProfil(g.user, target)) return pesan("Tidak diizinkan.", 403);
  if (berkas.size > FOTO_MAKS) return pesan("Ukuran foto maksimal 2 MB.", 413);

  const buf = Buffer.from(await berkas.arrayBuffer());
  const v = validasiFoto(buf);
  if (!v.ok) return pesan(v.pesan, v.pesan.includes("2 MB") ? 413 : 415);

  const key = kunciFoto(randomUUID(), v.mime);
  await mkdir(dirUpload(), { recursive: true });
  await writeFile(path.join(dirUpload(), key), buf);

  const r = await ubahFoto(pool, g.user, target, key);
  if (!r.ok) {
    await hapusFotoLama(key);   // pengguna tidak ada: jangan tinggalkan berkas yatim
    return pesan(r.pesan, 404);
  }
  await hapusFotoLama(r.lama);
  return NextResponse.json({ ok: true, key }, { status: 201 });
}
