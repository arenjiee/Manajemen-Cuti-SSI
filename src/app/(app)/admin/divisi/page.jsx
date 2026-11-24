import Link from "next/link";
import { requireRole } from "@/lib/guard";
import pool from "@/lib/db";
import { daftarDivisi } from "@/lib/queries/divisi";
import { formatTanggal } from "@/lib/format";
import DataTable from "@/components/DataTable";
import FilterBar from "@/components/FilterBar";
import PageHeader from "@/components/PageHeader";
import GlowCard from "@/components/GlowCard";
import TautanDetail from "@/components/TautanDetail";
import { btnPrimary } from "@/components/ui";

export const metadata = { title: "Divisi | LeaveSync" };

export default async function DivisiPage({ searchParams }) {
  await requireRole(["admin"]);
  const sp = await searchParams;
  const [rows, semua] = await Promise.all([daftarDivisi(pool, sp), daftarDivisi(pool, {})]);
  const ketuaOpsi = [
    { value: "none", label: "Tanpa ketua" },
    ...semua.filter((d) => d.ketua_id).map((d) => ({ value: d.ketua_id, label: d.ketua_nama })),
  ];

  const totalAnggota = semua.reduce((n, d) => n + d.jumlah_anggota, 0);
  const tanpaKetua = semua.filter((d) => !d.ketua_id).length;
  const tanpaKaryawan = semua.filter((d) => d.jumlah_anggota - (d.ketua_id ? 1 : 0) <= 0).length;

  const fields = [
    { name: "q", label: "Nama divisi" },
    { name: "ketuaId", label: "Ketua divisi", type: "select", options: ketuaOpsi },
    { name: "urut", label: "Urutkan", type: "select", options: [
      { value: "nama_asc", label: "Nama A–Z" }, { value: "nama_desc", label: "Nama Z–A" },
      { value: "anggota", label: "Jumlah anggota" }, { value: "dibuat", label: "Terbaru dibuat" },
    ] },
  ];
  const kolom = [
    { label: "Divisi", render: (d) => <div><p className="font-medium">{d.nama}</p><p className="text-sm text-muted">{d.deskripsi}</p></div> },
    { label: "Ketua", render: (d) => d.ketua_nama ?? "-" },
    { label: "Anggota", key: "jumlah_anggota" },
    { label: "Maks. cuti bersamaan", render: (d) => `${d.batas_harian} orang per hari (${d.max_persen_cuti}%)` },
    { label: "Dibentuk", render: (d) => formatTanggal(String(d.created_at.toISOString?.() ?? d.created_at).slice(0, 10)) },
    { label: "Aksi", render: (d) => <TautanDetail href={`/admin/divisi/${d.id}`} /> },
  ];
  return (
    <div className="space-y-6">
      <PageHeader
        title="Divisi"
        description="Kelola struktur organisasi, ketua, anggota, dan batas cuti tim."
        action={<Link href="/admin/divisi/baru" className={btnPrimary}>Tambah divisi baru</Link>}
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <GlowCard label="Total divisi" value={semua.length} description="Divisi aktif di sistem" />
        <GlowCard label="Total anggota aktif" value={totalAnggota} description="Termasuk ketua divisi" />
        <GlowCard label="Tanpa ketua" value={tanpaKetua} description="Divisi belum punya ketua" tone={tanpaKetua > 0 ? "warn" : undefined} />
        <GlowCard label="Belum punya karyawan" value={tanpaKaryawan} description="Hanya berisi ketua, atau kosong" tone={tanpaKaryawan > 0 ? "warn" : undefined} />
      </div>
      <FilterBar fields={fields} values={sp} resetHref="/admin/divisi" />
      <DataTable kolom={kolom} rows={rows} kosong="Belum ada divisi." />
    </div>
  );
}
