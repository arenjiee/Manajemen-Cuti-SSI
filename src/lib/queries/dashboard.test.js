import test from "node:test";
import assert from "node:assert/strict";
import { dashboardAdmin } from "./dashboard.js";

function buatMockDb(handlers) {
  let panggil = 0;
  return {
    query: async (sql, params) => {
      const h = handlers[panggil++];
      if (!h) throw new Error(`Query tak terduga #${panggil}: ${sql}`);
      return typeof h === "function" ? h(sql, params) : h;
    },
  };
}

test("dashboardAdmin mengembalikan seluruh field metrik, tabel, dan filter masa kerja", async () => {
  const db = buatMockDb([
    // 1. role
    { rows: [{ role: "karyawan", n: 10 }, { role: "admin", n: 1 }, { role: "ketua_divisi", n: 2 }, { role: "hrd", n: 1 }] },
    // 2. nonaktif
    { rows: [{ n: 2 }] },
    // 3. divisi
    { rows: [{ n: 3 }] },
    // 4. jenis_cuti
    { rows: [{ n: 4 }] },
    // 5. hari_libur
    { rows: [{ n: 15 }] },
    // 6. tanpaDivisi
    {
      rows: [
        { id: 2, nama_lengkap: "Budi", role: "karyawan", tanggal_bergabung: "2026-02-01" },
        { id: 3, nama_lengkap: "Siti", role: "ketua_divisi", tanggal_bergabung: "2025-01-01" },
      ],
    },
    // 7. divisiTanpaKetua
    { rows: [{ id: 10, nama: "Operasional", max_persen_cuti: 20, jumlah_anggota: 5 }] },
    // 8. cutiHariIni
    {
      rows: [
        {
          id: 101,
          pengaju_id: 5,
          nama_lengkap: "Andi",
          divisi_nama: "Teknologi",
          jenis_nama: "Cuti Tahunan",
          tanggal_mulai: "2026-11-18",
          tanggal_selesai: "2026-11-22",
          total_hari: 3,
        },
      ],
    },
    // 9. baru (masa kerja)
    {
      rows: [
        { id: 20, nama_lengkap: "Karyawan Baru", role: "karyawan", tanggal_bergabung: "2026-06-01", divisi_nama: "Teknologi" },
        { id: 21, nama_lengkap: "Karyawan Lama", role: "karyawan", tanggal_bergabung: "2024-01-01", divisi_nama: "Operasional" },
      ],
    },
    // 10. pengajuan
    { rows: [{ bulan_ini: 7, menunggu: 3 }] },
    // 11. divisi (ringkasKapasitasDivisi → petaKapasitas): kosong = tanpa query okupansi
    { rows: [] },
    // 12. hari_libur (petaKapasitas → muatHariLibur)
    { rows: [] },
    // 13. grafik: pengajuan per bulan menurut status
    { rows: [
      { bulan: 10, status: "Approved", ditolak_oleh: null, n: 3 },
      { bulan: 11, status: "Rejected", ditolak_oleh: "leader", n: 1 },
      { bulan: 11, status: "Pending", ditolak_oleh: null, n: 2 },
    ] },
    // 14. grafik: cuti disetujui yang sudah berlalu per bulan mulai
    { rows: [{ bulan: 9, n: 4 }] },
  ]);

  const res = await dashboardAdmin(db, { hari: "2026-11-20" });

  assert.equal(res.totalAktif, 14);
  assert.equal(res.tidakAktif, 2);
  assert.equal(res.totalDivisi, 3);
  assert.equal(res.jenisCutiAktif, 4);
  assert.equal(res.hariLiburTahunIni, 15);
  assert.equal(res.pengajuanBulanIni, 7);
  assert.equal(res.pengajuanMenunggu, 3);

  // Grafik riwayat pengajuan
  assert.equal(res.grafik.tahun, 2026);
  assert.equal(res.grafik.bulanIni, 11);
  assert.equal(res.grafik.perBulan[9].disetujui, 3);
  assert.deepEqual([res.grafik.perBulan[10].ditolak, res.grafik.perBulan[10].ditolakKetua, res.grafik.perBulan[10].menunggu], [1, 1, 2]);
  assert.equal(res.grafik.perBulan[8].berlalu, 4);
  assert.equal(res.grafik.total.semua, 6);

  // Chart kapasitas: tanpa divisi = ringkasan kosong
  assert.deepEqual(res.kapasitas, []);

  // tanpaDivisi
  assert.equal(res.tanpaDivisi.total, 2);
  assert.equal(res.tanpaDivisi.karyawan, 1);
  assert.equal(res.tanpaDivisi.ketua, 1);
  assert.equal(res.tanpaDivisi.rows.length, 2);

  // divisiTanpaKetua & cutiHariIni
  assert.equal(res.divisiTanpaKetua.length, 1);
  assert.equal(res.divisiTanpaKetua[0].nama, "Operasional");
  assert.equal(res.cutiHariIni.length, 1);
  assert.equal(res.cutiHariIni[0].nama_lengkap, "Andi");

  // Masa kerja di bawah 1 tahun: Karyawan Baru (bergabung 2026-06-01, layak 2027-06-01 > 2026-11-20)
  // Karyawan Lama layak 2025-01-01 <= 2026-11-20 (difilter keluar)
  assert.equal(res.masaKerjaDiBawah1Tahun.length, 1);
  assert.equal(res.masaKerjaDiBawah1Tahun[0].nama_lengkap, "Karyawan Baru");
  assert.equal(res.masaKerjaDiBawah1Tahun[0].layakTahunan, "2027-06-01");
});
