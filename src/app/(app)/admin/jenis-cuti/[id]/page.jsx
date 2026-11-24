import { notFound } from "next/navigation";
import { requireRole } from "@/lib/guard";
import pool from "@/lib/db";
import { ambilJenis } from "@/lib/queries/jenis-cuti";
import FormAction from "@/components/FormAction";
import FormJenis from "@/components/FormJenis";
import TombolKembali from "@/components/TombolKembali";
import PageHeader from "@/components/PageHeader";

export default async function EditJenisPage({ params }) {
  await requireRole(["admin"]);
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const j = await ambilJenis(pool, Number(id));
  if (!j) notFound();
  return (
    <div className="max-w-xl space-y-6">
      <TombolKembali href="/admin/jenis-cuti" label="Kembali ke Jenis Cuti" />
      <PageHeader
        title={`Edit ${j.nama}`}
        description="Atur kuota, periode pengajuan, dan ketentuan dokumen."
      />
      <FormAction action={`/api/admin/jenis-cuti/${j.id}`} method="PUT" redirectTo="/admin/jenis-cuti" batalHref="/admin/jenis-cuti" label="Simpan perubahan" className="space-y-4 rounded-2xl border border-line bg-surface p-6">
        <FormJenis j={j} />
      </FormAction>
    </div>
  );
}
