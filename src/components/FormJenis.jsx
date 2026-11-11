import { inputCls } from "./ui";

export default function FormJenis({ j }) {
  return (
    <>
      {j && <input type="hidden" name="id" value={j.id} />}
      <label className="block text-sm">Nama jenis cuti<input name="nama" defaultValue={j?.nama} required className={`${inputCls} mt-1`} /></label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">Kuota per tahun (hari)
          <input name="kuotaHari" type="number" min="0" step="0.5" defaultValue={j?.kuotaHari ?? ""} placeholder="Kosong = tak terbatas" className={`${inputCls} mt-1`} />
        </label>
        <label className="block text-sm">Batas pengajuan (H-n)
          <input name="batasPengajuanHari" type="number" step="1" required defaultValue={j?.batasPengajuanHari ?? 0} className={`${inputCls} mt-1`} />
        </label>
      </div>
      <p className="-mt-2 text-xs text-muted">Positif = minimal H-n sebelum mulai. 0 = tidak boleh lewat. Negatif = boleh diajukan mundur n hari.</p>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="wajibLampiran" defaultChecked={j?.wajibLampiran} /> Wajib melampirkan dokumen</label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="potongKuota" defaultChecked={j?.potongKuota} /> Memotong kuota cuti tahunan</label>
      {j && <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="aktif" defaultChecked={j.aktif} /> Aktif</label>}
    </>
  );
}
