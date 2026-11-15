import { tambahHari } from "./leave/tanggal.js";

const NAMA_BULAN = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const dua = (n) => String(n).padStart(2, "0");

// Minggu kerja Indonesia: Senin sampai Minggu. Masukan dan keluaran string YYYY-MM-DD.
export function rentangMinggu(hari) {
  const [y, m, d] = hari.split("-").map(Number);
  const sejakSenin = (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7;
  const dari = tambahHari(hari, -sejakSenin);
  return { dari, sampai: tambahHari(dari, 6) };
}

export function rentangBulan(hari) {
  const [y, m] = hari.split("-").map(Number);
  const hariTerakhir = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return { dari: `${y}-${dua(m)}-01`, sampai: `${y}-${dua(m)}-${dua(hariTerakhir)}` };
}

export function labelBulan(hari) {
  const [y, m] = hari.split("-").map(Number);
  return `${NAMA_BULAN[m - 1]} ${y}`;
}
