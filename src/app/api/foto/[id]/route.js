import { readFile } from "node:fs/promises";
import path from "node:path";
import pool from "@/lib/db";
import { guardApi } from "@/lib/guard";
import { ambilFotoUntuk } from "@/lib/queries/profil";
import { dirUpload } from "@/lib/upload-fs";

export async function GET(request, { params }) {
  const g = await guardApi(null, request);
  if (g.error) return g.error;
  const { id } = await params;
  const f = await ambilFotoUntuk(pool, g.user, id);
  if (!f) return Response.json({ message: "Foto tidak ditemukan" }, { status: 404 });
  let data = f.data;
  if (!data) {
    try {
      data = await readFile(path.join(dirUpload(), path.basename(f.storage_key)));
    } catch {
      return Response.json({ message: "Berkas tidak tersedia di server" }, { status: 404 });
    }
  }
  return new Response(data, {
    headers: {
      "Content-Type": f.mime,
      "Content-Disposition": "inline",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
    },
  });
}
