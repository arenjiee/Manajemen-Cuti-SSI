"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

// Menu melayang (portal ke <body>, posisi fixed) agar tidak terpotong oleh container yang bisa di-scroll.
// Ditutup lewat klik di luar, tombol Esc, resize, atau scroll.
export default function FloatingMenu({ x, y, rata = "kiri", onClose, label, children, ...hover }) {
  const ref = useRef(null);
  const [pos, setPos] = useState({ left: x, top: y });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const kiri = rata === "kanan" ? x - r.width : x;
    setPos({
      left: Math.max(8, Math.min(kiri, window.innerWidth - r.width - 8)),
      top: Math.max(8, Math.min(y, window.innerHeight - r.height - 8)),
    });
  }, [x, y, rata]);

  useEffect(() => {
    const luar = (e) => { if (!ref.current?.contains(e.target)) onClose(); };
    const esc = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("pointerdown", luar);
    document.addEventListener("keydown", esc);
    window.addEventListener("resize", onClose);
    window.addEventListener("scroll", onClose, true);
    return () => {
      document.removeEventListener("pointerdown", luar);
      document.removeEventListener("keydown", esc);
      window.removeEventListener("resize", onClose);
      window.removeEventListener("scroll", onClose, true);
    };
  }, [onClose]);

  return createPortal(
    <div
      ref={ref}
      role="menu"
      aria-label={label}
      style={{ left: pos.left, top: pos.top }}
      className="fixed z-50 min-w-48 rounded-xl border border-line bg-surface p-1 text-sm text-ink shadow-lg"
      {...hover}
    >
      {children}
    </div>,
    document.body
  );
}

export function MenuItem({ ikon: Ikon, bahaya, children, ...props }) {
  return (
    <button
      type="button"
      role="menuitem"
      className={`flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left transition hover:bg-ink/5 focus-visible:bg-ink/5 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40 ${bahaya ? "text-bad" : ""}`}
      {...props}
    >
      {Ikon && <Ikon className={`h-4 w-4 shrink-0 ${bahaya ? "" : "text-muted"}`} aria-hidden />}
      {children}
    </button>
  );
}

export const MenuSep = () => <div role="separator" className="my-1 h-px bg-line" />;
