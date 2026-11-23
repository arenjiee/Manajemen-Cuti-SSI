import { Fragment } from "react";
import EmptyState from "./EmptyState";
import TabelPilih from "./TabelPilih";
import HeaderUrut from "./HeaderUrut";

export default function DataTable({
  kolom,
  rows,
  kosong = "Belum ada data.",
  selectable = false,
  hapusAction,
  hapusLabel,
  pesanHapus,
  idField,
  extraFields,
  selectName,
  selectForm,
  defaultSelectAll = false,
  onSelectChange,
  sort,
}) {
  if (rows.length === 0) {
    return <EmptyState title="Tidak ada data" description={kosong} />;
  }

  // sort = { basePath, params, urut, arah }. Kolom dengan `sortKey` jadi header yang bisa diklik;
  // klik pertama = A-Z, klik berikutnya pada kolom yang sama membalik arah. URL dibangun di server
  // agar bisa diteruskan ke TabelPilih (komponen klien) sebagai data biasa.
  const header = kolom.map((k) => {
    if (!sort || !k.sortKey) return { label: k.label };
    const aktif = sort.urut === k.sortKey;
    const arahSekarang = aktif ? (sort.arah === "desc" ? "desc" : "asc") : null;
    const usp = new URLSearchParams();
    Object.entries(sort.params ?? {}).forEach(([n, v]) => { if (v) usp.set(n, v); });
    usp.set("urut", k.sortKey);
    usp.set("arah", arahSekarang === "asc" ? "desc" : "asc");
    return { label: k.label, href: `${sort.basePath}?${usp.toString()}`, arah: arahSekarang };
  });

  const sel = (k, r) => (k.render ? k.render(r) : r[k.key]);

  // Sel dirender di server lalu dikirim sebagai node agar kolom dengan render() tetap bisa dipakai
  // oleh komponen klien yang menyimpan state pilihan.
  if (selectable) {
    return (
      <TabelPilih
        label={kolom.map((k) => k.label)}
        header={header}
        baris={rows.map((r, i) => ({
          id: r.id ?? i,
          cells: kolom.map((k) => <Fragment key={k.label}>{sel(k, r)}</Fragment>),
        }))}
        hapusAction={hapusAction}
        hapusLabel={hapusLabel}
        pesanHapus={pesanHapus}
        idField={idField}
        extraFields={extraFields}
        selectName={selectName}
        selectForm={selectForm}
        defaultSelectAll={defaultSelectAll}
        onSelectChange={onSelectChange}
      />
    );
  }

  return (
    <>
      {/* Desktop view: table */}
      <div className="hidden overflow-hidden rounded-2xl border border-line bg-surface md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-bg/40 font-mono text-[11px] tracking-wider text-muted uppercase">
              <tr>
                {kolom.map((k) => (
                  <th key={k.label} className="px-5 py-3.5 font-medium whitespace-nowrap">
                    <HeaderUrut {...header[kolom.indexOf(k)]} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line/70">
              {rows.map((r, i) => (
                <tr
                  key={r.id ?? i}
                  className="transition-colors hover:bg-ink/[0.02]"
                >
                  {kolom.map((k) => (
                    <td key={k.label} className="px-5 py-3.5 align-middle">
                      {sel(k, r)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile view: cards */}
      <ul className="space-y-3 md:hidden">
        {rows.map((r, i) => (
          <li
            key={r.id ?? i}
            className="space-y-2 rounded-2xl border border-line bg-surface p-4 text-sm"
          >
            {kolom.map((k) => (
              <div key={k.label} className="flex items-center justify-between gap-4 border-b border-line/40 pb-1.5 last:border-0 last:pb-0">
                <span className="font-mono text-[11px] tracking-wide text-muted uppercase">
                  {k.label}
                </span>
                <span className="text-right text-ink font-medium">{sel(k, r)}</span>
              </div>
            ))}
          </li>
        ))}
      </ul>
    </>
  );
}
