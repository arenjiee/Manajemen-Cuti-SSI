import { terpakaiPotongKuota } from "./pengajuan.js";
import { sisaKuota } from "../leave/kuota.js";

// Satu-satunya sumber angka kuota tahunan untuk dashboard dan profil, supaya keduanya selalu sama.
// Sisa dihitung dari pengajuan aktif (bukan disimpan): kuota_awal − pemakaian jenis yang memotong kuota.
export async function ringkasanKuota(db, userId, tahun) {
  const u = (await db.query("SELECT kuota_awal FROM users WHERE id=$1 AND deleted_at IS NULL", [userId])).rows[0];
  if (!u) return null;
  const terpakai = await terpakaiPotongKuota(db, userId, tahun);
  return { tahun, kuotaAwal: u.kuota_awal, terpakai, sisa: sisaKuota(u.kuota_awal, terpakai) };
}
