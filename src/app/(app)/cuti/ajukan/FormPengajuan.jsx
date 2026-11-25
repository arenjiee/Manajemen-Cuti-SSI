"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useDropzone } from "react-dropzone";
import { FileText, Upload, X } from "lucide-react";
import { inputCls, btnPrimary, btnGhost, labelCls, selectCls } from "@/components/ui";
import KalenderMini from "@/components/KalenderMini";
import AutoTextarea from "@/components/AutoTextarea";
import { formatHari, formatTanggal } from "@/lib/format";
import { labelBatasPengajuan, keteranganBatasPengajuan } from "@/lib/leave/aturan-jenis";

const hint = (j) => {
  if (!j) return "";
  const b = `Diajukan ${labelBatasPengajuan(j.batas)} (${keteranganBatasPengajuan(j.batas)}).`;
  return `${b}${j.lampiran ? " Wajib melampirkan dokumen." : ""}${j.potong ? " Memotong kuota tahunan." : ""}`;
};

const L = ({ t, children }) => <label className="block"><span className={labelCls}>{t}</span>{children}</label>;

export default function FormPengajuan({ jenis, rekan, sisa, tahun, kalenderAwal = [], hariLiburMendatang = [] }) {
  const router = useRouter();
  const [errorPesan, setErrorPesan] = useState("");
  const [pending, setPending] = useState(false);
  const [jenisId, setJenisId] = useState("");
  const [set半分, setSetengah] = useState(false);
  const [jamMulai, setJamMulai] = useState("08:00");
  const [jamSelesai, setJamSelesai] = useState("12:00");
  const [mulai, setMulai] = useState("");
  const [selesai, setSelesai] = useState("");
  const [handoverId, setHandoverId] = useState("");
  const [lampiran, setLampiran] = useState(null);
  const [unggah, setUnggah] = useState({ loading: false, error: "" });
  const [sim, setSim] = useState(null);
  const [simMuat, setSimMuat] = useState(false);
  const urutan = useRef(0);
  const terpilih = jenis.find((j) => String(j.id) === jenisId);
  const isTahunan = Boolean(terpilih && (terpilih.kode === "tahunan" || (terpilih.isSystem && terpilih.nama.toLowerCase().includes("tahunan"))));

  function handlePilihJenis(id) {
    setJenisId(id);
    const j = jenis.find((item) => String(item.id) === id);
    const bolehSetengah = j && (j.kode === "tahunan" || (j.isSystem && j.nama.toLowerCase().includes("tahunan")));
    if (!bolehSetengah) {
      setSetengah(false);
    }
  }

  useEffect(() => {
    if (!mulai || !selesai) return;
    const nomor = ++urutan.current;
    const t = setTimeout(async () => {
      setSimMuat(true);
      try {
        const res = await fetch("/api/cuti/simulasi", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jenisId,
            mulai,
            selesai,
            setengahHari: isTahunan && set半分,
            jamMulai: isTahunan && set半分 ? jamMulai : "",
            jamSelesai: isTahunan && set半分 ? jamSelesai : "",
            handoverId,
          }),
        });
        const r = await res.json();
        if (nomor === urutan.current) setSim(r.siap ? r : null);
      } catch {
        if (nomor === urutan.current) setSim(null);
      } finally {
        if (nomor === urutan.current) setSimMuat(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [jenisId, mulai, selesai, set半分, isTahunan, jamMulai, jamSelesai, handoverId]);

  const punyaSim = Boolean(mulai && selesai && sim);
  const opsiRekan = punyaSim ? sim.kandidatRekan.map((r) => ({ id: r.id, nama_lengkap: r.nama })) : rekan;
  const rekanDipilih = opsiRekan.some((r) => String(r.id) === handoverId) ? handoverId : "";

  function reset() {
    urutan.current++;
    setJenisId("");
    setSetengah(false);
    setJamMulai("08:00");
    setJamSelesai("12:00");
    setMulai("");
    setSelesai("");
    setHandoverId("");
    setLampiran(null);
    setSim(null);
    setUnggah({ loading: false, error: "" });
    setErrorPesan("");
  }

  function handlePilihTanggal(arg1, arg2) {
    let m = "";
    let s = "";
    if (typeof arg1 === "object" && arg1 !== null) {
      m = arg1.mulai ?? "";
      s = arg1.selesai ?? "";
    } else if (typeof arg1 === "string") {
      m = arg1;
      s = typeof arg2 === "string" ? arg2 : arg1;
    }
    setMulai(m);
    setSelesai(s);
  }

  const onDrop = useCallback(async (acceptedFiles, fileRejections) => {
    if (fileRejections.length > 0) {
      const rej = fileRejections[0];
      if (rej.errors.some((e) => e.code === "file-too-large")) {
        setUnggah({ loading: false, error: "Ukuran berkas melebihi batas 2 MB." });
      } else if (rej.errors.some((e) => e.code === "file-invalid-type")) {
        setUnggah({ loading: false, error: "Format berkas harus PDF." });
      } else {
        setUnggah({ loading: false, error: rej.errors[0]?.message || "Berkas tidak valid." });
      }
      return;
    }
    const f = acceptedFiles?.[0];
    if (!f) return;
    setUnggah({ loading: true, error: "" });
    const fd = new FormData();
    fd.append("berkas", f);
    try {
      const res = await fetch("/api/lampiran", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setLampiran(null);
        return setUnggah({ loading: false, error: data.message || "Gagal mengunggah berkas." });
      }
      setLampiran(data);
      setUnggah({ loading: false, error: "" });
    } catch {
      setUnggah({ loading: false, error: "Gagal mengunggah berkas." });
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    maxSize: 2 * 1024 * 1024,
    multiple: false,
  });

  async function handleSubmit(e) {
    e.preventDefault();
    setPending(true);
    setErrorPesan("");

    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/cuti", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErrorPesan(data.message || "Gagal menyimpan pengajuan cuti.");
        setPending(false);
        return;
      }
      router.push(`/cuti/${data.id}`);
      router.refresh();
    } catch {
      setErrorPesan("Terjadi kesalahan jaringan saat mengirim pengajuan.");
      setPending(false);
    }
  }

  const sisaTampil = punyaSim ? sim.sisaSekarang : sisa;
  const tahunTampil = punyaSim ? sim.tahun : tahun;
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
      <form onSubmit={handleSubmit} onReset={reset} className="space-y-5 rounded-2xl border border-line bg-surface p-5 sm:p-6">
        <L t="Jenis cuti">
          <select name="jenisId" required value={jenisId} onChange={(e) => handlePilihJenis(e.target.value)} className={selectCls}>
            <option value="" disabled>Pilih jenis cuti</option>
            {jenis.map((j) => <option key={j.id} value={j.id}>{j.nama}</option>)}
          </select>
        </L>
        {terpilih && <p className="-mt-3 text-sm text-muted">{hint(terpilih)}</p>}

        {isTahunan && (
          <div className="space-y-3 rounded-xl border border-line/60 bg-ink/5 p-3.5">
            <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
              <input
                type="checkbox"
                name="setengahHari"
                checked={set半分}
                onChange={(e) => {
                  setSetengah(e.target.checked);
                  if (e.target.checked) setSelesai(mulai);
                }}
                className="rounded border-line accent-accent"
              />
              <span>Cuti setengah hari (0,5 hari)</span>
            </label>
            {set半分 && (
              <div className="space-y-2 pt-1">
                <div className="grid gap-3 sm:grid-cols-2">
                  <L t="Jam mulai">
                    <input
                      name="jamMulai"
                      type="time"
                      required
                      value={jamMulai}
                      onChange={(e) => setJamMulai(e.target.value)}
                      className={inputCls}
                    />
                  </L>
                  <L t="Jam selesai">
                    <input
                      name="jamSelesai"
                      type="time"
                      required
                      value={jamSelesai}
                      onChange={(e) => setJamSelesai(e.target.value)}
                      className={inputCls}
                    />
                  </L>
                </div>
                <p className="text-sm text-muted">Rentang jam maksimal 4 jam.</p>
              </div>
            )}
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <L t="Tanggal mulai">
            <input name="mulai" type="date" required value={mulai ?? ""} className={inputCls}
              onChange={(e) => { setMulai(e.target.value); if (set半分 || !selesai || selesai < e.target.value) setSelesai(e.target.value); }} />
          </L>
          <L t="Tanggal selesai">
            <input name="selesai" type="date" required value={selesai ?? ""} min={mulai || undefined} readOnly={set半分} className={inputCls} onChange={(e) => setSelesai(e.target.value)} />
          </L>
        </div>

        <L t="Alasan cuti"><AutoTextarea name="alasan" required rows={2} placeholder="Tuliskan alasan pengajuan cuti..." className={inputCls} /></L>
        <L t="Rekan pengganti (handover)">
          <select name="handoverId" required value={rekanDipilih} onChange={(e) => setHandoverId(e.target.value)} className={selectCls}>
            <option value="" disabled>{punyaSim ? "Pilih rekan yang tersedia pada tanggal tersebut" : "Pilih rekan satu divisi"}</option>
            {opsiRekan.map((r) => <option key={r.id} value={r.id}>{r.nama_lengkap}</option>)}
          </select>
        </L>
        {punyaSim && opsiRekan.length === 0 && <p className="-mt-3 text-sm text-bad">Tidak ada rekan yang tersedia pada tanggal tersebut.</p>}
        <L t="Catatan tugas untuk rekan pengganti">
          <AutoTextarea
            name="catatanTugas"
            required
            rows={2}
            placeholder="Tuliskan serah terima tugas pekerjaan..."
            className={inputCls}
          />
        </L>
        <div className="grid gap-4 sm:grid-cols-2">
          <L t="Alamat selama cuti"><input name="alamatCuti" className={inputCls} /></L>
          <L t="Nomor darurat">
            <input
              name="nomorDarurat"
              required
              inputMode="numeric"
              pattern="[0-9]{10,13}"
              minLength={10}
              maxLength={13}
              placeholder="08xxxxxxxxxx"
              className={inputCls}
              onInput={(e) => {
                e.target.value = e.target.value.replace(/\D/g, "").slice(0, 13);
              }}
            />
          </L>
        </div>

        <div className="space-y-2">
          <span className={labelCls}>
            Surat dokter / lampiran{" "}
            {terpilih?.lampiran ? (
              <span className="text-bad">(wajib)</span>
            ) : (
              <span className="text-muted">(opsional)</span>
            )}
          </span>
          <input type="hidden" name="lampiranId" value={lampiran?.id ?? ""} />

          {lampiran ? (
            <div className="flex items-center justify-between rounded-xl border border-ok/30 bg-ok/10 p-3.5 text-sm">
              <div className="flex items-center gap-2.5 min-w-0">
                <FileText className="h-5 w-5 shrink-0 text-ok" />
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink" title={lampiran.nama}>{lampiran.nama}</p>
                  <p className="text-sm text-ok">Berkas berhasil diunggah</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLampiran(null)}
                className="ml-3 shrink-0 rounded-lg p-1 text-muted transition hover:bg-ink/5 hover:text-bad"
                title="Hapus lampiran"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div
              {...getRootProps()}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition ${isDragActive
                  ? "border-accent bg-accent/10"
                  : "border-line bg-surface hover:border-line-focus hover:bg-ink/5"
                }`}
            >
              <input {...getInputProps()} />
              <Upload className={`h-8 w-8 ${isDragActive ? "text-accent" : "text-muted"}`} />
              <p className="mt-2 text-sm font-medium text-ink">
                {isDragActive ? "Lepaskan berkas di sini" : "Tarik & lepas berkas ke sini, atau klik untuk memilih"}
              </p>
              <p className="mt-1 text-sm text-muted">Format: PDF (Maks. 2 MB)</p>
            </div>
          )}

          {unggah.loading && <p className="text-sm text-muted">Mengunggah…</p>}
          {unggah.error && <p role="alert" className="text-sm text-bad">{unggah.error}</p>}
        </div>

        {errorPesan && <p role="alert" className="rounded-lg bg-bad/10 px-3 py-2 text-sm text-bad">{errorPesan}</p>}
        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" disabled={pending || unggah.loading} className={btnPrimary}>{pending ? "Mengirim…" : "Kirim pengajuan"}</button>
          <button type="reset" className={btnGhost}>Reset</button>
          <Link href="/cuti" className={btnGhost}>Batal</Link>
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
        {simMuat && <p className="text-sm text-muted">Menghitung simulasi…</p>}
        {punyaSim && !simMuat && (sim.ok
          ? <p role="status" className="rounded-lg bg-ok/10 px-3 py-2 text-sm text-ok">Tanggal ini memenuhi syarat untuk diajukan.</p>
          : sim.pesan && <p role="alert" className="rounded-lg bg-bad/10 px-3 py-2 text-sm text-bad">{sim.pesan}</p>)}

        {punyaSim && sim.hariLiburTerlewati?.length > 0 && (
          <div className="rounded-xl border border-line bg-ink/5 p-3 text-sm space-y-2">
            <div className="flex items-center gap-1.5 font-medium text-ink">
              <span>🎉</span>
              <span>{sim.hariLiburTerlewati.length} Hari Libur Terdeteksi</span>
            </div>
            <ul className="space-y-1 text-muted text-sm pl-4 list-disc">
              {sim.hariLiburTerlewati.map((hl) => (
                <li key={hl.tanggal}>
                  <span className="font-medium text-ink">{formatTanggal(hl.tanggal)}</span>: {hl.keterangan} ({hl.jenis === "cuti_bersama" ? "Cuti Bersama" : "Libur Nasional"})
                </li>
              ))}
            </ul>
            <p className="text-sm text-muted">Tanggal di atas bebas potong kuota (tidak dihitung sebagai hari cuti).</p>
          </div>
        )}

        {punyaSim && (
          <KalenderMini
            kalender={sim.kalender}
            mulai={mulai}
            selesai={selesai}
            setengahHari={set半分}
            onPilihTanggal={handlePilihTanggal}
          />
        )}

        {!punyaSim && (
          <div className="space-y-4 border-t border-line pt-3">
            <div>
              <p className="text-sm font-semibold text-ink mb-2">Kalender & Hari Libur</p>
              <KalenderMini
                kalender={kalenderAwal}
                mulai={mulai}
                selesai={selesai}
                setengahHari={set半分}
                onPilihTanggal={handlePilihTanggal}
              />
            </div>

            {hariLiburMendatang?.length > 0 && (
              <div className="border-t border-line pt-3 space-y-2">
                <p className="text-sm font-semibold text-ink">Libur & Cuti Bersama Terdekat</p>
                <ul className="space-y-1.5 text-sm">
                  {hariLiburMendatang.map((h) => {
                    const isCuti = h.jenis === "cuti_bersama";
                    return (
                      <li
                        key={h.tanggal}
                        onClick={() => {
                          setMulai(h.tanggal);
                          setSelesai(h.tanggal);
                        }}
                        title="Klik untuk memilih tanggal ini"
                        className="flex items-start justify-between gap-2 p-2 rounded-lg border border-line bg-ink/5 hover:border-accent/40 cursor-pointer transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-ink truncate" title={h.keterangan}>{h.keterangan}</p>
                          <p className="text-muted text-sm">{formatTanggal(h.tanggal)}</p>
                        </div>
                        <span className={`shrink-0 rounded px-1.5 py-0.5 text-xs font-medium ${isCuti ? "bg-warn/20 text-ink" : "bg-bad/20 text-bad"}`}>
                          {isCuti ? "Cuti Bersama" : "Libur Nasional"}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
            <p className="text-sm text-muted">Pilih tanggal di kalender atau form untuk melihat simulasi kuota dan rekan pengganti.</p>
          </div>
        )}
      </aside>
    </div>
  );
}
