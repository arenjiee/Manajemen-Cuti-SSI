"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function TombolKonfirmasi({
  action,
  method = "POST",
  fields = {},
  label,
  pesan = "Yakin?",
  konfirmasi = 1,
  className,
  onSuccess,
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const isUrl = typeof action === "string";

  async function handleSubmit(e) {
    for (let i = 0; i < konfirmasi; i++) {
      const teks = i === 0 ? pesan : "Konfirmasi sekali lagi: tindakan ini tidak dapat dibatalkan. Lanjutkan?";
      if (!confirm(teks)) {
        e.preventDefault();
        return;
      }
    }

    if (isUrl) {
      e.preventDefault();
      setLoading(true);
      try {
        const fd = new FormData(e.currentTarget);
        const res = await fetch(action, {
          method,
          body: fd,
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) {
          alert(data.message || data.pesan || "Gagal melakukan tindakan.");
          setLoading(false);
          return;
        }
        setLoading(false);
        if (onSuccess) onSuccess(data);
        else router.refresh();
      } catch {
        alert("Terjadi kesalahan jaringan.");
        setLoading(false);
      }
    }
  }

  return (
    <form action={typeof action === "function" ? action : undefined} onSubmit={handleSubmit}>
      {Object.entries(fields).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <button type="submit" disabled={loading} className={className}>
        {loading ? "Memproses…" : label}
      </button>
    </form>
  );
}
