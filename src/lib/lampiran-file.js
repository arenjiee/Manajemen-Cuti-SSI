const TANDA = [
  { mime: "application/pdf", bytes: [0x25, 0x50, 0x44, 0x46] },
  { mime: "image/jpeg", bytes: [0xff, 0xd8, 0xff] },
  { mime: "image/png", bytes: [0x89, 0x50, 0x4e, 0x47] },
];

export function deteksiMime(buf) {
  for (const t of TANDA) {
    if (buf.length >= t.bytes.length && t.bytes.every((b, i) => buf[i] === b)) return t.mime;
  }
  return null;
}

export function ekstensiDari(mime) {
  return { "application/pdf": ".pdf", "image/jpeg": ".jpg", "image/png": ".png" }[mime] ?? "";
}
