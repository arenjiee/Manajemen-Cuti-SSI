import { notFound } from "next/navigation";
import { requireRole } from "@/lib/guard";
import pool from "@/lib/db";
import { ambilDivisi, anggotaDivisi, calonKetua, karyawanTanpaDivisi } from "@/lib/queries/divisi";
import { formatTanggal } from "@/lib/format";
import DataTable from "@/components/DataTable";
import FormAction from "@/components/FormAction";
import TombolKembali from "@/components/TombolKembali";
import AutoTextarea from "@/components/AutoTextarea";
import PageHeader from "@/components/PageHeader";
import PresenceBadge from "@/components/PresenceBadge";
import Section from "@/components/Section";
import TombolKonfirmasi from "@/components/TombolKonfirmasi";
import { btnDanger, btnPrimary, inputCls, labelCls, selectCls } from "@/components/ui";

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
    { label: "Status", render: (a) => <PresenceBadge aktif={a.aktif} sedangCuti={a.sedang_cuti} /> },
    { label: "Bergabung", render: (a) => formatTanggal(a.tanggal_bergabung) },
    {
      label: "Aksi",
      render: (a) => (
        <TombolKonfirmasi
          action="/api/admin/divisi/anggota/keluar"
          fields={{ divisiId: d.id, userId: a.id }}
          label={a.role === "ketua_divisi" ? "Keluarkan Ketua" : "Keluarkan"}
          pesan={
            a.role === "ketua_divisi"
              ? `Keluarkan ${a.nama_lengkap} dari jabatan Ketua Divisi ${d.nama}? Akun tidak dihapus.`
              : `Keluarkan ${a.nama_lengkap} dari divisi? Akun tidak dihapus.`
          }
          className={btnDanger}
        />
      ),
    },
  ];

  return (
    <div className="space-y-10">
      <TombolKembali href="/admin/divisi" label="Kembali ke Divisi" />
      <PageHeader
        title={d.nama}
        description={`Ketua: ${d.ketua_nama ?? "-"} · ${anggota.length} anggota · Batas cuti ${d.max_persen_cuti}% (${d.batas_harian} orang/hari)`}
      />
      {sp.error && <p role="alert" className="rounded-2xl border border-bad/30 bg-bad/10 px-4 py-3 text-sm text-bad">{sp.error}</p>}

      <section className="max-w-xl space-y-4">
        <Section title="Edit divisi">
          <FormAction action={`/api/admin/divisi/${d.id}`} batalHref="/admin/divisi" label="Simpan perubahan" className="space-y-4 rounded-2xl border border-line bg-surface p-6">
          <input type="hidden" name="id" value={d.id} />
          <label className="block"><span className={labelCls}>Nama divisi</span><input name="nama" defaultValue={d.nama} required className={inputCls} /></label>
          <label className="block"><span className={labelCls}>Deskripsi</span><AutoTextarea name="deskripsi" rows={2} defaultValue={d.deskripsi ?? ""} className={inputCls} /></label>
          <label className="block"><span className={labelCls}>Ketua divisi</span>
            <select name="ketuaId" defaultValue={d.ketua_id ?? ""} className={selectCls}>
              <option value="">-- Tanpa Ketua Divisi --</option>
              {ketuaOpsi.map((k) => <option key={k.id} value={k.id}>{k.nama_lengkap}</option>)}
            </select>
          </label>
        </FormAction>
        </Section>
      </section>

      <Section title="Anggota">
        <DataTable
          kolom={kolom}
          rows={anggota}
          kosong="Divisi belum memiliki anggota."
          selectable
          hapusAction="/api/admin/divisi/anggota/keluar"
          hapusLabel="Keluarkan anggota"
          hapusPesan="Keluarkan {count} anggota dari divisi? Akun tidak dihapus."
          extraFields={{ divisiId: d.id }}
          idField="userId"
        />
        <form action={`/api/admin/divisi/${d.id}/anggota`} method="POST" className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="divisiId" value={d.id} />
          <label className="min-w-56"><span className={labelCls}>Tambah anggota</span>
            <select name="userId" required defaultValue="" className={selectCls}>
              <option value="" disabled>Pilih karyawan tanpa divisi</option>
              {bebas.map((k) => <option key={k.id} value={k.id}>{k.nama_lengkap}</option>)}
            </select>
          </label>
          <button className={btnPrimary} disabled={bebas.length === 0}>Tambahkan</button>
        </form>
      </Section>

      <Section title="Hapus divisi" eyebrow="Aksi berbahaya">
        <p className="mb-3 text-sm text-muted">Anggota kehilangan atribut divisi; akun mereka tetap ada.</p>
        <TombolKonfirmasi action="/api/admin/divisi/hapus" fields={{ id: d.id }} label="Hapus divisi" konfirmasi={2}
          pesan={`Hapus divisi ${d.nama}?`} className={btnDanger} />
      </Section>
    </div>
  );
}
