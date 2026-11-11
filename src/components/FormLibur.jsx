import { inputCls } from "./ui";

export default function FormLibur({ h }) {
  return (
    <>
      {h && <input type="hidden" name="id" value={h.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">Tanggal<input name="tanggal" type="date" required defaultValue={h?.tanggal} className={`${inputCls} mt-1`} /></label>
        <label className="block text-sm">Jenis
          <select name="jenis" defaultValue={h?.jenis ?? "nasional"} className={`${inputCls} mt-1`}>
            <option value="nasional">Libur nasional</option>
            <option value="cuti_bersama">Cuti bersama</option>
          </select>
        </label>
      </div>
      <label className="block text-sm">Keterangan<input name="keterangan" required defaultValue={h?.keterangan} className={`${inputCls} mt-1`} /></label>
    </>
  );
}
