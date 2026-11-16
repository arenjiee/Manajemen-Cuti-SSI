// Logika murni untuk tab ala browser (tanpa React) agar mudah diuji.
// Sebuah tab = { id, href }. href berisi path + query halaman yang sedang dibuka di tab itu.

export const MAKS_TAB = 8;

const pathDari = (href) => String(href).split("?")[0];

// Item menu yang paling cocok untuk sebuah href (prefix terpanjang). Query diabaikan.
export function cocokkanMenu(menu, href) {
  const path = pathDari(href);
  let terbaik = null;
  for (const m of menu) {
    if ((path === m.href || path.startsWith(m.href + "/")) && (!terbaik || m.href.length > terbaik.href.length)) terbaik = m;
  }
  return terbaik;
}

export function labelTab(menu, href) {
  const m = cocokkanMenu(menu, href);
  if (!m) return "Halaman";
  const seg = pathDari(href).slice(m.href.length).split("/").filter(Boolean)[0];
  if (seg === "baru") return `${m.label} · Baru`;
  if (seg && /^\d+$/.test(seg)) return `${m.label} · Detail`;
  return m.label;
}

// href dari localStorage tidak dipercaya: harus path internal dan termasuk menu role ini.
function hrefValid(menu, h) {
  return typeof h === "string" && h.startsWith("/") && !h.startsWith("//") && h.length <= 300 && cocokkanMenu(menu, h) != null;
}

export function bersihkanTabs(data, menu) {
  if (!data || !Array.isArray(data.tabs)) return null;
  const terlihat = new Set();
  const tabs = [];
  for (const t of data.tabs) {
    if (!t || typeof t.id !== "string" || terlihat.has(t.id) || !hrefValid(menu, t.href)) continue;
    terlihat.add(t.id);
    tabs.push({ id: t.id, href: t.href });
    if (tabs.length >= MAKS_TAB) break;
  }
  if (tabs.length === 0) return null;
  return { tabs, activeId: tabs.some((t) => t.id === data.activeId) ? data.activeId : tabs[0].id };
}

export function tambahTab(tabs, href, idBaru) {
  if (tabs.length >= MAKS_TAB) return null;
  return { tabs: [...tabs, { id: idBaru, href }], activeId: idBaru };
}

// Menutup tab aktif: pindah ke tetangga kanan, atau kiri jika tidak ada.
export function tutupTab(tabs, activeId, id) {
  const i = tabs.findIndex((t) => t.id === id);
  if (tabs.length <= 1 || i === -1) return { tabs, activeId };
  const baru = tabs.filter((t) => t.id !== id);
  return { tabs: baru, activeId: activeId === id ? (baru[i] ?? baru[i - 1]).id : activeId };
}

export function tutupLain(tabs, activeId, id) {
  const tab = tabs.find((t) => t.id === id);
  return tab ? { tabs: [tab], activeId: id } : { tabs, activeId };
}

function potong(tabs, activeId, id, ambil) {
  const i = tabs.findIndex((t) => t.id === id);
  if (i === -1) return { tabs, activeId };
  const baru = ambil(tabs, i);
  return { tabs: baru, activeId: baru.some((t) => t.id === activeId) ? activeId : id };
}
export const tutupKanan = (tabs, activeId, id) => potong(tabs, activeId, id, (t, i) => t.slice(0, i + 1));
export const tutupKiri = (tabs, activeId, id) => potong(tabs, activeId, id, (t, i) => t.slice(i));

export function tutupSemua(tabs, activeId) {
  const aktif = tabs.find((t) => t.id === activeId) ?? tabs[0];
  return { tabs: [aktif], activeId: aktif.id };
}

// Menyalin URL saat ini ke tab aktif. Mengembalikan array yang sama jika tidak ada perubahan.
export function sinkronkanHref(tabs, activeId, href) {
  if (tabs.every((t) => t.id !== activeId || t.href === href)) return tabs;
  return tabs.map((t) => (t.id === activeId ? { ...t, href } : t));
}
