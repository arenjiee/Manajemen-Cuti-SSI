import { test } from "node:test";
import assert from "node:assert/strict";
import { validasiPengajuan } from "./validasi.js";

const TAHUNAN = { id: 1, kode: "tahunan", nama: "Cuti Tahunan", kuotaHari: null, batasPengajuanHari: 3, wajibLampiran: false, potongKuota: true };
const SAKIT = { id: 2, kode: "sakit", nama: "Cuti Sakit", kuotaHari: null, batasPengajuanHari: -3, wajibLampiran: true, potongKuota: false };
const LAINNYA = { id: 3, kode: null, nama: "Cuti Duka", kuotaHari: 3, batasPengajuanHari: 0, wajibLampiran: false, potongKuota: false };
const PDF = { mime: "application/pdf", ukuran: 1000 };

const input = (o = {}) => ({ mulai: "2026-11-16", selesai: "2026-11-18", setengahHari: false, alasan: "Keperluan", handoverId: 2, ...o });
const ctx = (o = {}) => ({
  hariIni: "2026-11-09",
  pengaju: { id: 1, divisiId: 1, tanggalBergabung: "2022-01-01", kuotaAwal: 12 },
  jenis: TAHUNAN,
  hariLibur: new Set(),
  pengajuanAktifPengaju: [],
  terpakaiPotongKuota: 0,
  terpakaiJenis: 0,
  kandidatRekan: [2, 3],
  divisi: { maxPersen: 50, jumlahAnggotaAktif: 6 },
  okupansi: new Map(),
  lampiran: null,
  ...o,
});
const gagal = (r, kode) => {
  assert.equal(r.ok, false);
  assert.equal(r.kode, kode, r.pesan);
};

test("pengajuan tahunan valid", () => {
  assert.deepEqual(validasiPengajuan(input(), ctx()), { ok: true, totalHari: 3 });
});

test("bentuk data: tanggal mustahil, terbalik, setengah hari beda tanggal, alasan kosong", () => {
  gagal(validasiPengajuan(input({ mulai: "2026-02-31" }), ctx()), "BENTUK_DATA");
  gagal(validasiPengajuan(input({ mulai: "2026-11-18", selesai: "2026-11-16" }), ctx()), "BENTUK_DATA");
  gagal(validasiPengajuan(input({ setengahHari: true }), ctx()), "BENTUK_DATA");
  gagal(validasiPengajuan(input({ alasan: "  " }), ctx()), "BENTUK_DATA");
});

test("pengaju tanpa divisi ditolak lebih dulu (Review Focus 5)", () => {
  gagal(validasiPengajuan(input({ mulai: "2026-11-10" }), ctx({ pengaju: { id: 1, divisiId: null, tanggalBergabung: "2022-01-01", kuotaAwal: 12 } })), "TANPA_DIVISI");
});

test("aturan jenis: Tahunan H-2 ditolak, H-3 lolos", () => {
  gagal(validasiPengajuan(input({ mulai: "2026-11-11", selesai: "2026-11-11" }), ctx()), "ATURAN_JENIS");
  assert.equal(validasiPengajuan(input({ mulai: "2026-11-12", selesai: "2026-11-12" }), ctx()).totalHari, 1);
});

test("karyawan < 1 tahun: Tahunan ditolak, Sakit lolos", () => {
  const baru = { id: 1, divisiId: 1, tanggalBergabung: "2026-06-01", kuotaAwal: 12 };
  gagal(validasiPengajuan(input(), ctx({ pengaju: baru })), "ATURAN_JENIS");
  const r = validasiPengajuan(input({ mulai: "2026-11-09", selesai: "2026-11-09" }), ctx({ pengaju: baru, jenis: SAKIT, lampiran: PDF }));
  assert.equal(r.ok, true);
});

test("akhir pekan/libur saja: total 0 ditolak (Review Focus 1)", () => {
  gagal(validasiPengajuan(input({ mulai: "2026-11-14", selesai: "2026-11-15" }), ctx()), "TOTAL_NOL");
  gagal(validasiPengajuan(input({ mulai: "2026-11-17", selesai: "2026-11-17", setengahHari: true }), ctx({ hariLibur: new Set(["2026-11-17"]) })), "TOTAL_NOL");
});

test("lintas tahun: ditolak untuk potong kuota, boleh untuk Sakit", () => {
  gagal(validasiPengajuan(input({ mulai: "2026-12-30", selesai: "2027-01-04" }), ctx()), "LINTAS_TAHUN");
  const r = validasiPengajuan(input({ mulai: "2026-12-30", selesai: "2027-01-04" }), ctx({ jenis: SAKIT, lampiran: PDF }));
  assert.equal(r.ok, true);
});

test("overlap dengan pengajuan aktif sendiri", () => {
  gagal(validasiPengajuan(input(), ctx({ pengajuanAktifPengaju: [{ mulai: "2026-11-18", selesai: "2026-11-20" }] })), "OVERLAP");
});

test("kuota tahunan: sisa 3 untuk 3 hari lolos, sisa 2 ditolak", () => {
  assert.equal(validasiPengajuan(input(), ctx({ terpakaiPotongKuota: 9 })).ok, true);
  gagal(validasiPengajuan(input(), ctx({ terpakaiPotongKuota: 10 })), "KUOTA");
});

test("kuota per jenis (Cuti Lainnya berkuota 3 hari/tahun)", () => {
  const dua = input({ mulai: "2026-11-16", selesai: "2026-11-17" });
  assert.equal(validasiPengajuan(dua, ctx({ jenis: LAINNYA, terpakaiJenis: 1 })).ok, true);
  gagal(validasiPengajuan(dua, ctx({ jenis: LAINNYA, terpakaiJenis: 2 })), "KUOTA_JENIS");
});

test("rekan pengganti: wajib, harus kandidat, tanpa kandidat = pesan khusus (Review Focus 5)", () => {
  gagal(validasiPengajuan(input({ handoverId: null }), ctx()), "REKAN_WAJIB");
  gagal(validasiPengajuan(input({ handoverId: 99 }), ctx()), "REKAN_TIDAK_VALID");
  gagal(validasiPengajuan(input(), ctx({ kandidatRekan: [] })), "TANPA_REKAN");
});

test("kapasitas: Tahunan diblokir saat penuh, Sakit tidak", () => {
  const penuh = new Map([["2026-11-17", 3]]);
  const r = validasiPengajuan(input(), ctx({ okupansi: penuh }));
  gagal(r, "KAPASITAS");
  assert.match(r.pesan, /2026-11-17/);
  assert.match(r.pesan, /3\/3/);
  const s = validasiPengajuan(input({ mulai: "2026-11-16", selesai: "2026-11-18" }), ctx({ jenis: SAKIT, lampiran: PDF, okupansi: penuh }));
  assert.equal(s.ok, true);
});

test("lampiran: Sakit wajib; tipe dan ukuran divalidasi", () => {
  const s = (lampiran) => validasiPengajuan(input({ mulai: "2026-11-09", selesai: "2026-11-09" }), ctx({ jenis: SAKIT, lampiran }));
  gagal(s(null), "LAMPIRAN_WAJIB");
  gagal(s({ mime: "application/zip", ukuran: 1000 }), "LAMPIRAN_INVALID");
  gagal(s({ mime: "image/png", ukuran: 2 * 1024 * 1024 + 1 }), "LAMPIRAN_INVALID");
  assert.equal(s({ mime: "image/jpeg", ukuran: 2 * 1024 * 1024 }).ok, true);
});
