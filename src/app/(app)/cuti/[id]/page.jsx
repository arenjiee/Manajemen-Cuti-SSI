import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/guard";
import pool from "@/lib/db";
import { parseId } from "@/lib/id";
import { detailPengajuan } from "@/lib/queries/detail";
import { formatRentang, formatHari, formatTanggal, formatWaktu } from "@/lib/format";
import StatusBadge from "@/components/StatusBadge";
import Timeline from "@/components/Timeline";
import BatalkanCuti from "./BatalkanCuti";

export const metadata = { title: "Detail Cuti | SMCK" };

const Baris = ({ t, children }) => (
  <div className="flex justify-between gap-6 border-b border-line py-2 text-sm last:border-0"><dt className="text-muted">{t}</dt><dd className="text-right">{children || "-"}</dd></div>
);

export default async function DetailCutiPage({ params }) {
  const user = await requireRole();
  const { id } = await params;
  if (parseId(id) == null) notFound();
  const p = await detailPengajuan(pool, id, user);
  if (!p) notFound();

  const peran = (t) => (t === "leader" ? "Ketua Divisi" : "HRD");
  const items = [{ judul: `Diajukan oleh ${p.pengaju_nama}`, waktu: formatWaktu(p.created_at), tone: "info" }];
  for (const s of p.persetujuan) {
    items.push({
      judul: `${peran(s.tahap)} ${s.keputusan === "approve" ? "menyetujui" : "menolak"} · ${s.approver_nama}`,
      waktu: formatWaktu(s.created_at), catatan: s.catatan, tone: s.keputusan === "approve" ? "ok" : "bad",
    });
  }
  if (p.status === "Cancelled") items.push({ judul: "Dibatalkan oleh pengaju", catatan: p.alasan_batal, tone: "warn" });
  if (p.status === "Pending" || p.status === "Approved by Leader") items.push({ judul: `Menunggu ${peran(p.tahap)}`, tone: "warn" });

  const tolak = p.persetujuan.find((s) => s.keputusan === "reject");
  const milikSendiri = p.pengaju_id === user.id;

  return (
    <div className="max-w-3xl space-y-8">
      <Link href={milikSendiri ? "/cuti" : "/riwayat"} className="text-sm text-muted hover:underline">← Kembali</Link>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">{p.jenis_nama}</h1>
          <p className="mt-1 text-sm text-muted">{p.pengaju_nama}{p.divisi_nama ? ` · ${p.divisi_nama}` : ""}</p>
        </div>
        <StatusBadge status={p.status} tahap={p.tahap} />
      </header>

      {tolak?.catatan && p.status === "Rejected" && (
        <div role="note" className="rounded-xl border border-bad/30 bg-bad/5 p-4 text-sm">
          <p className="font-medium text-bad">Catatan penolakan ({peran(tolak.tahap)})</p>
          <p className="mt-1">{tolak.catatan}</p>
        </div>
      )}

      <section>
        <h2 className="mb-2 text-xl font-semibold">Rincian</h2>
        <dl className="rounded-xl border border-line bg-surface px-5 py-2">
          <Baris t="Periode">{formatRentang(p.tanggal_mulai, p.tanggal_selesai)}</Baris>
          <Baris t="Total hari kerja">{formatHari(p.total_hari)}{p.setengah_hari ? " (setengah hari)" : ""}</Baris>
          <Baris t="Tanggal pengajuan">{formatTanggal(p.tanggal_pengajuan)}</Baris>
          <Baris t="Alasan">{p.alasan}</Baris>
          <Baris t="Alamat selama cuti">{p.alamat_cuti}</Baris>
          <Baris t="Nomor darurat">{p.nomor_darurat}</Baris>
        </dl>
      </section>

      <section>
        <h2 className="mb-2 text-xl font-semibold">Serah terima (handover)</h2>
        <dl className="rounded-xl border border-line bg-surface px-5 py-2">
          <Baris t="Rekan pengganti">{p.handover_nama}</Baris>
          <Baris t="Catatan tugas">{p.catatan_tugas}</Baris>
        </dl>
      </section>

      {p.lampiran.length > 0 && (
        <section>
          <h2 className="mb-2 text-xl font-semibold">Lampiran</h2>
          <div className="space-y-3">
            {p.lampiran.map((l) => (
              <div key={l.id} className="rounded-xl border border-line bg-surface p-4 text-sm">
                <a href={`/api/lampiran/${l.id}`} target="_blank" rel="noreferrer" className="text-accent hover:underline">{l.nama_asli}</a>
                {l.mime.startsWith("image/") && <img src={`/api/lampiran/${l.id}`} alt={`Lampiran ${l.nama_asli}`} className="mt-3 max-h-72 rounded-lg border border-line" />}
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-xl font-semibold">Timeline persetujuan</h2>
        <Timeline items={items} />
      </section>

      {milikSendiri && p.status === "Pending" && <BatalkanCuti id={p.id} />}
    </div>
  );
}
