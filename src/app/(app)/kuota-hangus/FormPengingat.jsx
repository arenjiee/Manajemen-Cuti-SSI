"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { btnPrimary } from "@/components/ui";
import { useToast } from "@/components/ToastProvider";

const PESAN_KOSONG = "Belum ada karyawan yang dipilih.";

export default function FormPengingat({ ambang }) {
  const router = useRouter();
  const tampilToast = useToast();
  const [loading, setLoading] = useState(false);

  async function kirim(e) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    // Tidak ada yang dicentang: cukup beri tahu lewat toast, tanpa kirim ke server.
    if (fd.getAll("ids").length === 0) {
      tampilToast(PESAN_KOSONG, "gagal");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/kuota-hangus/pengingat", {
        method: "POST",
        body: fd,
        headers: { Accept: "application/json" },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        tampilToast(data.message || "Gagal mengirim pengingat.", "gagal");
      } else {
        tampilToast(data.message || "Pengingat berhasil dikirim.", "sukses");
        router.refresh();
      }
    } catch {
      tampilToast("Terjadi kesalahan jaringan.", "gagal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form id="form-pengingat" action="/api/kuota-hangus/pengingat" method="POST" onSubmit={kirim} suppressHydrationWarning>
      <input type="hidden" name="ambang" value={ambang} suppressHydrationWarning />
      <button disabled={loading} suppressHydrationWarning className={btnPrimary}>
        {loading ? "Mengirim…" : "Kirim pengingat ke yang dipilih"}
      </button>
    </form>
  );
}
