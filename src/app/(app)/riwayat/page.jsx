import Link from "next/link";
import { requireRole } from "@/lib/guard";
import pool from "@/lib/db";
import { riwayat } from "@/lib/queries/riwayat";
import { STATUS } from "@/lib/queries/detail";
import { daftarJenis } from "@/lib/queries/jenis-cuti";
import { daftarDivisi } from "@/lib/queries/divisi";
import { formatRentang, formatHari, formatTanggal } from "@/lib/format";
import { labelStatus } from "@/components/StatusBadge";
import StatusBadge from "@/components/StatusBadge";
import DataTable from "@/components/DataTable";
import FilterBar from "@/components/FilterBar";
import PageHeader from "@/components/PageHeader";
import TautanDetail from "@/components/TautanDetail";

export const metadata = { title: "Riwayat | SMCK" };

const CAKUPAN = {
  karyawan: "Seluruh pengajuan cuti Anda.",
  ketua_divisi: "Seluruh pengajuan cuti di divisi Anda.",
  hrd: "Seluruh pengajuan cuti karyawan.",
  admin: "Seluruh pengajuan cuti karyawan.",
};

export default async function RiwayatPage({ searchParams }) {
  const user = await requireRole();
  const sp = await searchParams;
  const luas = user.role === "hrd" || user.role === "admin";
  const [rows, jenis, divisi] = await Promise.all([riwayat(pool, user, sp), daftarJenis(pool), luas ? daftarDivisi(pool, {}) : []]);

  const fields = [
    ...(user.role !== "karyawan" ? [{ name: "q", label: "Cari nama", placeholder: "Nama pengaju" }] : []),
    { name: "status", label: "Status", type: "select", options: STATUS.map((s) => ({ value: s, label: s === "Pending" ? "Menunggu persetujuan" : labelStatus(s, "leader") })) },
    { name: "jenisId", label: "Jenis cuti", type: "select", options: jenis.map((j) => ({ value: j.id, label: j.nama })) },
    ...(luas ? [{ name: "divisiId", label: "Divisi", type: "select", options: divisi.map((d) => ({ value: d.id, label: d.nama })) }] : []),
    { name: "tahun", label: "Tahun", type: "number", placeholder: "2026" },
    {
      name: "urut", label: "Urutkan", type: "select",
      options: [{ value: "terbaru", label: "Terbaru diajukan" }, { value: "mulai", label: "Tanggal mulai" }, ...(user.role !== "karyawan" ? [{ value: "pengaju", label: "Nama pengaju" }] : [])],
    },
  ];
  const kolom = [
    ...(user.role !== "karyawan" ? [{ label: "Pengaju", key: "pengaju_nama" }] : []),
    ...(luas ? [{ label: "Divisi", render: (r) => r.divisi_nama ?? "-" }] : []),
    { label: "Jenis", key: "jenis_nama" },
    { label: "Periode", render: (r) => formatRentang(r.tanggal_mulai, r.tanggal_selesai) },
    { label: "Hari", render: (r) => formatHari(r.total_hari) },
    { label: "Status", render: (r) => <StatusBadge status={r.status} tahap={r.tahap} /> },
    { label: "Diajukan", render: (r) => formatTanggal(r.tanggal_pengajuan) },
    { label: "Aksi", render: (r) => <TautanDetail href={`/cuti/${r.id}`} /> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Riwayat Cuti"
        description={`${CAKUPAN[user.role]} ${rows.length} pengajuan ditampilkan.`}
      />
      <FilterBar fields={fields} values={sp} resetHref="/riwayat" />
      <DataTable kolom={kolom} rows={rows} kosong="Tidak ada pengajuan yang cocok dengan filter." />
    </div>
  );
}
