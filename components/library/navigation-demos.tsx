"use client";

import { useState } from "react";
import type { Appearance } from "../ui/appearance";
import { Button } from "../ui/button";
import { Switch } from "../ui/switch";
import { NavigationMenu, type NavigationMenuItem } from "../ui/navigation-menu";
import { Navbar } from "../ui/navbar";
import { Sidebar } from "../ui/sidebar";
import { ContextMenu } from "../ui/context-menu";
import { HoverCard } from "../ui/hover-card";
import { ScrollArea } from "../ui/scroll-area";
import { Carousel } from "../ui/carousel";
import { CodeBlock } from "../ui/code-block";
import type { NavigationLinkRenderer, NavigationSection } from "../ui/navigation-shared";
import "../../styles/navigation-demos.css";

export const NAVIGATION_DEMO_SLUGS = ["navigation-menu", "navbar", "sidebar", "context-menu", "hover-card", "scroll-area", "carousel", "code-block"] as const;
const links = [
  { value: "overview", label: "Overview", href: "#preview-overview", description: "Your workspace at a glance." },
  { value: "activity", label: "Activity", href: "#preview-activity", description: "The latest project updates." },
  { value: "members", label: "Members", href: "#preview-members", description: "Available to workspace admins.", disabled: true },
];
const items: NavigationMenuItem[] = [{ value: "workspace", label: "Workspace", links }, { value: "settings", label: "Settings", href: "#preview-settings" }];
const sections: NavigationSection[] = [{ value: "workspace", label: "Workspace", links: [...links.map((link) => ({ value: link.value, label: link.label, href: link.href, disabled: link.disabled })), { value: "settings", label: "Settings", href: "#preview-settings" }] }];
const previewLink: NavigationLinkRenderer = (_link, props) => <a {...props} onClick={(event) => { props.onClick?.(event); if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) event.preventDefault(); }} />;
const labels: Record<string, string> = { overview: "Overview", activity: "Activity", settings: "Settings" };

export function NavigationDemo({ slug, appearance, thumbnail = false }: { slug: string; appearance: Appearance; thumbnail?: boolean }) {
  switch (slug) {
    case "navigation-menu": case "navbar": case "sidebar": return <NavigationShellDemo kind={slug} appearance={appearance} thumbnail={thumbnail} />;
    case "context-menu": return <ContextMenuDemo appearance={appearance} thumbnail={thumbnail} />;
    case "hover-card": return <HoverCardDemo appearance={appearance} />;
    case "scroll-area": return <ScrollAreaDemo appearance={appearance} thumbnail={thumbnail} />;
    case "carousel": return <CarouselDemo appearance={appearance} thumbnail={thumbnail} />;
    case "code-block": return <CodeBlockDemo appearance={appearance} thumbnail={thumbnail} />;
    default: return null;
  }
}

function NavigationShellDemo({ kind, appearance, thumbnail }: { kind: "navigation-menu" | "navbar" | "sidebar"; appearance: Appearance; thumbnail: boolean }) {
  const [active, setActive] = useState("overview"), [feedback, setFeedback] = useState("");
  const navigation = { activeValue: active, renderLink: previewLink, onNavigate: (link: { value: string }) => { setActive(link.value); setFeedback(`${labels[link.value] ?? link.value} selected in this preview.`); }, appearance };
  const panel = <div className="launch-navigation-panel" id={`preview-${active}`}><h3>{labels[active] ?? "Workspace"}</h3><p>{active === "activity" ? "Three files updated today. Your workspace is up to date." : active === "settings" ? "Choose a project from the navigation to return to your work." : "A quiet place to organize your next project."}</p>{!thumbnail && <p className="demo-feedback" role="status">{feedback || "Select a destination to update this preview."}</p>}</div>;
  if (kind === "sidebar") return <div className="launch-sidebar-example" data-thumbnail={thumbnail}><Sidebar {...navigation} sections={sections} label="Studio navigation" header={<strong>Orange studio</strong>} defaultCollapsed={thumbnail} footer={<Button appearance={appearance} variant="ghost" onClick={() => setFeedback("Workspace settings opened in this preview.")}>Workspace settings</Button>} />{panel}</div>;
  return <div className="demo-stack launch-navigation-example">{kind === "navbar" ? <Navbar {...navigation} brand={<strong>Orange studio</strong>} items={items} actions={<Button appearance={appearance} variant="secondary" onClick={() => setFeedback("Account selected in this preview.")}>Account</Button>} /> : <NavigationMenu {...navigation} items={items} label="Project navigation" activationMode="manual" />}{!thumbnail && panel}</div>;
}

function ContextMenuDemo({ appearance, thumbnail }: { appearance: Appearance; thumbnail: boolean }) {
  const [open, setOpen] = useState(false), [feedback, setFeedback] = useState("");
  return <div className="demo-stack"><ContextMenu appearance={appearance} open={open} onOpenChange={setOpen} label="Project actions" trigger={<button className="launch-context-target" type="button" onClick={() => setOpen(true)}><strong>Studio notes</strong><span>{thumbnail ? "Open project actions" : "Click, right-click, or press Shift+F10 for actions."}</span></button>} items={[{ value: "rename", label: "Rename" }, { value: "duplicate", label: "Duplicate" }, { value: "share", label: "Share", disabled: true }, { value: "archive", label: "Archive", separatorBefore: true, destructive: true }]} onAction={(value) => setFeedback(`${value.charAt(0).toUpperCase() + value.slice(1)} selected in this preview.`)} />{!thumbnail && <p className="demo-feedback" role="status">{feedback || "Actions are local to this preview."}</p>}</div>;
}

function HoverCardDemo({ appearance }: { appearance: Appearance }) {
  const [feedback, setFeedback] = useState("");
  return <div className="demo-stack"><p className="launch-hover-copy">Designed with <HoverCard appearance={appearance} trigger={<a href="#contributor" onClick={(event) => { event.preventDefault(); setFeedback("Jamie Reed is a sample contributor in this preview."); }}>Jamie Reed</a>}><div className="launch-profile"><strong>Jamie Reed</strong><span>Design systems engineer</span><p>Turning useful patterns into thoughtful interfaces.</p></div></HoverCard>.</p><p className="demo-feedback" role="status">{feedback || "Hover or focus the name to read the profile."}</p></div>;
}

function ScrollAreaDemo({ appearance, thumbnail }: { appearance: Appearance; thumbnail: boolean }) {
  return <ScrollArea appearance={appearance} label="Recent workspace activity" style={{ height: thumbnail ? 180 : 260 }}><ol className="launch-activity-list">{Array.from({ length: 12 }, (_, index) => <li key={index}><span><strong>{["Updated the project brief", "Saved a component variation", "Reviewed the release notes"][index % 3]}</strong><small>{["Design system", "Components", "Documentation"][index % 3]}</small></span><time>{index + 1}h ago</time></li>)}</ol></ScrollArea>;
}

function CarouselDemo({ appearance, thumbnail }: { appearance: Appearance; thumbnail: boolean }) {
  const [loop, setLoop] = useState(false);
  const slides = [
    { value: "theme", label: "Choose an appearance", title: "Your interface, your character.", copy: "Five appearances share the same accessible controls." },
    { value: "keyboard", label: "Use your keyboard", title: "Every action within reach.", copy: "Move between slides with arrow keys, or use the visible controls." },
    { value: "source", label: "Keep the source", title: "Make it your own.", copy: "Take the component and adapt it to your project's needs." },
  ];
  return <div className="demo-stack"><Carousel appearance={appearance} label="Library highlights" loop={loop} items={slides.map((slide, index) => ({ value: slide.value, label: slide.label, content: <div className="launch-carousel-panel" data-tone={index}><h3>{slide.title}</h3><p>{slide.copy}</p></div> }))} />{!thumbnail && <Switch appearance={appearance} label="Loop slides" checked={loop} onCheckedChange={setLoop} />}</div>;
}

const snippet = 'const palette = ["orange", "mint", "sky"];\n\nexport function welcome(name: string) {\n  return `Hello, ${name}. Pick a color and make something useful.`;\n}\n';
function CodeBlockDemo({ appearance, thumbnail }: { appearance: Appearance; thumbnail: boolean }) {
  const [numbers, setNumbers] = useState(true), [wrap, setWrap] = useState(false);
  return <div className="demo-stack"><CodeBlock appearance={appearance} code={thumbnail ? 'const greeting = "Hello, studio.";' : snippet} language="typescript" filename="welcome.ts" showLineNumbers={numbers} wrap={wrap} maxHeight={thumbnail ? 160 : 300} />{!thumbnail && <div className="demo-row"><Switch appearance={appearance} label="Line numbers" checked={numbers} onCheckedChange={setNumbers} /><Switch appearance={appearance} label="Wrap long lines" checked={wrap} onCheckedChange={setWrap} /></div>}</div>;
}
