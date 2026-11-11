const kontrol = "rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent";

// Form GET: filter dan sortir hidup di URL (searchParams), dirender server.
export default function FilterBar({ fields, values = {}, resetHref }) {
  return (
    <form method="get" className="mb-5 flex flex-wrap items-end gap-3">
      {fields.map((f) => (
        <label key={f.name} className="text-xs text-muted">
          {f.label}
          {f.type === "select" ? (
            <select name={f.name} defaultValue={values[f.name] ?? ""} className={`${kontrol} mt-1 block`}>
              <option value="">Semua</option>
              {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          ) : (
            <input name={f.name} type={f.type ?? "text"} defaultValue={values[f.name] ?? ""} placeholder={f.placeholder} className={`${kontrol} mt-1 block`} />
          )}
        </label>
      ))}
      <button className="rounded-lg bg-accent px-4 py-2 text-sm text-accent-ink">Terapkan</button>
      {resetHref && <a href={resetHref} className="px-2 py-2 text-sm text-muted hover:underline">Reset</a>}
    </form>
  );
}
