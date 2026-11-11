import { redirect } from "next/navigation";
import { getUser } from "@/lib/guard";
import LoginForm from "./LoginForm";

export const metadata = { title: "Masuk | SMCK" };

export default async function LoginPage() {
  if (await getUser()) redirect("/dashboard");
  return (
    <main className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <section className="hidden flex-col justify-between bg-accent p-12 text-accent-ink lg:flex">
        <p className="text-sm tracking-widest uppercase opacity-80">PT SSI · Cabang Makassar</p>
        <div>
          <h1 className="text-5xl leading-[1.05] font-semibold">Cuti yang tertata,<br />operasional yang tetap berjalan.</h1>
          <p className="mt-6 max-w-md opacity-80">Ajukan, verifikasi, dan setujui cuti dengan kapasitas tim yang dijaga otomatis.</p>
        </div>
        <p className="text-sm opacity-60">Sistem Manajemen Cuti Karyawan</p>
      </section>
      <section className="flex items-center justify-center p-8">
        <LoginForm />
      </section>
    </main>
  );
}
