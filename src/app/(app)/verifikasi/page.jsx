import { requireRole } from "@/lib/guard";
import pool from "@/lib/db";
import { antreanLeader } from "@/lib/queries/approval";
import KartuApproval from "@/components/KartuApproval";
import { putuskanLeaderAction } from "./actions";

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
        <p className="rounded-xl border border-dashed border-line p-10 text-center text-sm text-muted">Tidak ada pengajuan yang menunggu verifikasi.</p>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {antre.map((p) => <KartuApproval key={p.id} p={p} action={putuskanLeaderAction} />)}
        </div>
      )}
    </div>
  );
}
