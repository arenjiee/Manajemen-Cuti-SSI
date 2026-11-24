export function labelStatus(status, tahap) {
  if (status === "Pending") return tahap === "hrd" ? "Menunggu HRD" : "Menunggu Ketua Divisi";
  return {
    "Approved by Leader": "Disetujui Ketua Divisi",
    Approved: "Disetujui",
    Rejected: "Ditolak",
    Cancelled: "Dibatalkan",
  }[status] ?? status;
}

const BADGE_CONFIG = {
  Pending: {
    bg: "bg-warn/10 text-warn border-warn/25",
    dot: "bg-warn",
  },
  "Approved by Leader": {
    bg: "bg-accent/15 text-accent border-accent/30",
    dot: "bg-accent",
  },
  Approved: {
    bg: "bg-ok/10 text-ok border-ok/25",
    dot: "bg-ok",
  },
  Rejected: {
    bg: "bg-bad/10 text-bad border-bad/25",
    dot: "bg-bad",
  },
  Cancelled: {
    bg: "bg-ink/5 text-muted border-line",
    dot: "bg-muted",
  },
};

export default function StatusBadge({ status, tahap }) {
  const config = BADGE_CONFIG[status] ?? {
    bg: "bg-ink/5 text-muted border-line",
    dot: "bg-muted",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap select-none ${config.bg}`}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${config.dot}`} aria-hidden />
      <span>{labelStatus(status, tahap)}</span>
    </span>
  );
}
