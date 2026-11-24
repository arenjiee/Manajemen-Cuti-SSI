"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { btnPrimary, labelCls, selectCls } from "@/components/ui";
import { useToast } from "@/components/ToastProvider";

export default function FormTambahAnggota({ divisiId, kandidat }) {
  const router = useRouter();
  const tampilToast = useToast();
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(false);

  async function kirim(e) {
    e.preventDefault();
    if (!userId) {
      tampilToast("Pilih karyawan terlebih dahulu.", "gagal");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/divisi/${divisiId}/anggota`, {
        method: "POST",
        body: new FormData(e.currentTarget),
        headers: { Accept: "application/json" },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        tampilToast(data.message || "Gagal menambahkan anggota.", "gagal");
      } else {
        tampilToast(data.message || "Anggota berhasil ditambahkan.", "sukses");
        setUserId("");
        router.refresh();
      }
    } catch {
      tampilToast("Terjadi kesalahan jaringan.", "gagal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      action={`/api/admin/divisi/${divisiId}/anggota`}
      method="POST"
      onSubmit={kirim}
      className="flex flex-wrap items-end gap-3"
      suppressHydrationWarning
    >
      <label className="min-w-56">
        <span className={labelCls}>Tambah anggota</span>
        <select
          name="userId"
          required
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          className={selectCls}
          suppressHydrationWarning
        >
          <option value="" disabled>Pilih karyawan tanpa divisi</option>
          {kandidat.map((k) => (
            <option key={k.id} value={k.id}>{k.nama_lengkap}</option>
          ))}
        </select>
      </label>
      <button className={btnPrimary} disabled={loading || kandidat.length === 0} suppressHydrationWarning>
        {loading ? "Menambahkan…" : "Tambahkan"}
      </button>
    </form>
  );
}
