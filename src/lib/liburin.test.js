import { test } from "node:test";
import assert from "node:assert/strict";
import { normalisasiJenisLibur, fetchHariLiburLiburin, sinkronkanHariLibur } from "./liburin.js";

test("normalisasiJenisLibur: membedakan cuti bersama dan libur nasional", () => {
  assert.equal(normalisasiJenisLibur("Libur Nasional"), "nasional");
  assert.equal(normalisasiJenisLibur("Cuti Bersama"), "cuti_bersama");
  assert.equal(normalisasiJenisLibur("cuti bersama idul fitri"), "cuti_bersama");
  assert.equal(normalisasiJenisLibur("Hari Libur Umum"), "nasional");
  assert.equal(normalisasiJenisLibur(null), "nasional");
});

test("fetchHariLiburLiburin: validasi parameter tahun", async () => {
  assert.equal((await fetchHariLiburLiburin("abc")).ok, false);
  assert.equal((await fetchHariLiburLiburin(1999)).ok, false);
  assert.equal((await fetchHariLiburLiburin(2150)).ok, false);
});

test("fetchHariLiburLiburin: parsing array dari api Liburin", async () => {
  const dummyData = [
    { date: "2026-01-01", name: "Tahun Baru Masehi 2026", type: "Libur Nasional" },
    { date: "2026-02-16", name: "Cuti Tahun Baru Imlek 2577 Kongzili", type: "Cuti Bersama" },
    { date: "2026-99-99", name: "Tanggal Rusak", type: "Libur Nasional" }, // tanggal tidak valid
    { date: "2026-03-19", name: "", type: "Libur Nasional" }, // keterangan kosong
  ];

  const fakeFetcher = async () => ({
    ok: true,
    json: async () => dummyData,
  });

  const res = await fetchHariLiburLiburin(2026, { fetcher: fakeFetcher });
  assert.equal(res.ok, true);
  assert.equal(res.data.length, 2);
  assert.deepEqual(res.data[0], {
    tanggal: "2026-01-01",
    keterangan: "Tahun Baru Masehi 2026",
    jenis: "nasional",
  });
  assert.deepEqual(res.data[1], {
    tanggal: "2026-02-16",
    keterangan: "Cuti Tahun Baru Imlek 2577 Kongzili",
    jenis: "cuti_bersama",
  });
});

test("sinkronkanHariLibur: upsert ke db dengan menghitung disisipkan dan diperbarui", async () => {
  const fakeFetcher = async () => ({
    ok: true,
    json: async () => [
      { date: "2026-01-01", name: "Tahun Baru", type: "Libur Nasional" },
      { date: "2026-02-16", name: "Cuti Imlek", type: "Cuti Bersama" },
    ],
  });

  const queries = [];
  const fakeDb = {
    query: async (sql, params) => {
      queries.push({ sql, params });
      // Pertama dianggap baru (disisipkan), kedua dianggap diperbarui
      const isNew = queries.length === 1;
      return { rows: [{ disisipkan: isNew }] };
    },
  };

  const res = await sinkronkanHariLibur(fakeDb, 2026, { fetcher: fakeFetcher });
  assert.equal(res.ok, true);
  assert.equal(res.total, 2);
  assert.equal(res.disisipkan, 1);
  assert.equal(res.diperbarui, 1);
  assert.equal(queries.length, 2);
});
