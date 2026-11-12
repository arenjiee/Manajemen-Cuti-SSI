"use client";
import { useState } from "react";
import Link from "next/link";
import Modal from "./Modal";
import FormAction from "./FormAction";
import { inputCls, btnPrimary, btnGhost } from "./ui";
import { formatRentang, formatHari, formatTanggal } from "../lib/format";

const inisial = (n) => n.split(/\s+/).slice(0, 2).map((x) => x[0]).join("").toUpperCase();

export default function KartuApproval({ p, action, children, pilih }) {
  const [mode, setMode] = useState(null); // "approve" | "reject" | null
  const tolak = mode === "reject";
  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-5">
      <header className="flex items-start gap-3">
        {pilih}
        <span aria-hidden className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent/10 font-display text-sm font-semibold text-accent">{inisial(p.pengaju_nama)}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{p.pengaju_nama}</p>
          <p className="text-xs text-muted">{p.divisi_nama ?? "Tanpa divisi"} · diajukan {formatTanggal(p.tanggal_pengajuan)}</p>
        </div>
      </header>
      <div>
        <p className="font-display text-xl font-semibold">{p.jenis_nama}</p>
        <p className="text-sm">{formatRentang(p.tanggal_mulai, p.tanggal_selesai)} · {formatHari(p.total_hari)} hari kerja{p.setengah_hari ? " (setengah hari)" : ""}</p>
      </div>
      <dl className="space-y-2 text-sm">
        <div><dt className="text-xs text-muted">Alasan</dt><dd>{p.alasan}</dd></div>
        <div><dt className="text-xs text-muted">Catatan tugas</dt><dd>{p.catatan_tugas || "-"}</dd></div>
        <div><dt className="text-xs text-muted">Rekan pengganti</dt><dd>{p.handover_nama || "-"}</dd></div>
      </dl>
      {p.lampiran.length > 0 && (
        <p className="text-sm">
          Lampiran: {p.lampiran.map((l) => <a key={l.id} href={`/api/lampiran/${l.id}`} target="_blank" rel="noreferrer" className="mr-2 text-accent hover:underline">{l.nama_asli}</a>)}
        </p>
      )}
      {children}
      <footer className="mt-auto flex flex-wrap items-center gap-2 pt-1">
        <button onClick={() => setMode("approve")} className={btnPrimary}>Setujui</button>
        <button onClick={() => setMode("reject")} className="rounded-lg border border-bad px-4 py-2 text-sm text-bad transition hover:bg-bad/10">Tolak</button>
        <Link href={`/cuti/${p.id}`} className="ml-auto text-sm text-muted hover:underline">Detail</Link>
      </footer>

      <Modal buka={mode !== null} onTutup={() => setMode(null)} judul={tolak ? "Tolak pengajuan?" : "Setujui pengajuan?"}>
        <p className="mb-3 text-sm text-muted">{p.pengaju_nama} · {p.jenis_nama} · {formatRentang(p.tanggal_mulai, p.tanggal_selesai)}</p>
        <FormAction action={action} label={tolak ? "Ya, tolak" : "Ya, setujui"}>
          <input type="hidden" name="id" value={p.id} />
          <input type="hidden" name="keputusan" value={mode ?? "approve"} />
          <label className="block text-sm">
            {tolak ? "Catatan penolakan (wajib)" : "Catatan (opsional)"}
            <textarea name="catatan" rows={3} required={tolak} className={`${inputCls} mt-1`} />
          </label>
        </FormAction>
        <button type="button" onClick={() => setMode(null)} className={`${btnGhost} mt-3 w-full`}>Kembali</button>
      </Modal>
    </article>
  );
}
