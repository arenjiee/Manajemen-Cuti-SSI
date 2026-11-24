import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/guard";
import pool from "@/lib/db";
import { ambilUser } from "@/lib/queries/users";
import { kuotaTahunan } from "@/lib/queries/jenis-cuti";
import { ROLE_DAPAT_DIPILIH } from "@/lib/nav";
import { formatHari } from "@/lib/format";
import FormAction from "@/components/FormAction";
import TombolKembali from "@/components/TombolKembali";
import Panah from "@/components/Panah";
import PageHeader from "@/components/PageHeader";
import { inputCls, labelCls, selectCls } from "@/components/ui";

const L = ({ t, children }) => <label className="block"><span className={labelCls}>{t}</span>{children}</label>;

export default async function EditUserPage({ params }) {
  await requireRole(["admin"]);
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const u = await ambilUser(pool, Number(id));
  if (!u) notFound();
  const kuotaGlobal = await kuotaTahunan(pool);
  return (
    <div className="max-w-xl space-y-6">
      <TombolKembali href="/admin/users" label="Kembali ke Pengguna" />
      <PageHeader
        title="Edit Pengguna"
        description={`Perbarui identitas, akses, dan status akun ${u.nama_lengkap}.`}
      />
      <Link href={`/profil?id=${u.id}&from=${encodeURIComponent(`/admin/users/${u.id}`)}`} className="inline-flex items-center gap-1 text-sm font-medium text-accent transition hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
        Lihat profil, foto, dan kuota <Panah arah="kanan" />
      </Link>
      <FormAction action={`/api/admin/users/${u.id}`} method="PUT" redirectTo="/admin/users" batalHref="/admin/users" label="Simpan perubahan" className="space-y-4 rounded-2xl border border-line bg-surface p-6">
        <input type="hidden" name="id" value={u.id} />
        <L t="Nama lengkap"><input name="nama_lengkap" defaultValue={u.nama_lengkap} required className={inputCls} /></L>
        <div className="grid gap-4 sm:grid-cols-2">
          <L t="Username"><input name="username" defaultValue={u.username} required className={inputCls} /></L>
          <L t="Email"><input name="email" type="email" defaultValue={u.email} required className={inputCls} /></L>
        </div>
        {u.role === "admin" ? (
          <div className="block">
            <span className={labelCls}>Role</span>
            <p className="text-sm text-ink">Admin (akun utama, role terkunci)</p>
            <input type="hidden" name="role" value="admin" />
          </div>
        ) : (
          <L t="Role">
            <select name="role" defaultValue={u.role} className={selectCls}>
              {ROLE_DAPAT_DIPILIH.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </L>
        )}
        <div className="block">
          <span className={labelCls}>Kuota cuti tahunan</span>
          <p className="mt-1 text-sm font-medium text-ink">
            {formatHari(kuotaGlobal)} hari{" "}
            <span className="text-sm text-muted">(mengikuti jenis Cuti Tahunan)</span>
          </p>
        </div>
        {u.role === "admin" ? (
          <label className="flex items-center gap-2 text-sm text-muted">
            <input type="checkbox" defaultChecked disabled /> Akun aktif (akun Admin selalu aktif)
            <input type="hidden" name="aktif" value="on" />
          </label>
        ) : (
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="aktif" defaultChecked={u.aktif} /> Akun aktif</label>
        )}
      </FormAction>
    </div>
  );
}
