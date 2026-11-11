import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/guard";
import pool from "@/lib/db";
import { ambilUser } from "@/lib/queries/users";
import { NAMA_ROLE } from "@/lib/nav";
import FormAction from "@/components/FormAction";
import { inputCls } from "@/components/ui";
import { ubahUserAction } from "../actions";

const L = ({ t, children }) => <label className="block text-sm">{t}<div className="mt-1">{children}</div></label>;

export default async function EditUserPage({ params }) {
  await requireRole(["admin"]);
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const u = await ambilUser(pool, Number(id));
  if (!u) notFound();
  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-3xl font-semibold">Edit pengguna</h1>
      <Link href={`/profil?id=${u.id}`} className="inline-block text-sm text-accent hover:underline">Lihat profil, foto, dan kuota →</Link>
      <FormAction action={ubahUserAction} label="Simpan perubahan">
        <input type="hidden" name="id" value={u.id} />
        <L t="Nama lengkap"><input name="nama_lengkap" defaultValue={u.nama_lengkap} required className={inputCls} /></L>
        <div className="grid gap-4 sm:grid-cols-2">
          <L t="Username"><input name="username" defaultValue={u.username} required className={inputCls} /></L>
          <L t="Email"><input name="email" type="email" defaultValue={u.email} required className={inputCls} /></L>
        </div>
        <L t="Role">
          <select name="role" defaultValue={u.role} className={inputCls}>
            {Object.entries(NAMA_ROLE).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </L>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="aktif" defaultChecked={u.aktif} /> Akun aktif</label>
      </FormAction>
    </div>
  );
}
