// Pembuat db/seed_data.sql. Jalankan: node scripts/buat-seed.mjs [YYYY-MM-DD]
//
// Seed disusun terhadap tanggal "hari ini" (anchor) supaya fitur yang bergantung waktu selalu punya data:
// cuti yang sedang berjalan, cuti minggu ini, notifikasi baru, periode kuota hangus, dan chart tahun berjalan.
// Tanpa argumen, anchor = 2026-11-25 sehingga db/seed_data.sql yang ter-commit selalu sama (deterministik).
// Dengan argumen, semua tanggal data digeser relatif terhadap tanggal itu (mis. `node scripts/buat-seed.mjs 2026-12-10`).
// Generator memeriksa sendiri aturan aplikasi (kuota, kapasitas divisi, tumpang tindih, masa kerja) sebelum menulis file.
import { readFileSync, writeFileSync } from "node:fs";

const ANCHOR_DEFAULT = "2026-11-25";
const anchor = process.argv[2] ?? ANCHOR_DEFAULT;
if (!/^\d{4}-\d{2}-\d{2}$/.test(anchor) || Number.isNaN(Date.parse(anchor))) {
  console.error("Format tanggal harus YYYY-MM-DD.");
  process.exit(1);
}

// ---------- Utilitas tanggal (UTC, tanpa zona waktu) ----------
const MS = 86400000;
const t = (s) => Date.parse(`${s.slice(0, 10)}T00:00:00Z`);
const iso = (ms) => new Date(ms).toISOString().slice(0, 10);
const tambah = (s, n) => iso(t(s) + n * MS);
const selisih = (a, b) => Math.round((t(a) - t(b)) / MS);
// Digeser kelipatan 7 hari agar hari dalam seminggu (dan pola akhir pekan) tetap sama; "hari ini" bisa berbeda sampai 3 hari.
const GESER = Math.round(selisih(anchor, ANCHOR_DEFAULT) / 7) * 7;
const geser = (s) => tambah(s, GESER); // tanggal "dunia default" -> dunia anchor
const akhirPekan = (s) => [0, 6].includes(new Date(t(s)).getUTCDay());
const BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const fmtTgl = (s) => { const [y, m, d] = s.split("-").map(Number); return `${d} ${BULAN[m - 1]} ${y}`; };
const fmtRentang = (a, b) => (a === b ? fmtTgl(a) : `${fmtTgl(a)} – ${fmtTgl(b)}`);
const q = (v) => (v === null || v === undefined ? "NULL" : typeof v === "number" || typeof v === "boolean" ? String(v) : `'${String(v).replaceAll("'", "''")}'`);
// "YYYY-MM-DD HH:MM" di WITA (+08), digeser mengikuti anchor
const ts = (s) => `${geser(s.slice(0, 10))} ${s.slice(11, 16)}:00+08`;

// ---------- Hari libur (sesuaikan dengan SKB resmi bila perlu) ----------
const LIBUR = [
  ["2026-01-01", "Tahun Baru 2026", "nasional"], ["2026-01-16", "Isra Mikraj Nabi Muhammad SAW", "nasional"],
  ["2026-02-16", "Cuti Bersama Tahun Baru Imlek", "cuti_bersama"], ["2026-02-17", "Tahun Baru Imlek 2577", "nasional"],
  ["2026-03-18", "Cuti Bersama Hari Suci Nyepi", "cuti_bersama"], ["2026-03-19", "Hari Suci Nyepi", "nasional"],
  ["2026-03-20", "Cuti Bersama Idulfitri", "cuti_bersama"], ["2026-03-21", "Idulfitri 1447 H", "nasional"],
  ["2026-03-22", "Idulfitri 1447 H", "nasional"], ["2026-03-23", "Cuti Bersama Idulfitri", "cuti_bersama"],
  ["2026-03-24", "Cuti Bersama Idulfitri", "cuti_bersama"], ["2026-04-03", "Wafat Yesus Kristus", "nasional"],
  ["2026-04-05", "Hari Paskah", "nasional"], ["2026-05-01", "Hari Buruh Internasional", "nasional"],
  ["2026-05-14", "Kenaikan Yesus Kristus", "nasional"], ["2026-05-15", "Cuti Bersama Kenaikan Yesus Kristus", "cuti_bersama"],
  ["2026-05-27", "Iduladha 1447 H", "nasional"], ["2026-05-28", "Cuti Bersama Iduladha", "cuti_bersama"],
  ["2026-05-31", "Hari Raya Waisak", "nasional"], ["2026-06-01", "Hari Lahir Pancasila", "nasional"],
  ["2026-06-16", "Tahun Baru Islam 1448 H", "nasional"], ["2026-08-17", "Hari Kemerdekaan RI", "nasional"],
  ["2026-08-25", "Maulid Nabi Muhammad SAW", "nasional"], ["2026-12-24", "Cuti Bersama Natal", "cuti_bersama"],
  ["2026-12-25", "Hari Natal", "nasional"],
];
const libur = new Set(LIBUR.map((l) => l[0]));
const kerja = (s) => !akhirPekan(s) && !libur.has(s);
const majuKerja = (s) => { while (!kerja(s)) s = tambah(s, 1); return s; };
const mundurKerja = (s) => { while (!kerja(s)) s = tambah(s, -1); return s; };
const selesaiDari = (mulai, n) => { let s = mulai; for (let i = 1; i < n; i++) s = majuKerja(tambah(s, 1)); return s; };
const hariKerja = (a, b) => { const r = []; for (let s = a; s <= b; s = tambah(s, 1)) if (kerja(s)) r.push(s); return r; };

// ---------- Pengguna ----------
const HASH = "$2b$10$wUzlf9lhQZ1GBwHOXOUmZepXLGF.zbZbiG5ocllH.poOGzV53Zd.i"; // password123
// [username, nama, role, divisi, bergabung, kuota_awal]. Bergabung berbentuk tanggal tetap, atau { hariLalu } relatif terhadap anchor.
const U = [
  ["andika", "Andika Rahman", "admin", null, "2018-02-01"],
  ["anita", "Anita Aminarti H.", "hrd", null, "2019-03-01"],
  ["al.daffa", "Al Daffa A'Aren", "ketua_divisi", "CPC", "2020-01-06"],
  ["rayyan", "Muhammad Rayyan Izdihar", "ketua_divisi", "CIT", "2020-07-13"],
  ["rifat", "Muhammad Rifat Kasman", "ketua_divisi", "FLM", "2021-02-01"],
  ["aidil", "Ahmad Aidil Mansur", "ketua_divisi", "OPS", "2021-08-02"],
  ["diva", "Diva Puspita", "karyawan", "CPC", "2022-04-04"],
  ["imam", "Imam Arief Rachmat", "karyawan", "CPC", "2019-04-15", 30], // kuota besar → contoh "pasti hangus"
  ["afdhol", "Afdhol As Syamardi", "karyawan", "CPC", "2023-01-09"],
  ["alifah", "Andi Alifah Mahrani", "karyawan", "CPC", "2022-09-12"],
  ["firah", "Firah Nuraisyah", "karyawan", "CPC", "2023-05-02"],
  ["mufiidah", "Mufiidah Nuzuluddin Febrianty", "karyawan", "CPC", "2024-01-08"],
  ["nurhayu", "Nurhayu Fiantika Gafar", "karyawan", "CPC", "2024-06-03"],
  ["tifli", "Achmad Tifli", "karyawan", "CIT", "2023-05-02"],
  ["karis", "Karis Kabanga", "karyawan", "CIT", "2023-08-14"],
  ["mawaddah", "Mawaddah Fajri Lahamuddin", "karyawan", "CIT", "2024-01-08"],
  ["naufal", "Muhammad Naufal Alim", "karyawan", "CIT", "2024-06-03"],
  ["fajar", "Moh. Fajar", "karyawan", "CIT", "2024-10-07"],
  ["almendo", "Almendo Daud Ubro", "karyawan", "CIT", "2025-02-03"],
  ["fharel", "Muh. Fharel Anugrah", "karyawan", "CIT", "2025-07-07"],
  ["mukhsin", "Mukhsin", "karyawan", "FLM", "2024-10-07"],
  ["alif", "Muh. Alif Syamsir", "karyawan", "FLM", "2025-02-03"],
  ["faiz", "Muh. Faiz Ilyas", "karyawan", "FLM", "2024-11-04"],
  ["talista", "Andi Talista Anindya", "karyawan", "FLM", "2023-03-06"],
  ["m.daffa", "M. Daffa Athaillah Inzaghi Sailu", "karyawan", "FLM", "2024-03-04"],
  ["rafly", "Muh. Rafly Nurramadhan", "karyawan", "FLM", "2024-09-02"],
  ["aqila", "Aqila", "karyawan", "OPS", { hariLalu: 177 }], // < 1 tahun: tidak boleh Cuti Tahunan
  ["fadhiyah", "Fadhiyah Syafikah Firman", "karyawan", "OPS", "2022-11-01"],
  ["aisyah", "Nur Aisyah AT", "karyawan", "OPS", "2023-02-06"],
  ["puti", "Puti Amelia Azzahra", "karyawan", "OPS", { hariLalu: 72 }], // < 1 tahun
  ["maisyah", "Maisyah Mahdiyyah", "karyawan", "OPS", "2020-05-04"],
];
const DIVISI = [
  ["CPC", "Cash Processing Center: penyortiran dan penghitungan uang", "al.daffa", 25],
  ["CIT", "Cash in Transit: pengawalan dan pengiriman uang", "rayyan", 25],
  ["FLM", "First Line Maintenance: perawatan ATM dan pengisian kaset", "rifat", 34],
  ["OPS", "Operasional dan dukungan administrasi", "aidil", 30],
];
const ALAMAT = ["Jl. Pettarani No. 10, Makassar", "Jl. Sultan Alauddin No. 45, Makassar", "Jl. Perintis Kemerdekaan Km. 9, Makassar", "Jl. Urip Sumoharjo No. 21, Makassar", "BTP Blok K No. 7, Makassar", "Jl. Hertasning Baru No. 3, Makassar", "Perumnas Antang Blok 5, Makassar", "Jl. Racing Centre No. 12, Makassar", "Jl. Tamalanrea Raya No. 30, Makassar", "Jl. Poros Malino, Kab. Gowa"];
const users = U.map(([username, nama, role, div, join, kuota], i) => ({
  id: i + 1, username, nama, role, div,
  join: typeof join === "string" ? geser(join) : tambah(anchor, -join.hariLalu), // masa kerja ikut bergeser
  kuota: kuota ?? 12, telepon: `08110000${String(i + 1).padStart(3, "0")}`, alamat: ALAMAT[i % ALAMAT.length],
}));
const byU = Object.fromEntries(users.map((u) => [u.username, u]));
const divId = Object.fromEntries(DIVISI.map((d, i) => [d[0], i + 1]));
const anggotaDiv = (kode) => users.filter((u) => u.div === kode);
const ketuaDiv = Object.fromEntries(DIVISI.map((d) => [d[0], byU[d[2]]]));
const hrdList = users.filter((u) => u.role === "hrd");
const batasDiv = Object.fromEntries(DIVISI.map((d) => [d[0], Math.max(1, Math.floor((d[3] * anggotaDiv(d[0]).length) / 100))]));

// ---------- Jenis cuti ----------
const JENIS = [
  { id: 1, nama: "Cuti Tahunan", kode: "tahunan", sys: true, kuota: 12, batas: 3, lamp: false, potong: true },
  { id: 2, nama: "Cuti Sakit", kode: "sakit", sys: true, kuota: null, batas: -3, lamp: true, potong: false },
  { id: 3, nama: "Cuti Menikah", kode: null, sys: false, kuota: 3, batas: 7, lamp: true, potong: false },
  { id: 4, nama: "Cuti Duka", kode: null, sys: false, kuota: 2, batas: 0, lamp: false, potong: false },
  { id: 5, nama: "Cuti Melahirkan", kode: null, sys: false, kuota: 90, batas: 30, lamp: true, potong: false },
  { id: 6, nama: "Cuti Tanpa Gaji", kode: null, sys: false, kuota: null, batas: 0, lamp: false, potong: false },
];
const J = { tahunan: 1, sakit: 2, menikah: 3, duka: 4, tanpagaji: 6 };

// ---------- Pengajuan ----------
// [username, jenis, mulai (tanggal dunia default), jumlah hari kerja, status, opsi]
// status: A disetujui | L menunggu Ketua | H disetujui Ketua, menunggu HRD | P menunggu HRD (diajukan Ketua)
//         RL ditolak Ketua | RH ditolak HRD | C dibatalkan
// opsi: lead (hari sebelum mulai, bawaan 10), aj/l/h (waktu ajuan/keputusan "YYYY-MM-DD HH:MM"), cat (catatan tolak),
//       batal (alasan batal), half ([jamMulai, jamSelesai] | "tanpa-jam"), ho (username rekan pengganti), lamp
const RAW = [
  // --- Riwayat Jan–Nov (membentuk chart bulanan) ---
  ["diva", "tahunan", "2026-01-12", 2, "A"], ["naufal", "tahunan", "2026-01-26", 3, "A"],
  ["mukhsin", "sakit", "2026-01-14", 2, "A", { lead: 0 }], ["imam", "tahunan", "2026-02-09", 2, "A"],
  ["aisyah", "tahunan", "2026-02-23", 2, "A"], ["karis", "tahunan", "2026-02-02", 2, "RL", { cat: "Bentrok dengan jadwal pengawalan kas akhir bulan." }],
  ["afdhol", "tahunan", "2026-03-02", 3, "A"], ["tifli", "tahunan", "2026-03-09", 2, "A"],
  ["faiz", "tahunan", "2026-03-12", 1, "A", { half: "tanpa-jam" }], // data lama: jam tidak tercatat
  ["fadhiyah", "tahunan", "2026-03-26", 3, "C", { batal: "Rencana perjalanan berubah" }],
  ["firah", "tahunan", "2026-04-06", 2, "RL", { cat: "Bentrok dengan jadwal audit kas." }],
  ["mawaddah", "sakit", "2026-04-13", 3, "A", { lead: 0 }], ["talista", "tahunan", "2026-04-20", 2, "A"],
  ["rayyan", "tahunan", "2026-04-27", 3, "A"],
  ["alifah", "tahunan", "2026-05-04", 2, "A"], ["fajar", "tahunan", "2026-05-18", 2, "RH", { cat: "Kuota unit pada periode tersebut sudah terisi, mohon pilih tanggal lain." }],
  ["aidil", "tahunan", "2026-05-11", 2, "A"], ["mufiidah", "duka", "2026-05-12", 2, "A", { lead: 0 }],
  ["nurhayu", "tahunan", "2026-06-08", 3, "A"], ["almendo", "tahunan", "2026-06-22", 2, "A"],
  ["m.daffa", "tahunan", "2026-06-17", 2, "C", { batal: "Dibatalkan karena ada dinas luar" }],
  ["al.daffa", "tahunan", "2026-07-06", 5, "A"], ["fharel", "tahunan", "2026-07-13", 3, "A"],
  ["karis", "tahunan", "2026-07-20", 3, "A"], ["alif", "tahunan", "2026-07-27", 2, "A"],
  ["rifat", "tahunan", "2026-08-03", 2, "A"], ["diva", "tahunan", "2026-08-10", 2, "RL", { cat: "Tim CPC sedang kekurangan personel pada tanggal tersebut." }],
  ["imam", "sakit", "2026-08-12", 2, "A", { lead: 0 }], ["mukhsin", "tahunan", "2026-08-24", 2, "A"],
  ["naufal", "menikah", "2026-09-14", 3, "A", { lead: 21 }], ["aqila", "tanpagaji", "2026-09-21", 2, "A"],
  ["tifli", "tahunan", "2026-09-28", 2, "C", { batal: "Acara keluarga dibatalkan" }], ["firah", "tahunan", "2026-09-07", 3, "A"],
  ["mawaddah", "tahunan", "2026-10-05", 2, "A"], ["faiz", "sakit", "2026-10-12", 1, "A", { lead: 0 }],
  ["rafly", "tahunan", "2026-10-19", 3, "A"], ["fadhiyah", "tahunan", "2026-10-26", 2, "A"],
  ["mufiidah", "tahunan", "2026-11-02", 2, "A"], ["m.daffa", "tahunan", "2026-11-10", 1, "A", { half: ["08:00", "12:00"] }],
  // --- Sedang berjalan / sudah lewat baru-baru ini ---
  ["firah", "tahunan", "2026-11-24", 3, "A", { lead: 14 }],
  ["almendo", "sakit", "2026-11-25", 2, "A", { lead: 0, aj: "2026-11-25 08:05", l: "2026-11-25 08:40", h: "2026-11-25 09:10" }],
  ["aisyah", "tahunan", "2026-11-23", 4, "A", { lead: 14 }],
  // --- Menunggu Ketua Divisi ---
  ["nurhayu", "tahunan", "2026-12-01", 2, "L", { aj: "2026-11-24 14:20" }],
  ["fharel", "tahunan", "2026-12-08", 2, "L", { aj: "2026-11-23 10:05" }],
  ["alif", "tahunan", "2026-12-03", 2, "L", { aj: "2026-11-24 16:45" }],
  ["puti", "tanpagaji", "2026-12-09", 2, "L", { aj: "2026-11-25 09:30" }],
  ["mawaddah", "tahunan", "2026-12-02", 1, "L", { aj: "2026-11-25 10:15", half: ["13:00", "17:00"] }],
  // --- Disetujui Ketua, menunggu HRD ---
  ["mufiidah", "tahunan", "2026-12-10", 2, "H", { aj: "2026-11-23 09:00", l: "2026-11-24 10:30" }],
  ["faiz", "tahunan", "2026-12-15", 3, "H", { aj: "2026-11-20 11:00", l: "2026-11-23 09:45" }],
  ["naufal", "tahunan", "2026-12-14", 2, "H", { aj: "2026-11-19 13:30", l: "2026-11-20 13:10" }],
  // --- Diajukan Ketua Divisi langsung ke HRD ---
  ["al.daffa", "tahunan", "2026-12-14", 2, "P", { aj: "2026-11-24 11:00" }],
  ["aidil", "tahunan", "2026-12-03", 2, "P", { aj: "2026-11-25 08:30" }],
  ["rifat", "tahunan", "2026-12-16", 2, "P", { aj: "2026-11-23 15:00" }],
  // --- Keputusan terbaru ---
  ["talista", "tahunan", "2026-12-01", 3, "A", { aj: "2026-11-18 09:40", l: "2026-11-20 10:00", h: "2026-11-24 08:50" }],
  ["fajar", "tahunan", "2026-12-04", 2, "RL", { aj: "2026-11-23 13:00", l: "2026-11-24 15:20", cat: "Bentrok dengan jadwal audit akhir tahun." }],
  ["alifah", "tahunan", "2026-12-17", 2, "RH", { aj: "2026-11-20 10:20", l: "2026-11-23 09:00", h: "2026-11-25 08:15", cat: "Dokumen pendukung belum lengkap, mohon ajukan ulang." }],
  ["m.daffa", "tahunan", "2026-12-21", 2, "C", { aj: "2026-11-19 14:10", batal: "Rencana perjalanan ditunda" }],
  // --- Cuti akhir tahun yang sudah disetujui ---
  ["diva", "tahunan", "2026-12-28", 3, "A", { aj: "2026-11-12 09:15" }], ["afdhol", "tahunan", "2026-12-28", 2, "A", { aj: "2026-11-12 10:05" }],
  ["karis", "tahunan", "2026-12-21", 3, "A", { aj: "2026-11-09 09:10" }], ["tifli", "tahunan", "2026-12-21", 3, "A", { aj: "2026-11-09 11:30" }],
  ["fadhiyah", "tahunan", "2026-12-14", 3, "A", { aj: "2026-11-10 09:00" }], ["rafly", "tahunan", "2026-12-18", 1, "A", { aj: "2026-11-11 13:45", half: ["13:00", "17:00"] }],
];

const ALASAN = {
  tahunan: ["Keperluan keluarga", "Acara keluarga di luar kota", "Mengurus dokumen kependudukan", "Istirahat dan liburan singkat", "Menghadiri wisuda saudara", "Pulang kampung", "Mengantar orang tua berobat"],
  sakit: ["Demam dan perlu istirahat sesuai surat dokter", "Tifus, rawat jalan sesuai surat dokter", "Infeksi saluran pernapasan, istirahat sesuai anjuran dokter"],
  menikah: ["Menikah"], duka: ["Anggota keluarga inti meninggal dunia"], tanpagaji: ["Mengurus keperluan keluarga"],
};
const CATATAN_TUGAS = {
  CPC: "Rekonsiliasi kas harian diserahkan ke rekan pengganti", CIT: "Rute pengawalan dialihkan ke rekan satu tim",
  FLM: "Jadwal maintenance dan pengisian kaset sudah dikoordinasikan", OPS: "Pekerjaan administrasi sudah diserahkan",
};
const CAT_SETUJU_L = ["Disetujui.", "Disetujui, pastikan serah terima sudah jelas.", "Silakan, selamat beristirahat."];
const CAT_SETUJU_H = ["Disetujui HRD.", "Disetujui, sisa kuota mencukupi."];
const AKTIF = new Set(["Pending", "Approved by Leader", "Approved"]);
const STATUS = { A: ["Approved", "hrd"], L: ["Pending", "leader"], H: ["Approved by Leader", "hrd"], P: ["Pending", "hrd"], RL: ["Rejected", "leader"], RH: ["Rejected", "hrd"], C: ["Cancelled", "leader"] };

// Tahap 1: resolusi tanggal
let P = RAW.map(([uname, jk, mulaiDef, n, st, o = {}], idx) => {
  const u = byU[uname];
  const mulai = majuKerja(geser(mulaiDef));
  const selesai = selesaiDari(mulai, n);
  let ajDT;
  if (o.aj) ajDT = ts(o.aj).slice(0, 16).replace("+08", "");
  else {
    const hariAj = mundurKerja(tambah(mulai, -(o.lead ?? 10)));
    const menit = 8 * 60 + ((idx * 37) % 420);
    ajDT = `${hariAj} ${String(Math.floor(menit / 60)).padStart(2, "0")}:${String(menit % 60).padStart(2, "0")}`;
  }
  return { idx, u, jk, jenis: J[jk], mulai, selesai, n, st, o, ajDT, ajuan: ajDT.slice(0, 10) };
});
P.sort((a, b) => a.ajDT.localeCompare(b.ajDT) || a.idx - b.idx);
P.forEach((p, i) => (p.id = i + 1));

// Penyelesai: setelah anchor digeser, tanggal libur yang tetap bisa membuat cuti saling bertabrakan atau melewati
// kapasitas divisi. Pengajuan yang paling belakangan diajukan digeser seminggu ke depan sampai semuanya valid.
// Pada anchor bawaan tidak ada yang perlu digeser.
(function rapikan() {
  const tumpangR = (a, b) => a.mulai <= b.selesai && a.selesai >= b.mulai;
  for (let i = 0; i < 300; i++) {
    const aktif = P.filter((p) => AKTIF.has(STATUS[p.st][0]));
    let korban = null;
    for (const a of aktif) for (const b of aktif) if (!korban && a.id < b.id && a.u === b.u && tumpangR(a, b)) korban = b;
    if (!korban) {
      const peta = new Map();
      for (const p of aktif.filter((x) => x.u.div)) for (const h of hariKerja(p.mulai, p.selesai)) {
        const key = `${p.u.div}|${h}`;
        peta.set(key, [...(peta.get(key) ?? []), p]);
      }
      for (const [key, list] of peta) if (!korban && list.length > batasDiv[key.split("|")[0]]) korban = list.reduce((x, y) => (x.id > y.id ? x : y));
    }
    if (!korban) return;
    korban.mulai = majuKerja(tambah(korban.mulai, 7));
    korban.selesai = selesaiDari(korban.mulai, korban.n);
  }
  throw new Error("Penyelesai jadwal tidak konvergen");
})();

// Tahap 2: rekan pengganti (tanpa bentrok dengan cuti rekan itu sendiri)
const tumpang = (a, b) => a.mulai <= b.selesai && a.selesai >= b.mulai;
P.forEach((p) => {
  const aktifLain = (x) => P.some((o) => o !== p && AKTIF.has(STATUS[o.st][0]) && o.u === x && tumpang(o, p));
  const calon = anggotaDiv(p.u.div).filter((x) => x !== p.u && x.role === "karyawan" && !aktifLain(x));
  const cadangan = anggotaDiv(p.u.div).filter((x) => x !== p.u && !aktifLain(x));
  const pilih = p.o.ho ? byU[p.o.ho] : calon[p.id % Math.max(1, calon.length)] ?? cadangan[0];
  if (!pilih) throw new Error(`Tidak ada rekan pengganti untuk pengajuan ${p.id}`);
  p.ho = pilih;
});

// Tahap 3: keputusan (persetujuan) per pengajuan
const nextKerjaWaktu = (dt, jam) => `${majuKerja(tambah(dt.slice(0, 10), 1))} ${jam}`;
P.forEach((p) => {
  const ketua = p.u.role === "ketua_divisi";
  const hrd = hrdList[p.id % hrdList.length];
  const k = [];
  const waktuL = p.o.l ?? nextKerjaWaktu(p.ajDT, "10:05");
  const waktuH = p.o.h ?? nextKerjaWaktu(waktuL, "08:45");
  if (ketua) {
    if (p.st === "A") k.push({ tahap: "hrd", ap: hrd, kep: "approve", cat: CAT_SETUJU_H[p.id % 2], at: p.o.h ?? nextKerjaWaktu(p.ajDT, "09:00") });
    if (p.st === "RH") k.push({ tahap: "hrd", ap: hrd, kep: "reject", cat: p.o.cat, at: p.o.h ?? nextKerjaWaktu(p.ajDT, "09:00") });
  } else {
    const kl = ketuaDiv[p.u.div];
    if (["A", "H", "RH"].includes(p.st)) k.push({ tahap: "leader", ap: kl, kep: "approve", cat: CAT_SETUJU_L[p.id % 3], at: waktuL });
    if (p.st === "RL") k.push({ tahap: "leader", ap: kl, kep: "reject", cat: p.o.cat, at: waktuL });
    if (p.st === "A") k.push({ tahap: "hrd", ap: hrd, kep: "approve", cat: CAT_SETUJU_H[p.id % 2], at: waktuH });
    if (p.st === "RH") k.push({ tahap: "hrd", ap: hrd, kep: "reject", cat: p.o.cat, at: waktuH });
  }
  p.keputusan = k;
  p.status = STATUS[p.st][0];
  p.tahap = STATUS[p.st][1];
  p.ditolakOleh = p.st === "RL" ? "leader" : p.st === "RH" ? "hrd" : null;
  p.setengah = !!p.o.half;
  p.total = p.setengah ? 0.5 : p.n;
  p.lampiran = JENIS.find((j) => j.id === p.jenis).lamp;
});

// ---------- Verifikasi aturan aplikasi ----------
const galat = [];
for (const p of P) {
  if (p.setengah && p.mulai !== p.selesai) galat.push(`#${p.id} setengah hari harus satu tanggal`);
  if (hariKerja(p.mulai, p.selesai).length !== p.n) galat.push(`#${p.id} jumlah hari kerja tidak cocok`);
  const j = JENIS.find((x) => x.id === p.jenis);
  if (p.jk === "tahunan" && tambah(p.u.join, 365) > p.mulai) galat.push(`#${p.id} ${p.u.username} belum 1 tahun masa kerja untuk Cuti Tahunan`);
  if (j.kuota != null && j.id !== 1 && p.total > j.kuota) galat.push(`#${p.id} melebihi kuota jenis`);
  if (p.ajuan > p.mulai && j.batas >= 0) galat.push(`#${p.id} diajukan setelah tanggal mulai`);
}
const aktifP = P.filter((p) => AKTIF.has(p.status));
for (const p of aktifP) for (const o of aktifP) if (p.id < o.id && p.u === o.u && tumpang(p, o)) galat.push(`#${p.id} & #${o.id} tumpang tindih untuk ${p.u.username}`);
const kuotaPakai = {};
for (const p of aktifP.filter((x) => x.jenis === 1)) { const key = `${p.u.username}|${p.mulai.slice(0, 4)}`; kuotaPakai[key] = (kuotaPakai[key] ?? 0) + p.total; }
for (const [key, v] of Object.entries(kuotaPakai)) if (v > byU[key.split("|")[0]].kuota) galat.push(`kuota tahunan ${key} terlampaui (${v})`);
const okupansi = {};
for (const p of aktifP.filter((x) => x.u.div)) for (const h of hariKerja(p.mulai, p.selesai)) { const key = `${p.u.div}|${h}`; okupansi[key] = (okupansi[key] ?? 0) + 1; }
for (const [key, v] of Object.entries(okupansi)) if (v > batasDiv[key.split("|")[0]]) galat.push(`kapasitas ${key} terlampaui (${v} > ${batasDiv[key.split("|")[0]]})`);
if (galat.length) { console.error("Seed tidak valid:\n- " + galat.join("\n- ")); process.exit(1); }

// ---------- Notifikasi ----------
const nowTs = `${anchor} 17:00`;
const notifs = [];
const batasBaru = tambah(anchor, -3), batasAwal = tambah(anchor, -45);
const tambahNotif = (user, tipe, pesan, link, waktu) => {
  const hari = waktu.slice(0, 10);
  if (hari < batasAwal || hari > anchor) return;
  notifs.push({ user, tipe, pesan, link, dibaca: hari < batasBaru, waktu });
};
for (const p of P) {
  const nama = p.u.nama, rentang = fmtRentang(p.mulai, p.selesai), jenisNama = JENIS.find((j) => j.id === p.jenis).nama;
  tambahNotif(p.ho, "handover", `${nama} menunjuk Anda sebagai rekan pengganti pada ${rentang}.`, null, p.ajDT);
  const pesanAjuan = `${nama} mengajukan ${jenisNama} (${rentang}).`;
  if (p.u.role === "ketua_divisi") for (const h of hrdList) tambahNotif(h, "pengajuan", pesanAjuan, "/persetujuan", p.ajDT);
  else tambahNotif(ketuaDiv[p.u.div], "pengajuan", pesanAjuan, "/verifikasi", p.ajDT);
  for (const k of p.keputusan) {
    const link = `/cuti/${p.id}`;
    if (k.kep === "reject") tambahNotif(p.u, "keputusan", `Pengajuan cuti Anda ditolak ${k.tahap === "leader" ? "Ketua Divisi" : "HRD"}. Catatan: ${k.cat}`, link, k.at);
    else if (k.tahap === "leader") {
      tambahNotif(p.u, "keputusan", "Pengajuan cuti Anda disetujui Ketua Divisi dan menunggu persetujuan final HRD.", link, k.at);
      for (const h of hrdList) tambahNotif(h, "pengajuan", "Ada pengajuan cuti yang menunggu persetujuan final Anda.", "/persetujuan", k.at);
    } else tambahNotif(p.u, "keputusan", "Pengajuan cuti Anda telah disetujui HRD.", link, k.at);
  }
}
// Kuota hangus: hitung sisa tahun berjalan untuk yang berhak (masa kerja ≥ 1 tahun, karyawan/ketua)
const tahunAnchor = Number(anchor.slice(0, 4));
const hariTersisa = hariKerja(anchor, `${tahunAnchor}-12-31`).length;
const risiko = [];
for (const u of users.filter((x) => ["karyawan", "ketua_divisi"].includes(x.role) && tambah(x.join, 365) <= anchor)) {
  const pakai = aktifP.filter((p) => p.u === u && p.jenis === 1 && p.mulai.startsWith(String(tahunAnchor))).reduce((a, p) => a + p.total, 0);
  const sisa = Math.max(0, Math.round((u.kuota - pakai) * 10) / 10);
  const r = sisa <= 0 ? null : sisa > hariTersisa ? "pasti" : sisa >= 8 ? "waspada" : null;
  if (r) risiko.push({ u, sisa, r });
}
const periodeAktif = Number(anchor.slice(5, 7)) >= 9;
if (periodeAktif) {
  // Sebagian sudah pernah diingatkan (jeda 7 hari berlaku), sisanya masih bisa dikirimi dari menu Kuota Hangus.
  risiko.filter((x, i) => x.r === "pasti" || i % 3 === 0).forEach((x, i) =>
    tambahNotif(x.u, "pengingat", `Sisa Cuti Tahunan Anda ${String(x.sisa).replace(".", ",")} hari dan akan hangus pada 31 Desember ${tahunAnchor}. Segera ajukan cuti.`, "/cuti/ajukan", `${tambah(anchor, -(1 + (i % 3)))} 08:30`));
}
const menunggu = P.filter((p) => ["Pending", "Approved by Leader"].includes(p.status)).length;
notifs.push({ user: byU["andika"], tipe: "pengajuan", pesan: `${menunggu} pengajuan cuti masih menunggu proses persetujuan.`, link: "/riwayat", dibaca: false, waktu: `${anchor} 08:00` });
notifs.sort((a, b) => a.waktu.localeCompare(b.waktu));

// ---------- Tulis SQL ----------
// Berkas lampiran contoh diambil dari seed/lampiran, dipetakan per jenis cuti (id jenis -> daftar nama berkas).
// Jenis yang wajib lampiran HARUS punya padanan di sini; satu jenis boleh punya beberapa berkas (satu baris lampiran per berkas).
const BERKAS_LAMPIRAN = {
  2: ["Surat Keterangan Sakit.pdf"],
  3: ["Surat Keterangan Rencana Menikah.pdf"],
  5: ["Surat Keterangan Cuti Melahirkan.pdf", "Surat Keterangan Perkiraan Lahir.pdf"],
};
const cachePdf = new Map();
const bacaPdf = (nama) => {
  if (!cachePdf.has(nama)) cachePdf.set(nama, readFileSync(new URL(`../seed/lampiran/${nama}`, import.meta.url)));
  return cachePdf.get(nama);
};
const slug = (v) => v.toLowerCase().replace(/\.pdf$/, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
for (const j of JENIS.filter((x) => x.lamp)) {
  const daftar = BERKAS_LAMPIRAN[j.id];
  if (!daftar?.length) { console.error(`Jenis "${j.nama}" wajib lampiran tetapi belum ada berkasnya di BERKAS_LAMPIRAN.`); process.exit(1); }
  for (const f of daftar) {
    if (bacaPdf(f).subarray(0, 5).toString("latin1") !== "%PDF-") { console.error(`Berkas seed/lampiran/${f} bukan PDF yang valid.`); process.exit(1); }
  }
}
const lampiranRows = P.filter((p) => p.lampiran).flatMap((p) => BERKAS_LAMPIRAN[p.jenis].map((nama) => ({ p, nama, pdf: bacaPdf(nama) })));
const baris = (rows) => rows.map((r) => `  (${r.join(", ")})`).join(",\n");
const out = [];
out.push(`-- ============================================================================
-- SEED DATA DEMO SISTEM MANAJEMEN CUTI (${users.length} AKUN)
-- File ini DIHASILKAN oleh scripts/buat-seed.mjs. Jangan diedit manual; ubah generatornya lalu jalankan:
--   node scripts/buat-seed.mjs            (anchor ${ANCHOR_DEFAULT}, hasil selalu sama)
--   node scripts/buat-seed.mjs YYYY-MM-DD (geser semua tanggal agar relatif ke tanggal itu)
-- Anchor file ini: ${anchor} (dianggap "hari ini")
--
-- PRASYARAT: tabel sudah dibuat (jalankan db/schema.sql lebih dulu pada database kosong).
-- PERINGATAN: skrip ini mengosongkan seluruh tabel lalu mengisi data baru.
-- Password semua akun: password123
-- ============================================================================

BEGIN;

TRUNCATE TABLE lampiran, persetujuan, pengajuan_cuti, notifications, users, divisi, jenis_cuti, hari_libur, pengaturan, file_storage
RESTART IDENTITY CASCADE;

-- 1. Pengguna (admin 1, HRD ${hrdList.length}, Ketua Divisi ${DIVISI.length}, karyawan ${users.filter((u) => u.role === "karyawan").length})
INSERT INTO users (id, username, email, password_hash, nama_lengkap, telepon, alamat, role, tanggal_bergabung, kuota_awal, aktif) VALUES
${baris(users.map((u) => [u.id, q(u.username), q(`${u.username}@ssi.co.id`), q(HASH), q(u.nama), q(u.telepon), q(u.alamat), q(u.role), q(u.join), u.kuota, "true"]))};

-- 2. Divisi (setiap Ketua Divisi hanya memimpin satu divisi)
INSERT INTO divisi (id, nama, deskripsi, ketua_id, max_persen_cuti) VALUES
${baris(DIVISI.map((d) => [divId[d[0]], q(d[0]), q(d[1]), byU[d[2]].id, d[3]]))};

-- 3. Penempatan anggota divisi
${DIVISI.map((d) => `UPDATE users SET divisi_id = ${divId[d[0]]} WHERE id IN (${anggotaDiv(d[0]).map((u) => u.id).join(", ")}); -- ${d[0]} (batas ${batasDiv[d[0]]} orang per hari)`).join("\n")}

-- 4. Jenis cuti
INSERT INTO jenis_cuti (id, nama, kode, is_system, kuota_hari, batas_pengajuan_hari, wajib_lampiran, potong_kuota, aktif) VALUES
${baris(JENIS.map((j) => [j.id, q(j.nama), q(j.kode), j.sys, j.kuota ?? "NULL", j.batas, j.lamp, j.potong, "true"]))};

-- 5. Hari libur dan cuti bersama 2026 (periksa kembali dengan SKB resmi)
INSERT INTO hari_libur (tanggal, keterangan, jenis) VALUES
${baris(LIBUR.map((l) => [q(l[0]), q(l[1]), q(l[2])]))};

-- 6. Pengaturan peringatan kuota hangus
INSERT INTO pengaturan (key, value) VALUES
  ('ambang_kuota_hangus', '8'),
  ('bulan_mulai_peringatan', '9')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 7. Pengajuan cuti (semua status dan jenis; setengah hari dengan dan tanpa jam)
INSERT INTO pengajuan_cuti
  (id, pengaju_id, divisi_id, jenis_id, tanggal_pengajuan, tanggal_mulai, tanggal_selesai, setengah_hari, jam_mulai, jam_selesai, total_hari,
   alasan, handover_id, catatan_tugas, alamat_cuti, nomor_darurat, status, tahap, ditolak_oleh, alasan_batal, created_at) VALUES
${baris(P.map((p) => {
  const jam = Array.isArray(p.o.half) ? p.o.half : [null, null];
  return [p.id, p.u.id, p.u.div ? divId[p.u.div] : "NULL", p.jenis, q(p.ajuan), q(p.mulai), q(p.selesai), p.setengah, q(jam[0]), q(jam[1]), p.total,
    q(ALASAN[p.jk][p.id % ALASAN[p.jk].length]), p.ho.id, q(CATATAN_TUGAS[p.u.div] ?? "Tugas harian sudah diserahkan"), q(p.u.alamat), q(`08129990${String(p.id).padStart(3, "0")}`),
    q(p.status), q(p.tahap), q(p.ditolakOleh), q(p.st === "C" ? p.o.batal : null), q(`${p.ajDT}:00+08`)];
}))};

-- 8. Riwayat persetujuan (timeline detail cuti)
INSERT INTO persetujuan (pengajuan_id, tahap, approver_id, keputusan, catatan, created_at) VALUES
${baris(P.flatMap((p) => p.keputusan.map((k) => [p.id, q(k.tahap), k.ap.id, q(k.kep), q(k.cat), q(`${k.at.slice(0, 10)} ${k.at.slice(11, 16)}:00+08`)])))};

-- 9. Berkas lampiran (disimpan di database, kolom BYTEA): berkas contoh sesuai jenis cuti, diambil dari seed/lampiran
${(() => {
  const lp = lampiranRows;
  if (lp.length === 0) return "-- (tidak ada pengajuan yang memakai lampiran)";
  return `INSERT INTO file_storage (id, nama_asli, mime, ukuran, data) VALUES\n${lp.map((r, i) => `  (${i + 1}, ${q(r.nama)}, 'application/pdf', ${r.pdf.length}, '\\x${r.pdf.toString("hex")}')`).join(",\n")};\n\n-- 10. Lampiran pengajuan cuti\nINSERT INTO lampiran (pengajuan_id, diunggah_oleh, nama_asli, mime, ukuran, storage_key, file_id) VALUES\n${baris(lp.map((r, i) => [r.p.id, r.p.u.id, q(r.nama), "'application/pdf'", r.pdf.length, q(`seed-${r.p.id}-${slug(r.nama)}.pdf`), i + 1]))};`;
})()}

-- 11. Notifikasi (jenis: pengajuan, handover, keputusan, pengingat; sebagian belum dibaca)
INSERT INTO notifications (user_id, tipe, pesan, link, dibaca, created_at) VALUES
${baris(notifs.map((n) => [n.user.id, q(n.tipe), q(n.pesan), q(n.link), n.dibaca, q(`${n.waktu.slice(0, 10)} ${n.waktu.slice(11, 16)}:00+08`)]))};

-- 12. Sinkronkan sequence agar insert berikutnya tidak bentrok
${["users", "divisi", "jenis_cuti", "pengajuan_cuti", "persetujuan", "file_storage", "lampiran", "notifications", "hari_libur"].map((tb) => `SELECT setval(pg_get_serial_sequence('${tb}', 'id'), (SELECT max(id) FROM ${tb}));`).join("\n")}

COMMIT;

-- ============================================================================
-- Verifikasi cepat setelah COMMIT
-- ============================================================================
-- SELECT role, count(*) FROM users GROUP BY role ORDER BY role;
-- SELECT status, count(*) FROM pengajuan_cuti GROUP BY status ORDER BY status;
-- SELECT EXTRACT(MONTH FROM tanggal_pengajuan)::int AS bulan, status, count(*) FROM pengajuan_cuti GROUP BY 1, 2 ORDER BY 1, 2;
-- SELECT u.nama_lengkap, count(*) FILTER (WHERE NOT n.dibaca) AS belum_dibaca FROM notifications n JOIN users u ON u.id = n.user_id GROUP BY 1 ORDER BY 2 DESC;
`);
writeFileSync(new URL("../db/seed_data.sql", import.meta.url), out.join("\n"));

// ---------- Ringkasan ----------
const hitung = (f) => P.filter(f).length;
console.error(`Seed ditulis (anchor ${anchor}): ${users.length} pengguna, ${P.length} pengajuan, ${P.reduce((a, p) => a + p.keputusan.length, 0)} keputusan, ${notifs.length} notifikasi (${notifs.filter((n) => !n.dibaca).length} belum dibaca).`);
console.error("Status:", Object.fromEntries(Object.keys(STATUS).map((s) => [s, hitung((p) => p.st === s)])));
const perBulan = Array.from({ length: 12 }, () => ({ A: 0, T: 0, M: 0, B: 0 }));
for (const p of P.filter((x) => x.ajuan.startsWith(String(tahunAnchor)))) {
  const m = perBulan[Number(p.ajuan.slice(5, 7)) - 1];
  if (p.status === "Approved") m.A++; else if (p.status === "Rejected") m.T++; else if (p.status === "Cancelled") m.B++; else m.M++;
}
console.error("Chart per bulan diajukan [disetujui/ditolak/menunggu/batal]:", perBulan.map((m, i) => `${BULAN[i]} ${m.A}/${m.T}/${m.M}/${m.B}`).join("  "));
console.error("Sudah berlalu:", hitung((p) => p.status === "Approved" && p.selesai < anchor && p.mulai.startsWith(String(tahunAnchor))));
console.error(`Kuota hangus (sisa hari kerja ${hariTersisa}):`, risiko.map((x) => `${x.u.username}=${x.sisa}${x.r === "pasti" ? "!" : ""}`).join(", "));
console.error("Kapasitas puncak:", Object.fromEntries(DIVISI.map((d) => [d[0], `${Math.max(0, ...Object.entries(okupansi).filter(([k]) => k.startsWith(d[0] + "|")).map(([, v]) => v))}/${batasDiv[d[0]]}`])));
console.error("Cuti hari ini:", P.filter((p) => AKTIF.has(p.status) && p.status === "Approved" && p.mulai <= anchor && p.selesai >= anchor).map((p) => p.u.username).join(", "));
