import { requireRole } from "@/lib/guard";
import { NAMA_ROLE } from "@/lib/nav";
import FormAction from "@/components/FormAction";
import TombolKembali from "@/components/TombolKembali";
import { inputCls } from "@/components/ui";

export const metadata = { title: "Tambah Pengguna | SMCK" };

const L = ({ t, children }) => <label className="block text-sm">{t}<div className="mt-1">{children}</div></label>;

export default async function BaruUserPage() {
  await requireRole(["admin"]);
  return (
    <div className="max-w-xl space-y-6">
      <TombolKembali href="/admin/users" label="Kembali ke Pengguna" />
      <h1 className="text-3xl font-semibold">Tambah pengguna</h1>
      <FormAction action="/api/admin/users" redirectTo="/admin/users" batalHref="/admin/users" label="Buat pengguna">
        <L t="Nama lengkap"><input name="nama_lengkap" required className={inputCls} /></L>
        <div className="grid gap-4 sm:grid-cols-2">
          <L t="Username"><input name="username" required className={inputCls} /></L>
          <L t="Email"><input name="email" type="email" required className={inputCls} /></L>
        </div>
        <L t="Password"><input name="password" type="password" required minLength={6} className={inputCls} /></L>
        <div className="grid gap-4 sm:grid-cols-2">
          <L t="Role">
            <select name="role" required defaultValue="karyawan" className={inputCls}>
              {Object.entries(NAMA_ROLE).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </L>
          <L t="Tanggal bergabung"><input name="tanggal_bergabung" type="date" required className={inputCls} /></L>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <L t="Kuota cuti awal (hari)"><input name="kuota_awal" type="number" step="0.5" min="0" defaultValue="12" className={inputCls} /></L>
          <L t="Telepon"><input name="telepon" className={inputCls} /></L>
        </div>
      </FormAction>
    </div>
  );
}
