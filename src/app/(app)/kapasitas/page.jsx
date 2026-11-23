import Link from "next/link";
import { requireRole } from "@/lib/guard";
import pool from "@/lib/db";
import { hariIni, tambahHari } from "@/lib/leave/tanggal";
import { rentangBulan, labelBulan } from "@/lib/periode";
import { petaKapasitas } from "@/lib/queries/kapasitas";
import KalenderMini from "@/components/KalenderMini";
import FormAction from "@/components/FormAction";
import Panah from "@/components/Panah";
import PageHeader from "@/components/PageHeader";
import { btnGhost, inputCls, labelCls } from "@/components/ui";

export const metadata = { title: "Kapasitas Tim | LeaveSync" };

const BULAN = /^\d{4}-(0[1-9]|1[0-2])$/;
const PESAN = { batas: "Persentase kapasitas disimpan." };

export default async function KapasitasPage({ searchParams }) {
  await requireRole(["admin", "hrd"]);
  const sp = await searchParams;
  const hari = hariIni();
  const bulan = BULAN.test(sp.bulan ?? "") ? sp.bulan : hari.slice(0, 7);
  const { dari, sampai } = rentangBulan(`${bulan}-01`);
  const sebelum = rentangBulan(tambahHari(dari, -1)).dari.slice(0, 7);
  const sesudah = tambahHari(sampai, 1).slice(0, 7);
  const peta = await petaKapasitas(pool, { dari, sampai });
  const [y, m, d] = dari.split("-").map(Number);
  const offset = (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7;
  const tab = (aktif) => `rounded-xl border px-3.5 py-2 text-sm font-medium transition ${aktif ? "border-accent bg-accent text-accent-ink" : "border-line bg-surface text-muted hover:bg-ink/5 hover:text-ink"}`;

  return (
    <div className="space-y-8">
      <header className="border-b border-line/60 pb-5">
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink md:text-4xl">Kapasitas Tim</h1>
        <p className="mt-1 text-sm text-muted">Batas maksimal anggota divisi yang boleh cuti bersamaan dalam satu hari.</p>
      </header>
      {PESAN[sp.ok] && <p role="status" className="rounded-2xl border border-ok/30 bg-ok/10 px-4 py-3 text-sm text-ok">{PESAN[sp.ok]}</p>}

      <section className="space-y-4">
        <PageHeader
          title={labelBulan(dari)}
          description="Okupansi pengajuan cuti per divisi"
          action={
            <nav className="shrink-0 flex flex-wrap gap-2" aria-label="Pilih bulan">
              <Link href={`/kapasitas?bulan=${sebelum}`} className={tab(false)}>Bulan sebelumnya</Link>
              <Link href={`/kapasitas?bulan=${hari.slice(0, 7)}`} className={tab(bulan === hari.slice(0, 7))}>Bulan ini</Link>
              <Link href={`/kapasitas?bulan=${sesudah}`} className={tab(false)}>Bulan berikutnya</Link>
            </nav>
          }
        />
        {peta.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line bg-surface/40 p-10 text-center text-sm text-muted">Belum ada divisi.</p>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {peta.map((p) => (
              <article key={p.id} className="space-y-4 rounded-2xl border border-line bg-surface p-6 transition hover:border-ink/20 hover:shadow-lg hover:shadow-black/20">
                <header className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display text-xl font-semibold text-ink">{p.nama}</h3>
                    <p className="mt-0.5 text-xs text-muted">Ketua: {p.ketuaNama ?? "-"} · {p.jumlahAnggota} anggota aktif</p>
                  </div>
                </header>
                <p className="mt-2 text-sm">
                  Maksimal <strong>{p.persen}%</strong> ({p.batas} orang/hari dari {p.jumlahAnggota} anggota aktif).
                  {p.hariPenuh > 0 ? <span className="text-bad"> {p.hariPenuh} hari penuh bulan ini.</span> : <span className="text-muted"> Belum ada hari penuh bulan ini.</span>}
                </p>
                <FormAction action="/api/kapasitas" label="Simpan persen" className="flex flex-wrap items-end gap-3" suksesPesan={`Kapasitas tim ${p.nama} berhasil disimpan.`}>
                  <input type="hidden" name="divisiId" value={p.id} />
                  <input type="hidden" name="bulan" value={bulan} />
                  <label className="min-w-[150px]">
                    <span className={labelCls}>Batas cuti (%)</span>
                    <input name="persen" type="number" min="1" max="100" defaultValue={p.persen} required className={inputCls} suppressHydrationWarning style={{ width: "96px" }} />
                  </label>
                </FormAction>
                <KalenderMini kalender={[{ bulan: dari.slice(0, 7), label: labelBulan(dari), offset, hari: p.harian }]} />
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
