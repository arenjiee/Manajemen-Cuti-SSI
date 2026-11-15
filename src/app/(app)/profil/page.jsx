import { notFound } from "next/navigation";
import { requireRole } from "@/lib/guard";
import pool from "@/lib/db";
import { parseId } from "@/lib/id";
import { NAMA_ROLE } from "@/lib/nav";
import { ambilProfil, bolehUbahProfil } from "@/lib/queries/profil";
import { formatHari, formatTanggal } from "@/lib/format";
import StatCard from "@/components/StatCard";
import FormAction from "@/components/FormAction";
import { inputCls } from "@/components/ui";
import FotoProfil from "./FotoProfil";
import { ubahProfilAction, hapusFotoAction } from "./actions";

export const metadata = { title: "Profil | SMCK" };

const L = ({ t, children }) => <label className="block text-sm">{t}<div className="mt-1">{children}</div></label>;
const Baris = ({ t, children }) => (
  <div className="flex justify-between gap-6 border-b border-line py-2 text-sm last:border-0"><dt className="text-muted">{t}</dt><dd className="text-right">{children || "-"}</dd></div>
);

export default async function ProfilPage({ searchParams }) {
  const user = await requireRole();
  const sp = await searchParams;
  // Tanpa ?id= → profil sendiri. ?id= hanya berlaku untuk Admin; selain itu 404 (bukan 403) agar keberadaan user tidak bocor.
  const targetId = sp.id === undefined ? user.id : parseId(sp.id);
  if (targetId == null || !bolehUbahProfil(user, targetId)) notFound();
  const p = await ambilProfil(pool, targetId);
  if (!p) notFound();

  const admin = user.role === "admin";
  const milikSendiri = p.id === user.id;
  const k = p.kuota;

  return (
    <div className="max-w-3xl space-y-8">
      <header>
        <h1 className="text-3xl font-semibold">{milikSendiri ? "Profil saya" : `Profil ${p.nama_lengkap}`}</h1>
        <p className="text-sm text-muted">{NAMA_ROLE[p.role]}{p.divisi_nama ? ` · Divisi ${p.divisi_nama}` : ""}{p.aktif ? "" : " · Akun nonaktif"}</p>
      </header>

      {sp.ok && <p role="status" className="rounded-lg bg-ok/10 px-3 py-2 text-sm text-ok">{sp.ok === "foto" ? "Foto profil diperbarui." : "Profil berhasil disimpan."}</p>}

      <FotoProfil userId={p.id} nama={p.nama_lengkap} fotoKey={p.foto_key} hapusAction={hapusFotoAction} />

      {k && (
        <section>
          <h2 className="mb-3 text-xl font-semibold">Kuota cuti tahunan {k.tahun}</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Kuota tahunan" nilai={formatHari(k.kuotaAwal)} catatan="hari" />
            <StatCard label="Terpakai" nilai={formatHari(k.terpakai)} catatan="Pengajuan yang masih aktif" />
            <StatCard label="Sisa" nilai={formatHari(k.sisa)} tone={k.sisa <= 2 ? "warn" : undefined} />
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-2 text-xl font-semibold">Data kepegawaian</h2>
        <dl className="rounded-xl border border-line bg-surface px-5 py-2">
          <Baris t="Username">{p.username}</Baris>
          <Baris t="Role">{NAMA_ROLE[p.role]}</Baris>
          <Baris t="Divisi">{p.divisi_nama}</Baris>
          {p.divisi_nama && p.role !== "ketua_divisi" && <Baris t="Ketua Divisi">{p.ketua_nama}</Baris>}
          <Baris t="Tanggal bergabung">{formatTanggal(p.tanggal_bergabung)}</Baris>
        </dl>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-semibold">Ubah data diri</h2>
        <FormAction action={ubahProfilAction} label="Simpan perubahan">
          <input type="hidden" name="id" value={p.id} />
          <L t="Nama lengkap"><input name="nama_lengkap" defaultValue={p.nama_lengkap} required maxLength={100} className={inputCls} /></L>
          <L t="Email"><input name="email" type="email" defaultValue={p.email} required maxLength={100} className={inputCls} /></L>
          <L t="Telepon"><input name="telepon" type="tel" defaultValue={p.telepon ?? ""} maxLength={30} className={inputCls} /></L>
          <L t="Alamat"><textarea name="alamat" rows={3} defaultValue={p.alamat ?? ""} maxLength={500} className={inputCls} /></L>
          {admin && (
            <div className="space-y-4 rounded-xl border border-line p-4">
              <p className="text-xs tracking-wide text-muted uppercase">Khusus Admin</p>
              <L t="Username"><input name="username" defaultValue={p.username} required maxLength={50} className={inputCls} /></L>
              {milikSendiri ? (
                <p className="text-sm text-muted">Role akun Anda sendiri tidak dapat diubah.</p>
              ) : (
                <L t="Role">
                  <select name="role" defaultValue={p.role} className={inputCls}>
                    {Object.entries(NAMA_ROLE).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </L>
              )}
            </div>
          )}
        </FormAction>
      </section>
    </div>
  );
}
