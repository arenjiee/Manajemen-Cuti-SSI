export const KUOTA_TAHUNAN_DEFAULT = 12;
export const KUOTA_TAHUNAN_MIN = 12;
export const KUOTA_TAHUNAN_MAX = 365;

export function sisaKuota(kuotaAwal, terpakai) {
  const sisa = Math.round((Number(kuotaAwal) - Number(terpakai)) * 10) / 10;
  return Math.max(0, sisa);
}
