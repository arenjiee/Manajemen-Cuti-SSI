import { adaOverlap } from "./overlap.js";

export function kandidatRekan(anggota, pengajuId, mulai, selesai) {
  return anggota
    .filter((a) => a.id !== pengajuId && a.aktif && !adaOverlap(mulai, selesai, a.pengajuanAktif))
    .map((a) => a.id);
}
