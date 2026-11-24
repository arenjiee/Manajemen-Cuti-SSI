"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "./Modal";
import HeaderUrut from "./HeaderUrut";
import { useToast } from "./ToastProvider";
import { btnDanger, btnGhost } from "./ui";
import { Trash2 } from "lucide-react";

export default function TabelPilih({
  label,
  header,
  baris,
  hapusAction,
  hapusMethod = "POST",
  hapusLabel = "Hapus terpilih",
  pesanHapus,
  idField = "ids",
  extraFields = {},
  selectName,
  selectForm,
  defaultSelectAll = false,
  onSelectChange,
}) {
  const router = useRouter();
  const tampilToast = useToast();

  const semuaId = baris.map((b) => b.id);
  const [terpilih, setTerpilih] = useState(() => (defaultSelectAll ? new Set(semuaId) : new Set()));
  const [modalBuka, setModalBuka] = useState(false);
  const [targetHapus, setTargetHapus] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorPesan, setErrorPesan] = useState("");

  const semuaRef = useRef(null);
  const semuaMobileRef = useRef(null);

  const jumlahTerpilih = semuaId.filter((id) => terpilih.has(id)).length;
  const semuaTerpilih = baris.length > 0 && jumlahTerpilih === baris.length;
  const sebagian = jumlahTerpilih > 0 && !semuaTerpilih;

  useEffect(() => {
    if (semuaRef.current) semuaRef.current.indeterminate = sebagian;
    if (semuaMobileRef.current) semuaMobileRef.current.indeterminate = sebagian;
  }, [sebagian]);

  // Urutan/pencarian berubah lewat navigasi klien (state ini tidak di-reset): buang pilihan
  // pada baris yang sudah tidak tampil supaya "Hapus terpilih" tidak menghapus baris tersembunyi.
  const kunciId = semuaId.join(",");
  const [kunciLama, setKunciLama] = useState(kunciId);
  if (kunciLama !== kunciId) {
    setKunciLama(kunciId);
    const ada = new Set(semuaId.map(String));
    setTerpilih((prev) => new Set([...prev].filter((id) => ada.has(String(id)))));
  }

  useEffect(() => {
    if (onSelectChange) {
      onSelectChange(Array.from(terpilih));
    }
  }, [terpilih, onSelectChange]);

  function toggleSemua() {
    setTerpilih(semuaTerpilih ? new Set() : new Set(semuaId));
  }

  function toggleSatu(id) {
    setTerpilih((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function konfirmasiHapus(ids) {
    setErrorPesan("");
    setTargetHapus(ids);
    setModalBuka(true);
  }

  async function eksekusiHapus() {
    if (targetHapus.length === 0) return;
    setLoading(true);
    setErrorPesan("");
    try {
      const fd = new FormData();
      targetHapus.forEach((id) => fd.append(idField, String(id)));
      Object.entries(extraFields).forEach(([k, v]) => fd.append(k, String(v ?? "")));

      const res = await fetch(hapusAction, {
        method: hapusMethod,
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setErrorPesan(data.message || data.pesan || "Gagal menghapus data.");
        setLoading(false);
        return;
      }

      setLoading(false);
      setModalBuka(false);
      setTerpilih((prev) => {
        const next = new Set(prev);
        targetHapus.forEach((id) => next.delete(id));
        return next;
      });
      tampilToast(data.message || data.pesan || "Data berhasil dihapus.", "sukses");
      router.refresh();
    } catch {
      setErrorPesan("Terjadi kesalahan jaringan.");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Hidden inputs untuk integrasi form native (misal: kirim pengingat kuota hangus) */}
      {selectName && (
        <div className="hidden" aria-hidden="true">
          {Array.from(terpilih).map((id) => (
            <input
              key={id}
              type="hidden"
              name={selectName}
              value={id}
              form={selectForm}
              suppressHydrationWarning
            />
          ))}
        </div>
      )}

      {/* Toolbar Seleksi & Bulk Action */}
      {jumlahTerpilih > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-4 text-sm shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center justify-center rounded-full bg-accent/15 px-3 py-1 font-mono text-xs font-semibold text-accent">
              {jumlahTerpilih} dipilih
            </span>
            {jumlahTerpilih < baris.length ? (
              <button
                type="button"
                onClick={() => setTerpilih(new Set(semuaId))}
                className="text-xs text-muted transition-colors hover:text-ink hover:underline"
                suppressHydrationWarning
              >
                Pilih semua ({baris.length})
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setTerpilih(new Set())}
                className="text-xs text-muted transition-colors hover:text-ink hover:underline"
                suppressHydrationWarning
              >
                Batalkan pilihan
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {hapusAction && (
              <>
                <button
                  type="button"
                  onClick={() => konfirmasiHapus(Array.from(terpilih))}
                  className={`${btnDanger} flex items-center gap-1.5`}
                  suppressHydrationWarning
                >
                  <Trash2 className="h-4 w-4" />
                  {hapusLabel} ({jumlahTerpilih})
                </button>
                {jumlahTerpilih < baris.length && (
                  <button
                    type="button"
                    onClick={() => {
                      setTerpilih(new Set(semuaId));
                      konfirmasiHapus(semuaId);
                    }}
                    className={`${btnDanger} opacity-85 hover:opacity-100 flex items-center gap-1.5`}
                    suppressHydrationWarning
                  >
                    Hapus semua ({baris.length})
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Desktop view: table */}
      <div className="hidden overflow-hidden rounded-2xl border border-line bg-surface md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-bg/40 font-mono text-[11px] tracking-wider text-muted uppercase">
              <tr>
                <th className="w-12 px-5 py-3.5">
                  <input
                    ref={semuaRef}
                    type="checkbox"
                    checked={semuaTerpilih}
                    onChange={toggleSemua}
                    aria-label="Pilih semua baris"
                    suppressHydrationWarning
                    className="h-4 w-4 cursor-pointer accent-accent"
                  />
                </th>
                {label.map((l, i) => (
                  <th key={l} className="px-5 py-3.5 font-medium whitespace-nowrap">
                    <HeaderUrut {...(header?.[i] ?? { label: l })} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line/70">
              {baris.map((b) => (
                <tr key={b.id} className="transition-colors hover:bg-ink/[0.02]">
                  <td className="w-12 px-5 py-3.5 align-middle">
                    <input
                      type="checkbox"
                      checked={terpilih.has(b.id)}
                      onChange={() => toggleSatu(b.id)}
                      aria-label="Pilih baris"
                      suppressHydrationWarning
                      className="h-4 w-4 cursor-pointer accent-accent"
                    />
                  </td>
                  {b.cells.map((c, i) => (
                    <td key={i} className="px-5 py-3.5 align-middle">
                      {c}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile view: cards */}
      <div className="md:hidden space-y-3">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              ref={semuaMobileRef}
              type="checkbox"
              checked={semuaTerpilih}
              onChange={toggleSemua}
              suppressHydrationWarning
              className="h-4 w-4 cursor-pointer accent-accent"
            />
            Pilih semua
          </label>
          {jumlahTerpilih > 0 && (
            <span className="font-mono text-xs text-muted">{jumlahTerpilih} dipilih</span>
          )}
        </div>
        <ul className="space-y-3">
          {baris.map((b) => (
            <li key={b.id} className="space-y-2 rounded-2xl border border-line bg-surface p-4 text-sm">
              <label className="flex items-center gap-2 border-b border-line/40 pb-1.5">
                <input
                  type="checkbox"
                  checked={terpilih.has(b.id)}
                  onChange={() => toggleSatu(b.id)}
                  suppressHydrationWarning
                  className="h-4 w-4 cursor-pointer accent-accent"
                />
                <span className="font-mono text-[11px] tracking-wide text-muted uppercase">Pilih</span>
              </label>
              {label.map((l, i) => (
                <div key={l} className="flex items-center justify-between gap-4 border-b border-line/40 pb-1.5 last:border-0 last:pb-0">
                  <span className="font-mono text-[11px] tracking-wide text-muted uppercase">{l}</span>
                  <span className="text-right text-ink font-medium">{b.cells[i]}</span>
                </div>
              ))}
            </li>
          ))}
        </ul>
      </div>

      {/* Modal Konfirmasi Hapus */}
      {hapusAction && (
        <Modal
          buka={modalBuka}
          onTutup={() => {
            if (!loading) {
              setModalBuka(false);
              setErrorPesan("");
            }
          }}
          judul="Konfirmasi Hapus"
          terkunci={loading}
        >
          <p className="text-sm text-muted">
            {targetHapus.length === baris.length
              ? `Hapus seluruh data (${targetHapus.length} item)? Tindakan ini tidak dapat dibatalkan.`
              : pesanHapus
                ? pesanHapus.replace("{count}", String(targetHapus.length))
                : `Hapus ${targetHapus.length} data yang dipilih? Tindakan ini tidak dapat dibatalkan.`}
          </p>

          {errorPesan && (
            <p role="alert" className="mt-3 rounded-lg border border-bad/30 bg-bad/10 p-3 text-xs text-bad">
              {errorPesan}
            </p>
          )}

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setModalBuka(false);
                setErrorPesan("");
              }}
              disabled={loading}
              className={btnGhost}
              suppressHydrationWarning
            >
              Batal
            </button>
            <button
              type="button"
              onClick={eksekusiHapus}
              disabled={loading}
              className={btnDanger}
              suppressHydrationWarning
            >
              {loading ? "Menghapus..." : "Ya, hapus"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
