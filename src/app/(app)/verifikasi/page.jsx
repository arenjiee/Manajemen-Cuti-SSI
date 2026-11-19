import Link from "next/link";
import { requireRole } from "@/lib/guard";
import pool from "@/lib/db";
import { antreanLeader } from "@/lib/queries/approval";
import KartuApproval from "@/components/KartuApproval";

export const metadata = { title: "Verifikasi Cuti | SMCK" };

export default async function VerifikasiPage() {
  const user = await requireRole(["ketua_divisi"]);
  const antre = await antreanLeader(pool, user);
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold">Verifikasi pengajuan</h1>
        <p className="text-sm text-muted">Pengajuan cuti dari anggota divisi Anda yang menunggu persetujuan pertama.</p>
      </header>
      {antre.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line p-10 text-center space-y-3">
          <p className="text-sm text-muted">Tidak ada pengajuan yang menunggu verifikasi.</p>
          <div className="flex justify-center gap-3">
            <Link href="/dashboard" className="text-sm text-accent hover:underline">Ke Dashboard</Link>
            <span className="text-muted">·</span>
            <Link href="/riwayat" className="text-sm text-accent hover:underline">Lihat Riwayat</Link>
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
