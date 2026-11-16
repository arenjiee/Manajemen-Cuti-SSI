import pool from "@/lib/db";
import { guardApi } from "@/lib/guard";
import { detailPengajuan } from "@/lib/queries/detail";
import { buatSuratCuti, nomorSurat } from "@/lib/surat-pdf";
import { bolehUnduhSurat } from "@/lib/surat-akses";
import { formatTanggal } from "@/lib/format";
import { hariIni } from "@/lib/leave/tanggal";

export async function GET(request, { params }) {
  const g = await guardApi(null, request);
  if (g.error) return g.error;
  const { id } = await params;
  const p = await detailPengajuan(pool, id, g.user);
  if (!p) return Response.json({ message: "Pengajuan tidak ditemukan" }, { status: 404 });
  if (!bolehUnduhSurat(g.user, p)) return Response.json({ message: "Surat hanya tersedia untuk pengajuan yang sudah disetujui HRD" }, { status: 403 });

  const bytes = await buatSuratCuti(p, {
    perusahaan: "PT Swadharma Sarana Informatika",
    alamat: "Cabang Makassar - Jl. Hertasning No. 7, Kota Makassar, Sulawesi Selatan",
    dicetak: formatTanggal(hariIni()),
  });
  const nama = nomorSurat(p.id, p.tanggal_mulai).replaceAll("/", "-");
  return new Response(bytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Surat-Cuti-${nama}.pdf"`,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
    },
  });
}
