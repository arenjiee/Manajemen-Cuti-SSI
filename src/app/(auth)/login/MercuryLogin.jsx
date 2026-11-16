"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const BLOBS = [
  { size: 260, left: 18, top: 22, delay: -4, duration: 22 },
  { size: 200, left: 72, top: 16, delay: -11, duration: 26 },
  { size: 320, left: 55, top: 64, delay: -2, duration: 30 },
  { size: 170, left: 10, top: 70, delay: -16, duration: 19 },
  { size: 230, left: 82, top: 76, delay: -8, duration: 24 },
  { size: 150, left: 40, top: 40, delay: -13, duration: 28 },
];

export default function MercuryLogin() {
  const router = useRouter();
  const blobRefs = useRef([]);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [pesan, setPesan] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const onMove = (e) => {
      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;
      blobRefs.current.forEach((blob, i) => {
        if (!blob) return;
        const speed = (i + 1) * 20;
        blob.style.marginLeft = `${x * speed}px`;
        blob.style.marginTop = `${y * speed}px`;
      });
    };
    document.addEventListener("mousemove", onMove);
    return () => document.removeEventListener("mousemove", onMove);
  }, []);

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
  const label = "mb-2 block font-mono text-xs text-white/70 uppercase";
  const input =
    "peer w-full border-0 border-b border-white/20 bg-transparent py-3 text-lg text-white outline-none transition-colors duration-[400ms] placeholder:text-white/40 [&:-webkit-autofill]:[-webkit-text-fill-color:#fff] [&:-webkit-autofill]:[box-shadow:inset_0_0_0_1000px_#050505]";
  const glow =
    "pointer-events-none absolute bottom-0 left-0 h-0.5 w-0 bg-[#e0e0e0] shadow-[0_0_15px_#e0e0e0] transition-[width] duration-[600ms] ease-[cubic-bezier(0.2,1,0.3,1)] peer-focus:w-full motion-reduce:transition-none";

  return (
    <div className="relative flex min-h-dvh w-full items-center justify-center overflow-hidden bg-[#050505] p-4 font-sans text-white">
      <svg className="absolute h-0 w-0" aria-hidden="true" focusable="false">
        <defs>
          <filter id="mc-gooey">
            <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9" result="goo" />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>

      <div className="pointer-events-none absolute inset-0 z-0 opacity-60 [filter:url(#mc-gooey)]" aria-hidden="true">
        {BLOBS.map((b, i) => (
          <div
            key={i}
            ref={(el) => (blobRefs.current[i] = el)}
            className="absolute animate-float rounded-full bg-linear-to-br from-[#e0e0e0] to-[#888] blur-[20px] shadow-[inset_-10px_-10px_20px_rgba(0,0,0,0.5),10px_10px_30px_rgba(255,255,255,0.2)] transition-[margin] duration-100 ease-out motion-reduce:animate-none motion-reduce:transition-none"
            style={{
              width: b.size,
              height: b.size,
              left: `${b.left}%`,
              top: `${b.top}%`,
              animationDelay: `${b.delay}s`,
              animationDuration: `${b.duration}s`,
            }}
          />
        ))}
      </div>

      {/* Panel gelap tembus pandang: menjaga kontras teks di atas blob, cairan latar tetap terlihat. */}
      <main className="relative z-10 w-full max-w-[440px] rounded-3xl border border-white/10 bg-[#050505]/65 px-6 pt-9 pb-7 backdrop-blur-[18px] min-[480px]:rounded-[28px] min-[480px]:px-9 min-[480px]:pt-11 min-[480px]:pb-9">
        <header className="mb-10">
          <span className="mb-2.5 block font-mono text-[11px] tracking-[3px] text-white/70 uppercase">PT SSI · Cabang Makassar</span>
          <h1 className="-ml-[3px] font-sans text-[length:clamp(2.4rem,11vw,3.4rem)] leading-[0.92] font-bold tracking-[-0.04em]">
            MANAJEMEN<br />CUTI
          </h1>
          <p className="mt-4 text-sm leading-normal text-white/70">Masuk untuk mengajukan, memverifikasi, atau menyetujui cuti karyawan.</p>
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

          <label className="-mt-1.5 mb-1.5 flex cursor-pointer items-center gap-2.5 text-sm text-white/70">
            <input type="checkbox" className="size-4 accent-white" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
            Ingat saya selama 30 hari
          </label>

          {pesan && (
            <p role="alert" className="mt-5 border-l-2 border-[#ff8a80] bg-[#ff8a80]/10 px-3.5 py-3 text-sm text-[#ff8a80]">
              {pesan}
            </p>
          )}

          <div className="group/submit relative mt-10 [filter:url(#mc-gooey)]">
            <div className="absolute top-1/2 left-1/2 z-[1] h-full w-full -translate-x-1/2 -translate-y-1/2 rounded-[50px] bg-[#e0e0e0] transition-all duration-500 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] group-hover/submit:scale-x-105 group-hover/submit:scale-y-120 group-hover/submit:brightness-120 motion-reduce:transition-none" />
            <button
              type="submit"
              disabled={loading}
              aria-busy={loading}
              className="relative z-[2] w-full cursor-pointer border-0 bg-white px-10 py-5 text-sm font-bold tracking-[2px] text-black uppercase transition-[letter-spacing] duration-300 hover:enabled:tracking-[4px] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#e0e0e0] disabled:cursor-progress disabled:opacity-70 motion-reduce:transition-none"
            >
              {loading ? "Memproses…" : "Masuk"}
            </button>
          </div>
        </form>

        <footer className="mt-10 flex justify-between gap-4 font-mono text-[11px] text-white/70">
          <span>SMCK 2026</span>
          <span>Lupa password? Hubungi Admin</span>
        </footer>
      </main>
    </div>
  );
}
