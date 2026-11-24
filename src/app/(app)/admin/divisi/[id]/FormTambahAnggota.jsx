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
  const terpilih = kandidat.find((k) => String(k.id) === userId);
  const bebas = kandidat.filter((k) => !k.divisi_nama);
  const dariLain = kandidat.filter((k) => k.divisi_nama);

  async function kirim(e) {
    e.preventDefault();
    if (!userId) {
      tampilToast("Pilih karyawan terlebih dahulu.", "gagal");
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData(e.currentTarget);
      if (terpilih?.divisi_nama) fd.set("pindah", "1");
      const res = await fetch(`/api/admin/divisi/${divisiId}/anggota`, {
        method: "POST",
        body: fd,
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
          <option value="" disabled>Pilih karyawan</option>
          {bebas.length > 0 && (
            <optgroup label="Tanpa divisi">
              {bebas.map((k) => <option key={k.id} value={k.id}>{k.nama_lengkap}</option>)}
            </optgroup>
          )}
          {dariLain.length > 0 && (
            <optgroup label="Pindahkan dari divisi lain">
              {dariLain.map((k) => <option key={k.id} value={k.id}>{k.nama_lengkap} (dari {k.divisi_nama})</option>)}
            </optgroup>
          )}
        </select>
      </label>
      <button className={btnPrimary} disabled={loading || kandidat.length === 0} suppressHydrationWarning>
        {loading ? "Memproses…" : terpilih?.divisi_nama ? "Pindahkan" : "Tambahkan"}
      </button>
    </form>
  );
}
