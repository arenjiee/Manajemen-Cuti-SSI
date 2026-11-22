"use client";

import * as React from "react";
import { Canvas } from "@react-three/fiber";

import { useResolvedTheme } from "@/components/ui/vortex-utils/use-shadcn-theme";

/** Latar CSS tipis di balik kanvas; kanvas sendiri transparan. */
const LATAR = {
  night: "radial-gradient(ellipse 90% 70% at 50% 45%, #121212 0%, #070707 55%, #050505 100%)",
  dawn: "radial-gradient(ellipse 90% 70% at 50% 45%, #ffffff 0%, #ededed 55%, #e2e2e2 100%)",
};

function kurangiGerakAwal() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function useKurangiGerak() {
  const [kurangi, setKurangi] = React.useState(kurangiGerakAwal);

  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const ubah = (e) => setKurangi(e.matches);
    mq.addEventListener("change", ubah);
    return () => mq.removeEventListener("change", ubah);
  }, []);

  return kurangi;
}

/**
 * Pembungkus <Canvas> untuk scene 3D dekoratif.
 *
 * `frameloop` otomatis menjadi "demand" saat pengguna meminta gerak minimal,
 * sehingga galaksi tampil statis tanpa membakar CPU tiap frame. Saat tab tidak
 * aktif, browser sudah menahan requestAnimationFrame sendiri.
 *
 * `environment = "auto"` memilih latar gelap/terang mengikuti tema aplikasi.
 */
export function SceneContainer({
  className,
  children,
  camera = [0, 3, 8],
  fov = 45,
  environment = "auto",
  theme = "auto",
}) {
  const kurangiGerak = useKurangiGerak();
  const mode = useResolvedTheme(theme);
  const latar = environment === "auto" ? (mode === "light" ? "dawn" : "night") : environment;

  return (
    <div
      aria-hidden="true"
      className={`overflow-hidden ${className ?? ""}`}
      style={{ background: LATAR[latar] ?? LATAR.night }}
    >
      <Canvas
        dpr={[1, 1.5]}
        frameloop={kurangiGerak ? "demand" : "always"}
        camera={{ position: camera, fov, near: 0.1, far: 100 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      >
        {children}
      </Canvas>
    </div>
  );
}
