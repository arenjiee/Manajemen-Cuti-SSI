import Link from "next/link";
import { requireRole } from "@/lib/guard";
import pool from "@/lib/db";
import { daftarHariLibur } from "@/lib/queries/hari-libur";
import { formatTanggal } from "@/lib/format";
import DataTable from "@/components/DataTable";
import FilterBar from "@/components/FilterBar";
import FormAction from "@/components/FormAction";
import FormLibur from "@/components/FormLibur";
import TombolKonfirmasi from "@/components/TombolKonfirmasi";
import { btnDanger } from "@/components/ui";

export const metadata = { title: "Hari Libur | SMCK" };

export default async function HariLiburPage({ searchParams }) {
  await requireRole(["admin"]);
  const sp = await searchParams;
  const tahunAktif = new Date().getFullYear();
  const tahun = /^\d{4}$/.test(sp.tahun ?? "") ? sp.tahun : undefined;
  const rows = await daftarHariLibur(pool, { tahun });
  const kolom = [
    { label: "Tanggal", render: (h) => formatTanggal(h.tanggal) },
    { label: "Keterangan", key: "keterangan" },
    {
      label: "Jenis",
      render: (h) => (
        <span
          className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
            h.jenis === "cuti_bersama" ? "bg-warn/20 text-ink" : "bg-bad/20 text-bad"
          }`}
        >
          {h.jenis === "nasional" ? "Libur nasional" : "Cuti bersama"}
        </span>
      ),
    },
    {
      label: "Aksi",
      render: (h) => (
        <div className="flex items-center gap-2">
          <Link href={`/admin/hari-libur/${h.id}`} className="text-sm text-accent hover:underline">
            Edit
          </Link>
          <TombolKonfirmasi
            action="/api/admin/hari-libur/hapus"
            fields={{ id: h.id }}
            label="Hapus"
            pesan={`Hapus hari libur ${formatTanggal(h.tanggal)}?`}
            className={btnDanger}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-semibold">Hari Libur & Cuti Bersama</h1>
        <p className="text-sm text-muted">Tanggal di sini tidak dihitung sebagai hari cuti dan ditandai di kalender pengajuan.</p>
      </header>

      {/* Integrasi Liburin */}
      <section className="rounded-2xl border border-line bg-surface p-5 space-y-3">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <span>🌐</span> Integrasi Kalender Nasional (Liburin)
          </h2>
          <p className="text-xs text-muted">
            Tarik otomatis seluruh daftar hari libur resmi dan cuti bersama berdasarkan SKB 3 Menteri dari API Liburin (liburin.vercel.app). Tanggal yang sudah ada akan diperbarui tanpa membuat duplikat.
          </p>
        </div>
        <FormAction
          action="/api/admin/hari-libur/sinkron"
          label="Sinkronkan dari Liburin"
          redirectTo={`/admin/hari-libur?tahun=${tahun ?? tahunAktif}`}
          className="flex flex-wrap items-center gap-3"
        >
          <label className="text-sm flex items-center gap-2">
            <span className="text-muted">Tahun:</span>
            <input
              name="tahun"
              type="number"
              min="2020"
              max="2099"
              defaultValue={tahun ?? tahunAktif}
              required
              className="w-24 rounded-lg border border-line bg-bg px-2.5 py-1.5 text-sm"
            />
          </label>
        </FormAction>
      </section>

      <FilterBar fields={[{ name: "tahun", label: "Tahun", type: "number", placeholder: String(tahunAktif) }]} values={sp} resetHref="/admin/hari-libur" />
      <DataTable kolom={kolom} rows={rows} kosong="Belum ada hari libur." />

      <section className="max-w-xl space-y-4 border-t border-line pt-6">
        <h2 className="text-xl font-semibold">Tambah hari libur manual</h2>
        <FormAction action="/api/admin/hari-libur" redirectTo="/admin/hari-libur" label="Tambah">
          <FormLibur />
        </FormAction>
      </section>
    </div>
  );
}
