import { requireRole } from "@/lib/guard";
import pool from "@/lib/db";
import { calonKetua, NAMA_DIVISI_MAKS, DESKRIPSI_DIVISI_MAKS } from "@/lib/queries/divisi";
import FormAction from "@/components/FormAction";
import TombolKembali from "@/components/TombolKembali";
import AutoTextarea from "@/components/AutoTextarea";
import PageHeader from "@/components/PageHeader";
import { inputCls, labelCls, selectCls } from "@/components/ui";

export default async function BaruDivisiPage() {
  await requireRole(["admin"]);
  const calon = await calonKetua(pool);
  return (
    <div className="max-w-xl space-y-6">
      <TombolKembali href="/admin/divisi" label="Kembali ke Divisi" />
      <PageHeader
        title="Tambah Divisi"
        description="Buat unit organisasi dan tetapkan ketua divisi."
      />
      <FormAction action="/api/admin/divisi" redirectTo="/admin/divisi" batalHref="/admin/divisi" label="Buat divisi" className="space-y-4 rounded-2xl border border-line bg-surface p-6">
        <label className="block"><span className={labelCls}>Nama divisi</span><input name="nama" required maxLength={NAMA_DIVISI_MAKS} className={inputCls} /></label>
        <label className="block"><span className={labelCls}>Deskripsi (opsional)</span><AutoTextarea name="deskripsi" rows={2} maxLength={DESKRIPSI_DIVISI_MAKS} className={inputCls} /></label>
        <label className="block"><span className={labelCls}>Ketua divisi</span>
          <select name="ketuaId" required className={selectCls} defaultValue="">
            <option value="" disabled>Pilih ketua</option>
            {calon.map((k) => <option key={k.id} value={k.id}>{k.nama_lengkap}</option>)}
          </select>
        </label>
        {calon.length === 0 && <p className="text-sm text-warn">Belum ada Ketua Divisi yang tersedia. Buat pengguna dengan role Ketua Divisi terlebih dahulu.</p>}
        <p className="text-sm text-muted">Tanggal dibentuk diisi otomatis.</p>
      </FormAction>
    </div>
  );
}
