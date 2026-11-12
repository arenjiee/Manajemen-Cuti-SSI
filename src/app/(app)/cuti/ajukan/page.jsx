import { requireRole } from "@/lib/guard";
import pool from "@/lib/db";
import { daftarJenisAktif } from "@/lib/queries/jenis-cuti";
import { terpakaiPotongKuota } from "@/lib/queries/pengajuan";
import { sisaKuota } from "@/lib/leave/kuota";
import { hariIni } from "@/lib/leave/tanggal";
import FormPengajuan from "./FormPengajuan";

export const metadata = { title: "Ajukan Cuti | SMCK" };

export default async function AjukanPage() {
  const user = await requireRole(["karyawan", "ketua_divisi"]);
  if (!user.divisi_id) {
    return (
      <div className="max-w-xl space-y-3">
        <h1 className="text-3xl font-semibold">Ajukan cuti</h1>
        <p className="rounded-lg bg-warn/15 px-4 py-3 text-sm">Anda belum tergabung di divisi mana pun, sehingga belum dapat mengajukan cuti. Hubungi Admin.</p>
      </div>
    );
  }
  const tahun = Number(hariIni().slice(0, 4));
  const [jenis, rekan, terpakai] = await Promise.all([
    daftarJenisAktif(pool),
    pool.query("SELECT id, nama_lengkap FROM users WHERE divisi_id=$1 AND id<>$2 AND aktif AND deleted_at IS NULL ORDER BY nama_lengkap", [user.divisi_id, user.id]),
    terpakaiPotongKuota(pool, user.id, tahun),
  ]);
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold">Ajukan cuti</h1>
        <p className="text-sm text-muted">Pengajuan akan diteruskan ke {user.role === "ketua_divisi" ? "HRD" : "Ketua Divisi lalu HRD"}.</p>
      </header>
      <FormPengajuan
        jenis={jenis.map((j) => ({ id: j.id, nama: j.nama, kode: j.kode, batas: j.batasPengajuanHari, lampiran: j.wajibLampiran, potong: j.potongKuota, kuotaHari: j.kuotaHari }))}
        rekan={rekan.rows}
        sisa={sisaKuota(user.kuota_awal, terpakai)}
        tahun={tahun}
      />
    </div>
  );
}
