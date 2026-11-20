import Link from "next/link";
import { requireRole } from "@/lib/guard";
import pool from "@/lib/db";
import { daftarDivisi } from "@/lib/queries/divisi";
import { formatTanggal } from "@/lib/format";
import DataTable from "@/components/DataTable";
import FilterBar from "@/components/FilterBar";
import PageHeader from "@/components/PageHeader";
import TautanDetail from "@/components/TautanDetail";
import { btnPrimary } from "@/components/ui";

export const metadata = { title: "Divisi | SMCK" };

export default async function DivisiPage({ searchParams }) {
  await requireRole(["admin"]);
  const sp = await searchParams;
  const [rows, semua] = await Promise.all([daftarDivisi(pool, sp), daftarDivisi(pool, {})]);
  const ketuaOpsi = semua.filter((d) => d.ketua_id).map((d) => ({ value: d.ketua_id, label: d.ketua_nama }));

  const fields = [
    { name: "q", label: "Nama divisi" },
    { name: "ketuaId", label: "Ketua divisi", type: "select", options: ketuaOpsi },
    { name: "minAnggota", label: "Anggota min.", type: "number" },
    { name: "maxAnggota", label: "Anggota maks.", type: "number" },
    { name: "urut", label: "Urutkan", type: "select", options: [
      { value: "nama_asc", label: "Nama A–Z" }, { value: "nama_desc", label: "Nama Z–A" },
      { value: "anggota", label: "Jumlah anggota" }, { value: "dibuat", label: "Terbaru dibuat" },
    ] },
  ];
  const kolom = [
    { label: "Divisi", render: (d) => <><p className="font-medium">{d.nama}</p><p className="text-xs text-muted">{d.deskripsi}</p></> },
    { label: "Ketua", render: (d) => d.ketua_nama ?? "-" },
    { label: "Anggota", key: "jumlah_anggota" },
    { label: "Batas cuti", render: (d) => `${d.max_persen_cuti}% · ${d.batas_harian} orang/hari` },
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
      <FilterBar fields={fields} values={sp} resetHref="/admin/divisi" />
      <DataTable kolom={kolom} rows={rows} kosong="Belum ada divisi." />
    </div>
  );
}
