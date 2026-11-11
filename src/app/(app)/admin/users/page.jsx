import Link from "next/link";
import { requireRole } from "@/lib/guard";
import pool from "@/lib/db";
import { daftarUser } from "@/lib/queries/users";
import { daftarDivisi } from "@/lib/queries/divisi";
import { NAMA_ROLE } from "@/lib/nav";
import { formatTanggal } from "@/lib/format";
import DataTable from "@/components/DataTable";
import FilterBar from "@/components/FilterBar";
import TombolKonfirmasi from "@/components/TombolKonfirmasi";
import { hapusUserAction } from "./actions";
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
    { name: "aktif", label: "Status", type: "select", options: [{ value: "true", label: "Aktif" }, { value: "false", label: "Tidak aktif" }] },
    { name: "masaKerja", label: "Masa kerja", type: "select", options: [{ value: "lt1", label: "< 1 tahun" }, { value: "gte1", label: "≥ 1 tahun" }] },
    { name: "urut", label: "Urutkan", type: "select", options: [{ value: "nama", label: "Nama" }, { value: "bergabung", label: "Tanggal bergabung" }, { value: "divisi", label: "Divisi" }] },
  ];
  const kolom = [
    { label: "Nama", render: (u) => <><p className="font-medium">{u.nama_lengkap}</p><p className="text-xs text-muted">{u.email}</p></> },
    { label: "Username", key: "username" },
    { label: "Role", render: (u) => NAMA_ROLE[u.role] },
    { label: "Divisi", render: (u) => u.divisi_nama ?? "-" },
    { label: "Bergabung", render: (u) => formatTanggal(u.tanggal_bergabung) },
    { label: "Status", render: (u) => (u.aktif ? "Aktif" : "Tidak aktif") },
    {
      label: "Aksi",
      render: (u) => (
        <div className="flex items-center gap-2">
          <Link href={`/admin/users/${u.id}`} className="text-sm text-accent hover:underline">Edit</Link>
          {["karyawan", "ketua_divisi"].includes(u.role) && (
            <TombolKonfirmasi action={hapusUserAction} fields={{ id: u.id }} label="Hapus" pesan={`Hapus pengguna ${u.nama_lengkap}?`} className={btnDanger} />
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Pengguna</h1>
          <p className="text-sm text-muted">Kelola akun Admin, Karyawan, Ketua Divisi, dan HRD.</p>
        </div>
        <Link href="/admin/users/baru" className={btnPrimary}>Tambah pengguna</Link>
      </header>
      {sp.error && <p role="alert" className="rounded-lg bg-bad/10 px-3 py-2 text-sm text-bad">{sp.error}</p>}
      <FilterBar fields={fields} values={sp} resetHref="/admin/users" />
      <DataTable kolom={kolom} rows={rows} kosong="Tidak ada pengguna yang cocok dengan filter." />
    </div>
  );
}
