import Link from "next/link";
import { btnGhost, btnPrimary, inputCls, labelCls, selectCls } from "@/components/ui";

// Form GET: filter dan sortir hidup di URL (searchParams), dirender server.
export default function FilterBar({ fields, values = {}, resetHref }) {
  return (
    <form method="get" className="flex flex-wrap items-end gap-3 rounded-2xl border border-line bg-surface/60 p-4">
      {fields.map((f) => (
        <label key={f.name} className="min-w-36 flex-1">
          <span className={labelCls}>{f.label}</span>
          {f.type === "select" ? (
            <select name={f.name} defaultValue={values[f.name] ?? ""} className={selectCls}>
              <option value="">Semua</option>
              {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          ) : (
            <input name={f.name} type={f.type ?? "text"} defaultValue={values[f.name] ?? ""} placeholder={f.placeholder} className={inputCls} />
          )}
        </label>
      ))}
      <button className={btnPrimary}>Terapkan</button>
      {resetHref && <Link href={resetHref} className={btnGhost}>Reset</Link>}
    </form>
  );
}
