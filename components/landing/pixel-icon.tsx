import type { SVGProps } from "react";

const shapes = {
  arrow: "M2 7h9V4h2v2h2v4h-2v2h-2V9H2z",
  sparkle: "M6 0h4v6h6v4h-6v6H6v-6H0V6h6z",
  check: "M1 7h3v3h3V7h3V4h3V1h3v6h-3v3h-3v3H7v3H4v-3H1z",
  code: "M4 3h3v3H4v4h3v3H4v-3H1V6h3zM9 3h3v3h3v4h-3v3H9v-3h3V6H9z",
  heart: "M2 2h4v2h4V2h4v2h2v6h-2v2h-2v2h-2v2H6v-2H4v-2H2v-2H0V4h2z",
  sun: "M6 0h4v3H6zM6 13h4v3H6zM0 6h3v4H0zM13 6h3v4h-3zM4 4h8v8H4zM1 1h2v2H1zM13 1h2v2h-2zM1 13h2v2H1zM13 13h2v2h-2z",
  moon: "M6 0h4v2H6v2H4v6h2v2h4v2h4v-2h2v2h-2v2H4v-2H2v-2H0V4h2V2h4z",
  github: "M4 1h3v2h3V1h3v3h2v7h-2v2h-2v3H5v-3H3v-2H1V4h3zM0 12h2v2h3v2H2v-2H0z",
  search: "M2 0h8v2h2v8h-2v2H2v-2H0V2h2zM3 3v6h6V3zM10 10h3v3h3v3h-3v-3h-3z",
  close: "M1 1h3v3h3v3h2V4h3V1h3v3h-3v3H9v2h3v3h3v3h-3v-3H9V9H7v3H4v3H1v-3h3V9h3V7H4V4H1z",
} as const;

export function PixelIcon({ name, ...props }: SVGProps<SVGSVGElement> & { name: keyof typeof shapes }) {
  return <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false" shapeRendering="crispEdges" {...props}><path fill="currentColor" fillRule="evenodd" d={shapes[name]} /></svg>;
}

export function PixelLogo() {
  return <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true" shapeRendering="crispEdges"><path fill="#242b20" d="M12 2h8v4h6v4h4v16h-4v4H6v-4H2V10h4V6h6z" /><path fill="var(--primary)" d="M8 8h16v4h4v12h-4v4H8v-4H4V12h4z" /><path fill="var(--grass-mid)" d="M16 0h12v4H16zM12 4h8v4h-8z" /><path fill="#242b20" d="M10 14h4v6h-4zM20 14h4v6h-4zM14 22h6v2h-6z" /></svg>;
}

export function PixelTree({ small = false }: { small?: boolean }) {
  return <svg className={small ? "pixel-tree pixel-tree--small" : "pixel-tree"} width="96" height="128" viewBox="0 0 24 32" aria-hidden="true" shapeRendering="crispEdges"><path fill="var(--grass-front)" d="M10 0h4v2h4v4h2v4h2v10h-2v2h-6v8h6v2H4v-2h6v-8H4v-2H2V10h2V6h2V2h4z" /><path fill="var(--grass-mid)" d="M10 2h4v2h4v6h2v8h-2v2H6v-2H4v-8h2V6h4z" /><path fill="var(--grass-back)" d="M8 6h4v4H8zM6 10h4v4H6zM14 4h2v2h-2z" /><path fill="var(--cream)" d="M11 21h2v9h-2z" /></svg>;
}
