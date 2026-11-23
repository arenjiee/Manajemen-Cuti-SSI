import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { formatTanggal, formatRentang, formatHari } from "./format.js";
import { hariIni } from "./leave/tanggal.js";

const A4 = [595.28, 841.89];
const MARGIN = 56;
const ROMAWI = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

export function nomorSurat(id, tanggalMulai) {
  const [y, m] = tanggalMulai.split("-").map(Number);
  return `CUTI/${String(id).padStart(4, "0")}/${ROMAWI[m - 1]}/${y}`;
}

function aman(font, teks) {
  return [...String(teks ?? "")]
    .map((ch) => {
      if (ch === "\n" || ch === "\t") return " ";
      try {
        font.encodeText(ch);
        return ch;
      } catch {
        return "?";
      }
    })
    .join("");
}

export function bungkus(font, teks, ukuran, lebar) {
  const kata = aman(font, teks).split(/\s+/).filter(Boolean);
  const baris = [];
  let kini = "";
  for (const k of kata) {
    const calon = kini ? `${kini} ${k}` : k;
    if (font.widthOfTextAtSize(calon, ukuran) <= lebar) {
      kini = calon;
      continue;
    }
    if (kini) baris.push(kini);
    let sisa = k;
    while (font.widthOfTextAtSize(sisa, ukuran) > lebar) {
      let n = sisa.length;
      while (n > 1 && font.widthOfTextAtSize(sisa.slice(0, n), ukuran) > lebar) n--;
      baris.push(sisa.slice(0, n));
      sisa = sisa.slice(n);
    }
    kini = sisa;
  }
  if (kini) baris.push(kini);
  return baris.length ? baris : ["-"];
}

export async function buatSuratCuti(p, { perusahaan, alamat, dicetak }) {
  const doc = await PDFDocument.create();
  doc.setTitle(`Surat Persetujuan Cuti ${nomorSurat(p.id, p.tanggal_mulai)}`);
  doc.setProducer("LeaveSync");
  const page = doc.addPage(A4);
  const reg = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const [W, H] = A4;
  const isi = W - MARGIN * 2;
  let y = H - MARGIN;

  const teks = (t, { x = MARGIN, ukuran = 11, font = reg, warna = rgb(0.1, 0.1, 0.1) } = {}) => {
    page.drawText(aman(font, t), { x, y, size: ukuran, font, color: warna });
  };
  const tengah = (t, ukuran, font) => {
    const s = aman(font, t);
    page.drawText(s, { x: (W - font.widthOfTextAtSize(s, ukuran)) / 2, y, size: ukuran, font, color: rgb(0.1, 0.1, 0.1) });
  };

  tengah(perusahaan, 15, bold);
  y -= 16;
  tengah(alamat, 9, reg);
  y -= 10;
  page.drawLine({ start: { x: MARGIN, y }, end: { x: W - MARGIN, y }, thickness: 1.2, color: rgb(0.1, 0.1, 0.1) });
  y -= 30;
  tengah("SURAT PERSETUJUAN CUTI", 14, bold);
  y -= 15;
  tengah(`Nomor: ${nomorSurat(p.id, p.tanggal_mulai)}`, 10, reg);
  y -= 30;

  teks("Dengan ini disampaikan bahwa pengajuan cuti karyawan berikut telah disetujui:");
  y -= 22;

  const baris = [
    ["Nama", p.pengaju_nama],
    ["Divisi", p.divisi_nama ?? "-"],
    ["Jenis cuti", p.jenis_nama],
    ["Periode cuti", formatRentang(p.tanggal_mulai, p.tanggal_selesai)],
    ["Total hari kerja", `${formatHari(p.total_hari)} hari${p.setengah_hari ? " (setengah hari)" : ""}`],
    ["Alasan", p.alasan],
    ["Rekan pengganti", p.handover_nama ?? "-"],
    ["Alamat selama cuti", p.alamat_cuti || "-"],
    ["Nomor darurat", p.nomor_darurat || "-"],
    ["Tanggal pengajuan", formatTanggal(p.tanggal_pengajuan)],
  ];
  const kolomNilai = MARGIN + 130;
  for (const [label, nilai] of baris) {
    const potong = bungkus(reg, nilai, 11, W - MARGIN - kolomNilai - 8);
    teks(label, { font: bold });
    teks(":", { x: kolomNilai - 10 });
    potong.forEach((b, i) => {
      teks(b, { x: kolomNilai });
      if (i < potong.length - 1) y -= 14;
    });
    y -= 20;
  }

  y -= 6;
  teks("Riwayat persetujuan", { font: bold });
  y -= 16;
  const disetujui = p.persetujuan.filter((s) => s.keputusan === "approve");
  for (const s of disetujui) {
    const peran = s.tahap === "leader" ? "Ketua Divisi" : "HRD";
    teks(`${peran}: ${s.approver_nama}, ${formatTanggal(hariIni(new Date(s.created_at)))}`, { ukuran: 10 });
    y -= 14;
    if (s.catatan) {
      for (const b of bungkus(reg, `Catatan: ${s.catatan}`, 9, isi - 14)) {
        teks(b, { x: MARGIN + 14, ukuran: 9, warna: rgb(0.35, 0.35, 0.35) });
        y -= 12;
      }
    }
  }

  y -= 20;
  for (const b of bungkus(reg, "Surat ini dibuat secara elektronik oleh Sistem Manajemen Cuti Karyawan dan sah tanpa tanda tangan basah.", 9, isi)) {
    teks(b, { ukuran: 9, warna: rgb(0.35, 0.35, 0.35) });
    y -= 12;
  }
  y -= 6;
  teks(`Dicetak: ${dicetak}`, { ukuran: 9, warna: rgb(0.35, 0.35, 0.35) });

  return doc.save();
}
