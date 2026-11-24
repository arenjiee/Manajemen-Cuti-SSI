import Link from "next/link";
import { requireRole } from "@/lib/guard";
import pool from "@/lib/db";
import { daftarUser } from "@/lib/queries/users";
import { daftarDivisi } from "@/lib/queries/divisi";
import { NAMA_ROLE, ROLE_DAPAT_DIHAPUS } from "@/lib/nav";
import { formatTanggal } from "@/lib/format";
import DataTable from "@/components/DataTable";
import FilterBar from "@/components/FilterBar";
import CariLangsung from "@/components/CariLangsung";
import TombolKonfirmasi from "@/components/TombolKonfirmasi";
import PageHeader from "@/components/PageHeader";
import PresenceBadge from "@/components/PresenceBadge";
import TautanDetail from "@/components/TautanDetail";
import { btnPrimary, btnDanger } from "@/components/ui";

export const metadata = { title: "Pengguna | LeaveSync" };

export default async function UsersPage({ searchParams }) {
  await requireRole(["admin"]);
  const sp = await searchParams;
  const urut = typeof sp.urut === "string" ? sp.urut : "";
  const arah = sp.arah === "desc" || sp.arah === "asc" ? sp.arah : urut === "bergabung" ? "desc" : "asc";
  const [rows, divisi] = await Promise.all([daftarUser(pool, { ...sp, arah }), daftarDivisi(pool, {})]);

  const fields = [
    { name: "role", label: "Role", type: "select", options: Object.entries(NAMA_ROLE).map(([value, label]) => ({ value, label })) },
    { name: "divisiId", label: "Divisi", type: "select", options: divisi.map((d) => ({ value: d.id, label: d.nama })) },
    { name: "aktif", label: "Status", type: "select", options: [{ value: "true", label: "Aktif (Tidak Cuti)" }, { value: "cuti", label: "Sedang Cuti" }, { value: "false", label: "Nonaktif" }] },
    { name: "masaKerja", label: "Masa kerja", type: "select", options: [{ value: "lt1", label: "Di bawah 1 tahun" }, { value: "gte1", label: "≥ 1 tahun" }] },
  ];
  const q = typeof sp.q === "string" ? sp.q : "";
  const paramFilter = Object.fromEntries(
    ["role", "divisiId", "aktif", "masaKerja"].map((k) => [k, typeof sp[k] === "string" ? sp[k] : ""])
  );
  const kolom = [
    { label: "Nama", sortKey: "nama", render: (u) => <div><p className="font-medium">{u.nama_lengkap}</p><p className="text-xs text-muted">{u.email}</p></div> },
    { label: "Username", key: "username", sortKey: "username" },
    { label: "Role", sortKey: "role", render: (u) => NAMA_ROLE[u.role] },
    { label: "Divisi", sortKey: "divisi", render: (u) => u.divisi_nama ?? "-" },
    { label: "Bergabung", sortKey: "bergabung", render: (u) => formatTanggal(u.tanggal_bergabung) },
    { label: "Status", render: (u) => <PresenceBadge aktif={u.aktif} sedangCuti={u.sedang_cuti} /> },
    {
      label: "Aksi",
      render: (u) => (
      <div className="flex items-center gap-4 pl-2">
        <TautanDetail href={`/admin/users/${u.id}`} label="Edit" />
        {ROLE_DAPAT_DIHAPUS.includes(u.role) && (
          <TombolKonfirmasi
            action={`/api/admin/users/${u.id}`}
            method="DELETE"
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
      <CariLangsung
        basePath="/admin/users"
        params={{ ...paramFilter, urut, arah: urut ? arah : "" }}
        defaultValue={q}
        placeholder="Cari nama lengkap atau username"
      />
      <FilterBar key={Object.values(paramFilter).join("|")} fields={fields} values={sp} resetHref="/admin/users" hidden={{ q, urut, arah: urut ? arah : "" }} />
      <DataTable
        kolom={kolom}
        rows={rows}
        kosong="Tidak ada pengguna yang cocok dengan filter."
        selectable
        sort={{ basePath: "/admin/users", params: { ...paramFilter, q }, urut, arah }}
        hapusAction="/api/admin/users"
        hapusMethod="DELETE"
        hapusPesan="Hapus {count} pengguna yang dipilih? Akun akan dinonaktifkan."
      />
    </div>
  );
}
