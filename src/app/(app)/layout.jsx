import { requireRole } from "@/lib/guard";
import { menuUntukRole, NAMA_ROLE } from "@/lib/nav";
import Sidebar from "@/components/Sidebar";

export default async function AppLayout({ children }) {
  const user = await requireRole();
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[16rem_1fr]">
      <Sidebar menu={menuUntukRole(user.role)} nama={user.nama_lengkap} peran={NAMA_ROLE[user.role]} />
      <main className="mx-auto w-full max-w-6xl p-5 lg:p-10">{children}</main>
    </div>
  );
}
