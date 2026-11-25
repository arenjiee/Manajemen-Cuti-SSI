import { test } from "node:test";
import assert from "node:assert/strict";
import { susunGrafikPengajuan, batasSumbu } from "./grafik-pengajuan.js";

test("susunGrafikPengajuan: 12 bulan selalu ada, bulan kosong bernilai 0", () => {
  const g = susunGrafikPengajuan({ tahun: 2026, bulanIni: 11 });
  assert.equal(g.perBulan.length, 12);
  assert.deepEqual(g.perBulan[0], { disetujui: 0, ditolak: 0, ditolakKetua: 0, menunggu: 0, dibatalkan: 0, berlalu: 0 });
  assert.equal(g.total.semua, 0);
  assert.equal(g.bulanIni, 11);
});

test("susunGrafikPengajuan: pemetaan status ke Disetujui, Ditolak, Menunggu, Dibatalkan", () => {
  const g = susunGrafikPengajuan({
    tahun: 2026,
    barisStatus: [
      { bulan: 3, status: "Approved", ditolak_oleh: null, n: 4 },
      { bulan: 3, status: "Rejected", ditolak_oleh: "leader", n: 2 },
      { bulan: 3, status: "Rejected", ditolak_oleh: "hrd", n: 1 },
      { bulan: 3, status: "Pending", ditolak_oleh: null, n: 1 },
      { bulan: 3, status: "Approved by Leader", ditolak_oleh: null, n: 2 },   // masih menunggu HRD → Menunggu
      { bulan: 3, status: "Cancelled", ditolak_oleh: null, n: 5 },
      { bulan: 12, status: "Approved", ditolak_oleh: null, n: 1 },
    ],
  });
  assert.deepEqual(g.perBulan[2], { disetujui: 4, ditolak: 3, ditolakKetua: 2, menunggu: 3, dibatalkan: 5, berlalu: 0 });
  assert.equal(g.perBulan[11].disetujui, 1);
  assert.deepEqual(g.total, { disetujui: 5, ditolak: 3, ditolakKetua: 2, menunggu: 3, dibatalkan: 5, berlalu: 0, semua: 16 });
});

test("susunGrafikPengajuan: 'berlalu' terpisah dari total 'semua'; bulan di luar 1-12 dan n string diabaikan/ditangani", () => {
  const g = susunGrafikPengajuan({
    tahun: 2026,
    barisStatus: [{ bulan: 0, status: "Approved", n: 9 }, { bulan: 13, status: "Approved", n: 9 }, { bulan: "2", status: "Approved", n: "3" }],
    barisBerlalu: [{ bulan: 1, n: 2 }, { bulan: 10, n: 1 }, { bulan: 99, n: 7 }],
  });
  assert.equal(g.perBulan[1].disetujui, 3);
  assert.equal(g.total.semua, 3);
  assert.equal(g.total.berlalu, 3);
  assert.equal(g.perBulan[0].berlalu, 2);
});

test("batasSumbu: genap, minimal 4, dan membulat ke atas", () => {
  for (const [masuk, harap] of [[0, 4], [3, 4], [4, 4], [5, 6], [9, 10], [10, 10], [11, 20], [47, 50], [51, 60], [201, 300], [NaN, 4]]) {
    assert.equal(batasSumbu(masuk), harap, String(masuk));
    assert.equal(batasSumbu(masuk) % 2, 0);
  }
});
