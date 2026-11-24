import { notFound } from "next/navigation";
import { requireRole } from "@/lib/guard";
import pool from "@/lib/db";
import FormAction from "@/components/FormAction";
import FormLibur from "@/components/FormLibur";
import TombolKembali from "@/components/TombolKembali";
import PageHeader from "@/components/PageHeader";

export default async function EditLiburPage({ params }) {
  await requireRole(["admin"]);
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const h = (await pool.query("SELECT * FROM hari_libur WHERE id=$1", [Number(id)])).rows[0];
  if (!h) notFound();
  return (
    <div className="max-w-xl space-y-6">
      <TombolKembali href="/admin/hari-libur" label="Kembali ke Hari Libur" />
      <PageHeader
        title="Edit Hari Libur"
        description="Tanggal ini dikecualikan dari perhitungan hari cuti."
      />
      <FormAction action={`/api/admin/hari-libur/${h.id}`} method="PUT" redirectTo="/admin/hari-libur" batalHref="/admin/hari-libur" label="Simpan perubahan" className="space-y-4 rounded-2xl border border-line bg-surface p-6">
        <FormLibur h={h} />
      </FormAction>
    </div>
  );
}
