import Link from "next/link";
import { requireRole } from "@/lib/guard";
import pool from "@/lib/db";
import { daftarJenis } from "@/lib/queries/jenis-cuti";
import { formatHari } from "@/lib/format";
import { labelBatasPengajuan, keteranganBatasPengajuan } from "@/lib/leave/aturan-jenis";
import DataTable from "@/components/DataTable";
import FormAction from "@/components/FormAction";
import FormJenis from "@/components/FormJenis";
import TombolKonfirmasi from "@/components/TombolKonfirmasi";
import PageHeader from "@/components/PageHeader";
import Section from "@/components/Section";
import TautanDetail from "@/components/TautanDetail";
import { btnDanger } from "@/components/ui";

export const metadata = { title: "Jenis Cuti | LeaveSync" };

export default async function JenisCutiPage({ searchParams }) {
  await requireRole(["admin"]);
  const sp = await searchParams;
  const rows = await daftarJenis(pool);
  const kolom = [
    { label: "Jenis", render: (j) => <div><p className="font-medium">{j.nama}</p><p className="text-xs text-muted">{j.isSystem ? "Bawaan sistem" : "Kustom"}{j.aktif ? "" : " · nonaktif"}</p></div> },
    {
      label: "Kuota/tahun",
      render: (j) =>
        j.kuotaHari == null
          ? "Tak terbatas"
          : `${formatHari(j.kuotaHari)} hari`,
    },
    {
      label: "Batas pengajuan",
      render: (j) => (
        <span title={keteranganBatasPengajuan(j.batasPengajuanHari)}>
          {labelBatasPengajuan(j.batasPengajuanHari)}
        </span>
      ),
    },
    { label: "Lampiran", render: (j) => (j.wajibLampiran ? "Wajib" : "Tidak") },
    { label: "Potong kuota", render: (j) => (j.potongKuota ? "Ya" : "Tidak") },
    { label: "Aksi", render: (j) => (
      <div className="flex items-center gap-4 pl-2">
        <TautanDetail href={`/admin/jenis-cuti/${j.id}`} label="Edit" />
        {!j.isSystem && (
          <TombolKonfirmasi
            action="/api/admin/jenis-cuti/hapus"
            fields={{ id: j.id }}
            label="Hapus"
            pesan={`Hapus jenis cuti ${j.nama}?`}
            className={`${btnDanger} ml-1`}
          />
        )}
      </div>
    ) },
  ];
  return (
    <div className="space-y-8">
      <PageHeader
        title="Jenis Cuti"
        description="Aturan kuota, batas pengajuan, dan lampiran disimpan di database."
      />
      {sp.error && <p role="alert" className="rounded-2xl border border-bad/30 bg-bad/10 px-4 py-3 text-sm text-bad">{sp.error}</p>}
      <DataTable kolom={kolom} rows={rows} />
      <Section title="Tambah jenis cuti" className="max-w-xl border-t border-line pt-6">
        <FormAction action="/api/admin/jenis-cuti" redirectTo="/admin/jenis-cuti" label="Tambah jenis"><FormJenis /></FormAction>
      </Section>
    </div>
  );
}
