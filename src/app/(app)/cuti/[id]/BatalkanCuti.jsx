"use client";
import { useState } from "react";
import Modal from "@/components/Modal";
import FormAction from "@/components/FormAction";
import { inputCls, btnGhost } from "@/components/ui";
import { batalkanCutiAction } from "../ajukan/actions";

export default function BatalkanCuti({ id }) {
  const [buka, setBuka] = useState(false);
  return (
    <>
      <button onClick={() => setBuka(true)} className="rounded-lg border border-bad px-4 py-2 text-sm text-bad transition hover:bg-bad/10">Batalkan pengajuan</button>
      <Modal buka={buka} onTutup={() => setBuka(false)} judul="Batalkan pengajuan?">
        <FormAction action={batalkanCutiAction} label="Ya, batalkan">
          <input type="hidden" name="id" value={id} />
          <label className="block text-sm">Alasan pembatalan (wajib)
            <textarea name="alasan" required rows={3} className={`${inputCls} mt-1`} />
          </label>
        </FormAction>
        <button type="button" onClick={() => setBuka(false)} className={`${btnGhost} mt-3 w-full`}>Kembali</button>
      </Modal>
    </>
  );
}
