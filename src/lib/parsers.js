import { s, bool } from "./http.js";

export const parseHariLibur = (b) => ({
  tanggal: s(b.tanggal),
  keterangan: s(b.keterangan),
  jenis: s(b.jenis),
});

export const parseJenis = (b) => ({
  nama: s(b.nama),
  kuotaHari: b.kuotaHari !== "" && b.kuotaHari != null ? Number(b.kuotaHari) : null,
  batasPengajuanHari: b.batasPengajuanHari === "" || b.batasPengajuanHari == null ? NaN : Number(b.batasPengajuanHari),
  wajibLampiran: bool(b.wajibLampiran),
  potongKuota: bool(b.potongKuota),
  aktif: b.aktif != null ? bool(b.aktif) : true,
});
