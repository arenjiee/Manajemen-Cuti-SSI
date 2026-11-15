import { deteksiMime, ekstensiDari } from "./lampiran-file.js";

export const FOTO_MAKS = 2 * 1024 * 1024;
const FOTO_MIME = ["image/jpeg", "image/png"];
const EKSTENSI_KE_MIME = { ".jpg": "image/jpeg", ".png": "image/png" };

// Jenis berkas ditentukan dari isinya (magic bytes), bukan dari nama atau Content-Type kiriman klien.
export function validasiFoto(buf) {
  if (!buf || buf.length === 0) return { ok: false, pesan: "Berkas foto kosong." };
  if (buf.length > FOTO_MAKS) return { ok: false, pesan: "Ukuran foto maksimal 2 MB." };
  const mime = deteksiMime(buf);
  if (!FOTO_MIME.includes(mime)) return { ok: false, pesan: "Foto harus berformat JPG atau PNG." };
  return { ok: true, mime };
}

export function kunciFoto(uuid, mime) {
  return `foto-${uuid}${ekstensiDari(mime)}`;
}

// Hanya kunci berpola foto-<id>.jpg|png yang dikenali; yang lain (termasuk path traversal) → null.
export function mimeDariKunci(key) {
  if (typeof key !== "string") return null;
  const m = /^foto-[A-Za-z0-9-]+(\.jpg|\.png)$/.exec(key);
  return m ? EKSTENSI_KE_MIME[m[1]] : null;
}
