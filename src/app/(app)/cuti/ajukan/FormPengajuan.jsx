"use client";
import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { inputCls, btnPrimary, btnGhost } from "@/components/ui";
import KalenderMini from "@/components/KalenderMini";
import { formatHari } from "@/lib/format";
import { ajukanCutiAction, simulasiAction } from "./actions";

const hint = (j) => {
  if (!j) return "";
  const b = j.batas > 0 ? `Diajukan minimal H-${j.batas}.` : j.batas === 0 ? "Tidak dapat diajukan untuk tanggal yang sudah lewat." : `Boleh diajukan sampai ${-j.batas} hari setelah mulai.`;
  return `${b}${j.lampiran ? " Wajib melampirkan dokumen." : ""}${j.potong ? " Memotong kuota tahunan." : ""}`;
};

const L = ({ t, children }) => <label className="block text-sm">{t}<div className="mt-1">{children}</div></label>;

export default function FormPengajuan({ jenis, rekan, sisa, tahun }) {
  const [state, formAction, pending] = useActionState(ajukanCutiAction, null);
  const [jenisId, setJenisId] = useState("");
  const [setengah, setSetengah] = useState(false);
  const [mulai, setMulai] = useState("");
  const [selesai, setSelesai] = useState("");
  const [handoverId, setHandoverId] = useState("");
  const [lampiran, setLampiran] = useState(null);
  const [unggah, setUnggah] = useState({ loading: false, error: "" });
  const [sim, setSim] = useState(null);
  const [simMuat, setSimMuat] = useState(false);
  const urutan = useRef(0);
  const terpilih = jenis.find((j) => String(j.id) === jenisId);

  useEffect(() => {
    if (!mulai || !selesai) return;
    const nomor = ++urutan.current;
    const t = setTimeout(async () => {
      setSimMuat(true);
      try {
        const r = await simulasiAction({ jenisId, mulai, selesai, setengahHari: setengah, handoverId });
        if (nomor === urutan.current) setSim(r.siap ? r : null);
      } catch {
        if (nomor === urutan.current) setSim(null);
      } finally {
        if (nomor === urutan.current) setSimMuat(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [jenisId, mulai, selesai, setengah, handoverId]);

  const punyaSim = Boolean(mulai && selesai && sim);
  const opsiRekan = punyaSim ? sim.kandidatRekan.map((r) => ({ id: r.id, nama_lengkap: r.nama })) : rekan;
  const rekanDipilih = opsiRekan.some((r) => String(r.id) === handoverId) ? handoverId : "";

  function reset() {
    urutan.current++;
    setJenisId(""); setSetengah(false); setMulai(""); setSelesai(""); setHandoverId(""); setLampiran(null); setSim(null); setUnggah({ loading: false, error: "" });
  }

  async function pilihBerkas(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setUnggah({ loading: true, error: "" });
    const fd = new FormData();
    fd.append("berkas", f);
    try {
      const res = await fetch("/api/lampiran", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) { setLampiran(null); return setUnggah({ loading: false, error: data.message }); }
      setLampiran(data);
      setUnggah({ loading: false, error: "" });
    } catch {
      setUnggah({ loading: false, error: "Gagal mengunggah berkas." });
    }
  }

  const sisaTampil = punyaSim ? sim.sisaSekarang : sisa;
  const tahunTampil = punyaSim ? sim.tahun : tahun;
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
      <form action={formAction} onReset={reset} className="space-y-5">
        <L t="Jenis cuti">
          <select name="jenisId" required value={jenisId} onChange={(e) => setJenisId(e.target.value)} className={inputCls}>
            <option value="" disabled>Pilih jenis cuti</option>
            {jenis.map((j) => <option key={j.id} value={j.id}>{j.nama}</option>)}
          </select>
        </L>
        {terpilih && <p className="-mt-3 text-xs text-muted">{hint(terpilih)}</p>}

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="setengahHari" checked={setengah} onChange={(e) => { setSetengah(e.target.checked); if (e.target.checked) setSelesai(mulai); }} />
          Cuti setengah hari (0,5 hari)
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <L t="Tanggal mulai">
            <input name="mulai" type="date" required value={mulai} className={inputCls}
              onChange={(e) => { setMulai(e.target.value); if (setengah || !selesai || selesai < e.target.value) setSelesai(e.target.value); }} />
          </L>
          <L t="Tanggal selesai">
            <input name="selesai" type="date" required value={selesai} min={mulai || undefined} readOnly={setengah} className={inputCls} onChange={(e) => setSelesai(e.target.value)} />
          </L>
        </div>

        <L t="Alasan cuti"><textarea name="alasan" required rows={3} className={inputCls} /></L>
        <L t="Rekan pengganti (handover)">
          <select name="handoverId" required value={rekanDipilih} onChange={(e) => setHandoverId(e.target.value)} className={inputCls}>
            <option value="" disabled>{punyaSim ? "Pilih rekan yang tersedia pada tanggal tersebut" : "Pilih rekan satu divisi"}</option>
            {opsiRekan.map((r) => <option key={r.id} value={r.id}>{r.nama_lengkap}</option>)}
          </select>
        </L>
        {punyaSim && opsiRekan.length === 0 && <p className="-mt-3 text-xs text-bad">Tidak ada rekan yang tersedia pada tanggal tersebut.</p>}
        <L t="Catatan tugas untuk rekan pengganti"><textarea name="catatanTugas" rows={3} className={inputCls} /></L>
        <div className="grid gap-4 sm:grid-cols-2">
          <L t="Alamat selama cuti"><input name="alamatCuti" className={inputCls} /></L>
          <L t="Nomor darurat"><input name="nomorDarurat" inputMode="tel" className={inputCls} /></L>
        </div>

        <div className="text-sm">
          Surat dokter / lampiran {terpilih?.lampiran ? <span className="text-bad">(wajib)</span> : <span className="text-muted">(opsional)</span>}
          <input type="file" accept="application/pdf,image/jpeg,image/png" onChange={pilihBerkas} className={`${inputCls} mt-1`} />
          <input type="hidden" name="lampiranId" value={lampiran?.id ?? ""} />
          <p className="mt-1 text-xs text-muted">PDF, JPG, atau PNG, maksimal 2 MB.</p>
          {unggah.loading && <p className="mt-1 text-xs text-muted">Mengunggah…</p>}
          {lampiran && <p className="mt-1 text-xs text-ok">Terunggah: {lampiran.nama}</p>}
          {unggah.error && <p role="alert" className="mt-1 text-xs text-bad">{unggah.error}</p>}
        </div>

        {state?.pesan && <p role="alert" className="rounded-lg bg-bad/10 px-3 py-2 text-sm text-bad">{state.pesan}</p>}
        <div className="flex flex-wrap gap-3">
          <button disabled={pending || unggah.loading} className={btnPrimary}>{pending ? "Mengirim…" : "Kirim pengajuan"}</button>
          <button type="reset" className={btnGhost}>Reset</button>
          <Link href="/cuti" className="px-2 py-2 text-sm text-muted hover:underline">Batal</Link>
        </div>
      </form>

      <aside className="h-fit space-y-4 rounded-xl border border-line bg-surface p-5 lg:sticky lg:top-10" aria-live="polite">
        <div>
          <p className="text-sm text-muted">Sisa kuota tahunan {tahunTampil}</p>
          <p className="font-display text-4xl font-semibold tabular-nums">
            {formatHari(sisaTampil)} <span className="text-base font-normal text-muted">hari</span>
          </p>
        </div>
        {punyaSim && (
          <dl className="space-y-1.5 border-t border-line pt-3 text-sm">
            <div className="flex justify-between gap-4"><dt className="text-muted">Hari kerja dipakai</dt><dd className="tabular-nums">{formatHari(sim.totalHari)}</dd></div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Sisa setelah cuti</dt>
              <dd className={`tabular-nums ${sim.sisaSetelah != null && sim.sisaSetelah < 0 ? "text-bad" : ""}`}>{sim.sisaSetelah == null ? "Tidak memotong kuota" : `${formatHari(sim.sisaSetelah)} hari`}</dd>
            </div>
          </dl>
        )}
        {simMuat && <p className="text-xs text-muted">Menghitung simulasi…</p>}
        {punyaSim && !simMuat && (sim.ok
          ? <p role="status" className="rounded-lg bg-ok/10 px-3 py-2 text-sm text-ok">Tanggal ini memenuhi syarat untuk diajukan.</p>
          : sim.pesan && <p role="alert" className="rounded-lg bg-bad/10 px-3 py-2 text-sm text-bad">{sim.pesan}</p>)}
        {punyaSim && <KalenderMini kalender={sim.kalender} mulai={mulai} selesai={selesai} />}
        {!punyaSim && <p className="text-xs text-muted">Pilih tanggal untuk melihat simulasi kuota, kapasitas divisi, dan rekan pengganti yang tersedia.</p>}
      </aside>
    </div>
  );
}
