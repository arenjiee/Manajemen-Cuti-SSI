"use client";
import { useState, useActionState } from "react";
import { useRouter } from "next/navigation";
import { btnPrimary } from "./ui";

export default function FormAction({
  action,
  method = "POST",
  children,
  label = "Simpan",
  className = "space-y-4",
  onSuccess,
  redirectTo,
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
      <form onSubmit={handleHttpSubmit} className={className}>
        {children}
        {errorPesan && (
          <p role="alert" className="rounded-lg bg-bad/10 px-3 py-2 text-sm text-bad">
            {errorPesan}
          </p>
        )}
        <button disabled={loading} className={btnPrimary}>
          {loading ? "Menyimpan…" : label}
        </button>
      </form>
    );
  }

  return (
    <form action={standardFormAction} className={className}>
      {children}
      {actionState?.pesan && (
        <p role="alert" className="rounded-lg bg-bad/10 px-3 py-2 text-sm text-bad">
          {actionState.pesan}
        </p>
      )}
      <button disabled={actionPending} className={btnPrimary}>
        {actionPending ? "Menyimpan…" : label}
      </button>
    </form>
  );
}
