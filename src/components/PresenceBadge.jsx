export default function PresenceBadge({ aktif = true, sedangCuti = false }) {
  if (!aktif) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2 py-0.5 text-xs text-muted">
        <span className="h-1.5 w-1.5 rounded-full bg-muted/60" aria-hidden />
        <span>Nonaktif</span>
      </span>
    );
  }

  if (sedangCuti) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-warn/30 bg-warn/10 px-2 py-0.5 text-xs font-semibold text-warn">
        <span className="h-1.5 w-1.5 rounded-full bg-warn animate-pulse" aria-hidden />
        <span>Sedang Cuti</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-ok/30 bg-ok/10 px-2 py-0.5 text-xs font-semibold text-ok">
      <span className="h-1.5 w-1.5 rounded-full bg-ok" aria-hidden />
      <span>Aktif</span>
    </span>
  );
}
