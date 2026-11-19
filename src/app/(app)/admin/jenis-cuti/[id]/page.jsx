import { notFound } from "next/navigation";
import { requireRole } from "@/lib/guard";
import pool from "@/lib/db";
import { ambilJenis } from "@/lib/queries/jenis-cuti";
import FormAction from "@/components/FormAction";
import FormJenis from "@/components/FormJenis";
import TombolKembali from "@/components/TombolKembali";

export default async function EditJenisPage({ params }) {
  await requireRole(["admin"]);
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const j = await ambilJenis(pool, Number(id));
  if (!j) notFound();
  return (
    <div className="max-w-xl space-y-6">
      <TombolKembali href="/admin/jenis-cuti" label="Kembali ke Jenis Cuti" />
      <h1 className="text-3xl font-semibold">Edit {j.nama}</h1>
      <FormAction action={`/api/admin/jenis-cuti/${j.id}`} redirectTo="/admin/jenis-cuti" batalHref="/admin/jenis-cuti" label="Simpan perubahan">
        <FormJenis j={j} />
      </FormAction>
    </div>
  );
}
