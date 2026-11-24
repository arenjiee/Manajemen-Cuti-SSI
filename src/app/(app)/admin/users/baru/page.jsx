import { requireRole } from "@/lib/guard";
import pool from "@/lib/db";
import { ROLE_DAPAT_DIPILIH } from "@/lib/nav";
import { kuotaTahunan } from "@/lib/queries/jenis-cuti";
import { formatHari } from "@/lib/format";
import FormAction from "@/components/FormAction";
import TombolKembali from "@/components/TombolKembali";
import PageHeader from "@/components/PageHeader";
import { inputCls, labelCls, selectCls } from "@/components/ui";

export const metadata = { title: "Tambah Pengguna | LeaveSync" };

const L = ({ t, children }) => <label className="block"><span className={labelCls}>{t}</span>{children}</label>;

export default async function BaruUserPage() {
  await requireRole(["admin"]);
  const kuotaGlobal = await kuotaTahunan(pool);
  return (
    <div className="max-w-xl space-y-6">
      <TombolKembali href="/admin/users" label="Kembali ke Pengguna" />
      <PageHeader
        title="Tambah Pengguna"
        description="Buat akun baru dan atur akses awalnya."
      />
      <FormAction action="/api/admin/users" redirectTo="/admin/users" batalHref="/admin/users" label="Buat pengguna" className="space-y-4 rounded-2xl border border-line bg-surface p-6">
        <L t="Nama lengkap"><input name="nama_lengkap" required className={inputCls} /></L>
        <div className="grid gap-4 sm:grid-cols-2">
          <L t="Username"><input name="username" required className={inputCls} /></L>
          <L t="Email"><input name="email" type="email" required className={inputCls} /></L>
        </div>
        <L t="Password"><input name="password" type="password" required minLength={6} className={inputCls} /></L>
        <div className="grid gap-4 sm:grid-cols-2">
          <L t="Role">
            <select name="role" required defaultValue="karyawan" className={selectCls}>
              {ROLE_DAPAT_DIPILIH.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </L>
          <L t="Tanggal bergabung"><input name="tanggal_bergabung" type="date" required className={inputCls} /></L>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="block">
            <span className={labelCls}>Kuota cuti awal</span>
            <p className="mt-1 text-sm font-medium text-ink">
              {formatHari(kuotaGlobal)} hari{" "}
              <span className="text-xs text-muted">(mengikuti jenis Cuti Tahunan)</span>
            </p>
          </div>
          <L t="Telepon">
            <input
              name="telepon"
              inputMode="numeric"
              pattern="[0-9]{10,13}"
              maxLength={13}
              placeholder="08xxxxxxxxxx (10–13 digit)"
              className={inputCls}
            />
          </L>
        </div>
      </FormAction>
    </div>
  );
}
