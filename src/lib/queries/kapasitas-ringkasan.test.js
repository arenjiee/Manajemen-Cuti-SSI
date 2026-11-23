import test from "node:test";
import assert from "node:assert/strict";
import { ringkasKapasitasDivisi } from "./kapasitas.js";

// Database tiruan: hanya tiga query yang dipakai petaKapasitas.
const divisi = [
  { id: 1, nama: "FLM", max_persen_cuti: 25, ketua_nama: "A", jumlah_anggota: 8 }, // batas 2
  { id: 2, nama: "CIT", max_persen_cuti: 25, ketua_nama: "B", jumlah_anggota: 8 }, // batas 2
  { id: 3, nama: "CPC", max_persen_cuti: 25, ketua_nama: "C", jumlah_anggota: 12 }, // batas 3
  { id: 4, nama: "OPS", max_persen_cuti: 25, ketua_nama: "D", jumlah_anggota: 0 },
];
const okupansi = {
  1: { "2026-11-24": 2, "2026-11-25": 2, "2026-11-28": 5 }, // 28 Nov 2026 = Sabtu: diabaikan
  2: { "2026-11-24": 1 },
  3: { "2026-11-24": 1 },
  4: {},
};
const db = {
  query: async (sql, p) => {
    if (sql.includes("FROM divisi d LEFT JOIN users k")) return { rows: divisi };
    if (sql.includes("generate_series")) return { rows: Object.entries(okupansi[p[0]]).map(([tanggal, n]) => ({ tanggal, n })) };
    if (sql.includes("hari_libur")) return { rows: [] };
    throw new Error(`SQL tak dikenal: ${sql.slice(0, 60)}`);
  },
};

test("ringkasKapasitasDivisi: puncak hari kerja, status, dan urutan paling mepet dulu", async () => {
  const r = await ringkasKapasitasDivisi(db, { dari: "2026-11-01", sampai: "2026-11-30" });
  assert.deepEqual(r.map((x) => [x.nama, x.puncak, x.batas, x.status]), [
    ["FLM", 2, 2, "penuh"],
    ["CIT", 1, 2, "hampir"],
    ["CPC", 1, 3, "aman"],
    ["OPS", 0, 1, "kosong"],
  ]);
  assert.equal(r[0].hariPenuh, 2);
});
