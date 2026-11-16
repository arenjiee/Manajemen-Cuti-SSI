import { test } from "node:test";
import assert from "node:assert/strict";
import { cocokkanMenu, labelTab, bersihkanTabs, tambahTab, tutupTab, tutupLain, tutupKanan, tutupKiri, tutupSemua, sinkronkanHref, MAKS_TAB } from "./tabs.js";

const menu = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Ajukan Cuti", href: "/cuti/ajukan" },
  { label: "Cuti Saya", href: "/cuti" },
  { label: "Pengguna", href: "/admin/users" },
];
const T = (...ids) => ids.map((id) => ({ id, href: "/dashboard" }));

test("cocokkanMenu memilih prefix terpanjang dan mengabaikan query", () => {
  assert.equal(cocokkanMenu(menu, "/cuti/ajukan").label, "Ajukan Cuti");
  assert.equal(cocokkanMenu(menu, "/cuti/5").label, "Cuti Saya");
  assert.equal(cocokkanMenu(menu, "/admin/users?role=hrd").label, "Pengguna");
  assert.equal(cocokkanMenu(menu, "/cutiku"), null);
  assert.equal(cocokkanMenu(menu, "/tidak-ada"), null);
});

test("labelTab menandai halaman detail dan baru", () => {
  assert.equal(labelTab(menu, "/cuti"), "Cuti Saya");
  assert.equal(labelTab(menu, "/cuti/12"), "Cuti Saya · Detail");
  assert.equal(labelTab(menu, "/admin/users/baru"), "Pengguna · Baru");
  assert.equal(labelTab(menu, "/x"), "Halaman");
});

test("bersihkanTabs membuang data rusak, href tak diizinkan, duplikat, dan membatasi jumlah", () => {
  assert.equal(bersihkanTabs(null, menu), null);
  assert.equal(bersihkanTabs({ tabs: "x" }, menu), null);
  const r = bersihkanTabs({
    tabs: [
      { id: "a", href: "/dashboard" },
      { id: "a", href: "/cuti" },
      { id: "b", href: "/admin/divisi" },
      { id: "c", href: "//evil.com" },
      { id: "d", href: "https://evil.com" },
      { id: 5, href: "/cuti" },
      { id: "e", href: "/cuti/9" },
    ],
    activeId: "zzz",
  }, menu);
  assert.deepEqual(r.tabs.map((t) => t.id), ["a", "e"]);
  assert.equal(r.activeId, "a");
  const banyak = Array.from({ length: 20 }, (_, i) => ({ id: `t${i}`, href: "/dashboard" }));
  assert.equal(bersihkanTabs({ tabs: banyak, activeId: "t3" }, menu).tabs.length, MAKS_TAB);
});

test("tambahTab menjadikan tab baru aktif dan menolak saat penuh", () => {
  const r = tambahTab(T("a"), "/cuti", "b");
  assert.deepEqual(r.tabs.map((t) => t.id), ["a", "b"]);
  assert.equal(r.activeId, "b");
  const penuh = Array.from({ length: MAKS_TAB }, (_, i) => ({ id: `t${i}`, href: "/dashboard" }));
  assert.equal(tambahTab(penuh, "/cuti", "x"), null);
});

test("tutupTab: tab terakhir tidak bisa ditutup; tab aktif digantikan tetangga kanan lalu kiri", () => {
  assert.deepEqual(tutupTab(T("a"), "a", "a"), { tabs: T("a"), activeId: "a" });
  assert.equal(tutupTab(T("a", "b", "c"), "b", "b").activeId, "c");
  assert.equal(tutupTab(T("a", "b", "c"), "c", "c").activeId, "b");
  const lain = tutupTab(T("a", "b", "c"), "a", "c");
  assert.deepEqual(lain.tabs.map((t) => t.id), ["a", "b"]);
  assert.equal(lain.activeId, "a");
  assert.deepEqual(tutupTab(T("a", "b"), "a", "zzz").tabs.length, 2);
});

test("tutupLain, tutupKanan, tutupKiri, tutupSemua", () => {
  assert.deepEqual(tutupLain(T("a", "b", "c"), "a", "b"), { tabs: [{ id: "b", href: "/dashboard" }], activeId: "b" });
  const kanan = tutupKanan(T("a", "b", "c", "d"), "d", "b");
  assert.deepEqual(kanan.tabs.map((t) => t.id), ["a", "b"]);
  assert.equal(kanan.activeId, "b");
  assert.equal(tutupKanan(T("a", "b", "c"), "a", "b").activeId, "a");
  const kiri = tutupKiri(T("a", "b", "c"), "a", "c");
  assert.deepEqual(kiri.tabs.map((t) => t.id), ["c"]);
  assert.equal(kiri.activeId, "c");
  assert.deepEqual(tutupSemua(T("a", "b", "c"), "b"), { tabs: [{ id: "b", href: "/dashboard" }], activeId: "b" });
});

test("sinkronkanHref hanya mengubah tab aktif", () => {
  const r = sinkronkanHref(T("a", "b"), "b", "/cuti?x=1");
  assert.equal(r[0].href, "/dashboard");
  assert.equal(r[1].href, "/cuti?x=1");
  assert.equal(sinkronkanHref(r, "b", "/cuti?x=1"), r);
});
