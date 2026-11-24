import Link from "next/link";
import { requireRole } from "@/lib/guard";
import pool from "@/lib/db";
import { notifikasiUser, jumlahBelumDibaca } from "@/lib/queries/riwayat";
import { tautanInternal } from "@/lib/tautan";
import { formatWaktu } from "@/lib/format";
import { btnGhost } from "@/components/ui";
import PageHeader from "@/components/PageHeader";

export const metadata = { title: "Notifikasi | LeaveSync" };

export default async function NotifikasiPage({ searchParams }) {
  const user = await requireRole();
  const sp = await searchParams;
  const hanyaBelum = sp.tampil === "belum";
  const [rows, belum] = await Promise.all([notifikasiUser(pool, user.id, { hanyaBelum }), jumlahBelumDibaca(pool, user.id)]);
  const tab = (aktif) => `rounded-xl px-3.5 py-2 text-sm font-medium transition ${aktif ? "bg-accent text-accent-ink" : "border border-line bg-surface text-muted hover:bg-ink/5 hover:text-ink"}`;

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        title="Notifikasi"
        description={belum > 0 ? `${belum} notifikasi belum dibaca.` : "Semua notifikasi sudah dibaca."}
        action={
          belum > 0 && (
            <form action="/api/notifikasi/baca-semua" method="POST">
              <button className={btnGhost}>Tandai semua dibaca</button>
            </form>
          )
        }
      />

      <nav className="flex gap-2" aria-label="Filter notifikasi">
        <Link href="/notifikasi" className={tab(!hanyaBelum)} aria-current={!hanyaBelum ? "page" : undefined}>Semua</Link>
        <Link href="/notifikasi?tampil=belum" className={tab(hanyaBelum)} aria-current={hanyaBelum ? "page" : undefined}>Belum dibaca</Link>
      </nav>

      {rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line bg-surface/40 p-10 text-center text-sm text-muted">{hanyaBelum ? "Tidak ada notifikasi yang belum dibaca." : "Belum ada notifikasi."}</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((n) => (
            <li key={n.id} className={`flex items-start gap-4 rounded-2xl border p-4 transition ${n.dibaca ? "border-line bg-surface hover:border-ink/20" : "border-accent/40 bg-accent/5"}`}>
              <div className="min-w-0 flex-1">
                <p className="text-sm">
                  {!n.dibaca && <span className="mr-2 rounded-full bg-accent px-2 py-0.5 text-xs text-accent-ink">Baru</span>}
                  {n.pesan}
                </p>
                <p className="mt-1 text-sm text-muted">{formatWaktu(n.created_at)}</p>
              </div>
              {(!n.dibaca || tautanInternal(n.link)) && (
                <form action={`/api/notifikasi/${n.id}/baca`} method="POST">
                  <button className="text-sm whitespace-nowrap text-accent hover:underline">{tautanInternal(n.link) ? "Buka" : "Tandai dibaca"}</button>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
