export function labelStatus(status, tahap) {
  if (status === "Pending") return tahap === "hrd" ? "Menunggu HRD" : "Menunggu Ketua Divisi";
  return {
    "Approved by Leader": "Disetujui Ketua Divisi",
    Approved: "Disetujui",
    Rejected: "Ditolak",
    Cancelled: "Dibatalkan",
  }[status] ?? status;
}

const TONE = {
  Pending: "bg-warn/15 text-warn",
  "Approved by Leader": "bg-accent/10 text-accent",
  Approved: "bg-ok/15 text-ok",
  Rejected: "bg-bad/10 text-bad",
  Cancelled: "bg-ink/10 text-muted",
};

export default function StatusBadge({ status, tahap }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${TONE[status] ?? "bg-ink/10 text-muted"}`}>
      {labelStatus(status, tahap)}
    </span>
  );
}
