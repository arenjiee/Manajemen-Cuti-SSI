import Link from "next/link";
import { requireRole } from "@/lib/guard";
import pool from "@/lib/db";
import { daftarDivisi } from "@/lib/queries/divisi";
import { formatTanggal } from "@/lib/format";
import DataTable from "@/components/DataTable";
import FilterBar from "@/components/FilterBar";
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
    { label: "Batas cuti", render: (d) => `${d.max_persen_cuti}%` },
    { label: "Dibentuk", render: (d) => formatTanggal(String(d.created_at.toISOString?.() ?? d.created_at).slice(0, 10)) },
    { label: "Aksi", render: (d) => <Link href={`/admin/divisi/${d.id}`} className="text-sm text-accent hover:underline">Detail</Link> },
  ];
  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Divisi</h1>
          <p className="text-sm text-muted">Struktur divisi, ketua, dan jumlah anggota.</p>
        </div>
        <Link href="/admin/divisi/baru" className={btnPrimary}>Tambah divisi</Link>
      </header>
      <FilterBar fields={fields} values={sp} resetHref="/admin/divisi" />
      <DataTable kolom={kolom} rows={rows} kosong="Belum ada divisi." />
    </div>
  );
}
