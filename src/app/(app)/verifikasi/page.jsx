import Link from "next/link";
import { requireRole } from "@/lib/guard";
import pool from "@/lib/db";
import { antreanLeader } from "@/lib/queries/approval";
import KartuApproval from "@/components/KartuApproval";
import PageHeader from "@/components/PageHeader";

export const metadata = { title: "Verifikasi Cuti | LeaveSync" };

export default async function VerifikasiPage() {
  const user = await requireRole(["ketua_divisi"]);
  const antre = await antreanLeader(pool, user);
  return (
    <div className="space-y-6">
      <PageHeader
        title="Verifikasi Pengajuan"
        description="Pengajuan cuti dari anggota divisi Anda yang menunggu verifikasi pertama."
      />
      {antre.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-surface/40 p-12 text-center">
          <p className="text-sm text-muted">Tidak ada pengajuan yang menunggu verifikasi saat ini.</p>
          <div className="mt-3 flex items-center justify-center gap-3 text-sm">
            <Link href="/dashboard" className="text-accent hover:underline">Ke Dashboard</Link>
            <span className="text-muted">·</span>
            <Link href="/riwayat" className="text-accent hover:underline">Lihat Riwayat</Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {antre.map((p) => <KartuApproval key={p.id} p={p} action="/api/verifikasi" fromHref="/verifikasi" />)}
        </div>
      )}
    </div>
  );
}
