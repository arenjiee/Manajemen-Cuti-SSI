"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function Sidebar({ menu, nama, peran }) {
  const pathname = usePathname();
  const router = useRouter();
  const [buka, setBuka] = useState(false);

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  const aktif = (href) => (href === "/dashboard" ? pathname === href : pathname === href || pathname.startsWith(href + "/"));

  return (
    <>
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-surface px-4 py-3 lg:hidden">
        <span className="font-display text-lg font-semibold">SMCK</span>
        <button aria-label="Buka menu" aria-expanded={buka} onClick={() => setBuka(!buka)} className="rounded-lg border border-line px-3 py-1.5 text-sm">
          Menu
        </button>
      </header>
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-line bg-surface p-5 transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${buka ? "translate-x-0" : "-translate-x-full"}`}
      >
        <p className="font-display text-2xl font-semibold">SMCK</p>
        <p className="mt-0.5 text-xs tracking-wide text-muted uppercase">PT SSI Makassar</p>
        <nav className="mt-8 flex-1 space-y-1 overflow-y-auto">
          {menu.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              onClick={() => setBuka(false)}
              aria-current={aktif(m.href) ? "page" : undefined}
              className={`block rounded-lg px-3 py-2 text-sm transition ${aktif(m.href) ? "bg-accent text-accent-ink" : "text-ink hover:bg-ink/5"}`}
            >
              {m.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-line pt-4">
          <p className="truncate text-sm font-medium">{nama}</p>
          <p className="text-xs text-muted">{peran}</p>
          <button onClick={logout} className="mt-3 w-full rounded-lg border border-line py-2 text-sm transition hover:bg-ink/5">
            Keluar
          </button>
        </div>
      </aside>
      {buka && <button aria-label="Tutup menu" className="fixed inset-0 z-20 bg-ink/30 lg:hidden" onClick={() => setBuka(false)} />}
    </>
  );
}
