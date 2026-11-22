"use client";

import { useEffect, useState } from "react";

export function getStoredTheme() {
  if (typeof window === "undefined") return "system";
  try {
    return localStorage.getItem("smck-theme") || "system";
  } catch {
    return "system";
  }
}

export function applyTheme(theme) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("smck-theme", theme);
  } catch {}

  const root = document.documentElement;
  const isDark =
    theme === "dark" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  if (isDark) {
    root.classList.add("dark");
    root.classList.remove("light");
    root.setAttribute("data-theme", "dark");
    root.style.colorScheme = "dark";
  } else {
    root.classList.remove("dark");
    root.classList.add("light");
    root.setAttribute("data-theme", "light");
    root.style.colorScheme = "light";
  }

  window.dispatchEvent(
    new CustomEvent("smck-theme-change", { detail: { theme, isDark } })
  );
}

export function useTheme() {
  const [theme, setThemeState] = useState(getStoredTheme);
  const [resolvedTheme, setResolvedTheme] = useState("dark");

  useEffect(() => {
    const update = () => {
      const stored = getStoredTheme();
      setThemeState(stored);
      const isDark =
        stored === "dark" ||
        (stored === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
      setResolvedTheme(isDark ? "dark" : "light");
    };

    update();

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onMq = () => {
      if (getStoredTheme() === "system") update();
    };
    const onCustom = () => update();

    mq.addEventListener("change", onMq);
    window.addEventListener("smck-theme-change", onCustom);

    return () => {
      mq.removeEventListener("change", onMq);
      window.removeEventListener("smck-theme-change", onCustom);
    };
  }, []);

  const setTheme = (next) => {
    setThemeState(next);
    applyTheme(next);
  };

  return { theme, setTheme, resolvedTheme };
}
