import { formatTanggal } from "@/lib/format";

const WARNA = {
  ok: "bg-ok/10 text-ink",
  hampir: "bg-warn/20 text-ink",
  penuh: "bg-bad/20 text-bad",
  libur: "bg-bad/15 text-bad font-semibold",
  cuti_bersama: "bg-warn/25 text-ink font-semibold",
  akhir_pekan: "bg-ink/5 text-muted",
};

const KET = {
  ok: "Tersedia",
  hampir: "Hampir penuh",
  penuh: "Kapasitas divisi penuh",
  libur: "Libur Nasional",
  cuti_bersama: "Cuti Bersama",
  akhir_pekan: "Akhir pekan",
};

const LEGENDA = [
  ["ok", "Tersedia"],
  ["hampir", "Hampir penuh"],
  ["penuh", "Penuh"],
  ["libur", "Libur Nasional"],
  ["cuti_bersama", "Cuti Bersama"],
];

export default function KalenderMini({ kalender, mulai, selesai, onPilihTanggal }) {
  if (!kalender?.length) return null;
  return (
    <div className="space-y-4">
      {kalender.map((b, bIdx) => {
        const daftarHari = b.hari || b.harian || [];
        const labelText = b.label || b.nama || b.bulan;
        return (
          <div key={b.bulan || labelText || bIdx}>
            <p className="mb-1 text-xs font-medium">{labelText}</p>
            <div className="grid grid-cols-7 gap-1 text-center text-[11px]">
              {["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map((h) => (
                <span key={h} className="text-muted">{h}</span>
              ))}
              {Array.from({ length: b.offset ?? 0 }, (_, i) => (
                <span key={`k${i}`} />
              ))}
              {daftarHari.map((h) => {
                const dipilih = mulai && selesai && h.tanggal >= mulai && h.tanggal <= selesai;
                const statusKunci = h.status === "libur" && h.liburInfo?.jenis === "cuti_bersama" ? "cuti_bersama" : h.status;
                
                let detailLibur = "";
                if (h.liburInfo) {
                  const jenisLabel = h.liburInfo.jenis === "cuti_bersama" ? "Cuti Bersama" : "Libur Nasional";
                  detailLibur = ` · ${jenisLabel}: ${h.liburInfo.keterangan}`;
                }
                const titleText = `${formatTanggal(h.tanggal)}: ${KET[statusKunci] ?? KET[h.status] ?? ""}${detailLibur}${h.terisi ? ` (${h.terisi} orang cuti)` : ""}`;

                return (
                  <button
                    type="button"
                    key={h.tanggal}
                    title={titleText}
                    onClick={() => onPilihTanggal?.(h.tanggal)}
                    disabled={!onPilihTanggal}
                    className={`rounded py-1 tabular-nums transition-colors ${WARNA[statusKunci] ?? WARNA[h.status] ?? ""} ${dipilih ? "ring-2 ring-accent shadow-sm" : ""} ${onPilihTanggal ? "cursor-pointer hover:opacity-80" : "cursor-default"}`}
                  >
                    {Number(h.tanggal.slice(8))}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
      <ul className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted">
        {LEGENDA.map(([s, l]) => (
          <li key={s} className="flex items-center gap-1">
            <span className={`inline-block h-2.5 w-2.5 rounded-sm ${WARNA[s].split(" ")[0]}`} />
            {l}
          </li>
        ))}
      </ul>
    </div>
  );
}
