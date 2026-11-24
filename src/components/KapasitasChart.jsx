import Link from "next/link";

const GAYA = {
  penuh: { batang: "bg-bad", teks: "text-bad", label: "Penuh" },
  hampir: { batang: "bg-warn", teks: "text-warn", label: "Hampir penuh" },
  aman: { batang: "bg-ok", teks: "text-ok", label: "Aman" },
  kosong: { batang: "bg-line", teks: "text-muted", label: "Belum ada anggota" },
};

// Batang per divisi: panjang = puncak orang cuti bersamaan / batas harian divisi itu.
// Server component murni (tanpa state), jadi tidak menambah JavaScript ke browser.
export default function KapasitasChart({ data }) {
  if (data.length === 0) {
    return <p className="rounded-2xl border border-dashed border-line bg-surface/40 p-8 text-center text-sm text-muted">Belum ada divisi.</p>;
  }
  return (
    <div className="space-y-4 rounded-2xl border border-line bg-surface p-5">
      <ul className="space-y-4">
        {data.map((d) => {
          const g = GAYA[d.status];
          const lebar = d.status === "kosong" ? 0 : Math.min(100, Math.round((d.puncak / d.batas) * 100));
          return (
            <li key={d.id}>
              <Link
                href="/kapasitas"
                className="group block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-accent"
                aria-label={`${d.nama}: puncak ${d.puncak} dari batas ${d.batas} orang per hari, ${g.label}`}
              >
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="font-medium text-ink group-hover:underline">{d.nama}</span>
                  <span className="font-mono text-xs text-muted">
                    <span className="text-ink tabular-nums">{d.puncak}/{d.batas}</span> orang per hari
                    {d.hariPenuh > 0 && <span className="text-bad"> · {d.hariPenuh} hari penuh</span>}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center gap-3">
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-ink/10" role="presentation">
                    <div className={`h-full rounded-full ${g.batang}`} style={{ width: `${lebar}%` }} />
                  </div>
                  <span className={`w-28 shrink-0 text-right text-xs font-medium ${g.teks}`}>{g.label}</span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
      <p className="border-t border-line/60 pt-3 text-xs text-muted">
        Puncak = jumlah orang cuti terbanyak pada satu hari kerja bulan ini. Termasuk pengajuan yang masih menunggu persetujuan,
        sehingga bisa lebih tinggi dari jumlah cuti yang sudah disetujui.
      </p>
    </div>
  );
}
