"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { btnGhost } from "@/components/ui";

const MAKS = 2 * 1024 * 1024;
const inisial = (n) => n.split(/\s+/).slice(0, 2).map((x) => x[0]).join("").toUpperCase();

export default function FotoProfil({ userId, nama, fotoKey }) {
  const router = useRouter();
  const input = useRef(null);
  const [error, setError] = useState(null);
  const [mengunggah, setMengunggah] = useState(false);

  async function pilih(e) {
    const berkas = e.target.files?.[0];
    if (!berkas) return;
    setError(null);
    if (berkas.size > MAKS) return setError("Ukuran foto maksimal 2 MB.");
    if (!["image/jpeg", "image/png"].includes(berkas.type)) return setError("Foto harus berformat JPG atau PNG.");
    const fd = new FormData();
    fd.append("berkas", berkas);
    fd.append("userId", String(userId));
    setMengunggah(true);
    try {
      const res = await fetch("/api/foto", { method: "POST", body: fd });
      if (!res.ok) setError((await res.json().catch(() => null))?.message ?? "Foto gagal diunggah.");
      else router.refresh();
    } catch {
      setError("Foto gagal diunggah. Periksa koneksi Anda.");
    } finally {
      setMengunggah(false);
      if (input.current) input.current.value = "";
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
            <form action="/api/profil/foto" method="POST">
              <input type="hidden" name="id" value={userId} />
              <button className={btnGhost}>Hapus foto</button>
            </form>
          )}
        </div>
        <p className="text-sm text-muted">JPG atau PNG, maksimal 2 MB.</p>
        {error && <p role="alert" className="text-sm text-bad">{error}</p>}
      </div>
    </div>
  );
}
