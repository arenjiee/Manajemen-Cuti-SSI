import { notFound } from "next/navigation";
import { requireRole } from "@/lib/guard";
import pool from "@/lib/db";
import { ambilJenis } from "@/lib/queries/jenis-cuti";
import FormAction from "@/components/FormAction";
import FormJenis from "@/components/FormJenis";
import { ubahJenisAction } from "../actions";

export default async function EditJenisPage({ params }) {
  await requireRole(["admin"]);
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const j = await ambilJenis(pool, Number(id));
  if (!j) notFound();
  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-3xl font-semibold">Edit {j.nama}</h1>
      <FormAction action={ubahJenisAction} label="Simpan perubahan"><FormJenis j={j} /></FormAction>
    </div>
  );
}
