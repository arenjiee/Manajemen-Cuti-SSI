"use client";
import { createContext, useCallback, useContext, useState } from "react";
import Toast from "./Toast";

const ToastContext = createContext(null);

export function useToast() {
  const tampil = useContext(ToastContext);
  if (!tampil) throw new Error("useToast harus dipakai di dalam ToastProvider.");
  return tampil;
}

export default function ToastProvider({ children }) {
  const [notif, setNotif] = useState(null);
  const tutup = useCallback(() => setNotif(null), []);
  const tampil = useCallback((pesan, tipe = "sukses") => {
    setNotif({ pesan, tipe, id: Date.now() });
  }, []);

  return (
    <ToastContext.Provider value={tampil}>
      {children}
      <Toast notif={notif} onTutup={tutup} />
    </ToastContext.Provider>
  );
}
