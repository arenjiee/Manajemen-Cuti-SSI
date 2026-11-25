// Pembangun data grafik riwayat pengajuan cuti per bulan. Murni (tanpa DB/Next) sehingga bisa dites langsung.
// Ditaruh di luar src/lib/queries supaya komponen client boleh mengimpor konstanta di sini tanpa menarik kode DB.

export const BULAN_SINGKAT = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
export const BULAN_PANJANG = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

const bulanKosong = () => ({ disetujui: 0, ditolak: 0, ditolakKetua: 0, menunggu: 0, dibatalkan: 0, berlalu: 0 });

// barisStatus : [{ bulan: 1-12 (bulan tanggal_pengajuan), status, ditolak_oleh, n }]
// barisBerlalu: [{ bulan: 1-12 (bulan tanggal_mulai), n }]  → cuti Approved yang sudah selesai sebelum hari ini
export function susunGrafikPengajuan({ tahun, bulanIni = null, barisStatus = [], barisBerlalu = [] }) {
  const perBulan = Array.from({ length: 12 }, bulanKosong);
  const idx = (b) => (Number.isInteger(b) && b >= 1 && b <= 12 ? b - 1 : -1);

  for (const r of barisStatus) {
    const i = idx(Number(r.bulan));
    if (i < 0) continue;
    const n = Number(r.n) || 0;
    const m = perBulan[i];
    if (r.status === "Approved") m.disetujui += n;
    else if (r.status === "Rejected") {
      m.ditolak += n;
      if (r.ditolak_oleh === "leader") m.ditolakKetua += n;
    } else if (r.status === "Pending" || r.status === "Approved by Leader") m.menunggu += n;
    else if (r.status === "Cancelled") m.dibatalkan += n;
  }
  for (const r of barisBerlalu) {
    const i = idx(Number(r.bulan));
    if (i >= 0) perBulan[i].berlalu += Number(r.n) || 0;
  }

  const total = bulanKosong();
  for (const m of perBulan) for (const k of Object.keys(total)) total[k] += m[k];
  const semua = total.disetujui + total.ditolak + total.menunggu + total.dibatalkan;
  return { tahun, bulanIni, perBulan, total: { ...total, semua } };
}

// Batas atas sumbu-Y yang genap, supaya label tengah (setengahnya) selalu bilangan bulat.
export function batasSumbu(maks) {
  const m = Math.max(0, Math.ceil(Number(maks) || 0));
  if (m <= 4) return 4;
  const langkah = m <= 10 ? 2 : m <= 50 ? 10 : m <= 200 ? 20 : 100;
  return Math.ceil(m / langkah) * langkah;
}
