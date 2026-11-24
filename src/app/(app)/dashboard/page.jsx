import Link from "next/link";
import { requireRole } from "@/lib/guard";
import pool from "@/lib/db";
import { NAMA_ROLE } from "@/lib/nav";
import { dashboardAdmin, dashboardKaryawan, dashboardKetua, dashboardHrd } from "@/lib/queries/dashboard";
import { formatHari, formatRentang, formatTanggal } from "@/lib/format";
import StatusBadge from "@/components/StatusBadge";
import DataTable from "@/components/DataTable";
import GlowCard from "@/components/GlowCard";
import Panah from "@/components/Panah";
import Section from "@/components/Section";
import KapasitasChart from "@/components/KapasitasChart";
import { btnGhost, btnPrimary, linkCls } from "@/components/ui";
import {
  CalendarDays,
  CalendarPlus,
  CalendarRange,
  CheckCircle2,
  Clock3,
  FileCheck2,
  FileText,
  Gauge,
  Hourglass,
  Plus,
  ShieldAlert,
  ShieldCheck,
  UserPlus,
  Users,
  UsersRound,
  UserX,
} from "lucide-react";

export const metadata = { title: "Dashboard | LeaveSync" };

const ikon = (Ikon) => <Ikon className="h-4 w-4" aria-hidden />;

const Bagian = ({ judul, deskripsi, aksi, children }) => (
  <Section title={judul} description={deskripsi} action={aksi}>
    {children}
  </Section>
);

// Rincian angka-di-atas-label untuk kartu ringkasan (pengganti teks dipisah titik tengah).
const RincianAngka = ({ items }) => (
  <dl className="mt-1 grid grid-cols-4 gap-2">
    {items.map(([label, n]) => (
      <div key={label}>
        <dd className="font-display text-lg font-semibold text-ink tabular-nums">{n}</dd>
        <dt className="text-xs text-muted">{label}</dt>
      </div>
    ))}
  </dl>
);

const kolomPeriode = { label: "Periode", render: (r) => formatRentang(r.tanggal_mulai, r.tanggal_selesai) };
const kolomHari = { label: "Hari", render: (r) => formatHari(r.total_hari) };
const TautanAksi = ({ href, children, className = "" }) => (
  <Link href={href} className={`${linkCls} text-xs ${className}`}>
    <span>{children}</span>
    <Panah arah="kanan" />
  </Link>
);

const kolomDetail = {
  label: "Aksi",
  render: (r) => <TautanAksi href={`/cuti/${r.id}`}>Detail</TautanAksi>,
};

async function DashKaryawan({ user }) {
  const d = await dashboardKaryawan(pool, user.id);
  if (!d) return null;

  return (
    <div className="space-y-8">
      {/* Grid Kartu Spotlight */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <GlowCard
          icon={ikon(CalendarRange)}
          label="Sisa Kuota Cuti"
          value={`${formatHari(d.sisa)} hari`}
          description={`Dari total ${formatHari(d.kuotaAwal)} kuota tahunan ${d.tahun}`}
          badge={d.sisa <= 2 ? "Menipis" : "Tersedia"}
          tone={d.sisa <= 2 ? "warn" : "accent"}
          colSpan={2}
          href="/cuti"
        />
        <GlowCard
          icon={ikon(Clock3)}
          label="Menunggu Proses"
          value={d.menunggu}
          description="Antrean Ketua Divisi atau HRD"
          tone={d.menunggu > 0 ? "warn" : "default"}
          href="/cuti"
        />
        <GlowCard
          icon={ikon(CheckCircle2)}
          label={`Disetujui ${d.tahun}`}
          value={d.perStatus.Approved}
          description="Pengajuan cuti yang telah aktif"
          tone="ok"
          href="/cuti"
        />
        <GlowCard
          icon={ikon(FileText)}
          label="Total Terpakai"
          value={`${formatHari(d.terpakai)} hari`}
          description={`Cuti sakit: ${d.cutiSakitDiajukan} pengajuan`}
          tone="default"
        />
        <GlowCard
          icon={ikon(UsersRound)}
          label="Divisi Kerja"
          value={d.divisi?.nama ?? "Belum ada"}
          description={d.divisi ? `Ketua: ${d.divisi.ketua_nama ?? "-"}` : "Hubungi Admin untuk penempatan"}
          tone="default"
        />
        <GlowCard
          icon={ikon(CalendarPlus)}
          label="Aksi Cepat"
          value="Ajukan Cuti"
          description="Kirim formulir cuti tahunan atau sakit"
          tone="accent"
          colSpan={2}
          href="/cuti/ajukan"
        />
      </div>

      {/* Tabel Cuti Mendatang */}
      <Bagian
        judul="Cuti Mendatang"
        deskripsi="Daftar cuti disetujui yang dijadwalkan dalam waktu dekat"
      >
        <DataTable
          kolom={[{ label: "Jenis", key: "jenis_nama" }, kolomPeriode, kolomHari, kolomDetail]}
          rows={d.cutiMendatang}
          kosong="Belum ada jadwal cuti disetujui yang akan datang."
        />
      </Bagian>

      {/* Tabel Pengajuan Terbaru */}
      <Bagian
        judul="Pengajuan Terbaru"
        deskripsi="Pantau status dan tahapan verifikasi pengajuan terakhir Anda"
        aksi={
          <TautanAksi href="/cuti">Lihat semua cuti saya</TautanAksi>
        }
      >
        <DataTable
          kolom={[
            { label: "Jenis", key: "jenis_nama" },
            kolomPeriode,
            kolomHari,
            { label: "Status", render: (r) => <StatusBadge status={r.status} tahap={r.tahap} /> },
            kolomDetail,
          ]}
          rows={d.terbaru}
          kosong={
            <div className="space-y-1.5 py-2">
              <p className="text-sm text-muted">Belum ada pengajuan cuti yang pernah dibuat.</p>
              <TautanAksi href="/cuti/ajukan">Ajukan cuti pertama Anda</TautanAksi>
            </div>
          }
        />
      </Bagian>
    </div>
  );
}

async function DashKetua({ user }) {
  const d = await dashboardKetua(pool, user.id);
  if (!d) return null;

  return (
    <div className="space-y-8">
      {!d.divisi && (
        <div role="note" className="flex items-center gap-3 rounded-2xl border border-warn/40 bg-warn/10 p-4 text-sm text-warn">
          <ShieldAlert className="h-5 w-5 shrink-0" aria-hidden />
          <p>Anda belum memimpin divisi mana pun, sehingga belum ada antrean verifikasi bawahan. Silakan hubungi Admin sistem.</p>
        </div>
      )}

      {/* Grid Kartu Spotlight */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <GlowCard
          icon={ikon(Clock3)}
          label="Perlu Verifikasi"
          value={d.menungguVerifikasi}
          description={d.divisi ? `Antrean verifikasi divisi ${d.divisi.nama}` : "Belum ada divisi"}
          badge={d.menungguVerifikasi > 0 ? "Tindakan Diperlukan" : "Kosong"}
          tone={d.menungguVerifikasi > 0 ? "warn" : "default"}
          colSpan={2}
          href="/verifikasi"
        />
        <GlowCard
          icon={ikon(CalendarRange)}
          label="Cuti Minggu Ini"
          value={`${d.anggotaCutiMingguIni.length} orang`}
          description={`${formatTanggal(d.minggu.dari)} – ${formatTanggal(d.minggu.sampai)}`}
          tone="default"
        />
        <GlowCard
          icon={ikon(Users)}
          label="Anggota Divisi"
          value={`${d.divisi?.jumlah_anggota_aktif ?? 0} aktif`}
          description="Total anggota aktif termasuk Ketua"
          tone="accent"
        />
        <GlowCard
          icon={ikon(FileCheck2)}
          label={`Masuk ${d.tahun}`}
          value={d.totalMasuk}
          description="Total pengajuan bawahan di tahun ini"
          tone="default"
          href="/verifikasi"
        />
        <GlowCard
          icon={ikon(CalendarPlus)}
          label="Sisa Kuota Anda"
          value={`${formatHari(d.sisa)} hari`}
          description={`Dari ${formatHari(d.kuotaAwal)} hari kuota pribadi`}
          tone={d.sisa <= 2 ? "warn" : "default"}
          href="/cuti"
        />
        <GlowCard
          icon={ikon(CalendarPlus)}
          label="Aksi Pribadi"
          value="Ajukan Cuti Saya"
          description="Pengajuan Anda langsung diverifikasi oleh HRD"
          tone="accent"
          colSpan={2}
          href="/cuti/ajukan"
        />
      </div>

      {/* Tabel Anggota Divisi */}
      <Bagian
        judul="Anggota Divisi & Kehadiran"
        deskripsi={`Status anggota di divisi ${d.divisi?.nama ?? "-"}`}
      >
        <DataTable
          kolom={[
            { label: "Nama Lengkap", key: "nama_lengkap" },
            {
              label: "Status Minggu Ini",
              render: (a) =>
                a.cutiMingguIni ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-warn/15 px-2.5 py-0.5 text-xs font-medium text-warn">
                    <span className="h-1.5 w-1.5 rounded-full bg-warn" aria-hidden />
                    Sedang Cuti
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-ok/15 px-2.5 py-0.5 text-xs font-medium text-ok">
                    <span className="h-1.5 w-1.5 rounded-full bg-ok" aria-hidden />
                    Hadir
                  </span>
                ),
            },
          ]}
          rows={d.anggota}
          kosong="Divisi belum memiliki anggota staf lain."
        />
      </Bagian>

      {/* Tabel Anggota Cuti Minggu Ini */}
      <Bagian
        judul="Jadwal Cuti Anggota Minggu Ini"
        deskripsi="Detail izin atau cuti anggota yang sedang atau akan berlangsung minggu ini"
      >
        <DataTable
          kolom={[{ label: "Nama Anggota", key: "nama_lengkap" }, { label: "Jenis", key: "jenis_nama" }, kolomPeriode, kolomHari, kolomDetail]}
          rows={d.anggotaCutiMingguIni}
          kosong="Tidak ada anggota divisi yang cuti pada minggu ini."
        />
      </Bagian>
    </div>
  );
}

async function DashHrd() {
  const d = await dashboardHrd(pool);

  return (
    <div className="space-y-8">
      {/* Grid Kartu Spotlight */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <GlowCard
          icon={ikon(ShieldCheck)}
          label="Persetujuan Final"
          value={d.menungguFinal}
          description="Pengajuan siap disetujui final oleh HRD"
          badge={d.menungguFinal > 0 ? "Perlu Diproses" : "Selesai"}
          tone={d.menungguFinal > 0 ? "warn" : "ok"}
          colSpan={2}
          href="/persetujuan"
        />
        <GlowCard
          icon={ikon(CalendarRange)}
          label={`Cuti ${d.bulan.label}`}
          value={`${d.jumlahOrangCuti} orang`}
          description="Karyawan cuti disetujui bulan ini"
          tone="default"
        />
        <GlowCard
          icon={ikon(FileText)}
          label="Pengajuan Masuk"
          value={d.pengajuanBulanIni}
          description={`Semua jenis berkas pada ${d.bulan.label}`}
          tone="accent"
        />
        <GlowCard
          icon={ikon(Gauge)}
          label="Kapasitas Tim"
          value="Aturan Kuota"
          description="Pantau batas harian % cuti per divisi"
          tone="default"
          href="/kapasitas"
        />
        <GlowCard
          icon={ikon(CheckCircle2)}
          label="Persetujuan"
          value="Buka Antrean"
          description="Periksa dan setujui berkas pengajuan final"
          tone="accent"
          colSpan={3}
          href="/persetujuan"
        />
      </div>

      {/* Chart Kapasitas Divisi */}
      <Bagian
        judul={`Kapasitas Divisi, ${d.bulan.label}`}
        deskripsi="Divisi yang paling mendekati batas cuti bersamaan"
        aksi={<TautanAksi href="/kapasitas">Lihat kalender</TautanAksi>}
      >
        <KapasitasChart data={d.kapasitas} />
      </Bagian>

      {/* Tabel Karyawan Cuti Bulan Ini */}
      <Bagian
        judul={`Karyawan Cuti pada ${d.bulan.label}`}
        deskripsi="Daftar seluruh staf dengan pengajuan disetujui yang aktif di bulan berjalan"
        aksi={
          <TautanAksi href="/persetujuan">Kelola persetujuan</TautanAksi>
        }
      >
        <DataTable
          kolom={[
            { label: "Nama Karyawan", key: "nama_lengkap" },
            { label: "Divisi", render: (r) => r.divisi_nama ?? "-" },
            { label: "Jenis Cuti", key: "jenis_nama" },
            kolomPeriode,
            kolomHari,
            kolomDetail,
          ]}
          rows={d.cutiBulanIni}
          kosong="Tidak ada karyawan yang cuti pada bulan ini."
        />
      </Bagian>

      {/* Tabel Kapasitas Divisi */}
      <Bagian
        judul="Kapasitas Cuti per Divisi"
        deskripsi="Ringkasan batas cuti bersamaan dan okupansi saat ini"
        aksi={
          <TautanAksi href="/kapasitas">Ubah persentase kapasitas tim</TautanAksi>
        }
      >
        <DataTable
          kolom={[
            { label: "Divisi", key: "nama" },
            { label: "Ketua", render: (v) => v.ketua_nama ?? "-" },
            { label: "Anggota Aktif", key: "jumlah_anggota" },
            {
              label: "Batas Bersamaan",
              render: (v) => `${v.max_persen_cuti}% (${v.batas_harian} orang/hari)`,
            },
            { label: `Cuti ${d.bulan.label}`, render: (v) => `${v.cutiBulanIni} orang` },
          ]}
          rows={d.divisi}
          kosong="Belum ada divisi terdaftar."
        />
      </Bagian>
    </div>
  );
}

async function DashAdmin() {
  const d = await dashboardAdmin(pool);
  const r = d.perRole;

  return (
    <div className="space-y-8">
      {/* Grid Kartu Spotlight */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <GlowCard
          icon={ikon(Users)}
          label="Pengguna Aktif"
          value={d.totalAktif}
          description={<RincianAngka items={[["Karyawan", r.karyawan], ["Ketua", r.ketua_divisi], ["HRD", r.hrd], ["Admin", r.admin]]} />}
          badge={d.tidakAktif > 0 ? `${d.tidakAktif} Nonaktif` : "Semua Aktif"}
          tone="accent"
          colSpan={2}
          href="/admin/users"
        />
        <GlowCard
          icon={ikon(Clock3)}
          label="Menunggu Proses"
          value={d.pengajuanMenunggu}
          description="Antrean Ketua Divisi atau HRD"
          tone={d.pengajuanMenunggu > 0 ? "warn" : "default"}
          href="/riwayat"
        />
        <GlowCard
          icon={ikon(FileText)}
          label="Pengajuan Bulan Ini"
          value={d.pengajuanBulanIni}
          description={`Semua pengajuan cuti pada ${d.bulan.label}`}
          tone="default"
          href="/riwayat"
        />
        <GlowCard
          icon={ikon(UsersRound)}
          label="Total Divisi"
          value={`${d.totalDivisi} divisi`}
          description="Struktur divisi aktif di sistem"
          tone="default"
          href="/admin/divisi"
        />
        <GlowCard
          icon={ikon(UserX)}
          label="Belum Punya Divisi"
          value={d.tanpaDivisi.total}
          description={d.tanpaDivisi.total === 0 ? "Semua sudah ditempatkan" : [d.tanpaDivisi.karyawan > 0 && `${d.tanpaDivisi.karyawan} karyawan`, d.tanpaDivisi.ketua > 0 && `${d.tanpaDivisi.ketua} ketua divisi`].filter(Boolean).join(", ")}
          badge={d.tanpaDivisi.total > 0 ? "Perlu Penempatan" : "Lengkap"}
          tone={d.tanpaDivisi.total > 0 ? "warn" : "ok"}
          href="/admin/users"
        />
        <GlowCard
          icon={ikon(CalendarRange)}
          label="Jenis Cuti"
          value={`${d.jenisCutiAktif} jenis`}
          description="Aturan cuti yang dapat diajukan"
          tone="default"
          href="/admin/jenis-cuti"
        />
        <GlowCard
          icon={ikon(CalendarDays)}
          label="Hari Libur"
          value={`${d.hariLiburTahunIni} hari`}
          description={`Kalender hari libur tahun ${d.bulan.label.slice(-4)}`}
          tone="default"
          href="/admin/hari-libur"
        />
        <GlowCard
          icon={ikon(Hourglass)}
          label="Kuota Hangus"
          value="Pengingat Cuti"
          description="Kirim pengingat sisa cuti berisiko hangus"
          tone="default"
          href="/kuota-hangus"
        />
      </div>

      {/* Chart Kapasitas Divisi */}
      <Bagian
        judul={`Kapasitas Divisi, ${d.bulan.label}`}
        deskripsi="Tinjau apakah persentase batas cuti per divisi sudah pas"
        aksi={<TautanAksi href="/kapasitas">Atur batas</TautanAksi>}
      >
        <KapasitasChart data={d.kapasitas} />
      </Bagian>

      {/* Tabel Cuti Hari Ini */}
      <Bagian
        judul="Cuti Hari Ini"
        deskripsi="Karyawan yang sedang cuti pada tanggal ini"
        aksi={<TautanAksi href="/riwayat">Lihat semua riwayat</TautanAksi>}
      >
        <DataTable
          kolom={[
            { label: "Nama Karyawan", key: "nama_lengkap" },
            { label: "Divisi", render: (r) => r.divisi_nama ?? "-" },
            { label: "Jenis Cuti", key: "jenis_nama" },
            kolomPeriode,
            kolomHari,
            kolomDetail,
          ]}
          rows={d.cutiHariIni}
          kosong="Tidak ada karyawan yang cuti hari ini."
        />
      </Bagian>

      {/* Tabel Divisi Tanpa Ketua */}
      <Bagian
        judul="Divisi Tanpa Ketua"
        deskripsi="Divisi yang belum ditetapkan ketua divisi"
        aksi={<TautanAksi href="/admin/divisi">Kelola divisi</TautanAksi>}
      >
        <DataTable
          kolom={[
            { label: "Divisi", key: "nama" },
            { label: "Anggota Aktif", key: "jumlah_anggota" },
            { label: "Batas Cuti Bersamaan", render: (v) => `${v.max_persen_cuti}% (${Math.max(1, Math.floor((v.max_persen_cuti * v.jumlah_anggota) / 100))} orang/hari)` },
            { label: "Aksi", render: (v) => <TautanAksi href={`/admin/divisi/${v.id}`}>Detail</TautanAksi> },
          ]}
          rows={d.divisiTanpaKetua}
          kosong="Semua divisi telah memiliki ketua divisi."
        />
      </Bagian>

      {/* Tabel Pengguna Belum Ditempatkan */}
      <Bagian
        judul="Pengguna Belum Ditempatkan"
        deskripsi="Karyawan dan Ketua Divisi yang belum tergabung ke divisi mana pun"
        aksi={<TautanAksi href="/admin/users">Kelola pengguna</TautanAksi>}
      >
        <DataTable
          kolom={[
            { label: "Nama Lengkap", key: "nama_lengkap" },
            { label: "Role", render: (u) => NAMA_ROLE[u.role] },
            { label: "Tanggal Bergabung", render: (u) => formatTanggal(u.tanggal_bergabung) },
            { label: "Aksi", render: (u) => <TautanAksi href={`/admin/users/${u.id}`}>Detail</TautanAksi> },
          ]}
          rows={d.tanpaDivisi.rows}
          kosong="Semua karyawan dan Ketua Divisi sudah tergabung ke divisi."
        />
      </Bagian>

      {/* Tabel Masa Kerja Di Bawah 1 Tahun */}
      <Bagian
        judul="Karyawan Masa Kerja Di Bawah 1 Tahun"
        deskripsi="Daftar staf yang belum berhak mengajukan Cuti Tahunan"
        aksi={
          <TautanAksi href="/admin/users">Kelola pengguna</TautanAksi>
        }
      >
        <DataTable
          kolom={[
            { label: "Nama Lengkap", key: "nama_lengkap" },
            { label: "Role", render: (u) => NAMA_ROLE[u.role] },
            { label: "Divisi", render: (u) => u.divisi_nama ?? "-" },
            { label: "Tanggal Bergabung", render: (u) => formatTanggal(u.tanggal_bergabung) },
            {
              label: "Berhak Cuti Tahunan",
              render: (u) => (
                <span className="font-mono text-xs text-accent">
                  {formatTanggal(u.layakTahunan)}
                </span>
              ),
            },
          ]}
          rows={d.masaKerjaDiBawah1Tahun}
          kosong="Semua karyawan telah bermasa kerja minimal 1 tahun."
        />
      </Bagian>
    </div>
  );
}

export default async function DashboardPage() {
  const user = await requireRole();

  return (
    <div className="space-y-8">
      {/* Header Sambutan */}
      <header className="flex flex-col gap-1 border-b border-line/60 pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold text-muted">
            Ringkasan {NAMA_ROLE[user.role]}
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-ink md:text-4xl">
            Halo, {user.nama_lengkap}
          </h1>
        </div>
        {user.role === "admin" && (
          <div className="mt-3 flex flex-wrap gap-2 md:mt-0">
            <Link href="/admin/users/baru" className={btnPrimary}>
              <UserPlus className="mr-1.5 h-4 w-4" aria-hidden />
              Tambah pengguna
            </Link>
            <Link href="/admin/divisi/baru" className={btnGhost}>
              <Plus className="mr-1.5 h-4 w-4" aria-hidden />
              Tambah divisi
            </Link>
          </div>
        )}
      </header>

      {/* Konten Dashboard Sesuai Role */}
      {user.role === "karyawan" && <DashKaryawan user={user} />}
      {user.role === "ketua_divisi" && <DashKetua user={user} />}
      {user.role === "hrd" && <DashHrd />}
      {user.role === "admin" && <DashAdmin />}
    </div>
  );
}
