"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { btnGhost } from "@/components/ui";
import { useToast } from "@/components/ToastProvider";

const MAKS = 2 * 1024 * 1024;
const inisial = (n) => n.split(/\s+/).slice(0, 2).map((x) => x[0]).join("").toUpperCase();

export default function FotoProfil({ userId, nama, fotoKey, notifAwal }) {
  const router = useRouter();
  const tampilToast = useToast();
  const input = useRef(null);
  const [error, setError] = useState(null);
  const [mengunggah, setMengunggah] = useState(false);

  useEffect(() => {
    if (notifAwal) {
      tampilToast(notifAwal, "sukses");
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        if (url.searchParams.has("ok")) {
          url.searchParams.delete("ok");
          window.history.replaceState({}, "", url.pathname + (url.search ? url.search : ""));
        }
      }
    }
  }, [notifAwal, tampilToast]);

  async function pilih(e) {
    const berkas = e.target.files?.[0];
    if (!berkas) return;
    setError(null);
    if (berkas.size > MAKS) {
      const msg = "Ukuran foto maksimal 2 MB.";
      setError(msg);
      tampilToast(msg, "gagal");
      return;
    }
    if (!["image/jpeg", "image/png"].includes(berkas.type)) {
      const msg = "Foto harus berformat JPG atau PNG.";
      setError(msg);
      tampilToast(msg, "gagal");
      return;
    }
    const fd = new FormData();
    fd.append("berkas", berkas);
    fd.append("userId", String(userId));
    setMengunggah(true);
    try {
      const res = await fetch("/api/foto", { method: "POST", body: fd });
      if (!res.ok) {
        const msg = (await res.json().catch(() => null))?.message ?? "Foto gagal diunggah.";
        setError(msg);
        tampilToast(msg, "gagal");
      } else {
        tampilToast("Foto profil berhasil diperbarui.", "sukses");
        router.refresh();
      }
    } catch {
      const msg = "Foto gagal diunggah. Periksa koneksi Anda.";
      setError(msg);
      tampilToast(msg, "gagal");
    } finally {
      setMengunggah(false);
      if (input.current) input.current.value = "";
    }
  }

  async function hapusFoto() {
    setError(null);
    setMengunggah(true);
    try {
      const res = await fetch("/api/profil/foto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        tampilToast("Foto profil berhasil dihapus.", "sukses");
        router.refresh();
      } else {
        const msg = data.message || "Gagal menghapus foto.";
        setError(msg);
        tampilToast(msg, "gagal");
      }
    } catch {
      const msg = "Terjadi kesalahan jaringan saat menghapus foto.";
      setError(msg);
      tampilToast(msg, "gagal");
    } finally {
      setMengunggah(false);
    }
  }

  return (
    <div className="flex items-center gap-5">
      {fotoKey ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={`/api/foto/${userId}?v=${encodeURIComponent(fotoKey)}`} alt={`Foto profil ${nama}`} className="h-24 w-24 rounded-full border border-line object-cover" />
      ) : (
        <span aria-hidden className="flex h-24 w-24 items-center justify-center rounded-full bg-accent/10 font-display text-3xl font-semibold text-accent">{inisial(nama)}</span>
      )}
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <label className={`${btnGhost} cursor-pointer ${mengunggah ? "pointer-events-none opacity-60" : ""}`}>
            {mengunggah ? "Mengunggah…" : fotoKey ? "Ganti foto" : "Unggah foto"}
            <input ref={input} type="file" accept="image/jpeg,image/png" onChange={pilih} className="sr-only" />
          </label>
          {fotoKey && (
            <button
              type="button"
              onClick={hapusFoto}
              disabled={mengunggah}
              className={`${btnGhost} ${mengunggah ? "pointer-events-none opacity-60" : ""}`}
            >
              Hapus foto
            </button>
          )}
        </div>
        <p className="text-sm text-muted">JPG atau PNG, maksimal 2 MB.</p>
        {error && <p role="alert" className="text-sm text-bad">{error}</p>}
      </div>
    </div>
  );
}
