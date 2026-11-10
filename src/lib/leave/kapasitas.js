export function batasHarian(maxPersen, jumlahAnggotaAktif) {
  return Math.max(1, Math.floor((maxPersen * jumlahAnggotaAktif) / 100));
}

export function cekKapasitas({ hariKerja, okupansi, batas }) {
  for (const tanggal of hariKerja) {
    const terisi = okupansi.get(tanggal) ?? 0;
    if (terisi + 1 > batas) return { ok: false, tanggalPenuh: tanggal, terisi, batas };
  }
  return { ok: true };
}
