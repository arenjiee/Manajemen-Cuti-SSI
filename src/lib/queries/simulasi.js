import { tanggalValid, selisihHari } from "../leave/tanggal.js";
import { hitungTotalHari } from "../leave/hitung-hari.js";
import { sisaKuota } from "../leave/kuota.js";
import { bangunKalender, batasKalender } from "../leave/kalender.js";
import { validasiPengajuan, MAKS_RENTANG_HARI } from "../leave/validasi.js";
import { parseId } from "../id.js";
import { muatKonteks } from "./pengajuan.js";
import { muatHariLibur, muatPetaHariLibur, muatHariLiburDalamRentang } from "./hari-libur.js";
import { okupansiDivisi } from "./kapasitas.js";

const BERKAS_TIRUAN = { mime: "application/pdf", ukuran: 1 };

export async function simulasiPengajuan(db, pengajuId, input) {
  const { mulai, selesai } = input ?? {};
  if (!tanggalValid(mulai) || !tanggalValid(selesai) || selesai < mulai) return { siap: false };
  if (selisihHari(mulai, selesai) > MAKS_RENTANG_HARI) return { siap: true, ok: false, pesan: `Rentang tanggal maksimal ${MAKS_RENTANG_HARI} hari.`, kalender: [], kandidatRekan: [], hariLiburTerlewati: [] };

  const setengah = Boolean(input.setengahHari);
  const jenisId = parseId(input.jenisId);
  const k = await muatKonteks(db, pengajuId, { jenisId, mulai, selesai }, BERKAS_TIRUAN);
  if (!k.pengaju) return { siap: false };

  const nama = k.kandidatRekan.length
    ? (await db.query("SELECT id, nama_lengkap FROM users WHERE id = ANY($1) ORDER BY nama_lengkap", [k.kandidatRekan])).rows.map((r) => ({ id: r.id, nama: r.nama_lengkap }))
    : [];

  const hasil = {
    siap: true,
    ok: false,
    kode: null,
    pesan: null,
    totalHari: 0,
    sisaSekarang: null,
    sisaSetelah: null,
    tahun: Number(mulai.slice(0, 4)),
    kandidatRekan: nama,
    kalender: [],
    hariLiburTerlewati: await muatHariLiburDalamRentang(db, { mulai, selesai }),
  };
  hasil.totalHari = hitungTotalHari(mulai, selesai, k.hariLibur, setengah);
  hasil.sisaSekarang = sisaKuota(k.pengaju.kuotaAwal, k.terpakaiPotongKuota);

  if (!k.jenis) {
    hasil.pesan = "Pilih jenis cuti.";
  } else {
    if (k.jenis.potongKuota) hasil.sisaSetelah = sisaKuota(k.pengaju.kuotaAwal, k.terpakaiPotongKuota + hasil.totalHari);
    const dipilih = parseId(input.handoverId);
    const v = validasiPengajuan(
      {
        mulai,
        selesai,
        setengahHari: setengah,
        jamMulai: input.jamMulai,
        jamSelesai: input.jamSelesai,
        alasan: "-",
        catatanTugas: "-",
        nomorDarurat: "081234567890",
        handoverId: k.kandidatRekan.includes(dipilih) ? dipilih : (k.kandidatRekan[0] ?? null),
      },
      k
    );
    if (v.ok) hasil.ok = true;
    else { hasil.kode = v.kode; hasil.pesan = v.pesan; }
  }

  if (k.pengaju.divisiId) {
    const { dari, sampai } = batasKalender(mulai, selesai);
    const [liburPeta, okupansi] = await Promise.all([
      muatPetaHariLibur(db, { dari, sampai }),
      okupansiDivisi(db, k.pengaju.divisiId, dari, sampai),
    ]);
    const batas = k.divisi ? k.divisi.maksPerHari : Infinity;
    hasil.kalender = bangunKalender({
      dari, sampai, okupansi, batas, libur: liburPeta, cekKapasitas: k.jenis?.kode !== "sakit",
    });
  }
  return hasil;
}
