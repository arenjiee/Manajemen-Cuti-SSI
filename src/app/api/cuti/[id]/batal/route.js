import pool from "@/lib/db";
import { withRole } from "@/lib/with-role";
import { ok, fail, readBody, s } from "@/lib/http";
import { batalkanPengajuan } from "@/lib/queries/pengajuan";

// Aksi pada pengajuan (bukan menghapus resource: statusnya menjadi Cancelled), jadi POST.
export const POST = withRole(["karyawan", "ketua_divisi"], async ({ request, params, user }) => {
  const { alasan } = await readBody(request);
  const r = await batalkanPengajuan(pool, params.id, user.id, s(alasan));
  return r.ok ? ok({ message: "Pengajuan cuti berhasil dibatalkan." }) : fail(r.pesan);
});
