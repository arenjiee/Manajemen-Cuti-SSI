import Link from "next/link";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

// Isi <th> yang bisa diklik untuk mengurutkan. Tanpa href, hanya menampilkan label biasa.
// arah: "asc" | "desc" | null (null = kolom ini belum menjadi dasar urutan).
export default function HeaderUrut({ label, href, arah }) {
  if (!href) return label;
  const Ikon = arah === "asc" ? ArrowUp : arah === "desc" ? ArrowDown : ArrowUpDown;
  return (
    <Link
      href={href}
      scroll={false}
      aria-label={`Urutkan berdasarkan ${label}`}
      className={`inline-flex items-center gap-1.5 rounded-md outline-none transition-colors hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${arah ? "text-ink" : ""}`}
    >
      {label}
      <Ikon className={`h-3.5 w-3.5 ${arah ? "" : "opacity-40"}`} aria-hidden="true" />
    </Link>
  );
}
