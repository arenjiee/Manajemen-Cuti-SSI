export function sisaKuota(kuotaAwal, terpakai) {
  return Math.round((Number(kuotaAwal) - Number(terpakai)) * 10) / 10;
}
