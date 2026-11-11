"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { BlockDemo } from "./block-demo";
import "../../styles/blocks-library.css";

export function BlockPreview({ slug, title }: { slug: string; title: string }) {
  const [theme, setTheme] = useState<"light" | "dark">("light"), [reset, setReset] = useState(0);
  return <main className="standalone-block-preview" data-theme={theme}><header><Link href={`/blocks/${slug}`}><ArrowLeft size={16} />{title}</Link><div><label>Palette<select aria-label="Preview palette" value={theme} onChange={event => setTheme(event.target.value as "light" | "dark")}><option value="light">Light</option><option value="dark">Dark</option></select></label><button type="button" aria-label="Reset block preview" onClick={() => setReset(value => value + 1)}><RotateCcw size={17} /></button></div></header><BlockDemo slug={slug} key={reset} /></main>;
}
