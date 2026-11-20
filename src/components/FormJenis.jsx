import { inputCls, labelCls } from "./ui";

export default function FormJenis({ j }) {
  return (
    <>
      {j && <input type="hidden" name="id" value={j.id} />}
      <label className="block"><span className={labelCls}>Nama jenis cuti</span><input name="nama" defaultValue={j?.nama} required className={inputCls} /></label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block"><span className={labelCls}>Kuota per tahun (hari)</span>
          <input
            name="kuotaHari"
            type="number"
            min="0"
            step="0.5"
            defaultValue={j?.kuotaHari ?? ""}
            placeholder={j?.kode === "tahunan" ? "Diatur per profil (min. 12)" : "Kosong = tak terbatas"}
            disabled={j?.kode === "tahunan"}
            className={inputCls}
          />
        </label>
        <label className="block"><span className={labelCls}>Batas pengajuan</span>
          <input name="batasPengajuanHari" type="number" step="1" required defaultValue={j?.batasPengajuanHari ?? 0} className={inputCls} />
        </label>
      </div>
      <p className="-mt-2 text-xs text-muted">Positif = H-n (sebelum mulai). 0 = H-0 (hari H). Negatif = H+n (setelah mulai).</p>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="wajibLampiran" defaultChecked={j?.wajibLampiran} /> Wajib melampirkan dokumen</label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="potongKuota" defaultChecked={j?.potongKuota} /> Memotong kuota cuti tahunan</label>
      {j && <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="aktif" defaultChecked={j.aktif} /> Aktif</label>}
    </>
  );
}
