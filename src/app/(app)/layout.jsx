import { Suspense } from "react";
import { requireRole } from "@/lib/guard";
import { menuUntukRole, NAMA_ROLE } from "@/lib/nav";
import pool from "@/lib/db";
import { jumlahBelumDibaca } from "@/lib/queries/riwayat";
import { ringkasanShell } from "@/lib/queries/shell";
import AppShell from "@/components/AppShell";
import ToastProvider from "@/components/ToastProvider";

export default async function AppLayout({ children }) {
  const user = await requireRole();
  const [ringkasan, notifikasi] = await Promise.all([
    ringkasanShell(pool, user),
    jumlahBelumDibaca(pool, user.id),
  ]);

  return (
    // useSearchParams di AppShell membutuhkan batas Suspense.
    <Suspense fallback={null}>
      <ToastProvider>
        <AppShell
          menu={menuUntukRole(user.role)}
          user={{
            id: user.id,
            nama: user.nama_lengkap,
            email: user.email,
            peran: NAMA_ROLE[user.role],
            fotoKey: user.foto_key,
          }}
          ringkasan={ringkasan}
          notifikasi={notifikasi}
        >
          {children}
        </AppShell>
      </ToastProvider>
    </Suspense>
  );
}
