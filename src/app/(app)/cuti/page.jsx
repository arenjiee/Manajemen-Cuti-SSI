import Link from "next/link";
import { requireRole } from "@/lib/guard";
import pool from "@/lib/db";
import { daftarCutiSaya, STATUS } from "@/lib/queries/detail";
import { terpakaiPotongKuota } from "@/lib/queries/pengajuan";
import { sisaKuota } from "@/lib/leave/kuota";
import { hariIni } from "@/lib/leave/tanggal";
import { formatRentang, formatHari, formatTanggal } from "@/lib/format";
import { labelStatus } from "@/components/StatusBadge";
import DataTable from "@/components/DataTable";
import FilterBar from "@/components/FilterBar";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";
import { btnPrimary } from "@/components/ui";

export const metadata = { title: "Cuti Saya | SMCK" };

export default async function CutiSayaPage({ searchParams }) {
  const user = await requireRole(["karyawan", "ketua_divisi"]);
  const sp = await searchParams;
  const tahun = Number(hariIni().slice(0, 4));
  const [rows, terpakai] = await Promise.all([daftarCutiSaya(pool, user.id, sp), terpakaiPotongKuota(pool, user.id, tahun)]);
  const sisa = sisaKuota(user.kuota_awal, terpakai);

  const fields = [
    { name: "status", label: "Status", type: "select", options: STATUS.map((s) => ({ value: s, label: labelStatus(s, "leader") })) },
    { name: "urut", label: "Urutkan", type: "select", options: [{ value: "terbaru", label: "Terbaru diajukan" }, { value: "mulai", label: "Tanggal mulai" }] },
  ];
  const kolom = [
    { label: "Jenis", key: "jenis_nama" },
    { label: "Periode", render: (r) => formatRentang(r.tanggal_mulai, r.tanggal_selesai) },
    { label: "Hari", render: (r) => formatHari(r.total_hari) },
    { label: "Status", render: (r) => <StatusBadge status={r.status} tahap={r.tahap} /> },
    { label: "Diajukan", render: (r) => formatTanggal(r.tanggal_pengajuan) },
    { label: "Aksi", render: (r) => <Link href={`/cuti/${r.id}`} className="text-sm text-accent hover:underline">Detail</Link> },
  ];
  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Cuti Saya</h1>
          <p className="text-sm text-muted">Daftar pengajuan cuti Anda beserta statusnya.</p>
        </div>
        <Link href="/cuti/ajukan" className={btnPrimary}>Ajukan cuti</Link>
      </header>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label={`Sisa kuota tahunan ${tahun}`} nilai={formatHari(sisa)} catatan={`dari ${formatHari(user.kuota_awal)} hari`} tone={sisa <= 2 ? "warn" : undefined} />
      </div>
      <FilterBar fields={fields} values={sp} resetHref="/cuti" />
      <DataTable kolom={kolom} rows={rows} kosong="Belum ada pengajuan cuti." />
    </div>
  );
}
