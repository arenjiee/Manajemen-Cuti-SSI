import pool from "@/lib/db";
import { withRole } from "@/lib/with-role";
import { ok, fail, readBody, s, num } from "@/lib/http";
import { daftarDivisi, buatDivisi } from "@/lib/queries/divisi";

export const GET = withRole(["admin", "hrd"], async () => {
  return ok({ data: await daftarDivisi(pool, {}) });
});

export const POST = withRole(["admin"], async ({ request }) => {
  const b = await readBody(request);
  const r = await buatDivisi(pool, {
    nama: s(b.nama),
    deskripsi: s(b.deskripsi),
    ketuaId: num(b.ketuaId),
  });
  return r.ok ? ok({ id: r.id }, 201) : fail(r.pesan);
});
