import type { Metadata } from "next";
import { Geist, Pixelify_Sans } from "next/font/google";
import { ThemeAccent } from "../components/library/theme-accent";
import { siteUrl } from "../lib/site-url";
import "../styles/globals.css";

const body = Geist({ subsets: ["latin"], variable: "--font-body", display: "swap" });
const display = Pixelify_Sans({ subsets: ["latin"], variable: "--font-display", display: "swap" });

export const metadata: Metadata = {
  metadataBase: siteUrl(),
  title: "oRangeUi | Play with pixels. Ship with polish.",
  description: "An open source React component library with a pixel soul. Polished, accessible, and readable by AI tools.",
  icons: { icon: "/icon.svg" },
  openGraph: { type: "website", siteName: "oRangeUi", title: "oRangeUi | A pixel soul. A polished finish.", description: "Accessible React components, original characters, and five distinct appearances. Copy the source and make it yours.", images: ["/opengraph-image"] },
  twitter: { card: "summary_large_image", images: ["/opengraph-image"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" data-theme="dark" className={`${body.variable} ${display.variable}`} suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: 'try{var palette=localStorage.getItem("orangeui-palette");document.documentElement.dataset.theme=palette==="light"?"light":"dark"}catch{}' }} /></head><body><ThemeAccent />{children}</body></html>;
}
