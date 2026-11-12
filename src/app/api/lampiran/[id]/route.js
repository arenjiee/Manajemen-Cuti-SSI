import { readFile } from "node:fs/promises";
import path from "node:path";
import pool from "@/lib/db";
import { guardApi } from "@/lib/guard";
import { ambilLampiranUntuk } from "@/lib/queries/detail";

export async function GET(request, { params }) {
  const g = await guardApi(null, request);
  if (g.error) return g.error;
  const { id } = await params;
  const l = await ambilLampiranUntuk(pool, id, g.user);
  if (!l) return Response.json({ message: "Lampiran tidak ditemukan" }, { status: 404 });
  let data;
  try {
    data = await readFile(path.join(process.cwd(), "uploads", path.basename(l.storage_key)));
  } catch {
    return Response.json({ message: "Berkas tidak tersedia di server" }, { status: 404 });
  }
  return new Response(data, {
    headers: {
      "Content-Type": l.mime,
      "Content-Disposition": `inline; filename="${encodeURIComponent(l.nama_asli)}"`,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
    },
  });
}
