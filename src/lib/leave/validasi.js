import { tanggalValid } from "./tanggal.js";
import { hariKerjaDalamRentang, hitungTotalHari } from "./hitung-hari.js";
import { adaOverlap } from "./overlap.js";
import { sisaKuota } from "./kuota.js";
import { batasHarian, cekKapasitas } from "./kapasitas.js";
import { cekAturanJenis } from "./aturan-jenis.js";

export const LAMPIRAN_MIME = ["application/pdf", "image/jpeg", "image/png"];
export const LAMPIRAN_MAKS = 2 * 1024 * 1024;

const gagal = (kode, pesan) => ({ ok: false, kode, pesan });

export function validasiPengajuan(input, k) {
  const { mulai, selesai } = input;
  const setengah = Boolean(input.setengahHari);

  // 2. bentuk data
  if (!tanggalValid(mulai) || !tanggalValid(selesai)) return gagal("BENTUK_DATA", "Tanggal tidak valid.");
  if (selesai < mulai) return gagal("BENTUK_DATA", "Tanggal selesai tidak boleh sebelum tanggal mulai.");
  if (setengah && mulai !== selesai) return gagal("BENTUK_DATA", "Cuti setengah hari hanya untuk satu tanggal.");
  if (!input.alasan || !String(input.alasan).trim()) return gagal("BENTUK_DATA", "Alasan cuti wajib diisi.");
  if (k.pengaju.divisiId == null) return gagal("TANPA_DIVISI", "Anda belum tergabung di divisi mana pun. Hubungi Admin.");

  // 3. aturan jenis cuti
  const aturan = cekAturanJenis({ jenis: k.jenis, mulai, hariIni: k.hariIni, tanggalBergabung: k.pengaju.tanggalBergabung });
  if (aturan) return gagal("ATURAN_JENIS", aturan);

  // 4. hari kerja
  const totalHari = hitungTotalHari(mulai, selesai, k.hariLibur, setengah);
  if (totalHari === 0) return gagal("TOTAL_NOL", "Rentang yang dipilih tidak mengandung hari kerja (akhir pekan atau hari libur).");

  // 5. lintas tahun untuk jenis berkuota
  const berkuota = k.jenis.potongKuota || k.jenis.kuotaHari != null;
  if (berkuota && mulai.slice(0, 4) !== selesai.slice(0, 4)) {
    return gagal("LINTAS_TAHUN", "Pengajuan yang memotong kuota tidak boleh melintasi pergantian tahun. Ajukan terpisah per tahun.");
  }

  // 6. overlap
  if (adaOverlap(mulai, selesai, k.pengajuanAktifPengaju)) {
    return gagal("OVERLAP", "Tanggal tumpang-tindih dengan pengajuan cuti Anda yang masih aktif.");
  }

  // 7. kuota
  if (k.jenis.potongKuota) {
    const sisa = sisaKuota(k.pengaju.kuotaAwal, k.terpakaiPotongKuota);
    if (sisa < totalHari) return gagal("KUOTA", `Kuota tidak mencukupi: sisa ${sisa} hari, dibutuhkan ${totalHari} hari.`);
  }
  if (k.jenis.kuotaHari != null && k.terpakaiJenis + totalHari > Number(k.jenis.kuotaHari)) {
    return gagal("KUOTA_JENIS", `Batas ${k.jenis.nama} ${k.jenis.kuotaHari} hari per tahun terlampaui.`);
  }

  // 8. rekan pengganti
  if (k.kandidatRekan.length === 0) return gagal("TANPA_REKAN", "Tidak ada rekan pengganti yang tersedia pada tanggal tersebut.");
  if (!input.handoverId) return gagal("REKAN_WAJIB", "Rekan pengganti wajib dipilih.");
  if (!k.kandidatRekan.includes(Number(input.handoverId))) {
    return gagal("REKAN_TIDAK_VALID", "Rekan pengganti tidak tersedia pada tanggal tersebut.");
  }

  // 9. kapasitas divisi (Cuti Sakit tidak diblokir)
  if (k.jenis.kode !== "sakit" && k.divisi) {
    const hariKerja = hariKerjaDalamRentang(mulai, selesai, k.hariLibur);
    const batas = batasHarian(k.divisi.maxPersen, k.divisi.jumlahAnggotaAktif);
    const r = cekKapasitas({ hariKerja, okupansi: k.okupansi, batas });
    if (!r.ok) return gagal("KAPASITAS", `Kapasitas divisi penuh pada ${r.tanggalPenuh} (${r.terisi}/${r.batas}). Pilih tanggal lain.`);
  }

  // 10. lampiran
  if (k.jenis.wajibLampiran && !k.lampiran) return gagal("LAMPIRAN_WAJIB", `${k.jenis.nama} wajib melampirkan dokumen.`);
  if (k.lampiran && (!LAMPIRAN_MIME.includes(k.lampiran.mime) || k.lampiran.ukuran > LAMPIRAN_MAKS)) {
    return gagal("LAMPIRAN_INVALID", "Lampiran harus PDF, JPG, atau PNG dengan ukuran maksimal 2 MB.");
  }

  return { ok: true, totalHari };
}
