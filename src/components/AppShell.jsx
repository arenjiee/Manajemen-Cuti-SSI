"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { Bell, CalendarRange, ChevronRight, ClipboardCheck, LogOut, Menu, PanelLeft, ShieldCheck, Users, X } from "lucide-react";
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

function RingkasanTopbar({ ringkasan }) {
  if (!ringkasan) return null;

  const data = {
    admin: [
      { href: "/riwayat", ikon: ClipboardCheck, label: "Menunggu", nilai: ringkasan.pengajuanMenunggu },
      { href: "/admin/users", ikon: Users, label: "Pengguna aktif", nilai: ringkasan.totalAktif },
    ],
    hrd: [
      { href: "/persetujuan", ikon: ShieldCheck, label: "Persetujuan", nilai: ringkasan.menungguFinal },
      { href: "/kapasitas", ikon: CalendarRange, label: "Cuti bulan ini", nilai: ringkasan.jumlahOrangCuti },
    ],
    ketua_divisi: [
      { href: "/verifikasi", ikon: ClipboardCheck, label: "Perlu verifikasi", nilai: ringkasan.menungguVerifikasi },
      { href: "/dashboard", ikon: CalendarRange, label: "Cuti minggu ini", nilai: ringkasan.anggotaCutiMingguIni },
    ],
  }[ringkasan.role];

  if (!data) return null;

  return (
    <div className="hidden items-center gap-2 lg:flex">
      {ringkasan.divisiNama && <span className="max-w-40 truncate text-xs text-muted">{ringkasan.divisiNama}</span>}
      {data.map(({ href, ikon: Ikon, label, nilai }) => (
        <Link key={label} href={href} className="group flex h-9 items-center gap-2 rounded-lg border border-line bg-bg/50 px-2.5 text-xs text-muted transition hover:border-ink/30 hover:bg-ink/5 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
          <Ikon className="h-3.5 w-3.5" aria-hidden />
          <span className="whitespace-nowrap">{label}</span>
          <span className="min-w-5 rounded bg-ink/10 px-1.5 py-0.5 text-center font-mono text-[11px] font-semibold text-ink">{nilai}</span>
          <ChevronRight className="h-3 w-3 opacity-0 transition group-hover:opacity-100" aria-hidden />
        </Link>
      ))}
    </div>
  );
}

function TopBar({ menu, pathname, user, ringkasan, notifikasi, drawer, onBukaMenu }) {
  const halaman = cocokkanMenu(menu, pathname)?.label ?? "SMCK";
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-line bg-chrome px-3 md:px-5">
      <button type="button" aria-label="Buka menu" aria-expanded={drawer} onClick={onBukaMenu} suppressHydrationWarning className={`${tombolIkon} md:hidden`}>
        <Menu className="h-5 w-5" />
      </button>
      <div className="min-w-0 flex-1">
        <p className="hidden text-[11px] font-medium tracking-[0.16em] text-muted uppercase sm:block">{user.peran}</p>
        <h1 className="truncate font-display text-base font-semibold">{halaman}</h1>
      </div>
      <RingkasanTopbar ringkasan={ringkasan} />
      <Link href="/notifikasi" aria-label={notifikasi > 0 ? `${notifikasi} notifikasi belum dibaca` : "Notifikasi"} className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted transition hover:bg-ink/5 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
        <Bell className="h-4 w-4" aria-hidden />
        {notifikasi > 0 && <span className="absolute top-1 right-1 flex min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] leading-4 font-bold text-accent-ink">{notifikasi > 9 ? "9+" : notifikasi}</span>}
      </Link>
    </header>
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
  const avatar = user.fotoKey ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/api/foto/${user.id}?v=${encodeURIComponent(user.fotoKey)}`}
      alt={`Foto ${user.nama}`}
      className="h-9 w-9 shrink-0 rounded-full border border-line object-cover"
    />
  ) : (
    <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/10 font-display text-sm font-semibold text-accent">
      {inisial}
    </span>
  );

  if (ciut) {
    return (
      <div className="flex flex-col items-center gap-2">
        <Link href="/profil" title={`Profil: ${user.nama}`} className="transition hover:opacity-80">
          {avatar}
        </Link>
        <button type="button" title="Keluar" aria-label="Keluar" onClick={onKeluar} suppressHydrationWarning className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg text-muted transition hover:bg-ink/5 hover:text-ink">
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    );
  }
  return (
    <div className="flex w-full items-center gap-3 rounded-lg bg-bg px-3 py-2">
      <Link href="/profil" title="Lihat profil" className="shrink-0 transition hover:opacity-80">
        {avatar}
      </Link>
      <div className="min-w-0 flex-1">
        <Link href="/profil" className="block truncate text-xs font-medium hover:underline">
          {user.nama}
        </Link>
        <p className="truncate text-[11px] text-muted">{user.peran}</p>
      </div>
      <button type="button" title="Keluar" aria-label="Keluar" onClick={onKeluar} suppressHydrationWarning className="rounded-md p-1.5 text-muted transition hover:bg-ink/5 hover:text-ink">
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function AppShell({ menu, user, children, ringkasan, notifikasi }) {
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
          <div className={`flex h-14 shrink-0 items-center border-b border-line px-4 ${ciut ? "justify-center" : "justify-between"}`}>
            <Brand ciut={ciut} />
            {!ciut && (
              <button type="button" aria-label="Ciutkan sidebar" onClick={toggleCiut} suppressHydrationWarning className={tombolIkon}><PanelLeft className="h-4 w-4" /></button>
            )}
          </div>
          {ciut && (
            <div className="flex justify-center border-b border-line py-2">
              <button type="button" aria-label="Lebarkan sidebar" onClick={toggleCiut} suppressHydrationWarning className={tombolIkon}><PanelLeft className="h-4 w-4 rotate-180" /></button>
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
          <TopBar
            menu={menu}
            pathname={pathname}
            user={user}
            ringkasan={ringkasan}
            notifikasi={notifikasi}
            drawer={drawer}
            onBukaMenu={() => setDrawer(true)}
          />
          <TabBar
            tabs={tabs}
            activeId={activeId}
            menu={menu}
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
            <button type="button" aria-label="Tutup menu" onClick={() => setDrawer(false)} suppressHydrationWarning className="fixed inset-0 z-40 bg-ink/40" />
            <aside role="dialog" aria-modal="true" aria-label="Menu" className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-chrome shadow-xl">
              <div className="flex h-14 shrink-0 items-center justify-between border-b border-line px-4">
                <Brand />
                <button type="button" aria-label="Tutup menu" onClick={() => setDrawer(false)} suppressHydrationWarning className={tombolIkon}><X className="h-5 w-5" /></button>
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
