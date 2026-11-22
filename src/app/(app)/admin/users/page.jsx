import Link from "next/link";
import { requireRole } from "@/lib/guard";
import pool from "@/lib/db";
import { daftarUser } from "@/lib/queries/users";
import { daftarDivisi } from "@/lib/queries/divisi";
import { NAMA_ROLE, ROLE_DAPAT_DIHAPUS } from "@/lib/nav";
import { formatTanggal } from "@/lib/format";
import DataTable from "@/components/DataTable";
import FilterBar from "@/components/FilterBar";
import TombolKonfirmasi from "@/components/TombolKonfirmasi";
import PageHeader from "@/components/PageHeader";
import PresenceBadge from "@/components/PresenceBadge";
import TautanDetail from "@/components/TautanDetail";
import { btnPrimary, btnDanger } from "@/components/ui";

export const metadata = { title: "Pengguna | SMCK" };

export default async function UsersPage({ searchParams }) {
  await requireRole(["admin"]);
  const sp = await searchParams;
  const [rows, divisi] = await Promise.all([daftarUser(pool, sp), daftarDivisi(pool, {})]);

  const fields = [
    { name: "q", label: "Cari", placeholder: "Nama, username, email" },
    { name: "role", label: "Role", type: "select", options: Object.entries(NAMA_ROLE).map(([value, label]) => ({ value, label })) },
    { name: "divisiId", label: "Divisi", type: "select", options: divisi.map((d) => ({ value: d.id, label: d.nama })) },
    { name: "aktif", label: "Status", type: "select", options: [{ value: "true", label: "Aktif (Tidak Cuti)" }, { value: "cuti", label: "Sedang Cuti" }, { value: "false", label: "Nonaktif" }] },
    { name: "masaKerja", label: "Masa kerja", type: "select", options: [{ value: "lt1", label: "Di bawah 1 tahun" }, { value: "gte1", label: "≥ 1 tahun" }] },
    { name: "urut", label: "Urutkan", type: "select", options: [{ value: "nama", label: "Nama" }, { value: "bergabung", label: "Tanggal bergabung" }, { value: "divisi", label: "Divisi" }] },
  ];
  const kolom = [
    { label: "Nama", render: (u) => <><p className="font-medium">{u.nama_lengkap}</p><p className="text-xs text-muted">{u.email}</p></> },
    { label: "Username", key: "username" },
    { label: "Role", render: (u) => NAMA_ROLE[u.role] },
    { label: "Divisi", render: (u) => u.divisi_nama ?? "-" },
    { label: "Bergabung", render: (u) => formatTanggal(u.tanggal_bergabung) },
    { label: "Status", render: (u) => <PresenceBadge aktif={u.aktif} sedangCuti={u.sedang_cuti} /> },
    {
      label: "Aksi",
      render: (u) => (
      <div className="flex items-center gap-4 pl-2">
        <TautanDetail href={`/admin/users/${u.id}`} label="Edit" />
        {ROLE_DAPAT_DIHAPUS.includes(u.role) && (
          <TombolKonfirmasi
            action="/api/admin/users/hapus"
            fields={{ id: u.id }}
            label="Hapus"
            pesan={`Hapus pengguna ${u.nama_lengkap}?`}
            className={`${btnDanger} ml-1`}
          />
        )}
      </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pengguna"
        description="Kelola akun Admin, Karyawan, Ketua Divisi, dan HRD."
        action={<Link href="/admin/users/baru" className={btnPrimary}>Tambah pengguna baru</Link>}
      />
      {sp.error && <p role="alert" className="rounded-2xl border border-bad/30 bg-bad/10 px-4 py-3 text-sm text-bad">{sp.error}</p>}
      <FilterBar fields={fields} values={sp} resetHref="/admin/users" />
      <DataTable kolom={kolom} rows={rows} kosong="Tidak ada pengguna yang cocok dengan filter." />
    </div>
  );
}
