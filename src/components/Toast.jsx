"use client";
import { useEffect } from "react";
import { CheckCircle2, XCircle, X } from "lucide-react";

export default function Toast({ notif, onTutup }) {
  useEffect(() => {
    if (!notif) return;
    const t = setTimeout(onTutup, 4500);
    return () => clearTimeout(t);
  }, [notif, onTutup]);

  if (!notif) return null;

  const sukses = notif.tipe !== "gagal";
  const Icon = sukses ? CheckCircle2 : XCircle;

  return (
    <div
      role={sukses ? "status" : "alert"}
      aria-live="polite"
      className={`fixed right-4 bottom-4 z-[80] flex w-[calc(100%-2rem)] max-w-sm items-start gap-3 rounded-2xl border p-4 shadow-2xl backdrop-blur ${
        sukses ? "border-ok/30 bg-ok/10" : "border-bad/30 bg-bad/10"
      }`}
    >
      <Icon size={20} className={`mt-0.5 shrink-0 ${sukses ? "text-ok" : "text-bad"}`} />
      <p className="flex-1 text-sm font-medium text-ink">{notif.pesan}</p>
      <button
        type="button"
        onClick={onTutup}
        aria-label="Tutup notifikasi"
        className="shrink-0 rounded-lg p-0.5 text-muted transition hover:bg-ink/5 hover:text-ink"
      >
        <X size={16} />
      </button>
    </div>
  );
}
