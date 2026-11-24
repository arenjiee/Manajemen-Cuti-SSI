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
  let data = l.binary_data;
  if (!data) {
    try {
      data = await readFile(path.join(process.cwd(), "uploads", path.basename(l.storage_key)));
    } catch {
      return Response.json({ message: "Berkas tidak tersedia di server" }, { status: 404 });
    }
  }

  // Preview memakai inline (buka di viewer), unduh memaksa attachment.
  const unduh = new URL(request.url).searchParams.get("download") === "1";
  const namaAsli = String(l.nama_asli || "lampiran");
  // Nama ASCII aman untuk browser lama + filename* UTF-8 untuk nama beraksen/non-ASCII.
  const namaAscii = namaAsli.replace(/[^\x20-\x7E]/g, "_").replace(/["\\]/g, "_");
  const disposisi = `${unduh ? "attachment" : "inline"}; filename="${namaAscii}"; filename*=UTF-8''${encodeURIComponent(namaAsli)}`;

  return new Response(data, {
    headers: {
      "Content-Type": l.file_mime || l.mime,
      "Content-Disposition": disposisi,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
    },
  });
}
