import { unlink } from "node:fs/promises";
import path from "node:path";

export const dirUpload = () => path.join(process.cwd(), "uploads");

// Hapus berkas foto lama; sengaja hanya untuk kunci berawalan "foto-" agar tidak menyentuh lampiran. Gagal dihapus tidak fatal.
export async function hapusFotoLama(key) {
  if (typeof key !== "string" || !key.startsWith("foto-")) return;
  try {
    await unlink(path.join(dirUpload(), path.basename(key)));
  } catch {}
}
