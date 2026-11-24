import { inputCls, labelCls } from "./ui";
import { KUOTA_TAHUNAN_MIN, KUOTA_TAHUNAN_MAX } from "@/lib/leave/kuota";

export default function FormJenis({ j }) {
  const isTahunan = j?.kode === "tahunan";
  return (
    <>
      {j && <input type="hidden" name="id" value={j.id} suppressHydrationWarning />}
      <label className="block">
        <span className={labelCls}>Nama jenis cuti</span>
        <input name="nama" defaultValue={j?.nama} required className={inputCls} suppressHydrationWarning />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className={labelCls}>
            Kuota per tahun (hari){isTahunan ? ` · min. ${KUOTA_TAHUNAN_MIN}` : ""}
          </span>
          <input
            name="kuotaHari"
            type="number"
            min={isTahunan ? KUOTA_TAHUNAN_MIN : "0"}
            max={isTahunan ? KUOTA_TAHUNAN_MAX : undefined}
            step="0.5"
            required={isTahunan}
            defaultValue={j?.kuotaHari ?? (isTahunan ? KUOTA_TAHUNAN_MIN : "")}
            placeholder={isTahunan ? `Minimal ${KUOTA_TAHUNAN_MIN} hari` : "Kosong = tak terbatas"}
            className={inputCls}
            suppressHydrationWarning
          />
        </label>
        <label className="block">
          <span className={labelCls}>Batas pengajuan</span>
          <input
            name="batasPengajuanHari"
            type="number"
            step="1"
            required
            defaultValue={j?.batasPengajuanHari ?? 0}
            className={inputCls}
            suppressHydrationWarning
          />
        </label>
      </div>
      <p className="-mt-2 text-xs text-muted">
        {isTahunan
          ? "Perubahan kuota Cuti Tahunan akan otomatis menyamakan kuota seluruh pengguna."
          : "Positif = H-n (sebelum mulai). 0 = H-0 (hari H). Negatif = H+n (setelah mulai)."}
      </p>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="wajibLampiran" defaultChecked={j?.wajibLampiran} suppressHydrationWarning /> Wajib melampirkan dokumen
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="potongKuota" defaultChecked={j?.potongKuota} suppressHydrationWarning /> Memotong kuota cuti tahunan
      </label>
      {j && (
        <label className="flex items-center gap-2 text-sm">
          <input type="hidden" name="aktif" value="false" />
          <input type="checkbox" name="aktif" defaultChecked={j.aktif} suppressHydrationWarning /> Aktif
        </label>
      )}
    </>
  );
}
