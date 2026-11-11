"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [pesan, setPesan] = useState("");
  const [loading, setLoading] = useState(false);

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
      const data = await res.json();
      if (!res.ok) return setPesan(data.message);
      router.replace("/dashboard");
      router.refresh();
    } catch {
      setPesan("Tidak dapat terhubung ke server");
    } finally {
      setLoading(false);
    }
  }

  const input = "w-full rounded-lg border border-line bg-surface px-4 py-2.5 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20";
  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-5">
      <div>
        <h2 className="text-3xl font-semibold">Masuk</h2>
        <p className="mt-1 text-sm text-muted">Gunakan email atau username Anda.</p>
      </div>
      <label className="block text-sm">
        Email / Username
        <input className={`${input} mt-1`} value={identifier} onChange={(e) => setIdentifier(e.target.value)} required autoComplete="username" />
      </label>
      <label className="block text-sm">
        Password
        <input className={`${input} mt-1`} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
      </label>
      <label className="flex items-center gap-2 text-sm text-muted">
        <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
        Ingat saya selama 30 hari
      </label>
      {pesan && <p role="alert" className="rounded-lg bg-bad/10 px-3 py-2 text-sm text-bad">{pesan}</p>}
      <button disabled={loading} className="w-full rounded-lg bg-accent py-2.5 font-medium text-accent-ink transition hover:opacity-90 disabled:opacity-60">
        {loading ? "Memproses…" : "Masuk"}
      </button>
    </form>
  );
}
