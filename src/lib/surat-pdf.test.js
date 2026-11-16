import { test } from "node:test";
import assert from "node:assert/strict";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { buatSuratCuti, nomorSurat, bungkus } from "./surat-pdf.js";

const data = {
  id: 7, pengaju_nama: "Ana Šebesta 山", divisi_nama: "FLM", jenis_nama: "Cuti Tahunan", tanggal_mulai: "2026-11-16", tanggal_selesai: "2026-11-18",
  total_hari: 3, setengah_hari: false, alasan: "Keperluan keluarga ".repeat(30), handover_nama: "Budi", alamat_cuti: null, nomor_darurat: "0812",
  tanggal_pengajuan: "2026-11-09",
  persetujuan: [
    { tahap: "leader", keputusan: "approve", approver_nama: "Ketua FLM", created_at: new Date("2026-11-10T03:00:00Z"), catatan: "Silakan" },
    { tahap: "hrd", keputusan: "approve", approver_nama: "Rina HRD", created_at: new Date("2026-11-11T03:00:00Z"), catatan: null },
  ],
};

test("nomorSurat memakai bulan romawi dari tanggal mulai", () => {
  assert.equal(nomorSurat(7, "2026-11-16"), "CUTI/0007/XI/2026");
  assert.equal(nomorSurat(123, "2027-01-02"), "CUTI/0123/I/2027");
});

test("buatSuratCuti menghasilkan PDF valid satu halaman meski ada karakter di luar WinAnsi", async () => {
  const bytes = await buatSuratCuti(data, { perusahaan: "PT SSI", alamat: "Makassar", dicetak: "12 Nov 2026" });
  assert.equal(Buffer.from(bytes.slice(0, 5)).toString(), "%PDF-");
  const doc = await PDFDocument.load(bytes);
  assert.equal(doc.getPageCount(), 1);
});

test("bungkus memecah teks panjang tanpa melebihi lebar", async () => {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const baris = bungkus(font, "x".repeat(300) + " pendek", 11, 200);
  assert.ok(baris.length > 2);
  for (const b of baris) assert.ok(font.widthOfTextAtSize(b, 11) <= 200);
});
