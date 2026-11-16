import Link from "next/link";
import { requireRole } from "@/lib/guard";
import pool from "@/lib/db";
import { hariIni, tambahHari } from "@/lib/leave/tanggal";
import { rentangBulan, labelBulan } from "@/lib/periode";
import { petaKapasitas } from "@/lib/queries/kapasitas";
import KalenderMini from "@/components/KalenderMini";
import FormAction from "@/components/FormAction";
import { inputCls } from "@/components/ui";
import { ubahBatasAction } from "./actions";

export const metadata = { title: "Kapasitas Tim | SMCK" };

const BULAN = /^\d{4}-(0[1-9]|1[0-2])$/;
const PESAN = { batas: "Batas kapasitas disimpan." };

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

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-semibold">Kapasitas Tim</h1>
        <p className="text-sm text-muted">Batas maksimal anggota divisi yang boleh cuti bersamaan.</p>
      </header>
      {PESAN[sp.ok] && <p role="status" className="rounded-lg bg-ok/10 px-3 py-2 text-sm text-ok">{PESAN[sp.ok]}</p>}

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="text-xl font-semibold">Okupansi {labelBulan(dari)}</h2>
          <nav className="flex gap-2 text-sm" aria-label="Pilih bulan">
            <Link href={`/kapasitas?bulan=${sebelum}`} className="rounded-lg border border-line px-3 py-1.5 hover:bg-ink/5">← Bulan sebelumnya</Link>
            <Link href={`/kapasitas?bulan=${hari.slice(0, 7)}`} className="rounded-lg border border-line px-3 py-1.5 hover:bg-ink/5">Bulan ini</Link>
            <Link href={`/kapasitas?bulan=${sesudah}`} className="rounded-lg border border-line px-3 py-1.5 hover:bg-ink/5">Bulan berikutnya →</Link>
          </nav>
        </div>
        {peta.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line p-8 text-center text-sm text-muted">Belum ada divisi.</p>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {peta.map((p) => (
              <article key={p.id} className="space-y-4 rounded-2xl border border-line bg-surface p-5">
                <header>
                  <h3 className="font-display text-xl font-semibold">{p.nama}</h3>
                  <p className="text-xs text-muted">Ketua: {p.ketuaNama ?? "-"} · {p.jumlahAnggota} anggota aktif</p>
                </header>
                <p className="text-sm">
                  Maksimal <strong>{p.batas}</strong> orang cuti per hari.
                  {p.hariPenuh > 0 ? <span className="text-bad"> {p.hariPenuh} hari penuh bulan ini.</span> : <span className="text-muted"> Belum ada hari penuh bulan ini.</span>}
                </p>
                <FormAction action={ubahBatasAction} label="Simpan batas" className="flex flex-wrap items-end gap-3">
                  <input type="hidden" name="divisiId" value={p.id} />
                  <input type="hidden" name="bulan" value={bulan} />
                  <label className="text-xs text-muted">Maksimal orang cuti per hari
                    <input name="batas" type="number" min="1" max="999" step="1" required defaultValue={p.batas} className={`${inputCls} mt-1 w-28`} />
                  </label>
                </FormAction>
                {p.batas >= p.jumlahAnggota && <p className="text-xs text-warn">Batas sama atau lebih besar dari jumlah anggota aktif, jadi tidak ada pembatasan yang efektif.</p>}
                <KalenderMini kalender={[{ bulan, label: labelBulan(dari), offset, hari: p.harian }]} />
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
