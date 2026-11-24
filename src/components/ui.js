export const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg";

export const inputCls =
  `w-full rounded-xl border border-line-strong bg-surface px-3.5 py-2.5 text-base md:text-sm text-ink placeholder:text-muted outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:opacity-50 ${focusRing}`;

export const selectCls =
  `w-full rounded-xl border border-line-strong bg-surface px-3.5 py-2.5 text-base md:text-sm text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:opacity-50 ${focusRing}`;

export const btnPrimary =
  `inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-ink transition hover:opacity-90 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50 ${focusRing}`;

export const btnGhost =
  `inline-flex items-center justify-center rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-medium text-ink transition hover:bg-ink/5 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50 ${focusRing}`;

export const btnDanger =
  `inline-flex items-center justify-center rounded-xl border border-bad/30 bg-bad/10 px-3.5 py-2 text-sm font-medium text-bad transition hover:bg-bad/20 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50 ${focusRing}`;

export const linkCls =
  `inline-flex items-center gap-1.5 text-sm font-medium text-accent transition hover:text-ink ${focusRing}`;

export const cardCls = "rounded-2xl border border-line bg-surface p-6 shadow-sm";
export const labelCls = "mb-1.5 block text-xs font-semibold text-muted";
