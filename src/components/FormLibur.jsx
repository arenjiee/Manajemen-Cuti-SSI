import { inputCls, labelCls, selectCls } from "./ui";

export default function FormLibur({ h }) {
  return (
    <>
      {h && <input type="hidden" name="id" value={h.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block"><span className={labelCls}>Tanggal</span><input name="tanggal" type="date" required defaultValue={h?.tanggal} className={inputCls} /></label>
        <label className="block"><span className={labelCls}>Jenis</span>
          <select name="jenis" defaultValue={h?.jenis ?? "nasional"} className={selectCls}>
            <option value="nasional">Libur nasional</option>
            <option value="cuti_bersama">Cuti bersama</option>
          </select>
        </label>
      </div>
      <label className="block"><span className={labelCls}>Keterangan</span><input name="keterangan" required defaultValue={h?.keterangan} className={inputCls} /></label>
    </>
  );
}
