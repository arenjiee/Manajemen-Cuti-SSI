export default function StatCard({ label, nilai, catatan, tone }) {
  const warna = tone === "warn" ? "text-warn" : tone === "bad" ? "text-bad" : tone === "ok" ? "text-ok" : "text-ink";
  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className={`mt-2 font-display text-4xl font-semibold tabular-nums ${warna}`}>{nilai}</p>
      {catatan && <p className="mt-1 text-xs text-muted">{catatan}</p>}
    </div>
  );
}
