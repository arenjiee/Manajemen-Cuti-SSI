import { test } from "node:test";
import assert from "node:assert/strict";
import { statusHari, bangunKalender, batasKalender } from "./kalender.js";

const dasar = { libur: new Set(["2026-11-20"]), terisi: 0, batas: 2 };

test("statusHari: prioritas akhir pekan, libur, penuh, hampir, ok", () => {
  assert.equal(statusHari({ ...dasar, tanggal: "2026-11-21" }), "akhir_pekan");
  assert.equal(statusHari({ ...dasar, tanggal: "2026-11-20" }), "libur");
  assert.equal(statusHari({ ...dasar, tanggal: "2026-11-24", terisi: 2 }), "penuh");
  assert.equal(statusHari({ ...dasar, tanggal: "2026-11-24", terisi: 1 }), "hampir");
  assert.equal(statusHari({ ...dasar, tanggal: "2026-11-24" }), "ok");
});

test("statusHari: kapasitas bisa dimatikan (jenis tak terkena)", () => {
  assert.equal(statusHari({ ...dasar, tanggal: "2026-11-24", terisi: 5, cekKapasitas: false }), "ok");
});

test("bangunKalender memecah per bulan dengan offset Senin=0", () => {
  const k = bangunKalender({ dari: "2026-11-01", sampai: "2026-12-31", okupansi: new Map([["2026-11-24", 2]]), batas: 2, libur: new Set() });
  assert.equal(k.length, 2);
  assert.equal(k[0].offset, 6);
  assert.equal(k[0].hari.length, 30);
  assert.equal(k[0].hari.find((h) => h.tanggal === "2026-11-24").status, "penuh");
  assert.equal(k[1].label, "Desember 2026");
  assert.equal(k[1].hari.length, 31);
});

test("batasKalender mulai dari awal bulan mulai dan maksimal 3 bulan", () => {
  assert.deepEqual(batasKalender("2026-11-12", "2026-11-14"), { dari: "2026-11-01", sampai: "2026-11-30" });
  assert.deepEqual(batasKalender("2026-11-12", "2026-12-02"), { dari: "2026-11-01", sampai: "2026-12-31" });
  assert.deepEqual(batasKalender("2026-11-12", "2027-09-01"), { dari: "2026-11-01", sampai: "2027-01-31" });
});
