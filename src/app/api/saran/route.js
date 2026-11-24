import pool from "@/lib/db";
import { withRole } from "@/lib/with-role";
import { ok, fail } from "@/lib/http";

export const POST = withRole(null, async ({ request, user }) => {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return fail("Format data tidak valid.");

  const kategori = typeof body.kategori === "string" && body.kategori.trim()
    ? body.kategori.trim().slice(0, 50)
    : "Saran & Masukan";
  const pesan = typeof body.pesan === "string" ? body.pesan.trim() : "";

  if (pesan.length < 5) return fail("Isi saran/masukan minimal 5 karakter.");
  if (pesan.length > 2000) return fail("Isi saran/masukan maksimal 2000 karakter.");

  const teksNotif = `[${kategori}] dari ${user.nama_lengkap || user.username} (${user.role}): ${pesan}`;
  try {
    await pool.query(
      `INSERT INTO notifications (user_id, tipe, pesan, link)
       SELECT id, 'saran', $1, NULL
       FROM users
       WHERE role IN ('admin', 'hrd') AND aktif AND deleted_at IS NULL`,
      [teksNotif]
    );
    return ok({ message: "Terima kasih! Saran dan masukan Anda telah terkirim ke admin." });
  } catch (err) {
    console.error("Gagal mengirim saran:", err);
    return fail("Gagal mengirim saran. Silakan coba lagi.", 500);
  }
});
