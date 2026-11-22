"use client";

import * as React from "react";
import * as THREE from "three";

/**
 * Palet cadangan bila token CSS tidak terbaca. Nilai sengaja memakai hex:
 * THREE.Color membaca rgba() tetapi mengabaikan alpha, sehingga warna redup
 * harus ditentukan langsung.
 */
const PALET = {
  dark: { primary: "#e8e8e8", muted: "#2c2c2c" },
  light: { primary: "#0f172a", muted: "#94a3b8" },
};

/**
 * Menentukan mode dari token `--bg` aplikasi, bukan langsung dari preferensi
 * OS: halaman login masih dipaksa gelap, jadi titik-titik harus tetap terang
 * walaupun OS memakai tema terang. Begitu tema terang aplikasi aktif, token
 * `--bg` ikut berubah dan palet vortex menyesuaikan sendiri.
 */
function bacaMode() {
  if (typeof window === "undefined") return "dark";

  const bg = getComputedStyle(document.documentElement).getPropertyValue("--bg").trim();
  if (!bg) return "dark";

  try {
    const c = new THREE.Color();
    c.setStyle(bg);
    // Setelah konversi ke ruang linear, latar gelap punya jumlah komponen kecil.
    return c.r + c.g + c.b < 1.5 ? "dark" : "light";
  } catch {
    return "dark";
  }
}

/**
 * Mengikuti tema aplikasi saat `theme = "auto"` dan mendeteksi ulang ketika
 * preferensi warna sistem berubah (mis. tema terang berbasis media query).
 */
export function useResolvedTheme(theme = "auto") {
  const [mode, setMode] = React.useState(bacaMode);

  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const ubah = () => setMode(bacaMode());
    mq.addEventListener("change", ubah);
    window.addEventListener("smck-theme-change", ubah);
    return () => {
      mq.removeEventListener("change", ubah);
      window.removeEventListener("smck-theme-change", ubah);
    };
  }, []);

  if (theme === "light" || theme === "dark") return theme;
  return mode;
}

/**
 * Warna `primary` dan `muted` untuk material 3D. Nama dipertahankan agar
 * komponen Vortex tetap kompatibel dengan versi shadcn aslinya.
 */
export function useShadcnTheme(theme = "auto") {
  const mode = useResolvedTheme(theme);

  return React.useMemo(() => {
    const palet = PALET[mode] ?? PALET.dark;
    return {
      primaryColor: new THREE.Color(palet.primary),
      mutedColor: new THREE.Color(palet.muted),
    };
  }, [mode]);
}
