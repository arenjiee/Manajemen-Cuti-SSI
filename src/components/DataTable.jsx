export default function DataTable({ kolom, rows, kosong = "Belum ada data." }) {
  if (rows.length === 0) {
    return <p className="rounded-xl border border-dashed border-line p-8 text-center text-sm text-muted">{kosong}</p>;
  }
  const sel = (k, r) => (k.render ? k.render(r) : r[k.key]);
  return (
    <>
      <div className="hidden overflow-x-auto rounded-xl border border-line bg-surface md:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line text-xs tracking-wide text-muted uppercase">
            <tr>{kolom.map((k) => <th key={k.label} className="px-4 py-3 font-medium">{k.label}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id ?? i} className="border-b border-line last:border-0">
                {kolom.map((k) => <td key={k.label} className="px-4 py-3 align-top">{sel(k, r)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="space-y-3 md:hidden">
        {rows.map((r, i) => (
          <li key={r.id ?? i} className="space-y-1.5 rounded-xl border border-line bg-surface p-4 text-sm">
            {kolom.map((k) => (
              <div key={k.label} className="flex justify-between gap-4">
                <span className="text-muted">{k.label}</span>
                <span className="text-right">{sel(k, r)}</span>
              </div>
            ))}
          </li>
        ))}
      </ul>
    </>
  );
}
