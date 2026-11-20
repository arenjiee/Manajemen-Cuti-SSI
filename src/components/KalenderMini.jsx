"use client";

import { formatTanggal } from "@/lib/format";

const WARNA = {
  // Tersedia: emerald jelas dan kontras
  ok: "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30",
  // Hampir penuh: amber tebal dengan ring kuning
  hampir: "bg-amber-500/25 text-amber-300 ring-1 ring-amber-500/40 font-medium",
  // Penuh: rose mencolok dengan ring merah
  penuh: "bg-rose-500/30 text-rose-300 ring-1 ring-rose-500/50 font-bold",
  // Libur Nasional: biru sky
  libur: "bg-sky-500/25 text-sky-300 ring-1 ring-sky-500/40 font-semibold",
  // Cuti Bersama: ungu purple
  cuti_bersama: "bg-purple-500/25 text-purple-300 ring-1 ring-purple-500/40 font-semibold",
  // Akhir pekan: netral abu-abu
  akhir_pekan: "bg-white/[0.04] text-muted ring-1 ring-white/5",
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
  ["ok", "Tersedia", "bg-emerald-500/30 ring-1 ring-emerald-500/50"],
  ["hampir", "Hampir penuh", "bg-amber-500/30 ring-1 ring-amber-500/50"],
  ["penuh", "Penuh", "bg-rose-500/35 ring-1 ring-rose-500/60"],
  ["libur", "Libur Nasional", "bg-sky-500/30 ring-1 ring-sky-500/50"],
  ["cuti_bersama", "Cuti Bersama", "bg-purple-500/30 ring-1 ring-purple-500/50"],
  ["akhir_pekan", "Akhir pekan", "bg-white/10 ring-1 ring-white/15"],
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
                    suppressHydrationWarning
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
      <ul className="flex flex-wrap gap-x-3 gap-y-1.5 text-[11px] text-muted pt-1">
        {LEGENDA.map(([s, l, kotakCls]) => (
          <li key={s} className="flex items-center gap-1.5">
            <span className={`inline-block h-2.5 w-2.5 rounded-sm ${kotakCls}`} />
            <span>{l}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
