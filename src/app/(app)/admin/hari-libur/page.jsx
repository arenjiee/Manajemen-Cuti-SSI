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
import PageHeader from "@/components/PageHeader";
import Section from "@/components/Section";
import TautanDetail from "@/components/TautanDetail";
import { CalendarDays } from "lucide-react";
import { btnDanger, inputCls } from "@/components/ui";

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
      <div className="flex items-center gap-4 pl-2">
        <TautanDetail href={`/admin/hari-libur/${h.id}`} label="Edit" />
        <TombolKonfirmasi
          action="/api/admin/hari-libur/hapus"
          fields={{ id: h.id }}
          label="Hapus"
          pesan={`Hapus hari libur ${formatTanggal(h.tanggal)}?`}
          className={`${btnDanger} ml-1`}
        />
      </div>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Hari Libur & Cuti Bersama"
        description="Tanggal di sini tidak dihitung sebagai hari cuti dan ditandai di kalender pengajuan."
      />

      <section className="rounded-2xl border border-line bg-surface p-6 space-y-4">
        <div className="flex items-start gap-3">
          <span className="flex shrink-0 h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <CalendarDays className="h-5 w-5" aria-hidden />
          </span>
          <div className="flex-1">
            <h2 className="text-lg font-semibold">Integrasi Kalender Nasional (Liburin)</h2>
            <p className="mt-1 text-xs text-muted">
              Tarik otomatis seluruh daftar hari libur resmi dan cuti bersama berdasarkan SKB 3 Menteri dari API Liburin (liburin.vercel.app). Tanggal yang sudah ada akan diperbarui tanpa membuat duplikat.
            </p>
          </div>
        </div>
        <FormAction
          action="/api/admin/hari-libur/sinkron"
          label="Sinkronkan dari Liburin"
          redirectTo={`/admin/hari-libur?tahun=${tahun ?? tahunAktif}`}
          className="flex flex-wrap items-center gap-3"
        >
          <label className="flex items-center gap-2">
            <span className="text-sm text-muted">Tahun:</span>
            <input
              name="tahun"
              type="number"
              min="2020"
              max="2099"
              defaultValue={tahun ?? tahunAktif}
              required
              className={inputCls}
              style={{ width: "96px" }}
            />
          </label>
        </FormAction>
      </section>

      <FilterBar fields={[{ name: "tahun", label: "Tahun", type: "number", placeholder: String(tahunAktif) }]} values={sp} resetHref="/admin/hari-libur" />
      <DataTable kolom={kolom} rows={rows} kosong="Belum ada hari libur." />

      <Section title="Tambah hari libur manual" className="max-w-xl border-t border-line pt-6">
        <FormAction action="/api/admin/hari-libur" redirectTo="/admin/hari-libur" label="Tambah">
          <FormLibur />
        </FormAction>
      </Section>
    </div>
  );
}
