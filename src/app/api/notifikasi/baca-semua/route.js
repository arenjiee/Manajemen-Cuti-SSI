import { revalidatePath } from "next/cache";
import pool from "@/lib/db";
import { withRole } from "@/lib/with-role";
import { ok, wantsHtml, redirect303 } from "@/lib/http";
import { tandaiSemuaDibaca } from "@/lib/queries/riwayat";

export const POST = withRole(null, async ({ request, user }) => {
  await tandaiSemuaDibaca(pool, user.id);
  revalidatePath("/", "layout");
  if (wantsHtml(request)) return redirect303(request, "/notifikasi");
  return ok({ message: "Semua notifikasi ditandai dibaca." });
});
