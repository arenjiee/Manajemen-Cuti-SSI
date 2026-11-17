import { requireRole } from "@/lib/guard";
import pool from "@/lib/db";
import { notifikasiUser, jumlahBelumDibaca } from "@/lib/queries/riwayat";
import { tautanInternal } from "@/lib/tautan";
import { formatWaktu } from "@/lib/format";
import { btnGhost } from "@/components/ui";

export const metadata = { title: "Notifikasi | SMCK" };

export default async function NotifikasiPage({ searchParams }) {
  const user = await requireRole();
  const sp = await searchParams;
  const hanyaBelum = sp.tampil === "belum";
  const [rows, belum] = await Promise.all([notifikasiUser(pool, user.id, { hanyaBelum }), jumlahBelumDibaca(pool, user.id)]);
  const tab = (aktif) => `rounded-lg px-3 py-1.5 text-sm ${aktif ? "bg-accent text-accent-ink" : "border border-line hover:bg-ink/5"}`;

  return (
    <div className="max-w-3xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Notifikasi</h1>
          <p className="text-sm text-muted">{belum > 0 ? `${belum} belum dibaca.` : "Semua notifikasi sudah dibaca."}</p>
        </div>
        {belum > 0 && (
          <form action="/api/notifikasi/baca-semua" method="POST">
            <button className={btnGhost}>Tandai semua dibaca</button>
          </form>
        )}
      </header>

      <nav className="flex gap-2" aria-label="Filter notifikasi">
        <a href="/notifikasi" className={tab(!hanyaBelum)} aria-current={!hanyaBelum ? "page" : undefined}>Semua</a>
        <a href="/notifikasi?tampil=belum" className={tab(hanyaBelum)} aria-current={hanyaBelum ? "page" : undefined}>Belum dibaca</a>
      </nav>

      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line p-8 text-center text-sm text-muted">{hanyaBelum ? "Tidak ada notifikasi yang belum dibaca." : "Belum ada notifikasi."}</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((n) => (
            <li key={n.id} className={`flex items-start gap-4 rounded-xl border p-4 ${n.dibaca ? "border-line bg-surface" : "border-accent/40 bg-accent/5"}`}>
              <div className="min-w-0 flex-1">
                <p className="text-sm">
                  {!n.dibaca && <span className="mr-2 rounded-full bg-accent px-2 py-0.5 text-xs text-accent-ink">Baru</span>}
                  {n.pesan}
                </p>
                <p className="mt-1 text-xs text-muted">{formatWaktu(n.created_at)}</p>
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
