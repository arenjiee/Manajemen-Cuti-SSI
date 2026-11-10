import { selisihHari } from "./tanggal.js";

export function tambahTahun(s, n) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(Date.UTC(y + n, m - 1, d)).toISOString().slice(0, 10);
}

export function cekAturanJenis({ jenis, mulai, hariIni, tanggalBergabung }) {
  if (jenis.kode === "tahunan" && tambahTahun(tanggalBergabung, 1) > hariIni) {
    return "Cuti Tahunan hanya dapat diajukan setelah masa kerja minimal 1 tahun.";
  }
  const batas = jenis.batasPengajuanHari;
  if (selisihHari(hariIni, mulai) >= batas) return null;
  if (batas > 0) return `${jenis.nama} harus diajukan minimal H-${batas} sebelum tanggal mulai.`;
  if (batas === 0) return `${jenis.nama} tidak dapat diajukan untuk tanggal yang sudah lewat.`;
  return `${jenis.nama} hanya dapat diajukan maksimal ${-batas} hari setelah tanggal mulai.`;
}
