"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { components } from "../../lib/components";
import { Button } from "../ui/button";
import { Command } from "../ui/command";
import { Dialog } from "../ui/dialog";
import { useLibrary } from "./library-shell";

export function CommandSearch() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { appearance, href } = useLibrary();
  useEffect(() => { const shortcut = (event: KeyboardEvent) => { if ((event.metaKey || event.ctrlKey) && !event.altKey && event.key.toLowerCase() === "k") { event.preventDefault(); setOpen((value) => !value); } }; window.addEventListener("keydown", shortcut); return () => window.removeEventListener("keydown", shortcut); }, []);
  return <Dialog open={open} onOpenChange={setOpen} appearance={appearance} title="Find a component" description="Search by name, category or what you want to build." trigger={<Button appearance={appearance} variant="ghost" className="header-tool" aria-label="Search Ctrl K" aria-keyshortcuts="Control+k Meta+k"><svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.5"/><path d="m13 13 5 5"/></svg><span className="header-tool-label">Search <kbd>Ctrl K</kbd></span></Button>}>
    <Command appearance={appearance} label="Search all components" placeholder="Button, chat, calendar..." items={components.map((component) => ({ value: component.slug, label: component.name, description: component.description, keywords: [component.category] }))} onSelect={(slug) => { setOpen(false); router.push(href(`/components/${slug}`)); }} />
  </Dialog>;
}
