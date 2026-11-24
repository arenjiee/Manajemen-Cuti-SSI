"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import Panah from "./Panah";

const TONE_STYLES = {
  default: {
    spotlight: "rgba(224, 224, 224, 0.12)",
    border: "rgba(255, 255, 255, 0.22)",
    badge: "bg-ink/5 text-muted",
  },
  accent: {
    spotlight: "rgba(224, 224, 224, 0.18)",
    border: "rgba(224, 224, 224, 0.35)",
    badge: "bg-accent/15 text-accent",
  },
  warn: {
    spotlight: "rgba(245, 158, 11, 0.18)",
    border: "rgba(245, 158, 11, 0.4)",
    badge: "bg-warn/15 text-warn",
  },
  ok: {
    spotlight: "rgba(34, 197, 94, 0.18)",
    border: "rgba(34, 197, 94, 0.4)",
    badge: "bg-ok/15 text-ok",
  },
  bad: {
    spotlight: "rgba(239, 68, 68, 0.18)",
    border: "rgba(239, 68, 68, 0.4)",
    badge: "bg-bad/15 text-bad",
  },
};

export default function GlowCard({
  icon,
  label,
  value,
  description,
  href,
  tone = "default",
  colSpan = 1,
  className = "",
  badge,
}) {
  const cardRef = useRef(null);
  const [pos, setPos] = useState({ x: -1000, y: -1000, opacity: 0 });

  const activeTone = TONE_STYLES[tone] ?? TONE_STYLES.default;

  function handleMouseMove(e) {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      opacity: 1,
    });
  }

  function handleMouseLeave() {
    setPos((prev) => ({ ...prev, opacity: 0 }));
  }

  const colClasses = {
    1: "col-span-1",
    2: "col-span-1 md:col-span-2",
    3: "col-span-1 md:col-span-2 lg:col-span-3",
    4: "col-span-1 md:col-span-2 lg:col-span-4",
  }[colSpan] ?? "col-span-1";

  const content = (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-line bg-surface p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/40 ${className}`}
    >
      {/* Radial spotlight effect following cursor */}
      <div
        className="pointer-events-none absolute -inset-px transition-opacity duration-300"
        style={{
          opacity: pos.opacity,
          background: `radial-gradient(400px circle at ${pos.x}px ${pos.y}px, ${activeTone.spotlight}, transparent 70%)`,
        }}
        aria-hidden
      />
      {/* Border glow on hover */}
      <div
        className="pointer-events-none absolute -inset-px rounded-2xl transition-opacity duration-300"
        style={{
          opacity: pos.opacity,
          border: `1px solid ${activeTone.border}`,
        }}
        aria-hidden
      />

      {/* Card Header: Icon + Label + Badge */}
      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          {icon && (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-line bg-bg/60 text-ink transition group-hover:border-ink/20 group-hover:bg-bg">
              {icon}
            </span>
          )}
          {label && (
            <span className="text-xs font-semibold text-muted">
              {label}
            </span>
          )}
        </div>
        {badge && (
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap ${activeTone.badge}`}>
            {badge}
          </span>
        )}
      </div>

      {/* Card Body: Metric / Value */}
      <div className="relative z-10 my-4">
        <div className="font-display text-3xl font-semibold tracking-tight text-ink md:text-4xl tabular-nums">
          {value}
        </div>
        {description && (
          <div className="mt-1.5 text-xs leading-relaxed text-muted">
            {description}
          </div>
        )}
      </div>

      {/* Card Footer: Action affordance if clickable */}
      {href && (
        <div className="relative z-10 flex items-center gap-1.5 text-xs font-medium text-accent opacity-80 transition group-hover:opacity-100">
          <span>Lihat detail</span>
          <Panah arah="kanan" className="transition-transform group-hover:translate-x-0.5" />
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className={`block h-full rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-accent ${colClasses}`}>
        {content}
      </Link>
    );
  }

  // Tanpa href, kartu itu sendiri yang jadi anak grid, jadi lebar kolom dipasang di pembungkus.
  return <div className={`h-full ${colClasses}`}>{content}</div>;
}
