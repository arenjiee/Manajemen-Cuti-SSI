"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { LogOut, Menu, PanelLeft, X } from "lucide-react";
import TabBar from "./TabBar";
import { IkonMenu } from "./nav-icons";
import { bersihkanTabs, cocokkanMenu, sinkronkanHref, tambahTab, tutupKanan, tutupKiri, tutupLain, tutupSemua, tutupTab } from "@/lib/tabs";

const PEGAS = { type: "spring", stiffness: 300, damping: 30 };
const tombolIkon = "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted transition hover:bg-ink/5 hover:text-ink";

function Brand({ ciut }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent font-display text-sm font-semibold text-accent-ink">S</span>
      {!ciut && <span className="truncate font-display text-lg font-semibold">SMCK</span>}
    </div>
  );
}

function NavList({ menu, aktifHref, ciut, onPilih, idIndikator }) {
  return (
    <nav aria-label="Menu utama" className="space-y-1 px-3">
      {menu.map((m) => {
        const aktif = aktifHref === m.href;
        return (
          <Link
            key={m.href}
            href={m.href}
            onClick={onPilih}
            title={ciut ? m.label : undefined}
            aria-current={aktif ? "page" : undefined}
            className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${aktif ? "bg-bg text-ink" : "text-muted hover:bg-ink/5 hover:text-ink"} ${ciut ? "justify-center px-0" : ""}`}
          >
            <IkonMenu href={m.href} className="h-5 w-5 shrink-0" aria-hidden />
            <AnimatePresence initial={false}>
              {!ciut && (
                <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "auto" }} exit={{ opacity: 0, width: 0 }} transition={PEGAS} className="overflow-hidden whitespace-nowrap">
                  {m.label}
                </motion.span>
              )}
            </AnimatePresence>
            {aktif && !ciut && <motion.span layoutId={idIndikator} transition={PEGAS} className="absolute top-1/2 left-0 h-5 w-1 -translate-y-1/2 rounded-r-full bg-accent" />}
          </Link>
        );
      })}
    </nav>
  );
}

function KartuUser({ user, ciut, onKeluar }) {
  const inisial = user.nama.split(/\s+/).slice(0, 2).map((x) => x[0]).join("").toUpperCase();
  if (ciut) {
    return (
      <button type="button" title="Keluar" aria-label="Keluar" onClick={onKeluar} className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-accent/10 text-accent transition hover:bg-accent/20">
        <LogOut className="h-4 w-4" />
      </button>
    );
  }
  return (
    <div className="flex w-full items-center gap-3 rounded-lg bg-bg px-3 py-2">
      <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/10 font-display text-sm font-semibold text-accent">{inisial}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium">{user.nama}</p>
        <p className="truncate text-[11px] text-muted">{user.peran}</p>
      </div>
      <button type="button" title="Keluar" aria-label="Keluar" onClick={onKeluar} className="rounded-md p-1.5 text-muted transition hover:bg-ink/5 hover:text-ink">
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function AppShell({ menu, user, children }) {
  const router = useRouter();
  const pathname = usePathname();
  const qs = useSearchParams().toString();
  const sekarang = qs ? `${pathname}?${qs}` : pathname;
  const kunci = `smck-tab:${user.id}`;

  // State awal sama di server dan klien (satu tab = halaman ini); isi tersimpan dimuat setelah mount.
  const [tabs, setTabs] = useState([{ id: "t1", href: sekarang }]);
  const [activeId, setActiveId] = useState("t1");
  const [siap, setSiap] = useState(false);
  const [ciut, setCiut] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const aktifRef = useRef("t1");
  const awal = useRef({ menu, sekarang });

  // Membaca localStorage hanya bisa setelah mount (server tidak punya localStorage), sehingga setState di sini disengaja.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    let simpan = null;
    try {
      simpan = bersihkanTabs(JSON.parse(localStorage.getItem(kunci)), awal.current.menu);
      setCiut(localStorage.getItem("smck-sidebar-ciut") === "1");
    } catch {}
    const mulai = simpan ?? { tabs: [{ id: "t1", href: awal.current.sekarang }], activeId: "t1" };
    aktifRef.current = mulai.activeId;
    setTabs(sinkronkanHref(mulai.tabs, mulai.activeId, awal.current.sekarang));
    setActiveId(mulai.activeId);
    setSiap(true);
  }, [kunci]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // URL berubah (klik tautan, tombol back/forward, filter): tab aktif mengikuti, seperti browser.
  useEffect(() => {
    if (siap) setTabs((prev) => sinkronkanHref(prev, aktifRef.current, sekarang));
  }, [sekarang, siap]);

  useEffect(() => {
    if (!siap) return;
    const t = setTimeout(() => {
      try { localStorage.setItem(kunci, JSON.stringify({ tabs, activeId })); } catch {}
    }, 300);
    return () => clearTimeout(t);
  }, [tabs, activeId, siap, kunci]);

  useEffect(() => {
    if (!drawer) return;
    const esc = (e) => { if (e.key === "Escape") setDrawer(false); };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [drawer]);

  // Menerapkan hasil fungsi tabs.js; jika tab aktif berganti, buka halaman tab itu.
  function terapkan(hasil) {
    const berganti = hasil.activeId !== activeId;
    aktifRef.current = hasil.activeId;
    setTabs(hasil.tabs);
    setActiveId(hasil.activeId);
    if (berganti) router.push(hasil.tabs.find((t) => t.id === hasil.activeId).href);
  }

  const aktifkan = (id) => id !== activeId && terapkan({ tabs, activeId: id });
  const tambah = (href = "/dashboard") => {
    const id = `t${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    const hasil = tambahTab(tabs, href, id);
    if (hasil) terapkan(hasil);
  };

  function toggleCiut() {
    setCiut((c) => {
      try { localStorage.setItem("smck-sidebar-ciut", c ? "0" : "1"); } catch {}
      return !c;
    });
  }

  async function keluar() {
    setSiap(false);
    try { localStorage.removeItem(kunci); } catch {}
    await fetch("/api/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  const aktifHref = cocokkanMenu(menu, pathname)?.href;
  const indeksAktif = tabs.findIndex((t) => t.id === activeId);

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex h-dvh w-full overflow-hidden bg-chrome">
        <motion.aside initial={false} animate={{ width: ciut ? 64 : 240 }} transition={PEGAS} className="hidden shrink-0 flex-col overflow-hidden bg-chrome md:flex">
          <div className={`flex h-[52px] shrink-0 items-center border-b border-line px-4 ${ciut ? "justify-center" : "justify-between"}`}>
            <Brand ciut={ciut} />
            {!ciut && (
              <button type="button" aria-label="Ciutkan sidebar" onClick={toggleCiut} className={tombolIkon}><PanelLeft className="h-4 w-4" /></button>
            )}
          </div>
          {ciut && (
            <div className="flex justify-center border-b border-line py-2">
              <button type="button" aria-label="Lebarkan sidebar" onClick={toggleCiut} className={tombolIkon}><PanelLeft className="h-4 w-4 rotate-180" /></button>
            </div>
          )}
          <div className="flex-1 overflow-y-auto py-4">
            <NavList menu={menu} aktifHref={aktifHref} ciut={ciut} idIndikator="nav-aktif" />
          </div>
          <div className="flex min-h-[73px] shrink-0 items-center border-t border-line p-3">
            <KartuUser user={user} ciut={ciut} onKeluar={keluar} />
          </div>
        </motion.aside>

        <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
          <TabBar
            tabs={tabs}
            activeId={activeId}
            menu={menu}
            awal={
              <button type="button" aria-label="Buka menu" aria-expanded={drawer} onClick={() => setDrawer(true)} className={`${tombolIkon} mr-1 ml-2 self-center md:hidden`}>
                <Menu className="h-5 w-5" />
              </button>
            }
            onActivate={aktifkan}
            onClose={(id) => terapkan(tutupTab(tabs, activeId, id))}
            onCloseOthers={(id) => terapkan(tutupLain(tabs, activeId, id))}
            onCloseRight={(id) => terapkan(tutupKanan(tabs, activeId, id))}
            onCloseLeft={(id) => terapkan(tutupKiri(tabs, activeId, id))}
            onCloseAll={() => terapkan(tutupSemua(tabs, activeId))}
            onAdd={tambah}
            onReorder={setTabs}
          />
          <main className="flex-1 overflow-hidden bg-chrome md:pr-3 md:pb-3">
            <div className={`h-full overflow-auto bg-bg md:rounded-tr-3xl md:rounded-br-3xl md:rounded-bl-3xl ${indeksAktif > 0 ? "md:rounded-tl-3xl" : ""}`}>
              <div className="mx-auto w-full max-w-6xl p-5 lg:p-10">{children}</div>
            </div>
          </main>
        </div>

        {drawer && (
          <div className="md:hidden">
            <button type="button" aria-label="Tutup menu" onClick={() => setDrawer(false)} className="fixed inset-0 z-40 bg-ink/40" />
            <aside role="dialog" aria-modal="true" aria-label="Menu" className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-chrome shadow-xl">
              <div className="flex h-[52px] shrink-0 items-center justify-between border-b border-line px-4">
                <Brand />
                <button type="button" aria-label="Tutup menu" onClick={() => setDrawer(false)} className={tombolIkon}><X className="h-5 w-5" /></button>
              </div>
              <div className="flex-1 overflow-y-auto py-4">
                <NavList menu={menu} aktifHref={aktifHref} onPilih={() => setDrawer(false)} idIndikator="nav-aktif-drawer" />
              </div>
              <div className="border-t border-line p-3"><KartuUser user={user} onKeluar={keluar} /></div>
            </aside>
          </div>
        )}
      </div>
    </MotionConfig>
  );
}
