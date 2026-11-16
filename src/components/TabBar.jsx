"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, Reorder, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, MoreHorizontal, Plus, Trash2, X } from "lucide-react";
import FloatingMenu, { MenuItem, MenuSep } from "./FloatingMenu";
import { IkonMenu, ikonUntuk } from "./nav-icons";
import { cocokkanMenu, labelTab, MAKS_TAB } from "@/lib/tabs";

function ChromeTab({ tab, menu, aktif, bisaTutup, tetanggaKananAktif, onActivate, onClose, onContextMenu }) {
  const ref = useRef(null);
  const item = cocokkanMenu(menu, tab.href);
  const label = labelTab(menu, tab.href);

  useEffect(() => {
    if (aktif) ref.current?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [aktif]);

  function onKeyDown(e) {
    const li = e.currentTarget.closest("li");
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onActivate();
    } else if ((e.key === "Delete" || e.key === "Backspace") && bisaTutup) {
      e.preventDefault();
      onClose();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      li?.nextElementSibling?.querySelector('[role="tab"]')?.focus();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      li?.previousElementSibling?.querySelector('[role="tab"]')?.focus();
    }
  }

  return (
    <div
      ref={ref}
      role="tab"
      aria-selected={aktif}
      tabIndex={aktif ? 0 : -1}
      title={label}
      onClick={onActivate}
      onAuxClick={(e) => { if (e.button === 1 && bisaTutup) { e.preventDefault(); onClose(); } }}
      onContextMenu={onContextMenu}
      onKeyDown={onKeyDown}
      className={`relative flex max-w-[220px] min-w-[140px] cursor-pointer items-center gap-2 px-4 py-2.5 text-sm outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-accent ${aktif ? "text-ink" : "text-muted hover:text-ink"}`}
    >
      {aktif && (
        <motion.div layoutId="tab-aktif" transition={{ type: "spring", bounce: 0.15, duration: 0.4 }} className="absolute inset-0 rounded-t-xl bg-bg">
          {/* Sudut melengkung ke luar, khas tab Chrome */}
          <div className="absolute bottom-0 -left-3 h-3 w-3 overflow-hidden">
            <div className="absolute right-0 bottom-0 z-[1] h-6 w-6 rounded-full bg-chrome" />
            <div className="absolute inset-0 bg-bg" />
          </div>
          <div className="absolute -right-3 bottom-0 h-3 w-3 overflow-hidden">
            <div className="absolute bottom-0 left-0 z-[1] h-6 w-6 rounded-full bg-chrome" />
            <div className="absolute inset-0 bg-bg" />
          </div>
        </motion.div>
      )}
      <div className="relative flex min-w-0 flex-1 items-center gap-2">
        <IkonMenu href={item?.href} className="h-4 w-4 shrink-0" aria-hidden />
        <span className="flex-1 truncate font-medium select-none">{label}</span>
        {bisaTutup && (
          <button
            type="button"
            tabIndex={-1}
            aria-label={`Tutup tab ${label}`}
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-muted transition hover:bg-ink/10 hover:text-ink ${aktif ? "" : "opacity-0 group-hover:opacity-100 max-md:opacity-100"}`}
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
      {!aktif && !tetanggaKananAktif && <div className="absolute top-1/2 right-0 h-4 w-px -translate-y-1/2 bg-line" />}
    </div>
  );
}

export default function TabBar({ tabs, activeId, menu, awal, onActivate, onClose, onCloseOthers, onCloseRight, onCloseLeft, onCloseAll, onAdd, onReorder }) {
  const [ctx, setCtx] = useState(null); // menu klik-kanan pada tab: { x, y, id }
  const [plus, setPlus] = useState(null); // popover "buka cepat": { x, y }
  const [lainnya, setLainnya] = useState(null); // menu "⋯": { x, y }
  const tunda = useRef(null);
  const sentuh = useRef({ waktu: 0, lama: false, timer: null });
  const bisaTutup = tabs.length > 1;
  const penuh = tabs.length >= MAKS_TAB;

  const tutupCtx = useCallback(() => setCtx(null), []);
  const tutupPlus = useCallback(() => setPlus(null), []);
  const tutupLainnya = useCallback(() => setLainnya(null), []);

  const posisi = (el) => { const r = el.getBoundingClientRect(); return { r, y: r.bottom + 6 }; };
  const bukaPlus = (el) => { const { r, y } = posisi(el); setPlus({ x: r.left, y }); };
  const jadwalTutupPlus = () => { clearTimeout(tunda.current); tunda.current = setTimeout(() => setPlus(null), 150); };
  useEffect(() => () => clearTimeout(tunda.current), []);

  const jalankan = (fn) => () => { setCtx(null); fn(); };
  const idxCtx = ctx ? tabs.findIndex((t) => t.id === ctx.id) : -1;

  return (
    <div className="flex items-end bg-chrome pt-2">
      {awal}
      <div className="flex flex-1 items-end overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Reorder.Group as="ol" axis="x" values={tabs} onReorder={onReorder} role="tablist" aria-label="Tab halaman" className="flex items-end pl-3">
          <AnimatePresence initial={false}>
            {tabs.map((tab, i) => (
              <Reorder.Item
                key={tab.id}
                value={tab}
                as="li"
                role="presentation"
                layout
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                whileDrag={{ cursor: "grabbing" }}
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                className="group relative shrink-0"
                style={{ zIndex: tab.id === activeId ? 10 : 1 }}
              >
                <ChromeTab
                  tab={tab}
                  menu={menu}
                  aktif={tab.id === activeId}
                  bisaTutup={bisaTutup}
                  tetanggaKananAktif={tabs[i + 1]?.id === activeId}
                  onActivate={() => onActivate(tab.id)}
                  onClose={() => onClose(tab.id)}
                  onContextMenu={(e) => { e.preventDefault(); setCtx({ x: e.clientX, y: e.clientY, id: tab.id }); }}
                />
              </Reorder.Item>
            ))}
          </AnimatePresence>
        </Reorder.Group>

        <button
          type="button"
          disabled={penuh}
          title={penuh ? `Maksimal ${MAKS_TAB} tab` : "Tab baru (tahan atau arahkan kursor untuk buka cepat)"}
          aria-label="Tab baru"
          onClick={() => {
            if (sentuh.current.lama) { sentuh.current.lama = false; return; }
            onAdd();
          }}
          onMouseEnter={(e) => {
            if (Date.now() - sentuh.current.waktu < 1000) return;
            clearTimeout(tunda.current);
            const el = e.currentTarget;
            tunda.current = setTimeout(() => bukaPlus(el), 250);
          }}
          onMouseLeave={jadwalTutupPlus}
          onTouchStart={(e) => {
            const el = e.currentTarget;
            sentuh.current.waktu = Date.now();
            sentuh.current.lama = false;
            sentuh.current.timer = setTimeout(() => { sentuh.current.lama = true; bukaPlus(el); }, 500);
          }}
          onTouchEnd={() => clearTimeout(sentuh.current.timer)}
          className="mb-0.5 ml-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted transition hover:bg-ink/5 hover:text-ink disabled:opacity-40"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <button
        type="button"
        aria-label="Menu tab"
        aria-haspopup="menu"
        onClick={(e) => {
          if (lainnya) return setLainnya(null);
          const { r, y } = posisi(e.currentTarget);
          setLainnya({ x: r.right, y });
        }}
        className="mr-2 mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted transition hover:bg-ink/5 hover:text-ink"
      >
        <MoreHorizontal className="h-5 w-5" />
      </button>

      {ctx && (
        <FloatingMenu x={ctx.x} y={ctx.y} label="Aksi tab" onClose={tutupCtx}>
          <MenuItem disabled={!bisaTutup} onClick={jalankan(() => onClose(ctx.id))}>Tutup tab</MenuItem>
          <MenuSep />
          <MenuItem disabled={!bisaTutup} onClick={jalankan(() => onCloseOthers(ctx.id))}>Tutup tab lain</MenuItem>
          <MenuItem ikon={ChevronRight} disabled={idxCtx >= tabs.length - 1} onClick={jalankan(() => onCloseRight(ctx.id))}>Tutup tab di kanan</MenuItem>
          <MenuItem ikon={ChevronLeft} disabled={idxCtx <= 0} onClick={jalankan(() => onCloseLeft(ctx.id))}>Tutup tab di kiri</MenuItem>
        </FloatingMenu>
      )}

      {plus && (
        <FloatingMenu x={plus.x} y={plus.y} label="Buka cepat" onClose={tutupPlus} onMouseEnter={() => clearTimeout(tunda.current)} onMouseLeave={jadwalTutupPlus}>
          <p className="px-2.5 py-1.5 text-xs font-medium text-muted">Buka cepat</p>
          {menu.map((m) => (
            <MenuItem key={m.href} ikon={ikonUntuk(m.href)} disabled={penuh} onClick={() => { setPlus(null); onAdd(m.href); }}>{m.label}</MenuItem>
          ))}
        </FloatingMenu>
      )}

      {lainnya && (
        <FloatingMenu x={lainnya.x} y={lainnya.y} rata="kanan" label="Menu tab" onClose={tutupLainnya}>
          <MenuItem ikon={Plus} disabled={penuh} onClick={() => { setLainnya(null); onAdd(); }}>Tab baru</MenuItem>
          <MenuSep />
          <MenuItem ikon={Trash2} bahaya disabled={!bisaTutup} onClick={() => { setLainnya(null); onCloseAll(); }}>Tutup semua tab lain</MenuItem>
        </FloatingMenu>
      )}
    </div>
  );
}
