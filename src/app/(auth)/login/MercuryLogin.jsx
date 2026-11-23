"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme";

// Kanvas WebGL hanya ada di browser: muat setelah hidrasi agar tidak ikut SSR.
const Vortex = dynamic(() => import("@/components/ui/vortex"), { ssr: false });

export default function MercuryLogin() {
  const router = useRouter();
  const { setTheme, resolvedTheme } = useTheme();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [pesan, setPesan] = useState("");
  const [loading, setLoading] = useState(false);

  function toggleTheme() {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setPesan("");
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password, remember }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return setPesan(data.message ?? "Terjadi kesalahan pada server. Coba lagi nanti.");
      router.replace("/dashboard");
      router.refresh();
    } catch {
      setPesan("Tidak dapat terhubung ke server");
    } finally {
      setLoading(false);
    }
  }

  const group = "relative mb-[30px] transition-transform duration-[400ms] ease-[cubic-bezier(0.2,1,0.3,1)] focus-within:translate-x-2.5 motion-reduce:transition-none motion-reduce:focus-within:translate-x-0";
  const label = "mb-2 block font-mono text-xs text-muted uppercase";
  const input =
    "peer w-full border-0 border-b border-line bg-transparent py-3 text-lg text-ink outline-none transition-colors duration-[400ms] placeholder:text-muted focus:border-accent [&:-webkit-autofill]:[-webkit-text-fill-color:var(--ink)] [&:-webkit-autofill]:[box-shadow:inset_0_0_0_1000px_var(--bg)]";
  const glow =
    "pointer-events-none absolute bottom-0 left-0 h-0.5 w-0 bg-accent shadow-[0_0_15px_var(--accent)] transition-[width] duration-[600ms] ease-[cubic-bezier(0.2,1,0.3,1)] peer-focus:w-full motion-reduce:transition-none";

  return (
    <div className="relative flex min-h-dvh w-full items-center justify-center overflow-hidden bg-bg p-4 font-sans text-ink transition-colors duration-300">
      <div className="absolute top-4 right-4 z-20">
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={`Ganti ke mode ${resolvedTheme === "dark" ? "terang" : "gelap"}`}
          title={`Ganti ke mode ${resolvedTheme === "dark" ? "terang" : "gelap"}`}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface/80 text-ink backdrop-blur-md transition hover:bg-ink/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {resolvedTheme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      <svg className="absolute h-0 w-0" aria-hidden="true" focusable="false">
        <defs>
          <filter id="mc-gooey">
            <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9" result="goo" />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>

      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden="true">
        <Vortex className="h-full w-full" theme="auto" environment="auto" />
      </div>

      {/* Panel tembus pandang: menjaga kontras teks di atas vortex, spiral latar tetap terlihat jelas baik mode terang maupun gelap. */}
      <main className="relative z-10 w-full max-w-[440px] rounded-3xl border border-line bg-surface/95 px-6 pt-9 pb-7 shadow-2xl backdrop-blur-[12px] min-[480px]:rounded-[28px] min-[480px]:px-9 min-[480px]:pt-11 min-[480px]:pb-9">
        <header className="mb-10">
          {/* Logo LeaveSync: wordmark gelap untuk dark mode, wordmark terang untuk light mode */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/leavesync-wordmark.png"
            alt="LeaveSync"
            className="mb-6 hidden h-8 w-auto select-none dark:block"
            draggable={false}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/leavesync-wordmark-light.png"
            alt="LeaveSync"
            className="mb-6 block h-8 w-auto select-none dark:hidden"
            draggable={false}
          />
          <span className="mb-2.5 block font-mono text-[11px] tracking-[3px] text-muted uppercase">PT SSI · Cabang Makassar</span>
          <h1 className="-ml-[3px] font-sans text-[length:clamp(2.4rem,11vw,3.4rem)] leading-[0.92] font-bold tracking-[-0.04em] text-ink">
            MANAJEMEN<br />CUTI
          </h1>
          <p className="mt-4 text-sm leading-normal text-muted">Masuk untuk mengajukan, memverifikasi, atau menyetujui cuti karyawan.</p>
        </header>

        <form onSubmit={handleSubmit}>
          <div className={group}>
            <label className={label} htmlFor="mc-identifier">Email / Username</label>
            <input
              id="mc-identifier"
              className={input}
              type="text"
              placeholder="nama@ssi.co.id"
              autoComplete="username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />
            <div className={glow} />
          </div>

          <div className={group}>
            <label className={label} htmlFor="mc-password">Password</label>
            <input
              id="mc-password"
              className={input}
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <div className={glow} />
          </div>

          <label className="-mt-1.5 mb-1.5 flex cursor-pointer items-center gap-2.5 text-sm text-muted">
            <input type="checkbox" className="size-4 accent-accent" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
            Ingat saya selama 30 hari
          </label>

          {pesan && (
            <p role="alert" className="mt-5 rounded-lg border-l-2 border-bad bg-bad/10 px-3.5 py-3 text-sm text-bad">
              {pesan}
            </p>
          )}

          <div className="group/submit relative mt-10 [filter:url(#mc-gooey)]">
            <div className="absolute top-1/2 left-1/2 z-[1] h-full w-full -translate-x-1/2 -translate-y-1/2 rounded-[50px] bg-accent transition-all duration-500 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] group-hover/submit:scale-x-105 group-hover/submit:scale-y-120 motion-reduce:transition-none" />
            <button
              type="submit"
              disabled={loading}
              aria-busy={loading}
              className="relative z-[2] w-full cursor-pointer border-0 bg-accent px-10 py-5 text-sm font-bold tracking-[2px] text-accent-ink uppercase transition-[letter-spacing] duration-300 hover:enabled:tracking-[4px] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent disabled:cursor-progress disabled:opacity-70 motion-reduce:transition-none"
            >
              {loading ? "Memproses…" : "Masuk"}
            </button>
          </div>
        </form>

        <footer className="mt-10 flex justify-between gap-4 font-mono text-[11px] text-muted">
          <span>LeaveSync 2026</span>
          <a
            href="https://wa.me/6283892122629?text=Halo%20Admin%2C%20saya%20lupa%20password%20akun%20LeaveSync"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-ink hover:underline"
          >
            Lupa password? Hubungi Admin
          </a>
        </footer>
      </main>
    </div>
  );
}
