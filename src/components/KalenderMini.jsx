import { formatTanggal } from "@/lib/format";

const WARNA = {
  ok: "bg-ok/10 text-ink",
  hampir: "bg-warn/20 text-ink",
  penuh: "bg-bad/20 text-bad",
  libur: "bg-accent/15 text-accent",
  akhir_pekan: "bg-ink/5 text-muted",
};

const KET = {
  ok: "Tersedia",
  hampir: "Hampir penuh",
  penuh: "Kapasitas divisi penuh",
  libur: "Hari libur",
  akhir_pekan: "Akhir pekan",
};

const LEGENDA = [["ok", "Tersedia"], ["hampir", "Hampir penuh"], ["penuh", "Penuh"], ["libur", "Libur"]];

export default function KalenderMini({ kalender, mulai, selesai }) {
  if (!kalender?.length) return null;
  return (
    <div className="space-y-4">
      {kalender.map((b) => (
        <div key={b.bulan}>
          <p className="mb-1 text-xs font-medium">{b.label}</p>
          <div className="grid grid-cols-7 gap-1 text-center text-[11px]">
            {["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map((h) => <span key={h} className="text-muted">{h}</span>)}
            {Array.from({ length: b.offset }, (_, i) => <span key={`k${i}`} />)}
            {b.hari.map((h) => {
              const dipilih = mulai && selesai && h.tanggal >= mulai && h.tanggal <= selesai;
              return (
                <span
                  key={h.tanggal}
                  title={`${formatTanggal(h.tanggal)}: ${KET[h.status]}${h.terisi ? ` (${h.terisi} orang cuti)` : ""}`}
                  className={`rounded py-1 tabular-nums ${WARNA[h.status]} ${dipilih ? "ring-2 ring-accent" : ""}`}
                >
                  {Number(h.tanggal.slice(8))}
                </span>
              );
            })}
          </div>
        </div>
      ))}
      <ul className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted">
        {LEGENDA.map(([s, l]) => <li key={s} className="flex items-center gap-1"><span className={`inline-block h-2.5 w-2.5 rounded-sm ${WARNA[s].split(" ")[0]}`} />{l}</li>)}
      </ul>
    </div>
  );
}
