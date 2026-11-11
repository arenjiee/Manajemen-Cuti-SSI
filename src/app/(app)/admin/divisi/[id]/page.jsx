import { notFound } from "next/navigation";
import { requireRole } from "@/lib/guard";
import pool from "@/lib/db";
import { ambilDivisi, anggotaDivisi, calonKetua, karyawanTanpaDivisi } from "@/lib/queries/divisi";
import { formatTanggal } from "@/lib/format";
import DataTable from "@/components/DataTable";
import FormAction from "@/components/FormAction";
import TombolKonfirmasi from "@/components/TombolKonfirmasi";
import { inputCls, btnPrimary, btnDanger } from "@/components/ui";
import { ubahDivisiAction, hapusDivisiAction, tambahAnggotaAction, keluarkanAnggotaAction } from "../actions";

export default async function DetailDivisiPage({ params, searchParams }) {
  await requireRole(["admin"]);
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const d = await ambilDivisi(pool, Number(id));
  if (!d) notFound();
  const sp = await searchParams;
  const [anggota, calon, bebas] = await Promise.all([anggotaDivisi(pool, d.id), calonKetua(pool), karyawanTanpaDivisi(pool)]);
  const ketuaOpsi = [...(d.ketua_id ? [{ id: d.ketua_id, nama_lengkap: d.ketua_nama }] : []), ...calon];

  const kolom = [
    { label: "Nama", render: (a) => a.nama_lengkap },
    { label: "Peran", render: (a) => (a.role === "ketua_divisi" ? "Ketua Divisi" : "Anggota") },
    { label: "Status", render: (a) => (a.aktif ? "Aktif" : "Tidak aktif") },
    { label: "Bergabung", render: (a) => formatTanggal(a.tanggal_bergabung) },
    { label: "Aksi", render: (a) => a.role === "karyawan" && (
      <TombolKonfirmasi action={keluarkanAnggotaAction} fields={{ divisiId: d.id, userId: a.id }} label="Keluarkan" pesan={`Keluarkan ${a.nama_lengkap} dari divisi? Akun tidak dihapus.`} className={btnDanger} />
    ) },
  ];

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-3xl font-semibold">{d.nama}</h1>
        <p className="text-sm text-muted">Ketua: {d.ketua_nama ?? "-"} · {anggota.length} anggota</p>
      </header>
      {sp.error && <p role="alert" className="rounded-lg bg-bad/10 px-3 py-2 text-sm text-bad">{sp.error}</p>}

      <section className="max-w-xl space-y-4">
        <h2 className="text-xl font-semibold">Edit divisi</h2>
        <FormAction action={ubahDivisiAction} label="Simpan perubahan">
          <input type="hidden" name="id" value={d.id} />
          <label className="block text-sm">Nama divisi<input name="nama" defaultValue={d.nama} required className={`${inputCls} mt-1`} /></label>
          <label className="block text-sm">Deskripsi<textarea name="deskripsi" rows={3} defaultValue={d.deskripsi ?? ""} className={`${inputCls} mt-1`} /></label>
          <label className="block text-sm">Ketua divisi
            <select name="ketuaId" defaultValue={d.ketua_id ?? ""} required className={`${inputCls} mt-1`}>
              {ketuaOpsi.map((k) => <option key={k.id} value={k.id}>{k.nama_lengkap}</option>)}
            </select>
          </label>
        </FormAction>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Anggota</h2>
        <DataTable kolom={kolom} rows={anggota} kosong="Divisi belum memiliki anggota." />
        <form action={tambahAnggotaAction} className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="divisiId" value={d.id} />
          <label className="text-sm">Tambah anggota
            <select name="userId" required defaultValue="" className={`${inputCls} mt-1 min-w-56`}>
              <option value="" disabled>Pilih karyawan tanpa divisi</option>
              {bebas.map((k) => <option key={k.id} value={k.id}>{k.nama_lengkap}</option>)}
            </select>
          </label>
          <button className={btnPrimary} disabled={bebas.length === 0}>Tambahkan</button>
        </form>
      </section>

      <section className="border-t border-line pt-6">
        <h2 className="text-xl font-semibold text-bad">Hapus divisi</h2>
        <p className="mb-3 text-sm text-muted">Anggota kehilangan atribut divisi; akun mereka tetap ada.</p>
        <TombolKonfirmasi action={hapusDivisiAction} fields={{ id: d.id }} label="Hapus divisi" konfirmasi={2}
          pesan={`Hapus divisi ${d.nama}?`} className="rounded-lg border border-bad px-4 py-2 text-sm text-bad transition hover:bg-bad/10" />
      </section>
    </div>
  );
}
