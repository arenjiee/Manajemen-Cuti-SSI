import { adalahAkhirPekan, hariDalamRentang, tambahHari } from "./tanggal.js";
import { labelBulan, rentangBulan } from "../periode.js";

export function statusHari({ tanggal, libur, terisi, batas, cekKapasitas = true }) {
  if (adalahAkhirPekan(tanggal)) return "akhir_pekan";
  if (libur.has(tanggal)) return "libur";
  if (cekKapasitas) {
    if (terisi >= batas) return "penuh";
    if (terisi > 0 && terisi + 1 >= batas) return "hampir";
  }
  return "ok";
}

export function bangunKalender({ dari, sampai, okupansi, batas, libur, ...rest }) {
  const hasil = [];
  let kursor = dari;
  while (kursor <= sampai) {
    const { dari: awal, sampai: akhir } = rentangBulan(kursor);
    const hari = hariDalamRentang(awal, akhir <= sampai ? akhir : sampai).map((tanggal) => {
      const terisi = okupansi.get(tanggal) ?? 0;
      const status = statusHari({ tanggal, terisi, batas, libur, ...rest });
      const liburInfo = libur?.get ? libur.get(tanggal) : null;
      return {
        tanggal,
        terisi,
        status,
        ...(liburInfo ? { liburInfo } : {}),
      };
    });
    const [y, m, d] = awal.split("-").map(Number);
    hasil.push({ bulan: awal.slice(0, 7), label: labelBulan(awal), offset: (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7, hari });
    kursor = tambahHari(akhir, 1);
  }
  return hasil;
}

export function batasKalender(mulai, selesai, maksBulan = 3) {
  const awal = rentangBulan(mulai).dari;
  let akhir = rentangBulan(mulai).sampai;
  for (let i = 1; i < maksBulan && akhir < selesai; i++) akhir = rentangBulan(tambahHari(akhir, 1)).sampai;
  return { dari: awal, sampai: akhir };
}
