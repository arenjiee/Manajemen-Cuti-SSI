"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "./Modal";
import { useToast } from "./ToastProvider";
import { btnPrimary, btnGhost, btnDanger } from "./ui";

const PESAN_LANJUT = "Konfirmasi sekali lagi: tindakan ini tidak dapat dibatalkan. Lanjutkan?";

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
  const tampilToast = useToast();
  const [buka, setBuka] = useState(false);
  const [langkah, setLangkah] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorPesan, setErrorPesan] = useState("");
  const isUrl = typeof action === "string";

  function bukaModal() {
    setErrorPesan("");
    setLangkah(0);
    setBuka(true);
  }

  function tutupModal() {
    if (loading) return;
    setBuka(false);
    setErrorPesan("");
  }

  async function jalankan() {
    setLoading(true);
    setErrorPesan("");
    try {
      const fd = new FormData();
      Object.entries(fields).forEach(([k, v]) => fd.append(k, String(v ?? "")));
      const res = await fetch(action, { method, body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setErrorPesan(data.message || data.pesan || "Gagal melakukan tindakan.");
        setLoading(false);
        return;
      }
      setLoading(false);
      setBuka(false);
      tampilToast(data.message || data.pesan || "Tindakan berhasil.", "sukses");
      if (onSuccess) onSuccess(data);
      else router.refresh();
    } catch {
      setErrorPesan("Terjadi kesalahan jaringan.");
      setLoading(false);
    }
  }

  function lanjut() {
    if (langkah < konfirmasi - 1) {
      setLangkah((n) => n + 1);
      return;
    }
    jalankan();
  }

  // Server action: pertahankan perilaku form native (belum dipakai di halaman mana pun).
  if (!isUrl) {
    return (
      <form action={action} suppressHydrationWarning>
        {Object.entries(fields).map(([k, v]) => (
          <input key={k} type="hidden" name={k} value={v} suppressHydrationWarning />
        ))}
        <button type="submit" suppressHydrationWarning className={className}>
          {label}
        </button>
      </form>
    );
  }

  const terakhir = langkah === konfirmasi - 1;

  return (
    <>
      <button type="button" onClick={bukaModal} suppressHydrationWarning className={className}>
        {label}
      </button>
      <Modal buka={buka} onTutup={tutupModal} judul={langkah === 0 ? label : "Konfirmasi"} terkunci={loading}>
        <p className="text-sm text-muted">{langkah === 0 ? pesan : PESAN_LANJUT}</p>
        {konfirmasi > 1 && (
          <p className="mt-2 font-mono text-xs text-muted">
            Langkah {langkah + 1} dari {konfirmasi}
          </p>
        )}
        {errorPesan && (
          <p role="alert" className="mt-4 rounded-xl border border-bad/30 bg-bad/10 px-3.5 py-2.5 text-sm text-bad">
            {errorPesan}
          </p>
        )}
        <div className="mt-6 flex items-center justify-end gap-2">
          <button type="button" onClick={tutupModal} disabled={loading} className={btnGhost}>
            Batal
          </button>
          <button type="button" onClick={lanjut} disabled={loading} className={terakhir ? btnDanger : btnPrimary}>
            {loading ? "Memproses…" : terakhir ? "Ya, lanjutkan" : "Lanjut"}
          </button>
        </div>
      </Modal>
    </>
  );
}
