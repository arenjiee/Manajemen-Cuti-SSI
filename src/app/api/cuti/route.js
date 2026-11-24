import pool from "@/lib/db";
import { withRole } from "@/lib/with-role";
import { ok, fail, readBody, bool, num, s } from "@/lib/http";
import { simpanPengajuan } from "@/lib/queries/pengajuan";
import { riwayat } from "@/lib/queries/riwayat";

export const GET = withRole(null, async ({ request, user }) => {
  const q = new URL(request.url).searchParams;
  const get = (k) => q.get(k) || undefined;
  const filter = {
    status: get("status"), jenisId: get("jenisId"), tahun: get("tahun"),
    q: get("q"), divisiId: get("divisiId"), urut: get("urut"),
  };
  return ok({ data: await riwayat(pool, user, filter) });
});

export const POST = withRole(["karyawan", "ketua_divisi"], async ({ request, user }) => {
  const b = await readBody(request);
  const input = {
    jenisId: num(b.jenisId),
    mulai: s(b.mulai),
    selesai: s(b.selesai),
    setengahHari: bool(b.setengahHari),
    jamMulai: s(b.jamMulai),
    jamSelesai: s(b.jamSelesai),
    alasan: s(b.alasan),
    handoverId: num(b.handoverId),
    catatanTugas: s(b.catatanTugas),
    alamatCuti: s(b.alamatCuti),
    nomorDarurat: s(b.nomorDarurat),
  };

  const r = await simpanPengajuan(pool, user.id, input, num(b.lampiranId));
  if (!r.ok) return Response.json({ ok: false, message: r.pesan, kode: r.kode }, { status: 400 });
  return ok({ id: r.id }, 201);
});
