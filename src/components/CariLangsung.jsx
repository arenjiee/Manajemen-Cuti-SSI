"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { inputCls } from "./ui";

// Kotak pencarian yang menulis ke URL (?q=) setelah berhenti mengetik sebentar.
// `params` = parameter URL lain (filter, urut, arah) yang harus ikut dipertahankan.
export default function CariLangsung({ basePath, params = {}, name = "q", defaultValue = "", placeholder = "Cari..." }) {
  const router = useRouter();
  const [nilai, setNilai] = useState(defaultValue);
  const [pending, mulai] = useTransition();
  const timer = useRef(null);
  const terakhir = useRef(defaultValue);

  function terapkan(v) {
    const t = v.trim();
    if (t === terakhir.current) return;
    terakhir.current = t;
    const usp = new URLSearchParams();
    Object.entries(params).forEach(([k, val]) => { if (val) usp.set(k, val); });
    if (t) usp.set(name, t);
    const qs = usp.toString();
    mulai(() => router.replace(qs ? `${basePath}?${qs}` : basePath, { scroll: false }));
  }

  function ubah(v) {
    setNilai(v);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => terapkan(v), 350);
  }

  useEffect(() => () => clearTimeout(timer.current), []);

  // URL berubah dari luar (Reset, tombol Back): samakan isi kotak. Perubahan dari ketikan sendiri
  // sudah tercatat di `terakhir`, jadi tidak menimpa apa yang sedang diketik.
  useEffect(() => {
    if (defaultValue === terakhir.current) return;
    terakhir.current = defaultValue;
    clearTimeout(timer.current);
    setNilai(defaultValue);
  }, [defaultValue]);

  return (
    <form
      role="search"
      onSubmit={(e) => { e.preventDefault(); clearTimeout(timer.current); terapkan(nilai); }}
      className="relative"
    >
      <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
      <input
        type="search"
        value={nilai}
        onChange={(e) => ubah(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        autoComplete="off"
        suppressHydrationWarning
        className={`${inputCls} pr-10 pl-10 [&::-webkit-search-cancel-button]:hidden ${pending ? "opacity-70" : ""}`}
      />
      {nilai && (
        <button
          type="button"
          onClick={() => { setNilai(""); clearTimeout(timer.current); terapkan(""); }}
          aria-label="Hapus pencarian"
          suppressHydrationWarning
          className="absolute top-1/2 right-3 -translate-y-1/2 rounded-md p-1 text-muted transition-colors hover:text-ink"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </form>
  );
}
