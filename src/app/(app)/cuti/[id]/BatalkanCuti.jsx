"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/Modal";
import AutoTextarea from "@/components/AutoTextarea";
import { inputCls, btnPrimary, btnGhost } from "@/components/ui";

export default function BatalkanCuti({ id }) {
  const router = useRouter();
  const [buka, setBuka] = useState(false);
  const [alasan, setAlasan] = useState("");
  const [pending, setPending] = useState(false);
  const [errorPesan, setErrorPesan] = useState("");

  async function handleBatal(e) {
    e.preventDefault();
    setPending(true);
    setErrorPesan("");

    try {
      const res = await fetch(`/api/cuti/${id}/batal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alasan }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErrorPesan(data.message || "Gagal membatalkan pengajuan.");
        setPending(false);
        return;
      }
      setBuka(false);
      router.refresh();
    } catch {
      setErrorPesan("Terjadi kesalahan jaringan.");
      setPending(false);
    }
  }

  return (
    <>
      <button
        onClick={() => {
          setBuka(true);
          setErrorPesan("");
          setAlasan("");
        }}
        className="rounded-lg border border-bad px-4 py-2 text-sm text-bad transition hover:bg-bad/10"
      >
        Batalkan pengajuan
      </button>
      <Modal buka={buka} onTutup={() => !pending && setBuka(false)} judul="Batalkan pengajuan?">
        <form onSubmit={handleBatal} className="space-y-4">
          <label className="block text-sm">
            Alasan pembatalan (wajib)
            <AutoTextarea
              name="alasan"
              required
              rows={2}
              value={alasan}
              onChange={(e) => setAlasan(e.target.value)}
              className={`${inputCls} mt-1`}
            />
          </label>
          {errorPesan && (
            <p role="alert" className="rounded-lg bg-bad/10 px-3 py-2 text-sm text-bad">
              {errorPesan}
            </p>
          )}
          <button disabled={pending} className={btnPrimary}>
            {pending ? "Membatalkan…" : "Ya, batalkan"}
          </button>
        </form>
        <button
          type="button"
          disabled={pending}
          onClick={() => setBuka(false)}
          className={`${btnGhost} mt-3 w-full`}
        >
          Kembali
        </button>
      </Modal>
    </>
  );
}
