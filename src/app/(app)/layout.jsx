import { Suspense } from "react";
import { requireRole } from "@/lib/guard";
import { menuUntukRole, NAMA_ROLE } from "@/lib/nav";
import AppShell from "@/components/AppShell";

export default async function AppLayout({ children }) {
  const user = await requireRole();
  return (
    // useSearchParams di AppShell membutuhkan batas Suspense.
    <Suspense fallback={null}>
      <AppShell
        menu={menuUntukRole(user.role)}
        user={{
          id: user.id,
          nama: user.nama_lengkap,
          peran: NAMA_ROLE[user.role],
          fotoKey: user.foto_key,
        }}
      >
        {children}
      </AppShell>
    </Suspense>
  );
}
