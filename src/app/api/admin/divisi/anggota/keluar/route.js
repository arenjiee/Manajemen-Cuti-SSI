import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { guardApi } from "@/lib/guard";
import { keluarkanAnggota, keluarkanKetua } from "@/lib/queries/divisi";
import { parseId } from "@/lib/id";

export async function POST(request) {
  const g = await guardApi(["admin"], request);
  if (g.error) return g.error;

  let userIds = [];
  let divisiId = null;
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const body = await request.json().catch(() => ({}));
    divisiId = parseId(body.divisiId);
    if (Array.isArray(body.userIds)) {
      userIds = body.userIds.map(parseId).filter((x) => x != null);
    } else if (Array.isArray(body.ids)) {
      userIds = body.ids.map(parseId).filter((x) => x != null);
    } else if (body.userId != null) {
      const parsed = parseId(body.userId);
      if (parsed != null) userIds = [parsed];
    }
  } else {
    const fd = await request.formData().catch(() => null);
    if (fd) {
      divisiId = parseId(fd.get("divisiId"));
      const rawList = [...fd.getAll("ids"), ...fd.getAll("userIds"), ...fd.getAll("userId")];
      if (rawList.length > 0) {
        userIds = rawList
          .flatMap((x) => String(x).split(","))
          .map(parseId)
          .filter((x) => x != null);
      }
    }
  }

  userIds = [...new Set(userIds)];

  if (userIds.length === 0) {
    return NextResponse.json({ ok: false, message: "User ID tidak valid." }, { status: 400 });
  }

  if (userIds.length === 1) {
    const userId = userIds[0];
    const u = (await pool.query("SELECT role FROM users WHERE id=$1 AND deleted_at IS NULL", [userId])).rows[0];
    let r;
    if (u?.role === "ketua_divisi" && divisiId) {
      r = await keluarkanKetua(pool, divisiId);
    } else {
      r = await keluarkanAnggota(pool, userId);
    }

    if (!r.ok) {
      return NextResponse.json({ ok: false, message: r.pesan }, { status: 400 });
    }

    const acceptsHtml = request.headers.get("accept")?.includes("text/html");
    if (acceptsHtml) {
      return NextResponse.redirect(new URL(divisiId ? `/admin/divisi/${divisiId}` : "/admin/divisi", request.url), 303);
    }

    return NextResponse.json({
      ok: true,
      message: u?.role === "ketua_divisi" ? "Ketua divisi berhasil dikeluarkan." : "Anggota berhasil dikeluarkan.",
    });
  }

  let sukses = 0;
  const gagal = [];
  for (const userId of userIds) {
    const u = (await pool.query("SELECT role FROM users WHERE id=$1 AND deleted_at IS NULL", [userId])).rows[0];
    let r;
    if (u?.role === "ketua_divisi" && divisiId) {
      r = await keluarkanKetua(pool, divisiId);
    } else {
      r = await keluarkanAnggota(pool, userId);
    }
    if (r.ok) {
      sukses++;
    } else {
      gagal.push({ userId, pesan: r.pesan });
    }
  }

  if (sukses === 0) {
    return NextResponse.json(
      { ok: false, message: gagal[0]?.pesan || "Semua anggota yang dipilih gagal dikeluarkan." },
      { status: 400 }
    );
  }

  const acceptsHtml = request.headers.get("accept")?.includes("text/html");
  if (acceptsHtml) {
    return NextResponse.redirect(new URL(divisiId ? `/admin/divisi/${divisiId}` : "/admin/divisi", request.url), 303);
  }

  let pesan = `${sukses} anggota berhasil dikeluarkan.`;
  if (gagal.length > 0) {
    pesan += ` (${gagal.length} dilewati: ${gagal[0].pesan})`;
  }

  return NextResponse.json({ ok: true, message: pesan, sukses, dilewati: gagal.length });
}

