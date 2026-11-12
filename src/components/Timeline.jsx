const TITIK = { ok: "bg-ok", bad: "bg-bad", warn: "bg-warn", info: "bg-accent" };

export default function Timeline({ items }) {
  return (
    <ol className="relative space-y-5 border-l border-line pl-6">
      {items.map((it, i) => (
        <li key={i} className="relative">
          <span className={`absolute -left-[1.85rem] top-1.5 h-2.5 w-2.5 rounded-full ${TITIK[it.tone] ?? "bg-muted"}`} />
          <p className="text-sm font-medium">{it.judul}</p>
          {it.waktu && <p className="text-xs text-muted">{it.waktu}</p>}
          {it.catatan && <p className="mt-1 text-sm text-muted">{it.catatan}</p>}
        </li>
      ))}
    </ol>
  );
}
