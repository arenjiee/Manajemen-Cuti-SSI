import { requireRole } from "@/lib/guard";
import pool from "@/lib/db";
import { antreanHrd, muatPeringatanHrd } from "@/lib/queries/approval";
import { formatTanggal, formatWaktu } from "@/lib/format";
import KartuApproval from "@/components/KartuApproval";
import { btnPrimary } from "@/components/ui";
import { putuskanHrdAction, approveBanyakAction } from "./actions";

export const metadata = { title: "Persetujuan Final | SMCK" };

const angka = (v) => (/^\d{1,4}$/.test(v ?? "") ? Number(v) : null);

export default async function PersetujuanPage({ searchParams }) {
  await requireRole(["hrd"]);
  const sp = await searchParams;
  const antre = await antreanHrd(pool);
  const peringatan = await Promise.all(antre.map((p) => muatPeringatanHrd(pool, p.id)));
  const ok = angka(sp.ok), lewat = angka(sp.lewat);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Persetujuan final</h1>
          <p className="text-sm text-muted">{antre.length} pengajuan menunggu keputusan HRD.</p>
        </div>
        {antre.length > 0 && (
          <form id="form-banyak" action={approveBanyakAction}>
            <button className={btnPrimary}>Setujui yang dipilih</button>
          </form>
        )}
      </header>

      {ok != null && (
        <p role="status" className="rounded-lg bg-ok/10 px-3 py-2 text-sm text-ok">
          {ok} pengajuan disetujui{lewat ? `, ${lewat} dilewati karena sudah diproses atau tidak valid` : ""}.
        </p>
      )}

      {antre.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line p-10 text-center text-sm text-muted">Tidak ada pengajuan yang menunggu persetujuan final.</p>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {antre.map((p, i) => {
            const w = peringatan[i];
            return (
              <KartuApproval
                key={p.id}
                p={p}
                action={putuskanHrdAction}
                pilih={<input type="checkbox" name="ids" value={p.id} form="form-banyak" aria-label={`Pilih pengajuan ${p.pengaju_nama}`} className="mt-3 h-4 w-4" />}
              >
                {p.atasan ? (
                  <div className="rounded-lg bg-ok/10 p-3 text-sm">
                    <p className="font-medium text-ok">Disetujui Ketua Divisi</p>
                    <p>{p.atasan.nama} · {formatWaktu(p.atasan.waktu)}</p>
                    {p.atasan.catatan && <p className="mt-1 text-muted">&ldquo;{p.atasan.catatan}&rdquo;</p>}
                  </div>
                ) : (
                  <p className="rounded-lg bg-accent/10 p-3 text-sm text-accent">Diajukan langsung oleh Ketua Divisi (tanpa verifikasi atasan).</p>
                )}
                {w.kapasitasPenuh && (
                  <p role="alert" className="rounded-lg bg-warn/15 p-3 text-sm">
                    <strong>Peringatan kapasitas:</strong> divisi {p.divisi_nama} sudah {w.kapasitasPenuh.terisi}/{w.kapasitasPenuh.batas} orang cuti pada {formatTanggal(w.kapasitasPenuh.tanggal)}. Menyetujui akan melampaui batas.
                  </p>
                )}
                {w.kuotaKurang && (
                  <p role="alert" className="rounded-lg bg-warn/15 p-3 text-sm"><strong>Peringatan kuota:</strong> sisa kuota cuti tahunan karyawan ini negatif.</p>
                )}
              </KartuApproval>
            );
          })}
        </div>
      )}
    </div>
  );
}
