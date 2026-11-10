const POLA = /^\d{4}-\d{2}-\d{2}$/;

function keUtc(s) {
  const [y, m, d] = s.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

function dariUtc(ms) {
  return new Date(ms).toISOString().slice(0, 10);
}

export function tanggalValid(s) {
  if (typeof s !== "string" || !POLA.test(s)) return false;
  const ms = keUtc(s);
  return Number.isFinite(ms) && dariUtc(ms) === s;
}

export function hariIni(now = new Date()) {
  return now.toLocaleDateString("sv-SE", { timeZone: "Asia/Makassar" });
}

export function tambahHari(s, n) {
  return dariUtc(keUtc(s) + n * 86400000);
}

export function selisihHari(a, b) {
  return Math.round((keUtc(b) - keUtc(a)) / 86400000);
}

export function hariDalamRentang(mulai, selesai) {
  const hasil = [];
  for (let t = mulai; t <= selesai; t = tambahHari(t, 1)) hasil.push(t);
  return hasil;
}

export function adalahAkhirPekan(s) {
  const hari = new Date(keUtc(s)).getUTCDay();
  return hari === 0 || hari === 6;
}
