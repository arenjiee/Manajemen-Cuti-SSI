"use client";
import { useState, useActionState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { btnPrimary, btnGhost } from "./ui";

export default function FormAction({
  action,
  method = "POST",
  children,
  label = "Simpan",
  className = "space-y-4",
  onSuccess,
  redirectTo,
  batalHref,
  batalLabel = "Batal",
}) {
  const router = useRouter();
  const isUrl = typeof action === "string";

  const [actionState, standardFormAction, actionPending] = useActionState(
    typeof action === "function" ? action : () => {},
    null
  );

  const [loading, setLoading] = useState(false);
  const [errorPesan, setErrorPesan] = useState("");

  async function handleHttpSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setErrorPesan("");

    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch(action, {
        method,
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setErrorPesan(data.message || data.pesan || "Terjadi kesalahan saat memproses permintaan.");
        setLoading(false);
        return;
      }
      setLoading(false);
      if (onSuccess) {
        onSuccess(data);
      } else if (redirectTo) {
        router.push(redirectTo);
        router.refresh();
      } else {
        router.refresh();
      }
    } catch {
      setErrorPesan("Terjadi kesalahan jaringan.");
      setLoading(false);
    }
  }

  if (isUrl) {
    return (
      <form onSubmit={handleHttpSubmit} className={className} suppressHydrationWarning>
        {children}
        {errorPesan && (
          <p role="alert" className="rounded-lg bg-bad/10 px-3 py-2 text-sm text-bad">
            {errorPesan}
          </p>
        )}
        <div className="flex items-center gap-3 pt-2">
          <button disabled={loading} className={btnPrimary} suppressHydrationWarning>
            {loading ? "Menyimpan…" : label}
          </button>
          {batalHref && (
            <Link href={batalHref} className={btnGhost}>
              {batalLabel}
            </Link>
          )}
        </div>
      </form>
    );
  }

  return (
    <form action={standardFormAction} className={className} suppressHydrationWarning>
      {children}
      {actionState?.pesan && (
        <p role="alert" className="rounded-lg bg-bad/10 px-3 py-2 text-sm text-bad">
          {actionState.pesan}
        </p>
      )}
      <div className="flex items-center gap-3 pt-2">
        <button disabled={actionPending} className={btnPrimary} suppressHydrationWarning>
          {actionPending ? "Menyimpan…" : label}
        </button>
        {batalHref && (
          <Link href={batalHref} className={btnGhost}>
            {batalLabel}
          </Link>
        )}
      </div>
    </form>
  );
}
