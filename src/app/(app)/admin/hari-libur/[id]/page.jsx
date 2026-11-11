import { notFound } from "next/navigation";
import { requireRole } from "@/lib/guard";
import pool from "@/lib/db";
import FormAction from "@/components/FormAction";
import FormLibur from "@/components/FormLibur";
import { ubahLiburAction } from "../actions";

export default async function EditLiburPage({ params }) {
  await requireRole(["admin"]);
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const h = (await pool.query("SELECT * FROM hari_libur WHERE id=$1", [Number(id)])).rows[0];
  if (!h) notFound();
  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-3xl font-semibold">Edit hari libur</h1>
      <FormAction action={ubahLiburAction} label="Simpan perubahan"><FormLibur h={h} /></FormAction>
    </div>
  );
}
