import { selisihHari } from "./tanggal.js";

export function tambahTahun(s, n) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(Date.UTC(y + n, m - 1, d)).toISOString().slice(0, 10);
}

// Notasi standar: H-3 = minimal 3 hari sebelum mulai, H-0 = hari yang sama, H+3 = masih boleh 3 hari setelah mulai.
export function labelBatasPengajuan(n) {
  const v = Number(n) || 0;
  if (v > 0) return `H-${v}`;
  if (v === 0) return "H-0";
  return `H+${Math.abs(v)}`;
}

export function keteranganBatasPengajuan(n) {
  const v = Number(n) || 0;
  if (v > 0) return `minimal ${v} hari sebelum tanggal mulai`;
  if (v === 0) return "hanya untuk hari ini atau tanggal mendatang";
  return `maksimal ${Math.abs(v)} hari setelah tanggal mulai`;
}

export function cekAturanJenis({ jenis, mulai, hariIni, tanggalBergabung }) {
  if (jenis.kode === "tahunan" && tambahTahun(tanggalBergabung, 1) > hariIni) {
    return "Cuti Tahunan hanya dapat diajukan setelah masa kerja minimal 1 tahun.";
  }
  const batas = jenis.batasPengajuanHari;
  if (selisihHari(hariIni, mulai) >= batas) return null;
  if (batas > 0) return `${jenis.nama} harus diajukan minimal ${keteranganBatasPengajuan(batas)} (${labelBatasPengajuan(batas)}).`;
  if (batas === 0) return `${jenis.nama} ${keteranganBatasPengajuan(0)} (${labelBatasPengajuan(0)}).`;
  return `${jenis.nama} hanya dapat diajukan ${keteranganBatasPengajuan(batas)} (${labelBatasPengajuan(batas)}).`;
}
