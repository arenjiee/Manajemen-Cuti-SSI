import Link from "next/link";
import { requireRole } from "@/lib/guard";
import pool from "@/lib/db";
import { NAMA_ROLE } from "@/lib/nav";
import { jumlahBelumDibaca } from "@/lib/queries/riwayat";
import { dashboardAdmin, dashboardKaryawan, dashboardKetua, dashboardHrd } from "@/lib/queries/dashboard";
import { formatHari, formatRentang, formatTanggal } from "@/lib/format";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";
import DataTable from "@/components/DataTable";
import { btnPrimary } from "@/components/ui";

export const metadata = { title: "Dashboard | SMCK" };

const Bagian = ({ judul, aksi, children }) => (
  <section className="space-y-3">
    <div className="flex items-end justify-between gap-4">
      <h2 className="text-xl font-semibold">{judul}</h2>
      {aksi}
    </div>
    {children}
  </section>
);

// Kartu yang bisa diklik menuju halaman terkait.
const KartuTaut = ({ href, ...props }) => (
  <Link href={href} className="block rounded-xl transition hover:-translate-y-0.5 hover:shadow-sm"><StatCard {...props} /></Link>
);

const kolomPeriode = { label: "Periode", render: (r) => formatRentang(r.tanggal_mulai, r.tanggal_selesai) };
const kolomHari = { label: "Hari", render: (r) => formatHari(r.total_hari) };
const kolomDetail = { label: "Aksi", render: (r) => <Link href={`/cuti/${r.id}`} className="text-sm text-accent hover:underline">Detail</Link> };

async function DashKaryawan({ user }) {
  const d = await dashboardKaryawan(pool, user.id);
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={`Sisa kuota tahunan ${d.tahun}`} nilai={formatHari(d.sisa)} catatan={`dari ${formatHari(d.kuotaAwal)} hari`} tone={d.sisa <= 2 ? "warn" : undefined} />
        <StatCard label="Kuota terpakai" nilai={formatHari(d.terpakai)} catatan="Pengajuan yang masih aktif" />
        <StatCard label="Menunggu proses" nilai={d.menunggu} catatan="Ketua Divisi atau HRD" tone={d.menunggu > 0 ? "warn" : undefined} />
        <StatCard label={`Disetujui ${d.tahun}`} nilai={d.perStatus.Approved} catatan="Pengajuan" tone="ok" />
      </div>
      <Bagian judul="Cuti mendatang" aksi={<Link href="/cuti/ajukan" className={btnPrimary}>Ajukan cuti</Link>}>
        <DataTable kolom={[{ label: "Jenis", key: "jenis_nama" }, kolomPeriode, kolomHari, kolomDetail]} rows={d.cutiMendatang} kosong="Belum ada cuti disetujui yang akan datang." />
      </Bagian>
      <Bagian judul="Pengajuan terbaru" aksi={<Link href="/cuti" className="text-sm text-accent hover:underline">Lihat semua</Link>}>
        <DataTable
          kolom={[{ label: "Jenis", key: "jenis_nama" }, kolomPeriode, kolomHari, { label: "Status", render: (r) => <StatusBadge status={r.status} tahap={r.tahap} /> }, kolomDetail]}
          rows={d.terbaru}
          kosong="Belum ada pengajuan cuti."
        />
      </Bagian>
    </>
  );
}

async function DashKetua({ user }) {
  const d = await dashboardKetua(pool, user.id);
  return (
    <>
      {!d.divisi && (
        <p role="note" className="rounded-xl border border-warn/40 bg-warn/10 p-4 text-sm">Anda belum memimpin divisi mana pun, sehingga belum ada antrean verifikasi. Hubungi Admin.</p>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KartuTaut href="/verifikasi" label="Menunggu verifikasi Anda" nilai={d.menungguVerifikasi} catatan={d.divisi ? `Divisi ${d.divisi.nama}` : undefined} tone={d.menungguVerifikasi > 0 ? "warn" : undefined} />
        <StatCard label="Anggota cuti minggu ini" nilai={d.anggotaCutiMingguIni.length} catatan={`${formatTanggal(d.minggu.dari)} – ${formatTanggal(d.minggu.sampai)}`} />
        <StatCard label="Anggota aktif divisi" nilai={d.divisi?.jumlah_anggota_aktif ?? 0} catatan="Termasuk Ketua Divisi" />
        <StatCard label={`Sisa kuota Anda ${d.tahun}`} nilai={formatHari(d.sisa)} catatan={`dari ${formatHari(d.kuotaAwal)} hari`} tone={d.sisa <= 2 ? "warn" : undefined} />
      </div>
      <Bagian judul="Anggota yang cuti minggu ini">
        <DataTable
          kolom={[{ label: "Nama", key: "nama_lengkap" }, { label: "Jenis", key: "jenis_nama" }, kolomPeriode, kolomHari, kolomDetail]}
          rows={d.anggotaCutiMingguIni}
          kosong="Tidak ada anggota yang cuti minggu ini."
        />
      </Bagian>
    </>
  );
}

async function DashHrd() {
  const d = await dashboardHrd(pool);
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KartuTaut href="/persetujuan" label="Menunggu persetujuan final" nilai={d.menungguFinal} catatan="Antrean HRD" tone={d.menungguFinal > 0 ? "warn" : undefined} />
        <StatCard label={`Karyawan cuti ${d.bulan.label}`} nilai={d.jumlahOrangCuti} catatan="Cuti berstatus Disetujui" />
        <StatCard label="Pengajuan cuti bulan ini" nilai={d.cutiBulanIni.length} catatan="Jumlah pengajuan, bukan orang" />
      </div>
      <Bagian judul={`Karyawan cuti pada ${d.bulan.label}`}>
        <DataTable
          kolom={[{ label: "Nama", key: "nama_lengkap" }, { label: "Divisi", render: (r) => r.divisi_nama ?? "-" }, { label: "Jenis", key: "jenis_nama" }, kolomPeriode, kolomHari, kolomDetail]}
          rows={d.cutiBulanIni}
          kosong="Tidak ada karyawan yang cuti bulan ini."
        />
      </Bagian>
    </>
  );
}

async function DashAdmin() {
  const d = await dashboardAdmin(pool);
  const r = d.perRole;
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KartuTaut href="/admin/users" label="Pengguna aktif" nilai={d.totalAktif} catatan={`Karyawan ${r.karyawan} · Ketua ${r.ketua_divisi} · HRD ${r.hrd} · Admin ${r.admin}${d.tidakAktif ? ` · ${d.tidakAktif} nonaktif` : ""}`} />
        <KartuTaut href="/admin/divisi" label="Divisi" nilai={d.totalDivisi} />
        <KartuTaut href="/admin/jenis-cuti" label="Jenis cuti aktif" nilai={d.jenisCutiAktif} />
        <KartuTaut href="/admin/hari-libur" label="Hari libur tahun ini" nilai={d.hariLiburTahunIni} />
      </div>
      <Bagian judul="Masa kerja kurang dari 1 tahun" aksi={<span className="text-xs text-muted">Belum berhak Cuti Tahunan</span>}>
        <DataTable
          kolom={[
            { label: "Nama", key: "nama_lengkap" },
            { label: "Role", render: (u) => NAMA_ROLE[u.role] },
            { label: "Divisi", render: (u) => u.divisi_nama ?? "-" },
            { label: "Bergabung", render: (u) => formatTanggal(u.tanggal_bergabung) },
            { label: "Berhak Cuti Tahunan mulai", render: (u) => formatTanggal(u.layakTahunan) },
          ]}
          rows={d.masaKerjaKurang1Tahun}
          kosong="Semua karyawan sudah bermasa kerja minimal 1 tahun."
        />
      </Bagian>
    </>
  );
}

export default async function DashboardPage() {
  const user = await requireRole();
  const belumDibaca = await jumlahBelumDibaca(pool, user.id);
  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm text-muted">{NAMA_ROLE[user.role]}</p>
        <h1 className="text-4xl font-semibold">Halo, {user.nama_lengkap}</h1>
      </header>
      {belumDibaca > 0 && (
        <p role="status" className="rounded-xl border border-accent/30 bg-accent/5 px-4 py-3 text-sm">
          Anda memiliki {belumDibaca} notifikasi yang belum dibaca. <Link href="/notifikasi" className="text-accent hover:underline">Lihat notifikasi</Link>
        </p>
      )}
      {user.role === "karyawan" && <DashKaryawan user={user} />}
      {user.role === "ketua_divisi" && <DashKetua user={user} />}
      {user.role === "hrd" && <DashHrd />}
      {user.role === "admin" && <DashAdmin />}
    </div>
  );
}
