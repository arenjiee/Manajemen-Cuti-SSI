import { notFound } from "next/navigation";
import { requireRole } from "@/lib/guard";
import pool from "@/lib/db";
import { parseId } from "@/lib/id";
import { tautanInternal } from "@/lib/tautan";
import { NAMA_ROLE, ROLE_DAPAT_DIPILIH } from "@/lib/nav";
import { ambilProfil, bolehUbahProfil } from "@/lib/queries/profil";
import { formatHari, formatTanggal } from "@/lib/format";
import FormAction from "@/components/FormAction";
import TombolKembali from "@/components/TombolKembali";
import AutoTextarea from "@/components/AutoTextarea";
import { inputCls, labelCls, selectCls } from "@/components/ui";
import PageHeader from "@/components/PageHeader";
import GlowCard from "@/components/GlowCard";
import Section from "@/components/Section";
import PresenceBadge from "@/components/PresenceBadge";
import FotoProfil from "./FotoProfil";

export const metadata = { title: "Profil | LeaveSync" };

const L = ({ t, children }) => <label className="block"><span className={labelCls}>{t}</span>{children}</label>;
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

  const asalValid = sp.from && tautanInternal(sp.from) ? sp.from : "/admin/users";
  const labelKembali = asalValid.includes("/admin/users/") ? "Kembali ke Edit Pengguna" : "Kembali ke Pengguna";

  return (
    <div className="max-w-3xl space-y-8">
      {!milikSendiri && <TombolKembali href={asalValid} label={labelKembali} />}
      <PageHeader
        title={milikSendiri ? "Profil Saya" : `Profil ${p.nama_lengkap}`}
        description={`${NAMA_ROLE[p.role]}${p.divisi_nama ? ` · Divisi ${p.divisi_nama}` : ""}${p.aktif ? "" : " · Akun nonaktif"}`}
      />

      {sp.ok && <p role="status" className="rounded-2xl border border-ok/30 bg-ok/10 px-4 py-3 text-sm text-ok">{sp.ok === "foto" ? "Foto profil diperbarui." : "Profil berhasil disimpan."}</p>}

      <FotoProfil userId={p.id} nama={p.nama_lengkap} fotoKey={p.foto_key} />

      {k && (
        <Section title={`Kuota cuti tahunan ${k.tahun}`}>
          <div className="grid gap-4 sm:grid-cols-3">
          <GlowCard label="Kuota tahunan" value={formatHari(k.kuotaAwal)} description="hari" />
          <GlowCard label="Terpakai" value={formatHari(k.terpakai)} description="Pengajuan yang masih aktif" />
          <GlowCard label="Sisa" value={formatHari(k.sisa)} tone={k.sisa <= 2 ? "warn" : undefined} description="Sisa kuota tahunan" />
        </div>
        </Section>
      )}

      <section className="rounded-2xl border border-line bg-surface p-6 space-y-5">
        <Section title="Data kepegawaian">
          <dl className="divide-y divide-line/70">
          <Baris t="Username">{p.username}</Baris>
          <Baris t="Role">{NAMA_ROLE[p.role]}</Baris>
          <Baris t="Divisi">{p.divisi_nama}</Baris>
          <Baris t="Ketua divisi">{p.ketua_nama}</Baris>
          <Baris t="Tanggal bergabung">{formatTanggal(p.tanggal_bergabung)}</Baris>
          <Baris t="Status akun">{p.aktif ? "Aktif" : "Nonaktif"}</Baris>
          <Baris t="Status kehadiran"><PresenceBadge aktif={p.aktif} sedangCuti={p.sedang_cuti} /></Baris>
        </dl>
      </Section>
      </section>

      <Section title="Ubah profil">
        <FormAction action="/api/profil" method="PUT" label="Simpan profil" className="space-y-4">
          <input type="hidden" name="id" value={p.id} />
          <L t="Nama lengkap"><input name="nama_lengkap" defaultValue={p.nama_lengkap} required className={inputCls} /></L>
          <L t="Username"><input name="username" defaultValue={p.username} required className={inputCls} /></L>
          <L t="Email"><input name="email" type="email" defaultValue={p.email} required className={inputCls} /></L>
          <L t="Nomor telepon">
            <input
              name="telepon"
              defaultValue={p.telepon ?? ""}
              inputMode="numeric"
              pattern="[0-9]{10,13}"
              maxLength={13}
              placeholder="08xxxxxxxxxx (10–13 digit)"
              className={inputCls}
            />
          </L>
          <L t="Alamat"><AutoTextarea name="alamat" rows={2} defaultValue={p.alamat ?? ""} className={inputCls} /></L>
          {admin && (
            <div className="rounded-2xl border border-line p-4 space-y-4">
              <p className="text-sm text-muted">Role hanya dapat diubah oleh Admin:</p>
              {p.role === "admin" ? (
                <div className="block">
                  <span className={labelCls}>Role</span>
                  <p className="text-sm text-ink">Admin (akun utama, role terkunci)</p>
                </div>
              ) : (
                <L t="Role">
                  <select name="role" defaultValue={p.role} className={selectCls}>
                    {ROLE_DAPAT_DIPILIH.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </L>
              )}
            </div>
          )}
        </FormAction>
      </Section>
    </div>
  );
}
