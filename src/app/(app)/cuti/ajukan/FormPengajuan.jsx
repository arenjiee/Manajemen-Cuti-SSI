"use client";
import { useActionState, useState } from "react";
import Link from "next/link";
import { inputCls, btnPrimary, btnGhost } from "@/components/ui";
import { ajukanCutiAction } from "./actions";

const hint = (j) => {
  if (!j) return "";
  const b = j.batas > 0 ? `Diajukan minimal H-${j.batas}.` : j.batas === 0 ? "Tidak dapat diajukan untuk tanggal yang sudah lewat." : `Boleh diajukan sampai ${-j.batas} hari setelah mulai.`;
  return `${b}${j.lampiran ? " Wajib melampirkan dokumen." : ""}${j.potong ? " Memotong kuota tahunan." : ""}`;
};

export default function FormPengajuan({ jenis, rekan, sisa, tahun }) {
  const [state, formAction, pending] = useActionState(ajukanCutiAction, null);
  const [jenisId, setJenisId] = useState("");
  const [setengah, setSetengah] = useState(false);
  const [mulai, setMulai] = useState("");
  const [selesai, setSelesai] = useState("");
  const [lampiran, setLampiran] = useState(null);
  const [unggah, setUnggah] = useState({ loading: false, error: "" });
  const terpilih = jenis.find((j) => String(j.id) === jenisId);

  function reset() {
    setJenisId(""); setSetengah(false); setMulai(""); setSelesai(""); setLampiran(null); setUnggah({ loading: false, error: "" });
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

  const L = ({ t, children }) => <label className="block text-sm">{t}<div className="mt-1">{children}</div></label>;
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
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
          <select name="handoverId" required defaultValue="" className={inputCls}>
            <option value="" disabled>Pilih rekan satu divisi</option>
            {rekan.map((r) => <option key={r.id} value={r.id}>{r.nama_lengkap}</option>)}
          </select>
        </L>
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

      <aside className="h-fit space-y-3 rounded-xl border border-line bg-surface p-5 lg:sticky lg:top-10">
        <p className="text-sm text-muted">Sisa kuota tahunan {tahun}</p>
        <p className="font-display text-4xl font-semibold tabular-nums">{String(sisa).replace(".", ",")} <span className="text-base font-normal text-muted">hari</span></p>
        <p className="text-xs text-muted">Hari kerja dihitung otomatis (tanpa Sabtu, Minggu, dan hari libur). Simulasi kuota langsung tersedia setelah Task 17.</p>
      </aside>
    </div>
  );
}
