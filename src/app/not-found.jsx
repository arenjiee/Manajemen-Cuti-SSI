import Link from "next/link";

export const metadata = { title: "Halaman tidak ditemukan | LeaveSync" };

const Ikon = ({ children }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="size-4">
    {children}
  </svg>
);
const IkonRumah = () => (
  <Ikon>
    <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
    <path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
  </Ikon>
);
const IkonRiwayat = () => (
  <Ikon>
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
    <path d="M12 7v5l4 2" />
  </Ikon>
);

const tombol = "inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-bg p-6">
      <div className="flex max-w-md flex-col items-center gap-6 text-center">
        <div className="flex flex-col items-center gap-2">
          <h1 className="bg-linear-to-b from-ink from-20% to-transparent to-90% bg-clip-text text-9xl font-extrabold text-transparent select-none">404</h1>
          <p className="-mt-6 text-lg font-medium text-ink">Halaman tidak ditemukan</p>
          <p className="text-sm text-balance text-muted">
            Halaman yang Anda cari mungkin sudah dipindahkan, belum tersedia, atau Anda tidak memiliki akses ke halaman ini.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <Link href="/dashboard" className={`${tombol} bg-accent text-accent-ink hover:opacity-90`}>
            <IkonRumah />
            Ke Dashboard
          </Link>
          <Link href="/riwayat" className={`${tombol} border border-line bg-surface text-ink hover:bg-ink/5`}>
            <IkonRiwayat />
            Riwayat Cuti
          </Link>
        </div>
      </div>
    </main>
  );
}
