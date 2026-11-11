"use client";
import { useEffect, useRef } from "react";

export default function Modal({ buka, onTutup, judul, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (buka && !d.open) d.showModal();
    if (!buka && d.open) d.close();
  }, [buka]);

  return (
    <dialog
      ref={ref}
      onClose={onTutup}
      onClick={(e) => e.target === ref.current && onTutup()}
      className="m-auto w-full max-w-md rounded-2xl border border-line bg-surface p-0 text-ink backdrop:bg-ink/40"
    >
      <div className="p-6">
        <h2 className="text-xl font-semibold">{judul}</h2>
        <div className="mt-4">{children}</div>
      </div>
    </dialog>
  );
}
