"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { components } from "../../lib/components";
import { blocks, blockCategories, blockCategoryHref } from "../../lib/blocks";
import { Button } from "../ui/button";
import { Command } from "../ui/command";
import { Dialog } from "../ui/dialog";
import { useLibrary } from "./library-shell";

export function CommandSearch({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const router = useRouter();
  const { appearance, href } = useLibrary();
  useEffect(() => { const shortcut = (event: KeyboardEvent) => { if (trigger.current?.getClientRects().length && (event.metaKey || event.ctrlKey) && !event.altKey && event.key.toLowerCase() === "k") { event.preventDefault(); setOpen((value) => !value); } }; window.addEventListener("keydown", shortcut); return () => window.removeEventListener("keydown", shortcut); }, []);
  return <div className={className}><Dialog open={open} onOpenChange={setOpen} appearance={appearance} title="Search docs" description="Find a component or open the setup guide." trigger={<Button ref={trigger} appearance={appearance} variant="ghost" className="header-tool" aria-label="Search docs Ctrl K" aria-keyshortcuts="Control+k Meta+k"><svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.5"/><path d="m13 13 5 5"/></svg><span className="header-tool-label">Search docs <kbd>Ctrl K</kbd></span></Button>}>
    <Command appearance={appearance} label="Search components and blocks" placeholder="Button, auth, hero, getting started..." items={[{ value: "/docs", label: "Getting started", description: "Installation, theming and source setup.", keywords: ["documentation", "install"] }, { value: "/blocks", label: "All page blocks", description: "Original marketing and workspace sections.", keywords: ["sections", "templates"] }, ...blockCategories.map(category => ({ value: blockCategoryHref(category), label: `${category} blocks`, description: `${blocks.filter(block => block.category === category).length} original examples with live previews and complete source.`, keywords: [category, "sections", "blocks"] })), ...blocks.map(block => ({ value: `/blocks/${block.slug}`, label: `${block.name} block`, description: block.description, keywords: [block.category, block.title, "blocks"] })), ...components.map((component) => ({ value: `/components/${component.slug}`, label: component.name, description: component.description, keywords: [component.category] }))]} onSelect={(path) => { setOpen(false); router.push(href(path)); }} />
  </Dialog></div>;
}
