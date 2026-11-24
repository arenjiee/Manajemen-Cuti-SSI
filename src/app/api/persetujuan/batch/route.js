import pool from "@/lib/db";
import { withRole } from "@/lib/with-role";
import { ok, readBody, toList, wantsHtml, redirect303 } from "@/lib/http";
import { approveBanyak } from "@/lib/queries/approval";

// Dipakai <form method="POST"> bawaan di halaman persetujuan (tanpa JS) -> redirect dengan hasil.
export const POST = withRole(["hrd"], async ({ request, user }) => {
  const ids = toList((await readBody(request)).ids);
  const r = ids.length === 0 ? { berhasil: [], dilewati: [] } : await approveBanyak(pool, user.id, ids);

  if (wantsHtml(request)) {
    return redirect303(request, `/persetujuan?ok=${r.berhasil.length}&lewat=${r.dilewati.length}`);
  }
  return ok({ berhasil: r.berhasil.length, dilewati: r.dilewati.length });
});
