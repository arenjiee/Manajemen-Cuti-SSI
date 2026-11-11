"use client";
import { useActionState } from "react";
import { btnPrimary } from "./ui";

export default function FormAction({ action, children, label = "Simpan", className = "space-y-4" }) {
  const [state, formAction, pending] = useActionState(action, null);
  return (
    <form action={formAction} className={className}>
      {children}
      {state?.pesan && <p role="alert" className="rounded-lg bg-bad/10 px-3 py-2 text-sm text-bad">{state.pesan}</p>}
      <button disabled={pending} className={btnPrimary}>{pending ? "Menyimpan…" : label}</button>
    </form>
  );
}
