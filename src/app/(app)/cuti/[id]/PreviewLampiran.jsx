"use client";
import { useState } from "react";
import { Download, Eye, EyeOff, FileText } from "lucide-react";
import { btnGhost, btnPrimary } from "@/components/ui";
import { formatUkuran } from "@/lib/format";

// Pratinjau dan unduh lampiran. Preview membuka viewer inline, unduh memakai
// parameter ?download=1 yang dipaksa oleh route /api/lampiran/[id].
export default function PreviewLampiran({ id, nama, mime, ukuran }) {
  const [buka, setBuka] = useState(false);
  const url = `/api/lampiran/${id}`;
  const adalahPdf = mime === "application/pdf";
  const adalahGambar = typeof mime === "string" && mime.startsWith("image/");

  return (
    <div className="rounded-2xl border border-line bg-surface p-4 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <FileText className="h-5 w-5 shrink-0 text-accent" aria-hidden />
          <div className="min-w-0">
            <p className="truncate font-medium text-ink">{nama}</p>
            <p className="text-xs text-muted">{formatUkuran(ukuran)}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setBuka((b) => !b)}
            className={btnGhost}
            aria-expanded={buka}
            suppressHydrationWarning
          >
            {buka ? <EyeOff className="mr-1.5 h-4 w-4" aria-hidden /> : <Eye className="mr-1.5 h-4 w-4" aria-hidden />}
            {buka ? "Tutup preview" : "Preview"}
          </button>
          <a href={`${url}?download=1`} className={btnPrimary} suppressHydrationWarning>
            <Download className="mr-1.5 h-4 w-4" aria-hidden />
            Download
          </a>
        </div>
      </div>

      {buka && (
        <div className="mt-4">
          {adalahPdf ? (
            <iframe
              src={url}
              title={`Preview ${nama}`}
              className="h-[70vh] w-full rounded-lg border border-line bg-chrome"
            />
          ) : adalahGambar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt={`Preview ${nama}`} className="max-h-[70vh] rounded-lg border border-line" />
          ) : (
            <p className="text-xs text-muted">Preview tidak tersedia untuk berkas ini. Silakan unduh berkas.</p>
          )}
        </div>
      )}
    </div>
  );
}
