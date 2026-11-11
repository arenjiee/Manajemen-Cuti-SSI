import Link from "next/link";
import { requireRole } from "@/lib/guard";
import pool from "@/lib/db";
import { daftarJenis } from "@/lib/queries/jenis-cuti";
import { formatHari } from "@/lib/format";
import DataTable from "@/components/DataTable";
import FormAction from "@/components/FormAction";
import FormJenis from "@/components/FormJenis";
import TombolKonfirmasi from "@/components/TombolKonfirmasi";
import { btnDanger } from "@/components/ui";
import { buatJenisAction, hapusJenisAction } from "./actions";

export const metadata = { title: "Jenis Cuti | SMCK" };

export default async function JenisCutiPage({ searchParams }) {
  await requireRole(["admin"]);
  const sp = await searchParams;
  const rows = await daftarJenis(pool);
  const kolom = [
    { label: "Jenis", render: (j) => <><p className="font-medium">{j.nama}</p><p className="text-xs text-muted">{j.isSystem ? "Bawaan sistem" : "Kustom"}{j.aktif ? "" : " · nonaktif"}</p></> },
    { label: "Kuota/tahun", render: (j) => (j.kuotaHari == null ? "Tak terbatas" : `${formatHari(j.kuotaHari)} hari`) },
    { label: "Batas pengajuan", render: (j) => (j.batasPengajuanHari > 0 ? `H-${j.batasPengajuanHari}` : j.batasPengajuanHari === 0 ? "Tidak mundur" : `Mundur ${-j.batasPengajuanHari} hari`) },
    { label: "Lampiran", render: (j) => (j.wajibLampiran ? "Wajib" : "Tidak") },
    { label: "Potong kuota", render: (j) => (j.potongKuota ? "Ya" : "Tidak") },
    { label: "Aksi", render: (j) => (
      <div className="flex items-center gap-2">
        <Link href={`/admin/jenis-cuti/${j.id}`} className="text-sm text-accent hover:underline">Edit</Link>
        {!j.isSystem && <TombolKonfirmasi action={hapusJenisAction} fields={{ id: j.id }} label="Hapus" pesan={`Hapus jenis cuti ${j.nama}?`} className={btnDanger} />}
      </div>
    ) },
  ];
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-semibold">Jenis Cuti</h1>
        <p className="text-sm text-muted">Aturan kuota, batas pengajuan, dan lampiran disimpan di database, bukan di kode.</p>
      </header>
      {sp.error && <p role="alert" className="rounded-lg bg-bad/10 px-3 py-2 text-sm text-bad">{sp.error}</p>}
      <DataTable kolom={kolom} rows={rows} />
      <section className="max-w-xl space-y-4 border-t border-line pt-6">
        <h2 className="text-xl font-semibold">Tambah jenis cuti</h2>
        <FormAction action={buatJenisAction} label="Tambah jenis"><FormJenis /></FormAction>
      </section>
    </div>
  );
}
