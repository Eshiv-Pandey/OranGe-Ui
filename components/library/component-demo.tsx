"use client";
import { useState } from "react";
import type { Appearance } from "../ui/appearance";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Select } from "../ui/select";
import { Checkbox } from "../ui/checkbox";
import { RadioGroup } from "../ui/radio-group";
import { Switch } from "../ui/switch";
import { Slider } from "../ui/slider";
import { Toggle } from "../ui/toggle";
import { ToggleGroup } from "../ui/toggle-group";
import { Accordion } from "../ui/accordion";
import { Tabs } from "../ui/tabs";
import { Breadcrumb } from "../ui/breadcrumb";
import { Pagination } from "../ui/pagination";
import { DropdownMenu } from "../ui/dropdown-menu";
import { Command } from "../ui/command";
import { Dialog } from "../ui/dialog";
import { Sheet } from "../ui/sheet";
import { Popover } from "../ui/popover";
import { Tooltip } from "../ui/tooltip";
import { Toast, ToastProvider } from "../ui/toast";
import { Alert } from "../ui/alert";
import { Progress } from "../ui/progress";
import { Skeleton } from "../ui/skeleton";
import { Badge } from "../ui/badge";
import { Avatar } from "../ui/avatar";
import { AvatarGroup } from "../ui/avatar-group";
import { AvatarEditor } from "../ui/avatar-editor";
import { generateAvatarConfig } from "../../lib/avatar/index";
import { Card } from "../ui/card";
import { StatCard } from "../ui/stat-card";
import { Separator } from "../ui/separator";
import { Table } from "../ui/table";
import { EmptyState } from "../ui/empty-state";
import { GamerBoy } from "../ui/gamer-boy";
import { MascotAvatar, MASCOT_OPTIONS, type MascotKind, type MascotState } from "../ui/mascot-avatar";

const projects = [
  { id: "1", name: "Orange studio", status: "Live", members: 8 },
  { id: "2", name: "Pocket garden", status: "Draft", members: 3 },
  { id: "3", name: "Sunday notes", status: "Live", members: 12 },
  { id: "4", name: "Little orbit", status: "Draft", members: 2 },
  { id: "5", name: "Field journal", status: "Live", members: 6 },
];

/** The catalogue and docs render these same reusable components. */
export function ComponentDemo({ slug, appearance = "polished" }: { slug: string; appearance?: Appearance }) {
  const a = { appearance };
  const [avatarSeed, setAvatarSeed] = useState("user-42");
  const [avatarConfig, setAvatarConfig] = useState(() => generateAvatarConfig("user-42"));
  const [saved, setSaved] = useState(false);
  const [value, setValue] = useState("");
  const [checked, setChecked] = useState(true);
  const [number, setNumber] = useState(40);
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [validated, setValidated] = useState(false);
  const status = <p className="demo-feedback" role="status">{feedback || "Try it. Every example is interactive."}</p>;
  const action = <Button {...a} onClick={() => { setSaved(!saved); setFeedback(saved ? "Ready for a fresh start." : "Project created in this preview."); }}>{saved ? "Start again" : "Create project"}</Button>;
  switch (slug) {
    case "button": return <div className="demo-stack"><div className="demo-row"><Button {...a} onClick={() => { setSaved(!saved); setFeedback(saved ? "Removed from favourites." : "Saved to favourites."); }} aria-pressed={saved}>{saved ? "Saved!" : "Save a little joy"}</Button><Button {...a} variant="secondary" onClick={() => { setSaved(false); setFeedback("Ready to go again."); }}>Reset</Button></div><div className="demo-row"><Button {...a} variant="ghost" onClick={() => setFeedback("A little detail, a big difference.")}>Learn more</Button><Button {...a} disabled>Unavailable</Button></div>{status}</div>;
    case "input": return <form className="demo-stack" noValidate onSubmit={(event) => { event.preventDefault(); setValidated(true); setFeedback(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? "Looks good. Ready to go!" : "Check your email address."); }}><Input {...a} label="Your email" type="email" placeholder="you@example.com" value={value} onChange={(event) => { setValue(event.target.value); setValidated(false); }} error={validated && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? "Enter a valid email address." : undefined} description="A little room for your next idea." required /><Button {...a} type="submit">Try validation</Button>{status}</form>;
    case "textarea": return <div className="demo-stack"><Textarea {...a} label="Your next big idea" placeholder="It all starts with a little thought..." value={value} maxLength={200} onChange={(event) => setValue(event.target.value)} description={`${value.length} of 200 characters`} /><Button {...a} onClick={() => setFeedback(value.trim() ? "Draft saved in this preview." : "Write a little something first.")}>Save draft</Button>{status}</div>;
    case "select": return <div className="demo-stack"><Select {...a} label="Workspace" placeholder="Find your space" value={value} onValueChange={(next) => { setValue(next); setFeedback(next === "studio" ? "Orange studio selected." : "Personal space selected."); }} options={[{ value: "studio", label: "Orange studio" }, { value: "personal", label: "Personal space" }, { value: "archive", label: "Archive (unavailable)", disabled: true }]} description="A home for the things you make." />{status}</div>;
    case "checkbox": return <div className="demo-stack"><Checkbox {...a} label="Keep me in the loop" description="A small update when something new arrives." checked={checked} onCheckedChange={(next) => setChecked(next === true)} /><Checkbox {...a} label="Select all projects" checked={saved ? true : "indeterminate"} onCheckedChange={(next) => setSaved(next === true)} /><Checkbox {...a} label="Managed by your workspace" disabled checked /><p className="demo-feedback" role="status">Updates {checked ? "enabled" : "disabled"}.</p></div>;
    case "radio-group": return <RadioGroup {...a} label="Make yourself at home" defaultValue="personal" options={[{ value: "personal", label: "Just me", description: "A quiet corner for personal projects." }, { value: "team", label: "With my team", description: "Good things happen together." }, { value: "enterprise", label: "Enterprise (coming later)", disabled: true }]} />;
    case "switch": return <div className="demo-stack"><Switch {...a} label="Quiet hours" description="A little less noise. A little more focus." checked={checked} onCheckedChange={setChecked} /><Switch {...a} label="Weekly round-up" defaultChecked /><Switch {...a} label="Workspace setting" disabled /><p className="demo-feedback" role="status">Quiet hours {checked ? "on" : "off"}.</p></div>;
    case "slider": return <div className="demo-stack"><Slider {...a} label="A little background music" value={[number]} onValueChange={(next) => setNumber(next[0])} formatValue={(n) => `${n}%`} /><Slider {...a} label="Comfortable range" defaultValue={[20, 75]} /><Slider {...a} label="Locked level" disabled defaultValue={[30]} /></div>;
    case "toggle": return <div className="demo-stack"><div className="demo-row"><Toggle {...a} pressed={checked} onPressedChange={setChecked} >Pin this project</Toggle><Toggle {...a} disabled>Locked</Toggle></div><p className="demo-feedback" role="status">{checked ? "This one stays close." : "Project unpinned."}</p></div>;
    case "toggle-group": return <div className="demo-stack"><ToggleGroup {...a} type="single" label="Text alignment" defaultValue="left" onValueChange={(next) => setFeedback(next ? `Aligned ${next}.` : "Alignment cleared.")} options={[{ value: "left", label: "Left" }, { value: "center", label: "Center" }, { value: "right", label: "Right" }]} /><ToggleGroup {...a} type="multiple" label="Text formatting" defaultValue={["bold"]} options={[{ value: "bold", label: "Bold" }, { value: "italic", label: "Italic" }, { value: "underline", label: "Underline" }]} />{status}</div>;
    case "accordion": return <Accordion {...a} type="single" collapsible defaultValue="open" items={[{ value: "open", title: "A little personality. Any project.", content: "Copy the source, choose your colours, and make it yours. Every component has Polished, Pixelated, Neobrutalism, Retro OS, and Terminal appearances." }, { value: "license", title: "Can I use this commercially?", content: "Yes. The MIT license lets you build personal and commercial projects. Keep the license with the source." }, { value: "keyboard", title: "Built for the keyboard, too?", content: "Use Tab to reach a heading, arrows to move between them, and Enter or Space to open it." }]} />;
    case "tabs": return <Tabs {...a} label="Project view" items={[{ value: "overview", label: "Overview", content: <div><h3>Small ideas. Room to grow.</h3><p>Everything your team is making, in one comfortable place.</p></div> }, { value: "activity", label: "Activity", content: <p>Your first component was added today. A good beginning.</p> }, { value: "settings", label: "Settings", content: <Switch {...a} label="Allow comments" defaultChecked /> }]} />;
    case "breadcrumb": return <div className="demo-stack"><Breadcrumb {...a} items={[{ label: "Home", href: "/" }, { label: "Components", href: `/components?style=${appearance}` }, { label: "Breadcrumb" }]} /><p className="demo-feedback">A clear path back to where you started.</p></div>;
    case "pagination": return <div className="demo-stack"><Pagination {...a} totalPages={8} defaultPage={1} onPageChange={(page) => setFeedback(`Showing page ${page} of 8.`)} />{status}</div>;
    case "dropdown-menu": return <div className="demo-stack"><DropdownMenu {...a} trigger={<Button {...a} variant="secondary">Project actions ↓</Button>} label="Orange studio" items={[{ value: "duplicate", label: "Duplicate project" }, { value: "favourite", label: "Add to favourites" }, { value: "transfer", label: "Transfer (unavailable)", disabled: true }, { value: "archive", label: "Archive project", destructive: true, separatorBefore: true }]} onAction={(next) => setFeedback(next === "duplicate" ? "Project duplicated in this preview." : next === "favourite" ? "Added to favourites." : "Archived in this preview. Reset to restore.")} />{status}</div>;
    case "command": return <Command {...a} items={[{ value: "project", label: "Create project", description: "Give a little idea a home", keywords: ["new"] }, { value: "search", label: "Find a component", description: "Your next building block" }, { value: "theme", label: "Change appearance", description: "Find your favourite palette", keywords: ["theme", "dark", "light"] }, { value: "invite", label: "Invite team (unavailable)", disabled: true }]} />;
    case "dialog": return <div className="demo-stack"><Dialog {...a} open={open} onOpenChange={setOpen} trigger={<Button {...a}>Create a workspace</Button>} title="Room for your next idea." description="Give your workspace a name. You can change it any time."><form className="demo-stack" onSubmit={(event) => { event.preventDefault(); setOpen(false); setFeedback(`${value || "Orange studio"} created in this preview.`); }}><Input {...a} label="Workspace name" placeholder="Orange studio" value={value} onChange={(event) => setValue(event.target.value)} required /><Button {...a} type="submit">Create workspace</Button></form></Dialog>{status}</div>;
    case "sheet": return <div className="demo-stack"><Sheet {...a} trigger={<Button {...a} variant="secondary">Workspace preferences</Button>} title="A space that feels like you." description="Little adjustments for a better working day."><Switch {...a} label="Quiet hours" defaultChecked /><Switch {...a} label="Weekly round-up" /><Slider {...a} label="Preview size" defaultValue={[60]} /></Sheet><p className="demo-feedback">Your workspace, with room to adjust.</p></div>;
    case "popover": return <div className="demo-stack"><Popover {...a} open={open} onOpenChange={setOpen} trigger={<Button {...a} variant="secondary">Edit project name</Button>} title="The little details"><form className="demo-stack" onSubmit={(event) => { event.preventDefault(); setOpen(false); setFeedback(`Project renamed to ${value}.`); }}><Input {...a} label="Project name" value={value} placeholder="Pocket garden" required onChange={(event) => setValue(event.target.value)} /><Button {...a} type="submit">Save name</Button></form></Popover>{status}</div>;
    case "tooltip": return <div className="demo-stack"><Tooltip {...a} content="Your project runs in Mumbai."><Button {...a} variant="secondary">Deployment region</Button></Tooltip><p className="demo-feedback">Hover or focus for a little more context.</p></div>;
    case "toast": return <ToastProvider><div className="demo-stack"><Button {...a} onClick={() => { setOpen(true); setFeedback("Changes saved in this preview."); }}>Save changes</Button>{status}</div><Toast {...a} open={open} onOpenChange={setOpen} title="A little progress, saved." description="Your workspace is up to date." tone="success" action={{ label: "Undo", onClick: () => setFeedback("Changes undone.") }} /></ToastProvider>;
    case "alert": return <div className="demo-stack"><Alert {...a} title="Everything is up to date." tone="success" dismissible>Your latest changes have a safe home.</Alert><Alert {...a} title="A small heads-up" tone="warning">Your workspace is nearly full.</Alert></div>;
    case "progress": return <div className="demo-stack"><Progress {...a} label="Bringing your ideas along" value={number} /><div className="demo-row"><Button {...a} variant="secondary" onClick={() => setNumber((n) => Math.min(100, n + 20))} disabled={number === 100}>Advance</Button><Button {...a} variant="ghost" onClick={() => setNumber(0)}>Start again</Button></div><Progress {...a} label="Looking for inspiration" /></div>;
    case "skeleton": return <div className="demo-stack">{saved ? <Card {...a} title="Orange studio" description="Your creative corner is ready."><p>Good things are worth the wait.</p></Card> : <><Skeleton {...a} shape="avatar" label="Loading profile" /><Skeleton {...a} lines={3} label="Loading project" /></>}<Button {...a} variant="secondary" onClick={() => setSaved(!saved)}>{saved ? "Show loading" : "Reveal content"}</Button></div>;
    case "badge": return <div className="demo-row"><Badge {...a} tone="success" dot>Live</Badge><Badge {...a} tone="accent">New</Badge><Badge {...a}>Draft</Badge><Badge {...a} tone="warning">In review</Badge><Badge {...a} tone="danger">Needs attention</Badge></div>;
    case "avatar": return <div className="demo-stack avatar-seed-demo"><div className="demo-row avatar-seed-preview"><Avatar {...a} seed={avatarSeed} size={112} aria-label={`Avatar for ${avatarSeed || "guest"}`} /><div><strong>Your seed. Your identity.</strong><p className="demo-feedback">Same seed, same avatar. No upload needed.</p></div></div><Input {...a} label="Avatar seed" value={avatarSeed} onChange={(event) => setAvatarSeed(event.target.value)} /><div className="avatar-mini-grid">{Array.from({ length: 12 }, (_, index) => <Avatar {...a} key={index} seed={`user-${index + 1}`} size={40} />)}</div></div>;
    case "avatar-group": return <div className="demo-stack"><AvatarGroup {...a} avatars={Array.from({ length: 8 }, (_, index) => ({ seed: `user-${index + 1}`, name: `Team member ${index + 1}` }))} max={5} size="md" label="Your studio team" /><p className="demo-feedback">Eight people. One small, colourful introduction.</p></div>;
    case "avatar-editor": return <div className="avatar-editor-demo"><AvatarEditor {...a} seed="user-42" value={avatarConfig} onChange={setAvatarConfig} /></div>;
    case "card": return <Card {...a} title="Weekend studio" description="A good place for your next idea." footer={action}><div className="demo-row"><Avatar {...a} name="Orange Studio" /><Badge {...a} tone="success" dot>{saved ? "Created" : "Ready when you are"}</Badge></div><p className="demo-feedback" role="status">{feedback || "Make room for something new."}</p></Card>;
    case "stat-card": return <StatCard {...a} accent="mint" title="Small wins" subtitle="Every little detail adds up." counter="01 / 05" art={<span className="demo-star">✦</span>} stats={[{ label: "Ideas", value: 24 }, { label: "Made real", value: 8 }]} footer="A good day to build" />;
    case "separator": return <div className="demo-stack"><strong>Orange studio</strong><p className="demo-feedback">A quiet corner for your next idea.</p><Separator {...a} /><div className="demo-row"><span>Projects</span><Separator {...a} orientation="vertical" /><span>People</span><Separator {...a} orientation="vertical" /><span>Settings</span></div></div>;
    case "table": return <Table {...a} caption="A few things we are making" pageSize={3} rows={projects} columns={[{ key: "name", header: "Project", sortable: true }, { key: "status", header: "Status", render: (row) => <Badge {...a} tone={row.status === "Live" ? "success" : "neutral"} dot>{row.status}</Badge> }, { key: "members", header: "People", sortable: true }]} />;
    case "empty-state": return saved ? <Card {...a} title="Your first project" description="A good beginning." footer={action}>{status}</Card> : <EmptyState {...a} title="A fresh canvas." description="Your first project belongs here. Make a little room for it." action={action} />;
    case "mascot-avatar": return <MascotDemo appearance={appearance} />;
    case "gamer-boy": return <GamerBoy {...a} />;
    default: return null;
  }
}

function MascotDemo({ appearance }: { appearance: Appearance }) {
  const [mascot, setMascot] = useState<MascotKind>("dune-hopper");
  const [state, setState] = useState<MascotState>("idle");
  return <div className="demo-stack mascot-demo">
    <MascotAvatar seed="studio-helper" mascot={mascot} state={state} size={176} appearance={appearance} aria-label={`Mascot preview, ${state}`} />
    <div className="avatar-editor-selects">
      <Select appearance={appearance} label="Character" value={mascot} onValueChange={(value) => setMascot(value as MascotKind)} options={MASCOT_OPTIONS.map(({ value, label }) => ({ value, label }))} />
      <Select appearance={appearance} label="Chat state" value={state} onValueChange={(value) => setState(value as MascotState)} options={["idle", "thinking", "talking", "error"].map((value) => ({ value, label: value[0].toUpperCase() + value.slice(1) }))} />
    </div>
    <p className="demo-feedback">Move your pointer, then click the character to say hello.</p>
  </div>;
}
