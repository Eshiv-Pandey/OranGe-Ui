"use client";

import type { SVGProps } from "react";

export type CreativeIconName = "play" | "pause" | "previous" | "next" | "speaker" | "muted" | "heart" | "share" | "output" | "camera" | "flip" | "trash" | "download" | "plus" | "close" | "spark" | "refresh" | "music";
const paths: Record<CreativeIconName, React.ReactNode> = {
  play: <path d="m8 5 11 7-11 7Z" fill="currentColor" strokeLinejoin="round" />,
  pause: <><path d="M7 5v14M17 5v14" strokeWidth="5" /></>,
  previous: <><path d="M5 5v14M19 5 8 12l11 7Z" /><path d="m19 5-11 7 11 7Z" fill="currentColor" /></>,
  next: <><path d="M19 5v14M5 5l11 7-11 7Z" /><path d="m5 5 11 7-11 7Z" fill="currentColor" /></>,
  speaker: <><path d="M4 9h4l5-4v14l-5-4H4ZM17 8c3 2 3 6 0 8m3-11c5 4 5 10 0 14" /></>,
  muted: <><path d="M4 9h4l5-4v14l-5-4H4Zm13 0 5 6m0-6-5 6" /></>,
  heart: <path d="M20.5 5.5c-2.4-2.6-6-1.7-8.5 1-2.5-2.7-6.1-3.6-8.5-1C-1 10.6 6.8 17.5 12 21c5.2-3.5 13-10.4 8.5-15.5Z" />,
  share: <><path d="M14 4h6v6m0-6-10 10M8 5H4v15h15v-5" /></>,
  output: <><path d="M4 15V9a8 8 0 0 1 16 0v6M4 12H2v7h5v-7Zm16 0h2v7h-5v-7Z" /></>,
  camera: <><path d="M3 7h4l2-3h6l2 3h4v13H3Z" /><circle cx="12" cy="13" r="4" /></>,
  flip: <><path d="m3 7 3-3 3 3M6 4v12a4 4 0 0 0 4 4m11-3-3 3-3-3m3 3V8a4 4 0 0 0-4-4" /></>,
  trash: <><path d="M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7" /></>,
  download: <><path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4" /></>,
  plus: <path d="M12 4v16M4 12h16" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  spark: <path d="m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z" />,
  refresh: <><path d="M20 9a8 8 0 1 0 0 7M20 3v6h-6" /></>,
  music: <><path d="M10 17V5l10-2v12M10 8l10-2" /><ellipse cx="6" cy="18" rx="4" ry="3" /><ellipse cx="16" cy="16" rx="4" ry="3" /></>,
};

export function CreativeIcon({ name, ...props }: SVGProps<SVGSVGElement> & { name: CreativeIconName }) {
  return <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name]}</svg>;
}
