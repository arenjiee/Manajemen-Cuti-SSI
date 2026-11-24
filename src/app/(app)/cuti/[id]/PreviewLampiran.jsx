"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Download, ExternalLink, Eye, EyeOff, FileText, Loader2 } from "lucide-react";
import { btnGhost, btnPrimary } from "@/components/ui";
import { formatUkuran } from "@/lib/format";

// Pratinjau dan unduh lampiran dengan efek animasi halus (smooth expand/collapse,
// loading skeleton, dan transisi ikon).
export default function PreviewLampiran({ id, nama, mime, ukuran }) {
  const [buka, setBuka] = useState(false);
  const [memuat, setMemuat] = useState(true);
  const url = `/api/lampiran/${id}`;
  const adalahPdf = mime === "application/pdf";
  const adalahGambar = typeof mime === "string" && mime.startsWith("image/");

  function toggleBuka() {
    setBuka((prev) => {
      const selanjutnya = !prev;
      if (selanjutnya) setMemuat(true);
      return selanjutnya;
    });
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface p-4 text-sm transition-colors duration-200 hover:border-line-strong">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent transition-transform duration-200 hover:scale-105">
            <FileText className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium text-ink" title={nama}>{nama}</p>
            <p className="text-xs text-muted">{formatUkuran(ukuran)}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={toggleBuka}
            className={`${btnGhost} gap-1.5`}
            aria-expanded={buka}
            suppressHydrationWarning
          >
            <AnimatePresence mode="wait" initial={false}>
              {buka ? (
                <motion.span
                  key="eye-off"
                  initial={{ opacity: 0, rotate: -30, scale: 0.8 }}
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  exit={{ opacity: 0, rotate: 30, scale: 0.8 }}
                  transition={{ duration: 0.15 }}
                  className="inline-flex items-center"
                >
                  <EyeOff className="h-4 w-4" aria-hidden />
                </motion.span>
              ) : (
                <motion.span
                  key="eye-on"
                  initial={{ opacity: 0, rotate: 30, scale: 0.8 }}
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  exit={{ opacity: 0, rotate: -30, scale: 0.8 }}
                  transition={{ duration: 0.15 }}
                  className="inline-flex items-center"
                >
                  <Eye className="h-4 w-4" aria-hidden />
                </motion.span>
              )}
            </AnimatePresence>
            <span>{buka ? "Tutup preview" : "Preview"}</span>
          </motion.button>

          <motion.a
            href={`${url}?download=1`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`${btnPrimary} gap-1.5`}
            suppressHydrationWarning
          >
            <Download className="h-4 w-4" aria-hidden />
            <span>Download</span>
          </motion.a>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {buka && (
          <motion.div
            key="preview-panel"
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: "auto", marginTop: 16 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{
              height: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
              opacity: { duration: 0.25, ease: "easeOut" },
              marginTop: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
            }}
            className="overflow-hidden"
          >
            <div className="relative rounded-xl border border-line bg-chrome/50 p-2">
              <div className="mb-2 flex items-center justify-between px-2 text-xs text-muted">
                <span className="font-medium text-ink">Pratinjau berkas</span>
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-accent transition-colors hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                  Buka di tab baru
                </a>
              </div>

              <div className="relative min-h-[300px] overflow-hidden rounded-lg border border-line bg-surface">
                {memuat && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-surface/90 backdrop-blur-xs">
                    <Loader2 className="h-6 w-6 animate-spin text-accent" />
                    <p className="text-xs text-muted">Memuat pratinjau…</p>
                  </div>
                )}

                {adalahPdf ? (
                  <iframe
                    src={url}
                    title={`Preview ${nama}`}
                    onLoad={() => setMemuat(false)}
                    className={`h-[72vh] w-full bg-chrome transition-opacity duration-300 ${
                      memuat ? "opacity-0" : "opacity-100"
                    }`}
                  />
                ) : adalahGambar ? (
                  <div className="flex items-center justify-center p-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`Preview ${nama}`}
                      onLoad={() => setMemuat(false)}
                      className={`max-h-[70vh] rounded-lg object-contain transition-opacity duration-300 ${
                        memuat ? "opacity-0" : "opacity-100"
                      }`}
                    />
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <p className="text-xs text-muted">
                      Preview tidak tersedia untuk tipe berkas ini. Silakan gunakan tombol unduh.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
