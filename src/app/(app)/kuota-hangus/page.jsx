import { requireRole } from "@/lib/guard";
import pool from "@/lib/db";
import { NAMA_ROLE } from "@/lib/nav";
import { daftarKuotaHangus } from "@/lib/queries/kuota-hangus";
import { ambangValid, JEDA_PENGINGAT_HARI } from "@/lib/leave/kuota-hangus";
import { formatHari, formatTanggal, formatWaktu } from "@/lib/format";
import StatCard from "@/components/StatCard";
import DataTable from "@/components/DataTable";
import FilterBar from "@/components/FilterBar";
import { btnPrimary } from "@/components/ui";

export const metadata = { title: "Kuota Hangus | SMCK" };

const angka = (v) => (/^\d{1,4}$/.test(v ?? "") ? Number(v) : null);

export default async function KuotaHangusPage({ searchParams }) {
  await requireRole(["admin", "hrd"]);
  const sp = await searchParams;
  const ambang = ambangValid(sp.ambang);
  const d = await daftarKuotaHangus(pool, { ambang });
  const terkirim = angka(sp.terkirim), dilewati = angka(sp.dilewati);
  const pasti = d.rows.filter((r) => r.risiko === "pasti").length;

  const kolom = [
    { label: "", render: (r) => <input type="checkbox" name="ids" value={r.id} form="form-pengingat" defaultChecked aria-label={`Pilih ${r.nama}`} className="h-4 w-4" /> },
    { label: "Nama", render: (r) => <><p className="font-medium">{r.nama}</p><p className="text-xs text-muted">{NAMA_ROLE[r.role]} · {r.divisiNama ?? "Tanpa divisi"}</p></> },
    { label: "Kuota", render: (r) => `${formatHari(r.kuotaAwal)} hari` },
    { label: "Terpakai", render: (r) => `${formatHari(r.terpakai)} hari` },
    { label: "Sisa", render: (r) => <strong className={r.risiko === "pasti" ? "text-bad" : "text-warn"}>{formatHari(r.sisa)} hari</strong> },
    { label: "Risiko", render: (r) => (r.risiko === "pasti" ? "Tidak mungkin habis" : "Waspada") },
    { label: "Pengingat terakhir", render: (r) => (r.pengingatTerakhir ? formatWaktu(r.pengingatTerakhir) : "Belum pernah") },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Peringatan kuota hangus</h1>
          <p className="text-sm text-muted">Karyawan berhak Cuti Tahunan dengan sisa kuota besar. Kuota tidak dibawa ke tahun berikutnya.</p>
        </div>
        {d.rows.length > 0 && (
          <form id="form-pengingat" action="/api/kuota-hangus/pengingat" method="POST">
            <input type="hidden" name="ambang" value={d.ambang} />
            <button className={btnPrimary}>Kirim pengingat ke yang dipilih</button>
          </form>
        )}
      </header>

      {terkirim != null && (
        <p role="status" className="rounded-lg bg-ok/10 px-3 py-2 text-sm text-ok">
          {terkirim} pengingat terkirim{dilewati ? `, ${dilewati} dilewati (sudah diingatkan dalam ${JEDA_PENGINGAT_HARI} hari terakhir atau sudah tidak berisiko)` : ""}.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Karyawan berisiko" nilai={d.rows.length} catatan={`Sisa ≥ ${formatHari(d.ambang)} hari`} tone={d.rows.length > 0 ? "warn" : undefined} />
        <StatCard label="Tidak mungkin habis" nilai={pasti} catatan="Sisa melebihi hari kerja tersisa" tone={pasti > 0 ? "bad" : undefined} />
        <StatCard label="Hari kerja tersisa" nilai={d.hariKerjaTersisa} catatan={`Sampai 31 Des ${d.tahun} (dari ${formatTanggal(d.hari)})`} />
      </div>

      <FilterBar fields={[{ name: "ambang", label: "Ambang sisa (hari)", type: "number", placeholder: "6" }]} values={sp} resetHref="/kuota-hangus" />
      <DataTable kolom={kolom} rows={d.rows} kosong="Tidak ada karyawan dengan sisa kuota melebihi ambang." />
    </div>
  );
}
