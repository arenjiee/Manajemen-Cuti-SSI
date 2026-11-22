import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { guardApi } from "@/lib/guard";

export async function POST(request) {
  const g = await guardApi(null, request);
  if (g.error) return g.error;

  let body = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, message: "Format data tidak valid." },
      { status: 400 }
    );
  }

  const kategori = typeof body.kategori === "string" && body.kategori.trim()
    ? body.kategori.trim().slice(0, 50)
    : "Saran & Masukan";
  const pesan = typeof body.pesan === "string" ? body.pesan.trim() : "";

  if (!pesan || pesan.length < 5) {
    return NextResponse.json(
      { ok: false, message: "Isi saran/masukan minimal 5 karakter." },
      { status: 400 }
    );
  }

  if (pesan.length > 2000) {
    return NextResponse.json(
      { ok: false, message: "Isi saran/masukan maksimal 2000 karakter." },
      { status: 400 }
    );
  }

  const teksNotif = `[${kategori}] dari ${g.user.nama_lengkap || g.user.username} (${g.user.role}): ${pesan}`;

  try {
    await pool.query(
      `INSERT INTO notifications (user_id, tipe, pesan, link)
       SELECT id, 'saran', $1, NULL
       FROM users
       WHERE role IN ('admin', 'hrd') AND aktif AND deleted_at IS NULL`,
      [teksNotif]
    );

    return NextResponse.json({
      ok: true,
      message: "Terima kasih! Saran dan masukan Anda telah terkirim ke admin.",
    });
  } catch (err) {
    console.error("Gagal mengirim saran:", err);
    return NextResponse.json(
      { ok: false, message: "Gagal mengirim saran. Silakan coba lagi." },
      { status: 500 }
    );
  }
}
