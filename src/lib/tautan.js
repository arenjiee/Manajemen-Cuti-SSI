// Tautan notifikasi ditulis oleh kode server, tetapi tetap divalidasi sebelum dipakai untuk redirect:
// hanya path internal ("/cuti/5"). Menolak "//host", "https://…", "javascript:…", backslash, dan spasi/tab/newline
// (browser membuang tab/newline dari URL, sehingga "/\t/evil.com" menjadi "//evil.com").
export function tautanInternal(link) {
  if (typeof link !== "string" || link.length > 200) return null;
  return /^\/(?![/\\])[^\s\\]*$/.test(link) ? link : null;
}
