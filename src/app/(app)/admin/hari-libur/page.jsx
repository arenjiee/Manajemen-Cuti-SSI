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
import { buatLiburAction, hapusLiburAction } from "./actions";

export const metadata = { title: "Hari Libur | SMCK" };

export default async function HariLiburPage({ searchParams }) {
  await requireRole(["admin"]);
  const sp = await searchParams;
  const tahun = /^\d{4}$/.test(sp.tahun ?? "") ? sp.tahun : undefined;
  const rows = await daftarHariLibur(pool, { tahun });
  const kolom = [
    { label: "Tanggal", render: (h) => formatTanggal(h.tanggal) },
    { label: "Keterangan", key: "keterangan" },
    { label: "Jenis", render: (h) => (h.jenis === "nasional" ? "Libur nasional" : "Cuti bersama") },
    { label: "Aksi", render: (h) => (
      <div className="flex items-center gap-2">
        <Link href={`/admin/hari-libur/${h.id}`} className="text-sm text-accent hover:underline">Edit</Link>
        <TombolKonfirmasi action={hapusLiburAction} fields={{ id: h.id }} label="Hapus" pesan={`Hapus hari libur ${formatTanggal(h.tanggal)}?`} className={btnDanger} />
      </div>
    ) },
  ];
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-semibold">Hari Libur & Cuti Bersama</h1>
        <p className="text-sm text-muted">Tanggal di sini tidak dihitung sebagai hari cuti dan ditandai di kalender pengajuan.</p>
      </header>
      <FilterBar fields={[{ name: "tahun", label: "Tahun", type: "number", placeholder: "2026" }]} values={sp} resetHref="/admin/hari-libur" />
      <DataTable kolom={kolom} rows={rows} kosong="Belum ada hari libur." />
      <section className="max-w-xl space-y-4 border-t border-line pt-6">
        <h2 className="text-xl font-semibold">Tambah hari libur</h2>
        <FormAction action={buatLiburAction} label="Tambah"><FormLibur /></FormAction>
      </section>
    </div>
  );
}
