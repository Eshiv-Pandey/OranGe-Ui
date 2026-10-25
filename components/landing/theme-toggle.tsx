"use client";

import { useSyncExternalStore } from "react";
import { Button } from "../ui/button";
import { PixelIcon } from "./pixel-icon";

function subscribeTheme(notify: () => void) {
  const observer = new MutationObserver(notify);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  const query = window.matchMedia("(prefers-color-scheme: dark)");
  query.addEventListener("change", notify);
  return () => { observer.disconnect(); query.removeEventListener("change", notify); };
}

function isDark() {
  return document.documentElement.dataset.theme === "dark" ||
    (!document.documentElement.dataset.theme && window.matchMedia("(prefers-color-scheme: dark)").matches);
}

export function ThemeToggle() {
  const dark = useSyncExternalStore(subscribeTheme, isDark, () => false);
  return <Button variant="ghost" className="theme-toggle" aria-label="Dark mode" aria-pressed={dark} onClick={() => {
    const theme = dark ? "light" : "dark";
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem("orangeui-palette", theme); } catch { /* Storage can be unavailable in private browsing. */ }
  }}><PixelIcon name={dark ? "moon" : "sun"} /></Button>;
}
