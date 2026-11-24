import { revalidatePath } from "next/cache";
import pool from "@/lib/db";
import { withRole } from "@/lib/with-role";
import { ok, wantsHtml, redirect303 } from "@/lib/http";
import { tandaiDibaca } from "@/lib/queries/riwayat";
import { tautanInternal } from "@/lib/tautan";

// Dipakai <form method="POST"> bawaan di halaman notifikasi (tanpa JS) -> redirect ke tautan notifikasi.
export const POST = withRole(null, async ({ request, params, user }) => {
  const r = await tandaiDibaca(pool, user.id, String(params.id));
  revalidatePath("/", "layout");

  if (wantsHtml(request)) {
    const tujuan = r.ok ? tautanInternal(r.link) : null;
    return redirect303(request, tujuan ?? "/notifikasi");
  }
  return ok({ link: r.ok ? r.link : null });
});
