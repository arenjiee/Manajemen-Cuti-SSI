import { requireRole } from "@/lib/guard";
import pool from "@/lib/db";
import { calonKetua } from "@/lib/queries/divisi";
import FormAction from "@/components/FormAction";
import { inputCls } from "@/components/ui";
import { buatDivisiAction } from "../actions";

export default async function BaruDivisiPage() {
  await requireRole(["admin"]);
  const calon = await calonKetua(pool);
  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-3xl font-semibold">Tambah divisi</h1>
      <FormAction action={buatDivisiAction} label="Buat divisi">
        <label className="block text-sm">Nama divisi<input name="nama" required className={`${inputCls} mt-1`} /></label>
        <label className="block text-sm">Deskripsi (opsional)<textarea name="deskripsi" rows={3} className={`${inputCls} mt-1`} /></label>
        <label className="block text-sm">Ketua divisi
          <select name="ketuaId" required className={`${inputCls} mt-1`} defaultValue="">
            <option value="" disabled>Pilih ketua</option>
            {calon.map((k) => <option key={k.id} value={k.id}>{k.nama_lengkap}</option>)}
          </select>
        </label>
        {calon.length === 0 && <p className="text-sm text-warn">Belum ada Ketua Divisi yang tersedia. Buat pengguna dengan role Ketua Divisi terlebih dahulu.</p>}
        <p className="text-xs text-muted">Tanggal dibentuk diisi otomatis.</p>
      </FormAction>
    </div>
  );
}
