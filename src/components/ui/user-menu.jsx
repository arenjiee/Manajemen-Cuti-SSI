"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  LoaderCircle,
  LogOut,
  Monitor,
  Moon,
  Sun,
  SunMoon,
} from "lucide-react";

export function PresenceDot({ status = "available", className = "" }) {
  const colors = {
    available: "bg-ok",
    busy: "bg-bad",
    away: "bg-warn",
  };
  return (
    <span
      className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-surface ${colors[status] || "bg-ok"} ${className}`}
      aria-hidden="true"
    />
  );
}

function Portrait({ user, size = "sm" }) {
  const [failed, setFailed] = useState(false);
  const initials = (user?.name || "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  if (!user?.avatarSrc || failed) {
    return (
      <span
        className={`flex h-full w-full items-center justify-center rounded-full bg-accent/15 font-display font-bold text-accent ${
          size === "md" ? "text-sm" : "text-xs"
        }`}
      >
        {initials || "U"}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className="h-full w-full rounded-full object-cover"
      src={user.avatarSrc}
      srcSet={user.avatarSrcSet}
      alt={user.name || "Avatar"}
      decoding="async"
      draggable={false}
      onError={() => setFailed(true)}
    />
  );
}

function Face({ user, status, size = "sm" }) {
  const dimensions = size === "md" ? "h-11 w-11" : "h-8 w-8";
  return (
    <span className={`relative flex shrink-0 rounded-full border border-line ${dimensions}`}>
      <Portrait user={user} size={size} />
      {status && <PresenceDot status={status} />}
    </span>
  );
}

export function UserMenu({
  user = { name: "Pengguna", email: "", plan: "Karyawan" },
  status,
  theme = "system",
  onThemeChange,
  showTheme = true,
  items = [],
  onSignOut,
  showName = true,
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const rootRef = useRef(null);

  // Close on outside click & escape key
  useEffect(() => {
    if (!open) return;
    function handlePointer(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    function handleKeyDown(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("touchstart", handlePointer);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("touchstart", handlePointer);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await onSignOut?.();
    } finally {
      setSigningOut(false);
      setOpen(false);
    }
  }

  const themes = [
    { value: "light", label: "Light", icon: <Sun size={14} /> },
    { value: "dark", label: "Dark", icon: <Moon size={14} /> },
    { value: "system", label: "System", icon: <Monitor size={14} /> },
  ];

  return (
    <div ref={rootRef} className={`relative inline-flex items-center ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Menu akun, ${user.name}`}
        onClick={() => setOpen((prev) => !prev)}
        className={`flex items-center gap-2.5 rounded-full border border-line bg-surface/90 py-1 pl-1 pr-3 text-ink shadow-sm transition hover:bg-ink/5 hover:border-ink/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
          open ? "border-accent ring-1 ring-accent" : ""
        }`}
      >
        <Face user={user} status={status} size="sm" />
        {showName && (
          <span className="hidden max-w-[130px] truncate font-display text-xs font-semibold text-ink sm:inline-block">
            {user.name}
          </span>
        )}
        <ChevronDown
          size={14}
          className={`text-muted transition-transform duration-200 ${open ? "rotate-180 text-ink" : ""}`}
          aria-hidden="true"
        />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 6 }}
            transition={{ type: "spring", stiffness: 450, damping: 32 }}
            className="absolute right-0 top-full z-50 mt-2 w-72 origin-top-right rounded-2xl border border-line bg-surface p-1.5 text-ink shadow-2xl backdrop-blur-xl ring-1 ring-black/10 focus:outline-none"
          >
            {/* Header info */}
            <div className="flex items-center gap-3 rounded-xl bg-chrome/60 p-3">
              <Face user={user} status={status} size="md" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-display text-sm font-bold text-ink leading-tight">
                    {user.name}
                  </p>
                  {user.plan && (
                    <span className="shrink-0 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold text-accent uppercase tracking-wider">
                      {user.plan}
                    </span>
                  )}
                </div>
                {user.email && (
                  <p className="mt-0.5 truncate text-xs text-muted" title={user.email}>
                    {user.email}
                  </p>
                )}
              </div>
            </div>

            {/* Nav Items */}
            {items.length > 0 && (
              <>
                <div className="my-1.5 h-px bg-line" role="separator" />
                <div className="space-y-0.5">
                  {items.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setOpen(false);
                        item.onSelect?.();
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-ink transition hover:bg-ink/5 focus-visible:bg-ink/5 focus-visible:outline-none"
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center text-muted">
                        {item.icon}
                      </span>
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.keys && (
                        <span className="flex items-center gap-1 font-mono text-[10px] text-muted">
                          {item.keys.join(" ")}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Theme Switcher */}
            {showTheme && (
              <>
                <div className="my-1.5 h-px bg-line" role="separator" />
                <div className="flex items-center justify-between rounded-xl px-3 py-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-muted">
                    <SunMoon size={15} />
                    <span>Tema</span>
                  </div>
                  <div className="flex items-center rounded-lg border border-line bg-chrome p-0.5">
                    {themes.map((t) => {
                      const isActive = theme === t.value;
                      return (
                        <button
                          key={t.value}
                          type="button"
                          onClick={() => onThemeChange?.(t.value)}
                          title={t.label}
                          aria-label={`Tema ${t.label}`}
                          className={`flex h-7 w-7 items-center justify-center rounded-md text-xs font-medium transition ${
                            isActive
                              ? "bg-surface text-ink shadow-sm"
                              : "text-muted hover:text-ink"
                          }`}
                        >
                          {t.icon}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* Sign Out */}
            <div className="my-1.5 h-px bg-line" role="separator" />
            <button
              type="button"
              role="menuitem"
              disabled={signingOut}
              onClick={handleSignOut}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-bad transition hover:bg-bad/10 focus-visible:bg-bad/10 focus-visible:outline-none disabled:opacity-50"
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                {signingOut ? (
                  <LoaderCircle size={15} className="animate-spin" />
                ) : (
                  <LogOut size={15} />
                )}
              </span>
              <span className="flex-1 text-left">
                {signingOut ? "Keluar..." : "Keluar"}
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default UserMenu;
