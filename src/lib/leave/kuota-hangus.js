import { hariKerjaDalamRentang } from "./hitung-hari.js";

export const AMBANG_DEFAULT = 5;
export const JEDA_PENGINGAT_HARI = 7;

export function hariKerjaTersisa(hari, libur) {
  const tahun = hari.slice(0, 4);
  return hariKerjaDalamRentang(hari, `${tahun}-12-31`, libur).length;
}

export function risikoHangus(sisa, hariTersisa, ambang = AMBANG_DEFAULT) {
  if (sisa <= 0) return null;
  if (sisa > hariTersisa) return "pasti";
  if (sisa >= ambang) return "waspada";
  return null;
}

export function ambangValid(v) {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0.5 && n <= 365 ? n : AMBANG_DEFAULT;
}
