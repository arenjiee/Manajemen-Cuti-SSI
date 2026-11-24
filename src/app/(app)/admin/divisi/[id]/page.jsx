import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/guard";
import pool from "@/lib/db";
import { ambilDivisi, anggotaDivisi, calonKetua, karyawanTanpaDivisi, NAMA_DIVISI_MAKS, DESKRIPSI_DIVISI_MAKS } from "@/lib/queries/divisi";
import { formatTanggal } from "@/lib/format";
import DataTable from "@/components/DataTable";
import FormAction from "@/components/FormAction";
import TombolKembali from "@/components/TombolKembali";
import AutoTextarea from "@/components/AutoTextarea";
import PageHeader from "@/components/PageHeader";
import PresenceBadge from "@/components/PresenceBadge";
import Section from "@/components/Section";
import TombolKonfirmasi from "@/components/TombolKonfirmasi";
import { btnDanger, inputCls, labelCls, selectCls } from "@/components/ui";
import FormTambahAnggota from "./FormTambahAnggota";

export default async function DetailDivisiPage({ params }) {
  await requireRole(["admin"]);
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const d = await ambilDivisi(pool, Number(id));
  if (!d) notFound();
  const [anggota, calon, bebas] = await Promise.all([anggotaDivisi(pool, d.id), calonKetua(pool), karyawanTanpaDivisi(pool)]);
  const nonaktif = anggota.filter((a) => !a.aktif).length;
  const ketuaOpsi = [...(d.ketua_id ? [{ id: d.ketua_id, nama_lengkap: d.ketua_nama }] : []), ...calon];

  const kolom = [
    { label: "Nama", render: (a) => a.nama_lengkap },
    { label: "Username", render: (a) => <span className="font-mono text-xs text-muted">{a.username}</span> },
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
        description={`Ketua: ${d.ketua_nama ?? "-"} · ${d.jumlah_anggota} anggota aktif${nonaktif ? ` (+${nonaktif} nonaktif)` : ""} · Maks. cuti bersamaan ${d.batas_harian} orang per hari (${d.max_persen_cuti}%)`}
      />

      <section className="max-w-xl space-y-4">
        <Section title="Edit divisi">
          <FormAction action={`/api/admin/divisi/${d.id}`} batalHref="/admin/divisi" label="Simpan perubahan" className="space-y-4 rounded-2xl border border-line bg-surface p-6">
          <input type="hidden" name="id" value={d.id} />
          <label className="block"><span className={labelCls}>Nama divisi</span><input name="nama" defaultValue={d.nama} required maxLength={NAMA_DIVISI_MAKS} className={inputCls} /></label>
          <label className="block"><span className={labelCls}>Deskripsi</span><AutoTextarea name="deskripsi" rows={2} defaultValue={d.deskripsi ?? ""} maxLength={DESKRIPSI_DIVISI_MAKS} className={inputCls} /></label>
          <label className="block"><span className={labelCls}>Ketua divisi</span>
            <select name="ketuaId" defaultValue={d.ketua_id ?? ""} className={selectCls}>
              <option value="">-- Tanpa Ketua Divisi --</option>
              {ketuaOpsi.map((k) => <option key={k.id} value={k.id}>{k.nama_lengkap}</option>)}
            </select>
            <span className="mt-1.5 block text-xs text-muted">Mengganti atau mengosongkan ketua akan mengeluarkan ketua saat ini dari divisi ini. Akunnya tidak dihapus.</span>
          </label>
          <p className="text-xs text-muted">
            Batas cuti bersamaan ({d.max_persen_cuti}%) diatur di <Link href="/kapasitas" className="underline underline-offset-2 hover:text-ink">Kapasitas Tim</Link>.
          </p>
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
        <FormTambahAnggota divisiId={d.id} kandidat={bebas} />
      </Section>

      <Section title="Hapus divisi" eyebrow="Aksi berbahaya">
        <p className="mb-3 text-sm text-muted">{anggota.length > 0 ? `${anggota.length} anggota (termasuk ketua) akan menjadi tanpa divisi; akun mereka tetap ada.` : "Divisi ini belum memiliki anggota."}</p>
        <TombolKonfirmasi action="/api/admin/divisi/hapus" fields={{ id: d.id }} label="Hapus divisi" konfirmasi={2}
          pesan={`Hapus divisi ${d.nama}?${anggota.length > 0 ? ` ${anggota.length} anggota akan menjadi tanpa divisi.` : ""}`} className={btnDanger} />
      </Section>
    </div>
  );
}
