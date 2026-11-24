"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Loader2, MessageSquarePlus, X } from "lucide-react";

export default function ModalSaran({ buka, onTutup }) {
  const [kategori, setKategori] = useState("Saran Fitur");
  const [pesan, setPesan] = useState("");
  const [loading, setLoading] = useState(false);
  const [sukses, setSukses] = useState(false);
  const [error, setError] = useState("");

  const handleTutup = useCallback(() => {
    if (loading) return;
    setSukses(false);
    setError("");
    onTutup();
  }, [loading, onTutup]);

  // Handle escape key
  useEffect(() => {
    if (!buka) return;
    function handleKeyDown(e) {
      if (e.key === "Escape" && !loading) {
        handleTutup();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [buka, loading, handleTutup]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!pesan.trim() || pesan.trim().length < 5) {
      setError("Pesan minimal 5 karakter.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/saran", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kategori, pesan: pesan.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.message || "Gagal mengirim saran.");
      }

      setSukses(true);
      setPesan("");
      setTimeout(() => {
        handleTutup();
      }, 1500);
    } catch (err) {
      setError(err.message || "Terjadi kesalahan sistem.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {buka && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop Scrim */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleTutup}
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: "spring", stiffness: 450, damping: 30 }}
            className="relative z-10 w-full max-w-lg rounded-3xl border border-line bg-surface p-6 sm:p-7 text-ink shadow-2xl"
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={handleTutup}
              className="absolute top-5 right-5 flex h-10 w-10 md:h-8 md:w-8 items-center justify-center rounded-full text-muted transition hover:bg-ink/5 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              aria-label="Tutup modal"
            >
              <X size={18} />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                <MessageSquarePlus size={22} />
              </div>
              <div>
                <h2 className="font-display text-lg font-bold leading-tight text-ink">
                  Saran & Masukan
                </h2>
                <p className="mt-0.5 text-sm text-muted">
                  Bantu kami meningkatkan kualitas sistem LeaveSync
                </p>
              </div>
            </div>

            {/* Success state */}
            {sukses ? (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 flex items-center gap-3 rounded-2xl border border-ok/30 bg-ok/10 p-4 text-sm font-semibold text-ok"
              >
                <CheckCircle2 size={20} className="shrink-0" />
                <span>Saran dan masukan Anda berhasil terkirim ke admin. Terima kasih!</span>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                {error && (
                  <div className="rounded-xl border border-bad/30 bg-bad/10 p-3 text-sm font-semibold text-bad">
                    {error}
                  </div>
                )}

                <div>
                  <label className="mb-2 block text-xs font-semibold text-muted">
                    Kategori
                  </label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {["Saran Fitur", "Laporan Kendala", "Kritik & Masukan", "Lainnya"].map((item) => {
                      const aktif = kategori === item;
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => setKategori(item)}
                          className={`rounded-xl border px-2.5 py-2 text-center text-sm font-semibold transition ${
                            aktif
                              ? "border-accent bg-accent text-accent-ink shadow-sm"
                              : "border-line bg-chrome/50 text-ink hover:border-ink/20 hover:bg-chrome"
                          }`}
                        >
                          {item}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="input-saran-pesan"
                    className="mb-2 block text-xs font-semibold text-muted"
                  >
                    Isi Pesan
                  </label>
                  <textarea
                    id="input-saran-pesan"
                    rows={4}
                    required
                    value={pesan}
                    onChange={(e) => setPesan(e.target.value)}
                    placeholder="Tuliskan saran, kendala teknis, atau tanggapan Anda di sini..."
                    className="w-full rounded-2xl border border-line-strong bg-chrome/40 p-3.5 text-base md:text-sm text-ink placeholder:text-muted focus:border-accent focus:bg-surface focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={handleTutup}
                    disabled={loading}
                    className="rounded-xl border border-line px-4 py-2 text-sm font-semibold text-ink transition hover:bg-ink/5 disabled:opacity-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !pesan.trim()}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-5 py-2 text-sm font-semibold text-accent-ink transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading && <Loader2 size={14} className="animate-spin" />}
                    {loading ? "Mengirim..." : "Kirim Masukan"}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
