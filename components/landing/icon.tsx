import type { SVGProps, ReactNode } from "react";

export type IconName = "arrow" | "search" | "sun" | "moon" | "github" | "heart" | "check" | "close" | "pause" | "play" | "code" | "sparkle";
const paths: Record<IconName, ReactNode> = {
  arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
  search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4 4" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" /></>,
  moon: <path d="M20 15.2A8.5 8.5 0 0 1 8.8 4 8.5 8.5 0 1 0 20 15.2Z" />,
  github: <path d="M9 20c-4 1-4-2-6-2m12 4v-4c0-1-.3-1.7-1-2 3-.3 6-1.5 6-6 0-1.4-.5-2.5-1.3-3.4.2-.9.2-2.2-.2-3.6 0 0-1.2-.3-3.7 1.3a13 13 0 0 0-7.6 0C4.7 2.7 3.5 3 3.5 3c-.4 1.4-.4 2.7-.2 3.6C2.5 7.5 2 8.6 2 10c0 4.5 3 5.7 6 6-.7.3-1 1-1 2v4" transform="translate(1 0) scale(.92)" />,
  heart: <path d="M20.5 5.5a5 5 0 0 0-7 0L12 7l-1.5-1.5a5 5 0 0 0-7 7L12 21l8.5-8.5a5 5 0 0 0 0-7Z" />,
  check: <path d="m5 12 4 4L19 6" />,
  close: <path d="m6 6 12 12M6 18 18 6" />,
  pause: <path d="M8 5v14M16 5v14" />,
  play: <path d="m8 4 12 8-12 8Z" />,
  code: <path d="m8 6-6 6 6 6m8-12 6 6-6 6M14 3l-4 18" />,
  sparkle: <path d="m12 2 2.8 7.2L22 12l-7.2 2.8L12 22l-2.8-7.2L2 12l7.2-2.8Z" />,
};
export function Icon({ name, ...props }: SVGProps<SVGSVGElement> & { name: IconName }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name]}</svg>;
}
