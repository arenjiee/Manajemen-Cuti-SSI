export function adaOverlap(mulai, selesai, aktif) {
  return aktif.some((a) => a.mulai <= selesai && a.selesai >= mulai);
}
