import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TombolKembali({ href, label = "Kembali", className = "" }) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-ink hover:underline ${className}`}
    >
      <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{label}</span>
    </Link>
  );
}
