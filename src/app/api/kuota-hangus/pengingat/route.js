import pool from "@/lib/db";
import { withRole } from "@/lib/with-role";
import { ok, readBody, toList, wantsHtml, redirect303 } from "@/lib/http";
import { kirimPengingat } from "@/lib/queries/kuota-hangus";
import { ambangValid, JEDA_PENGINGAT_HARI } from "@/lib/leave/kuota-hangus";

function pesanHasil({ terkirim, dilewati }) {
  if (terkirim === 0 && dilewati === 0) return "Belum ada karyawan yang dipilih.";
  const alasan = `karena sudah diingatkan dalam ${JEDA_PENGINGAT_HARI} hari terakhir atau sudah tidak berisiko`;
  if (terkirim === 0) return `Tidak ada pengingat yang dikirim. ${dilewati} karyawan dilewati ${alasan}.`;
  if (dilewati === 0) return `${terkirim} pengingat berhasil dikirim.`;
  return `${terkirim} pengingat berhasil dikirim. ${dilewati} dilewati ${alasan}.`;
}

// Aksi (kirim notifikasi), jadi POST. Form di halaman juga bisa mengirim tanpa JS -> redirect.
export const POST = withRole(["admin", "hrd"], async ({ request }) => {
  const b = await readBody(request);
  const raw = b.ambang;
  const ambang = raw != null && raw !== "" ? ambangValid(raw) : undefined;
  const r = await kirimPengingat(pool, toList(b.ids), { ambang });

  if (wantsHtml(request)) {
    const qAmbang = ambang ? `ambang=${ambang}&` : "";
    return redirect303(request, `/kuota-hangus?${qAmbang}terkirim=${r.terkirim}&dilewati=${r.dilewati}`);
  }
  return ok({ terkirim: r.terkirim, dilewati: r.dilewati, message: pesanHasil(r) });
});
