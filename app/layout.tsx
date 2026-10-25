import type { Metadata } from "next";
import { Geist, Pixelify_Sans } from "next/font/google";
import "../styles/globals.css";

const body = Geist({ subsets: ["latin"], variable: "--font-body", display: "swap" });
const display = Pixelify_Sans({ subsets: ["latin"], variable: "--font-display", display: "swap" });

export const metadata: Metadata = {
  title: "oRangeUi | Play with pixels. Ship with polish.",
  description: "An open source React component library with a pixel soul. Polished, accessible, and readable by AI tools.",
  icons: { icon: "/icon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className={`${body.variable} ${display.variable}`} suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: 'try{var palette=localStorage.getItem("orangeui-palette");if(palette==="light"||palette==="dark")document.documentElement.dataset.theme=palette}catch{}' }} /></head><body>{children}</body></html>;
}
