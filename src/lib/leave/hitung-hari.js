import { hariDalamRentang, adalahAkhirPekan } from "./tanggal.js";

export function hariKerjaDalamRentang(mulai, selesai, libur) {
  return hariDalamRentang(mulai, selesai).filter((t) => !adalahAkhirPekan(t) && !libur.has(t));
}

export function hitungTotalHari(mulai, selesai, libur, setengahHari) {
  const n = hariKerjaDalamRentang(mulai, selesai, libur).length;
  if (n === 0) return 0;
  return setengahHari ? 0.5 : n;
}
