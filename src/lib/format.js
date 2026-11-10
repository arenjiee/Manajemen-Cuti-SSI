const BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

export function formatTanggal(s) {
  if (!s) return "-";
  const [y, m, d] = String(s).slice(0, 10).split("-").map(Number);
  return `${d} ${BULAN[m - 1]} ${y}`;
}

export function formatHari(n) {
  return String(Number(n)).replace(".", ",");
}

export function formatRentang(mulai, selesai) {
  return mulai === selesai ? formatTanggal(mulai) : `${formatTanggal(mulai)} – ${formatTanggal(selesai)}`;
}

export function formatWaktu(ts) {
  if (!ts) return "-";
  const d = new Date(ts);
  const tgl = d.toLocaleDateString("sv-SE", { timeZone: "Asia/Makassar" });
  const jam = d.toLocaleTimeString("id-ID", { timeZone: "Asia/Makassar", hour: "2-digit", minute: "2-digit", hour12: false });
  return `${formatTanggal(tgl)}, ${jam.replace(":", ".")}`;
}
