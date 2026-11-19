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
import MagicBento from "@/components/MagicBento";
import { CalendarPlus, CalendarRange, CheckCircle2, Clock3, FileText, ShieldCheck, Users, UsersRound } from "lucide-react";

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

const KartuTaut = ({ href, ...props }) => (
  <Link href={href} className="block rounded-xl transition hover:-translate-y-0.5 hover:shadow-sm"><StatCard {...props} /></Link>
);

const kolomPeriode = { label: "Periode", render: (r) => formatRentang(r.tanggal_mulai, r.tanggal_selesai) };

const ikonBento = "h-4 w-4";

const BentoDashboard = ({ user, data }) => {
  const peran = user.role;
  const items = peran === "karyawan"
    ? [
        { label: "Kuota cuti", icon: <CalendarRange className={ikonBento} />, title: `${formatHari(data.sisa)} tersisa`, description: `Dari ${formatHari(data.kuotaAwal)} kuota tahunan`, visual: "analytics", colSpan: 2, href: "/cuti" },
        { label: "Status pengajuan", icon: <Clock3 className={ikonBento} />, title: `${data.menunggu} menunggu`, description: "Sedang diproses Ketua Divisi atau HRD", visual: "automation", colSpan: 2, rowSpan: 2, href: "/cuti" },
        { label: "Aksi cepat", icon: <CalendarPlus className={ikonBento} />, title: "Ajukan cuti", description: "Buat pengajuan cuti baru", visual: "dashboard", href: "/cuti/ajukan" },
        { label: "Divisi", icon: <UsersRound className={ikonBento} />, title: data.divisi?.nama ?? "Belum ada divisi", description: data.divisi ? `Ketua: ${data.divisi.ketua_nama ?? "-"}` : "Hubungi Admin untuk penempatan", visual: "collaboration" },
        { label: "Disetujui", icon: <CheckCircle2 className={ikonBento} />, title: `${data.perStatus.Approved} pengajuan`, description: `Cuti disetujui pada ${data.tahun}`, visual: "security", href: "/cuti" }
      ]
    : peran === "ketua_divisi"
      ? [
          { label: "Perlu verifikasi", icon: <Clock3 className={ikonBento} />, title: `${data.menungguVerifikasi} pengajuan`, description: data.divisi ? `Antrean divisi ${data.divisi.nama}` : "Belum memimpin divisi", visual: "automation", colSpan: 2, rowSpan: 2, href: "/verifikasi" },
          { label: "Tim aktif", icon: <Users className={ikonBento} />, title: `${data.divisi?.jumlah_anggota_aktif ?? 0} anggota`, description: "Termasuk Ketua Divisi", visual: "collaboration", colSpan: 2 },
          { label: "Cuti minggu ini", icon: <CalendarRange className={ikonBento} />, title: `${data.anggotaCutiMingguIni.length} anggota`, description: "Jadwal anggota yang disetujui", visual: "dashboard" },
          { label: "Kuota Anda", icon: <CalendarPlus className={ikonBento} />, title: `${formatHari(data.sisa)} tersisa`, description: `Dari ${formatHari(data.kuotaAwal)} kuota tahunan`, visual: "analytics", href: "/cuti" },
          { label: "Pengajuan masuk", icon: <FileText className={ikonBento} />, title: `${data.totalMasuk} pengajuan`, description: `Dari anggota pada ${data.tahun}`, visual: "security", href: "/verifikasi" }
        ]
      : peran === "hrd"
        ? [
            { label: "Persetujuan final", icon: <ShieldCheck className={ikonBento} />, title: `${data.menungguFinal} menunggu`, description: "Pengajuan selesai diverifikasi Ketua Divisi", visual: "automation", colSpan: 2, rowSpan: 2, href: "/persetujuan" },
            { label: "Cuti bulan ini", icon: <CalendarRange className={ikonBento} />, title: `${data.jumlahOrangCuti} karyawan`, description: "Berkas berstatus Disetujui", visual: "dashboard", colSpan: 2 },
            { label: "Pengajuan baru", icon: <FileText className={ikonBento} />, title: `${data.pengajuanBulanIni} pengajuan`, description: `Masuk selama ${data.bulan.label}`, visual: "analytics", href: "/persetujuan" },
            { label: "Kapasitas tim", icon: <UsersRound className={ikonBento} />, title: "Pantau divisi", description: "Cegah cuti bersamaan melebihi batas", visual: "collaboration", href: "/kapasitas" },
            { label: "Tindak lanjut", icon: <CheckCircle2 className={ikonBento} />, title: "Proses antrean", description: "Selesaikan persetujuan final", visual: "security", href: "/persetujuan" }
          ]
        : [
            { label: "Pengguna aktif", icon: <Users className={ikonBento} />, title: `${data.totalAktif} pengguna`, description: `Karyawan ${data.perRole.karyawan} · HRD ${data.perRole.hrd}`, visual: "collaboration", colSpan: 2, href: "/admin/users" },
            { label: "Pengajuan menunggu", icon: <Clock3 className={ikonBento} />, title: `${data.pengajuanMenunggu} antrean`, description: "Menunggu Ketua Divisi atau HRD", visual: "automation", colSpan: 2, rowSpan: 2, href: "/riwayat" },
            { label: "Divisi", icon: <UsersRound className={ikonBento} />, title: `${data.totalDivisi} divisi`, description: "Struktur organisasi aktif", visual: "dashboard", href: "/admin/divisi" },
            { label: "Jenis cuti", icon: <CalendarRange className={ikonBento} />, title: `${data.jenisCutiAktif} aktif`, description: "Aturan cuti tersedia", visual: "analytics", href: "/admin/jenis-cuti" },
            { label: "Hari libur", icon: <CalendarPlus className={ikonBento} />, title: `${data.hariLiburTahunIni} hari`, description: `Kalender ${data.bulan.label}`, visual: "security", href: "/admin/hari-libur" }
          ];

  return <MagicBento columns={4} rowHeight={180} gap={12} radius={20} theme="dark" glowColor="224, 224, 224" enableBorderGlow enableSpotlight spotlightRadius={300} clickEffect items={items} />;
};
const kolomHari = { label: "Hari", render: (r) => formatHari(r.total_hari) };
const kolomDetail = { label: "Aksi", render: (r) => <Link href={`/cuti/${r.id}`} className="text-sm text-accent hover:underline">Detail</Link> };

async function DashKaryawan({ user }) {
  const d = await dashboardKaryawan(pool, user.id);
  return (
    <>
      <BentoDashboard user={user} data={d} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={`Sisa kuota tahunan ${d.tahun}`} nilai={formatHari(d.sisa)} catatan={`dari ${formatHari(d.kuotaAwal)} hari`} tone={d.sisa <= 2 ? "warn" : undefined} />
        <StatCard label="Kuota terpakai" nilai={formatHari(d.terpakai)} catatan="Pengajuan yang masih aktif" />
        <StatCard label="Menunggu proses" nilai={d.menunggu} catatan="Ketua Divisi atau HRD" tone={d.menunggu > 0 ? "warn" : undefined} />
        <StatCard label={`Disetujui ${d.tahun}`} nilai={d.perStatus.Approved} catatan="Pengajuan" tone="ok" />
        <StatCard label={`Total pengajuan ${d.tahun}`} nilai={d.totalPengajuan} catatan="Semua status" />
        <StatCard label={`Cuti sakit ${d.tahun}`} nilai={d.cutiSakitDiajukan} catatan="Pengajuan, tidak termasuk dibatalkan" />
        <StatCard label="Divisi" nilai={d.divisi?.nama ?? "-"} catatan={d.divisi ? `Ketua: ${d.divisi.ketua_nama ?? "-"}` : "Belum tergabung di divisi"} />
      </div>
      <Bagian judul="Cuti mendatang" aksi={<Link href="/cuti/ajukan" className={btnPrimary}>Ajukan cuti</Link>}>
        <DataTable kolom={[{ label: "Jenis", key: "jenis_nama" }, kolomPeriode, kolomHari, kolomDetail]} rows={d.cutiMendatang} kosong="Belum ada cuti disetujui yang akan datang." />
      </Bagian>
      <Bagian judul="Pengajuan terbaru" aksi={<Link href="/cuti" className="text-sm text-accent hover:underline">Lihat semua</Link>}>
        <DataTable
          kolom={[{ label: "Jenis", key: "jenis_nama" }, kolomPeriode, kolomHari, { label: "Status", render: (r) => <StatusBadge status={r.status} tahap={r.tahap} /> }, kolomDetail]}
          rows={d.terbaru}
          kosong={
            <div className="space-y-1 py-1">
              <p>Belum ada pengajuan cuti.</p>
              <Link href="/cuti/ajukan" className="inline-block text-xs text-accent hover:underline">Ajukan cuti pertama Anda →</Link>
            </div>
          }
        />
      </Bagian>
    </>
  );
}

async function DashKetua({ user }) {
  const d = await dashboardKetua(pool, user.id);
  return (
    <>
      <BentoDashboard user={user} data={d} />
      {!d.divisi && (
        <p role="note" className="rounded-xl border border-warn/40 bg-warn/10 p-4 text-sm">Anda belum memimpin divisi mana pun, sehingga belum ada antrean verifikasi. Hubungi Admin.</p>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KartuTaut href="/verifikasi" label="Menunggu verifikasi Anda" nilai={d.menungguVerifikasi} catatan={d.divisi ? `Divisi ${d.divisi.nama}` : undefined} tone={d.menungguVerifikasi > 0 ? "warn" : undefined} />
        <StatCard label="Anggota cuti minggu ini" nilai={d.anggotaCutiMingguIni.length} catatan={`${formatTanggal(d.minggu.dari)} – ${formatTanggal(d.minggu.sampai)}`} />
        <StatCard label={`Pengajuan masuk ${d.tahun}`} nilai={d.totalMasuk} catatan="Dari anggota divisi, semua status" />
        <StatCard label="Anggota aktif divisi" nilai={d.divisi?.jumlah_anggota_aktif ?? 0} catatan="Termasuk Ketua Divisi" />
        <StatCard label={`Sisa kuota Anda ${d.tahun}`} nilai={formatHari(d.sisa)} catatan={`dari ${formatHari(d.kuotaAwal)} hari`} tone={d.sisa <= 2 ? "warn" : undefined} />
      </div>
      <Bagian judul="Anggota divisi">
        <DataTable
          kolom={[{ label: "Nama", key: "nama_lengkap" }, { label: "Minggu ini", render: (a) => (a.cutiMingguIni ? <span className="text-warn">Sedang cuti</span> : <span className="text-muted">Hadir</span>) }]}
          rows={d.anggota}
          kosong="Divisi belum memiliki anggota lain."
        />
      </Bagian>
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
      <BentoDashboard user={{ role: "hrd" }} data={d} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KartuTaut href="/persetujuan" label="Menunggu persetujuan final" nilai={d.menungguFinal} catatan="Antrean HRD" tone={d.menungguFinal > 0 ? "warn" : undefined} />
        <StatCard label={`Karyawan cuti ${d.bulan.label}`} nilai={d.jumlahOrangCuti} catatan="Cuti berstatus Disetujui" />
        <StatCard label="Pengajuan cuti bulan ini" nilai={d.pengajuanBulanIni} catatan="Diajukan pada bulan ini, semua status" />
      </div>
      <Bagian judul={`Karyawan cuti pada ${d.bulan.label}`}>
        <DataTable
          kolom={[{ label: "Nama", key: "nama_lengkap" }, { label: "Divisi", render: (r) => r.divisi_nama ?? "-" }, { label: "Jenis", key: "jenis_nama" }, kolomPeriode, kolomHari, kolomDetail]}
          rows={d.cutiBulanIni}
          kosong="Tidak ada karyawan yang cuti bulan ini."
        />
      </Bagian>
      <Bagian judul="Daftar divisi" aksi={<Link href="/kapasitas" className="text-sm text-accent hover:underline">Kapasitas tim</Link>}>
        <DataTable
          kolom={[
            { label: "Divisi", key: "nama" },
            { label: "Ketua", render: (v) => v.ketua_nama ?? "-" },
            { label: "Anggota aktif", key: "jumlah_anggota" },
            { label: "Batas cuti bersamaan", render: (v) => `${v.max_persen_cuti}% · ${v.batas_harian} orang/hari` },
            { label: `Cuti ${d.bulan.label}`, render: (v) => `${v.cutiBulanIni} orang` },
          ]}
          rows={d.divisi}
          kosong="Belum ada divisi."
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
      <BentoDashboard user={{ role: "admin" }} data={d} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KartuTaut href="/admin/users" label="Pengguna aktif" nilai={d.totalAktif} catatan={`Karyawan ${r.karyawan} · Ketua ${r.ketua_divisi} · HRD ${r.hrd} · Admin ${r.admin}${d.tidakAktif ? ` · ${d.tidakAktif} nonaktif` : ""}`} />
        <KartuTaut href="/admin/divisi" label="Divisi" nilai={d.totalDivisi} />
        <KartuTaut href="/admin/jenis-cuti" label="Jenis cuti aktif" nilai={d.jenisCutiAktif} />
        <KartuTaut href="/admin/hari-libur" label="Hari libur tahun ini" nilai={d.hariLiburTahunIni} />
        <StatCard label={`Pengajuan cuti ${d.bulan.label}`} nilai={d.pengajuanBulanIni} catatan="Diajukan pada bulan ini, semua status" />
        <KartuTaut href="/riwayat" label="Menunggu persetujuan" nilai={d.pengajuanMenunggu} catatan="Menunggu Ketua Divisi atau HRD" tone={d.pengajuanMenunggu > 0 ? "warn" : undefined} />
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
