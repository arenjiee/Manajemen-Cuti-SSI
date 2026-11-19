import { requireRole } from "@/lib/guard";
import pool from "@/lib/db";
import { daftarJenisAktif } from "@/lib/queries/jenis-cuti";
import { terpakaiPotongKuota } from "@/lib/queries/pengajuan";
import { sisaKuota } from "@/lib/leave/kuota";
import { hariIni, tambahHari } from "@/lib/leave/tanggal";
import { daftarHariLiburMendatang, muatPetaHariLibur } from "@/lib/queries/hari-libur";
import { rentangBulan } from "@/lib/periode";
import { okupansiDivisi } from "@/lib/queries/kapasitas";
import { hitungBatasHarian } from "@/lib/leave/kapasitas";
import { bangunKalender } from "@/lib/leave/kalender";
import TombolKembali from "@/components/TombolKembali";
import FormPengajuan from "./FormPengajuan";

export const metadata = { title: "Ajukan Cuti | SMCK" };

export default async function AjukanPage() {
  const user = await requireRole(["karyawan", "ketua_divisi"]);
  if (!user.divisi_id) {
    return (
      <div className="max-w-xl space-y-4">
        <TombolKembali href="/cuti" label="Kembali ke Cuti Saya" />
        <h1 className="text-3xl font-semibold">Ajukan cuti</h1>
        <p className="rounded-lg bg-warn/15 px-4 py-3 text-sm">Anda belum tergabung di divisi mana pun, sehingga belum dapat mengajukan cuti. Hubungi Admin.</p>
      </div>
    );
  }
  const hari = hariIni();
  const tahun = Number(hari.slice(0, 4));

  const { dari: awalBulanIni, sampai: akhirBulanIni } = rentangBulan(hari);
  const { sampai: akhirBulanDepan } = rentangBulan(tambahHari(akhirBulanIni, 1));

  const [jenis, rekan, terpakai, hariLiburMendatang, dv, anggota, liburPeta, okupansi] = await Promise.all([
    daftarJenisAktif(pool),
    pool.query("SELECT id, nama_lengkap FROM users WHERE divisi_id=$1 AND id<>$2 AND aktif AND deleted_at IS NULL ORDER BY nama_lengkap", [user.divisi_id, user.id]),
    terpakaiPotongKuota(pool, user.id, tahun),
    daftarHariLiburMendatang(pool, { dari: hari, limit: 6 }),
    pool.query("SELECT max_persen_cuti FROM divisi WHERE id=$1 AND deleted_at IS NULL", [user.divisi_id]),
    pool.query("SELECT count(*)::int AS jumlah FROM users WHERE divisi_id=$1 AND aktif AND deleted_at IS NULL", [user.divisi_id]),
    muatPetaHariLibur(pool, { dari: awalBulanIni, sampai: akhirBulanDepan }),
    okupansiDivisi(pool, user.divisi_id, awalBulanIni, akhirBulanDepan),
  ]);

  const batas = dv.rows[0] ? hitungBatasHarian(dv.rows[0].max_persen_cuti, anggota.rows[0]?.jumlah ?? 0) : Infinity;
  const kalenderAwal = bangunKalender({
    dari: awalBulanIni,
    sampai: akhirBulanDepan,
    okupansi,
    batas,
    libur: liburPeta,
    cekKapasitas: true,
  });

  return (
    <div className="space-y-6">
      <TombolKembali href="/cuti" label="Kembali ke Cuti Saya" />
      <header>
        <h1 className="text-3xl font-semibold">Ajukan cuti</h1>
        <p className="text-sm text-muted">Pengajuan akan diteruskan ke {user.role === "ketua_divisi" ? "HRD" : "Ketua Divisi lalu HRD"}.</p>
      </header>
      <FormPengajuan
        jenis={jenis.map((j) => ({ id: j.id, nama: j.nama, kode: j.kode, batas: j.batasPengajuanHari, lampiran: j.wajibLampiran, potong: j.potongKuota, kuotaHari: j.kuotaHari }))}
        rekan={rekan.rows}
        sisa={sisaKuota(user.kuota_awal, terpakai)}
        tahun={tahun}
        kalenderAwal={kalenderAwal}
        hariLiburMendatang={hariLiburMendatang}
      />
    </div>
  );
}
