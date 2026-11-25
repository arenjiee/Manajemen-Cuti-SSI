"use client";
import { useId, useRef, useState } from "react";
import { BULAN_PANJANG, BULAN_SINGKAT, batasSumbu } from "@/lib/grafik-pengajuan";

// Segmen berurutan dari dasar batang ke atas. `ambil` membaca angka satu bulan.
const SEGMEN = {
  disetujui: { label: "Disetujui", warna: "bg-ok", ambil: (b) => b.disetujui },
  ditolak: { label: "Ditolak", warna: "bg-bad", ambil: (b) => b.ditolak },
  menunggu: { label: "Menunggu", warna: "bg-warn", ambil: (b) => b.menunggu },
  dibatalkan: { label: "Dibatalkan", warna: "bg-ink/30", ambil: (b) => b.dibatalkan },
  ditolakHrd: { label: "Ditolak HRD", warna: "bg-bad", ambil: (b) => b.ditolak - b.ditolakKetua },
  ditolakKetua: { label: "Ditolak Ketua Divisi", warna: "bg-bad/55", ambil: (b) => b.ditolakKetua },
  berlalu: { label: "Cuti sudah berlalu", warna: "bg-accent", ambil: (b) => b.berlalu },
};

const TAB = [
  {
    id: "semua",
    label: "Semua",
    segmen: ["disetujui", "ditolak", "menunggu", "dibatalkan"],
    total: (t) => t.semua,
    satuan: "pengajuan",
    catatan: "Semua pengajuan, dikelompokkan menurut bulan diajukan dan dipisah per status.",
    kosong: "Belum ada pengajuan pada tahun ini.",
  },
  {
    id: "disetujui",
    label: "Disetujui",
    segmen: ["disetujui"],
    total: (t) => t.disetujui,
    satuan: "pengajuan disetujui",
    catatan: "Pengajuan berstatus Disetujui (final HRD), menurut bulan diajukan.",
    kosong: "Belum ada pengajuan yang disetujui pada tahun ini.",
  },
  {
    id: "ditolak",
    label: "Ditolak",
    segmen: ["ditolakHrd", "ditolakKetua"],
    total: (t) => t.ditolak,
    satuan: "pengajuan ditolak",
    catatan: "Pengajuan yang ditolak, menurut bulan diajukan. Dipisah antara penolakan Ketua Divisi dan HRD.",
    kosong: "Belum ada pengajuan yang ditolak pada tahun ini.",
  },
  {
    id: "berlalu",
    label: "Sudah berlalu",
    segmen: ["berlalu"],
    total: (t) => t.berlalu,
    satuan: "cuti telah berlalu",
    catatan: "Cuti disetujui yang tanggal selesainya sudah lewat, menurut bulan mulai cuti (bukan bulan diajukan).",
    kosong: "Belum ada cuti yang telah berlalu pada tahun ini.",
  },
];

const hurufKecil = (s) => s.charAt(0).toLowerCase() + s.slice(1);

export default function GrafikPengajuan({ data }) {
  const [aktif, setAktif] = useState("semua");
  const idDasar = useId();
  const refTab = useRef({});
  const tab = TAB.find((t) => t.id === aktif);
  const segmen = tab.segmen.map((k) => ({ kunci: k, ...SEGMEN[k] }));

  const jumlahBulan = (b) => segmen.reduce((a, s) => a + s.ambil(b), 0);
  const maks = Math.max(0, ...data.perBulan.map(jumlahBulan));
  const puncak = batasSumbu(maks);
  const total = tab.total(data.total);

  function geser(e, i) {
    const arah = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!arah && e.key !== "Home" && e.key !== "End") return;
    e.preventDefault();
    const ke = e.key === "Home" ? 0 : e.key === "End" ? TAB.length - 1 : (i + arah + TAB.length) % TAB.length;
    setAktif(TAB[ke].id);
    refTab.current[TAB[ke].id]?.focus();
  }

  return (
    <div className="space-y-4 rounded-2xl border border-line bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label="Jenis grafik pengajuan" className="flex max-w-full flex-wrap gap-0.5 rounded-xl border border-line bg-chrome p-0.5">
          {TAB.map((t, i) => {
            const dipilih = t.id === aktif;
            return (
              <button
                key={t.id}
                ref={(el) => { refTab.current[t.id] = el; }}
                type="button"
                role="tab"
                id={`${idDasar}-tab-${t.id}`}
                aria-selected={dipilih}
                aria-controls={`${idDasar}-panel`}
                tabIndex={dipilih ? 0 : -1}
                onClick={() => setAktif(t.id)}
                onKeyDown={(e) => geser(e, i)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  dipilih ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink"
                }`}
              >
                {t.label}
                <span className="tabular-nums text-muted">{t.total(data.total)}</span>
              </button>
            );
          })}
        </div>
        <p className="text-sm text-muted">
          <span className="font-display text-xl font-semibold tabular-nums text-ink">{total}</span> {tab.satuan} pada {data.tahun}
        </p>
      </div>

      <p className="text-xs text-muted">{tab.catatan}</p>

      <div role="tabpanel" id={`${idDasar}-panel`} aria-labelledby={`${idDasar}-tab-${aktif}`}>
        <div className="flex gap-2">
          {/* Sumbu Y */}
          <div className="relative h-48 w-7 shrink-0 text-right text-[10px] tabular-nums text-muted" aria-hidden>
            {[puncak, puncak / 2, 0].map((n) => (
              <span key={n} className="absolute right-0 leading-none" style={{ bottom: `${(n / puncak) * 100}%`, transform: "translateY(50%)" }}>
                {n}
              </span>
            ))}
          </div>

          <div className="min-w-0 flex-1">
            <div className="relative h-48">
              {/* Garis bantu */}
              {[0, 50, 100].map((p) => (
                <div key={p} className={`absolute inset-x-0 border-t ${p === 0 ? "border-line-strong/50" : "border-dashed border-line"}`} style={{ bottom: `${p}%` }} aria-hidden />
              ))}

              <div className="absolute inset-0 grid grid-cols-12 gap-1 sm:gap-2">
                {data.perBulan.map((b, i) => {
                  const jml = jumlahBulan(b);
                  const tinggi = (jml / puncak) * 100;
                  const rincian = segmen.length > 1 ? ` (${segmen.filter((s) => s.ambil(b) > 0).map((s) => `${s.ambil(b)} ${hurufKecil(s.label)}`).join(", ")})` : "";
                  return (
                    <div key={i} className="relative" title={`${BULAN_PANJANG[i]} ${data.tahun}: ${jml} ${tab.satuan}${jml > 0 ? rincian : ""}`}>
                      {jml > 0 && (
                        <span className="absolute inset-x-0 text-center text-[10px] font-medium tabular-nums leading-4 text-ink transition-[bottom] duration-300 motion-reduce:transition-none" style={{ bottom: `${tinggi}%` }} aria-hidden>
                          {jml}
                        </span>
                      )}
                      <div className="absolute inset-x-0.5 bottom-0 flex flex-col-reverse overflow-hidden rounded-t-md transition-[height] duration-300 motion-reduce:transition-none sm:inset-x-1" style={{ height: `${tinggi}%` }} aria-hidden>
                        {segmen.map((s) => {
                          const n = s.ambil(b);
                          return n > 0 ? <div key={s.kunci} className={`${s.warna} min-h-[2px]`} style={{ flexGrow: n, flexBasis: 0 }} /> : null;
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {total === 0 && (
                <p className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-muted">{tab.kosong}</p>
              )}
            </div>

            {/* Label bulan */}
            <div className="mt-1.5 grid grid-cols-12 gap-1 sm:gap-2" aria-hidden>
              {BULAN_SINGKAT.map((nama, i) => {
                const sekarang = data.bulanIni === i + 1;
                return (
                  <span key={nama} className={`truncate text-center text-[10px] sm:text-xs ${sekarang ? "font-semibold text-ink" : "text-muted"}`}>
                    {nama}
                    {sekarang && <span className="mx-auto mt-0.5 block h-0.5 w-3 rounded-full bg-accent" />}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {/* Legenda */}
        <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 border-t border-line/60 pt-3 text-xs text-muted">
          {segmen.map((s) => (
            <li key={s.kunci} className="inline-flex items-center gap-1.5">
              <span className={`h-2.5 w-2.5 rounded-sm ${s.warna}`} aria-hidden />
              {s.label}
              <span className="tabular-nums text-ink">{data.perBulan.reduce((a, b) => a + s.ambil(b), 0)}</span>
            </li>
          ))}
        </ul>

        {/* Setara tekstual untuk pembaca layar */}
        <table className="sr-only">
          <caption>{`${tab.label}: ${tab.satuan} per bulan, ${data.tahun}`}</caption>
          <thead>
            <tr>
              <th scope="col">Bulan</th>
              {segmen.map((s) => <th key={s.kunci} scope="col">{s.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {data.perBulan.map((b, i) => (
              <tr key={i}>
                <th scope="row">{BULAN_PANJANG[i]}</th>
                {segmen.map((s) => <td key={s.kunci}>{s.ambil(b)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
