import type { SVGProps } from "react";

export type InteractionIconName = "back" | "next" | "reset" | "check" | "search" | "send" | "close" | "plus" | "home" | "grid" | "palette" | "music" | "sun" | "download" | "volume";
const paths: Record<InteractionIconName, string> = {
  back: "m14 6-6 6 6 6", next: "m10 6 6 6-6 6", reset: "M4 10a8 8 0 1 1 1 7M4 4v6h6",
  check: "m5 12 4 4L19 6", search: "M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0",
  send: "m3 3 18 9-18 9 4-9-4-9Zm4 9h14", close: "m6 6 12 12M6 18 18 6", plus: "M12 5v14M5 12h14",
  home: "m3 10 9-7 9 7v10h-6v-7H9v7H3V10Z", grid: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
  palette: "M12 3a9 9 0 1 0 0 18h2a2 2 0 0 0 0-4h-1a2 2 0 0 1 0-4h5a3 3 0 0 0 3-3c0-4-5-7-9-7ZM7 8h.01M12 6h.01M17 8h.01M6 13h.01",
  music: "M9 18V5l11-2v13M9 8l11-2M9 18c0 3-6 4-6 1s6-4 6-1Zm11-2c0 3-6 4-6 1s6-4 6-1Z",
  sun: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM12 2v2M12 20v2M2 12h2M20 12h2M5 5l1 1M18 18l1 1M5 19l1-1M18 6l1-1",
  download: "M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5", volume: "M4 9h4l5-5v16l-5-5H4V9Zm13-2a7 7 0 0 1 0 10m3-13a11 11 0 0 1 0 16",
};
export function InteractionIcon({ name, ...props }: SVGProps<SVGSVGElement> & { name: InteractionIconName }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}><path d={paths[name]} /></svg>;
}
