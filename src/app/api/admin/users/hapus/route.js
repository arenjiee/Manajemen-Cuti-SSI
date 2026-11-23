import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { guardApi } from "@/lib/guard";
import { hapusUser } from "@/lib/queries/users";
import { parseId } from "@/lib/id";

export async function POST(request) {
  const g = await guardApi(["admin"], request);
  if (g.error) return g.error;

  let ids = [];
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const body = await request.json().catch(() => ({}));
    if (Array.isArray(body.ids)) {
      ids = body.ids.map(parseId).filter((x) => x != null);
    } else if (body.id != null) {
      const parsed = parseId(body.id);
      if (parsed != null) ids = [parsed];
    }
  } else {
    const fd = await request.formData().catch(() => null);
    if (fd) {
      const rawIds = [...fd.getAll("ids"), ...fd.getAll("id")];
      if (rawIds.length > 0) {
        ids = rawIds
          .flatMap((x) => String(x).split(","))
          .map(parseId)
          .filter((x) => x != null);
      }
    }
  }

  ids = [...new Set(ids)];

  if (ids.length === 0) {
    return NextResponse.json({ ok: false, message: "ID tidak valid." }, { status: 400 });
  }

  if (ids.length === 1) {
    const r = await hapusUser(pool, ids[0]);
    if (!r.ok) {
      return NextResponse.json({ ok: false, message: r.pesan }, { status: 400 });
    }
    return NextResponse.json({ ok: true, message: "Pengguna berhasil dihapus." });
  }

  let sukses = 0;
  const gagal = [];
  for (const id of ids) {
    const r = await hapusUser(pool, id);
    if (r.ok) {
      sukses++;
    } else {
      gagal.push({ id, pesan: r.pesan });
    }
  }

  if (sukses === 0) {
    return NextResponse.json(
      { ok: false, message: gagal[0]?.pesan || "Semua pengguna yang dipilih gagal dihapus." },
      { status: 400 }
    );
  }

  let pesan = `${sukses} pengguna berhasil dihapus.`;
  if (gagal.length > 0) {
    pesan += ` (${gagal.length} dilewati: ${gagal[0].pesan})`;
  }

  return NextResponse.json({ ok: true, message: pesan, sukses, dilewati: gagal.length });
}

