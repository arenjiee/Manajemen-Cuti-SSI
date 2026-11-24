import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/guard";
import pool from "@/lib/db";
import { parseId } from "@/lib/id";
import { tautanInternal } from "@/lib/tautan";
import { detailPengajuan } from "@/lib/queries/detail";
import { bolehUnduhSurat } from "@/lib/surat-akses";
import { formatRentang, formatHari, formatTanggal, formatWaktu } from "@/lib/format";
import StatusBadge from "@/components/StatusBadge";
import Timeline from "@/components/Timeline";
import Section from "@/components/Section";
import TombolKembali from "@/components/TombolKembali";
import PageHeader from "@/components/PageHeader";
import BatalkanCuti from "./BatalkanCuti";
import PreviewLampiran from "./PreviewLampiran";
import { btnPrimary } from "@/components/ui";

export const metadata = { title: "Detail Cuti | LeaveSync" };

const Baris = ({ t, children }) => (
  <div className="flex justify-between gap-6 border-b border-line py-2 text-sm last:border-0"><dt className="text-muted">{t}</dt><dd className="text-right">{children || "-"}</dd></div>
);

export default async function DetailCutiPage({ params, searchParams }) {
  const user = await requireRole();
  const [{ id }, sp] = await Promise.all([params, searchParams]);
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

  const asalValid = sp?.from && tautanInternal(sp.from) ? sp.from : null;
  const hrefKembali = asalValid ?? (milikSendiri ? "/cuti" : "/riwayat");
  let labelKembali = milikSendiri ? "Kembali ke Cuti Saya" : "Kembali ke Riwayat";
  if (asalValid) {
    if (asalValid.startsWith("/verifikasi")) labelKembali = "Kembali ke Verifikasi";
    else if (asalValid.startsWith("/persetujuan")) labelKembali = "Kembali ke Persetujuan";
    else if (asalValid.startsWith("/cuti")) labelKembali = "Kembali ke Cuti Saya";
    else if (asalValid.startsWith("/riwayat")) labelKembali = "Kembali ke Riwayat";
    else if (asalValid.startsWith("/dashboard")) labelKembali = "Kembali ke Dashboard";
    else labelKembali = "Kembali";
  }

  return (
    <div className="max-w-4xl space-y-8">
      <TombolKembali href={hrefKembali} label={labelKembali} />
      <PageHeader
        eyebrow="Detail Pengajuan Cuti"
        title={p.jenis_nama}
        description={`${p.pengaju_nama}${p.divisi_nama ? ` · ${p.divisi_nama}` : ""}`}
        action={
          <div className="flex flex-col items-end gap-3">
            <StatusBadge status={p.status} tahap={p.tahap} />
            {bolehUnduhSurat(user, p) && (
              <a href={`/api/surat/${p.id}`} className={btnPrimary}>
                Unduh surat cuti (PDF)
              </a>
            )}
          </div>
        }
      />

      {tolak?.catatan && p.status === "Rejected" && (
        <div role="note" className="rounded-2xl border border-bad/30 bg-bad/10 p-5 text-sm">
          <p className="font-semibold text-bad">Catatan penolakan ({peran(tolak.tahap)})</p>
          <p className="mt-1 text-bad/90">{tolak.catatan}</p>
        </div>
      )}

      <Section title="Rincian">
        <dl className="rounded-2xl border border-line bg-surface px-5 py-2">
          <Baris t="Periode">{formatRentang(p.tanggal_mulai, p.tanggal_selesai)}</Baris>
          <Baris t="Total hari kerja">
            {formatHari(p.total_hari)}
            {p.setengah_hari ? (p.jam_mulai && p.jam_selesai ? ` (setengah hari: ${p.jam_mulai.slice(0, 5)} – ${p.jam_selesai.slice(0, 5)})` : " (setengah hari)") : ""}
          </Baris>
          <Baris t="Tanggal pengajuan">{formatTanggal(p.tanggal_pengajuan)}</Baris>
          <Baris t="Alasan">{p.alasan}</Baris>
          <Baris t="Alamat selama cuti">{p.alamat_cuti}</Baris>
          <Baris t="Nomor darurat">{p.nomor_darurat}</Baris>
        </dl>
      </Section>

      <Section title="Serah terima (handover)">
        <dl className="rounded-2xl border border-line bg-surface px-5 py-2">
          <Baris t="Rekan pengganti">{p.handover_nama}</Baris>
          <Baris t="Catatan tugas">{p.catatan_tugas}</Baris>
        </dl>
      </Section>

      {p.lampiran.length > 0 && (
        <Section title="Lampiran">
          <div className="space-y-3">
            {p.lampiran.map((l) => (
              <PreviewLampiran key={l.id} id={l.id} nama={l.nama_asli} mime={l.mime} ukuran={l.ukuran} />
            ))}
          </div>
        </Section>
      )}

      <Section title="Timeline persetujuan">
        <Timeline items={items} />
      </Section>

      {milikSendiri && p.status === "Pending" && <BatalkanCuti id={p.id} />}
    </div>
  );
}
