"use client";

import { useState } from "react";
import type { Appearance } from "../ui/appearance";
import { KEEPSAKE_PHOTOS } from "../ui/keepsake-photos";
import { SpringDeck } from "../ui/spring-deck";
import { CascadeMenu, type CascadeMenuItem } from "../ui/cascade-menu";
import { ChoiceDial } from "../ui/choice-dial";
import { ApertureGallery } from "../ui/aperture-gallery";
import { CreativeWorkbench } from "../ui/creative-editor-slot";
import { ShaderCheck, ShaderColor, ShaderRange, ShaderSelect } from "./shader-demo-controls";
import "../../styles/kinetic-demos.css";

const PHOTOS = KEEPSAKE_PHOTOS.slice(0, 5).map((photo, index) => ({ id: photo.id, image: photo.src, alt: photo.alt, title: photo.title, description: photo.note, color: ["#ede5d1", "#dce4d2", "#e3ddd4", "#e8d9c9", "#d7ded7"][index] }));
const LINKS: CascadeMenuItem[] = [{ id: "work", label: "Selected work", href: "#selected-work", description: "Ideas brought into the world" }, { id: "notes", label: "Field notes", href: "#field-notes", description: "A few things worth keeping" }, { id: "about", label: "About", href: "#about", description: "The people behind the practice" }, { id: "contact", label: "Start a conversation", href: "#contact", description: "Every good project starts here" }];
const OPTIONS = [{ id: "design", label: "Design", description: "Shape an idea into something clear." }, { id: "code", label: "Development", description: "Make it work as well as it looks." }, { id: "photo", label: "Photography", description: "Keep a different point of view." }, { id: "writing", label: "Writing", description: "Find the words that carry it." }, { id: "motion", label: "Motion", description: "Give a good idea a little movement." }, { id: "music", label: "Music", description: "Set the mood for what comes next." }, { id: "research", label: "Research", description: "Start with a better question." }];
type DemoProps = { appearance: Appearance; thumbnail?: boolean };

export function SpringDeckDemo({ appearance, thumbnail = false }: DemoProps) {
  const [selected, setSelected] = useState(PHOTOS[2].id), [spread, setSpread] = useState(1), [tilt, setTilt] = useState(6), [width, setWidth] = useState(180), [accent, setAccent] = useState("#be5837");
  const preview = <SpringDeck items={PHOTOS} value={selected} onValueChange={setSelected} spread={spread} tilt={tilt} cardWidth={thumbnail ? 140 : width} accent={accent} appearance={appearance} />;
  return thumbnail ? preview : <div className="creative-demo kinetic-demo"><CreativeWorkbench preview={preview}><ShaderRange label="Fan spread" value={spread} onChange={setSpread} min={.4} max={1.8} step={.1} /><ShaderRange label="Card tilt" value={tilt} onChange={setTilt} max={12} step={1} /><ShaderRange label="Card width" value={width} onChange={setWidth} min={120} max={260} step={10} /><ShaderColor label="Accent" value={accent} onChange={setAccent} /><p className="creative-help">Select a card, use the arrow controls or swipe sideways. The selected photo stays in front while nearby cards lift on hover.</p></CreativeWorkbench></div>;
}

export function CascadeMenuDemo({ appearance, thumbnail = false }: DemoProps) {
  const [open, setOpen] = useState(false), [accent, setAccent] = useState("#c15f3c"), [fullScreen, setFullScreen] = useState(false), [last, setLast] = useState<string>();
  const preview = <CascadeMenu items={LINKS} brand="Fieldnotes" open={open} onOpenChange={setOpen} onNavigate={item => setLast(item.label)} accent={accent} fullScreen={!thumbnail && fullScreen} appearance={appearance} height={thumbnail ? 290 : 460} footer="A demonstration of four links. Supply your own destinations."><div className="cascade-menu-demo-copy"><h3>{last ?? "A place for your next idea."}</h3><p>{last ? "Selected from the navigation." : "Open the menu. Take a look around."}</p><span className="cascade-menu-demo-rule" /></div></CascadeMenu>;
  return thumbnail ? preview : <div className="creative-demo kinetic-demo"><CreativeWorkbench preview={preview}><ShaderColor label="Sheet accent" value={accent} onChange={setAccent} /><ShaderCheck label="Full screen menu" value={fullScreen} onChange={setFullScreen} /><button type="button" className="creative-button" onClick={() => setOpen(!open)}>{open ? "Close menu" : "Open menu"}</button><p className="creative-help">The inline menu keeps the rest of the page available. Full screen mode traps focus, closes with Escape and returns focus to the opener.</p></CreativeWorkbench></div>;
}

export function ChoiceDialDemo({ appearance, thumbnail = false }: DemoProps) {
  const [value, setValue] = useState("writing"), [curve, setCurve] = useState(1), [visible, setVisible] = useState(5), [loop, setLoop] = useState(false), [accent, setAccent] = useState("#46765b");
  const preview = <ChoiceDial options={OPTIONS} value={value} onValueChange={setValue} curve={curve} visibleOptions={visible} loop={loop} accent={accent} label="Where will you start?" appearance={appearance} />;
  return thumbnail ? preview : <div className="creative-demo kinetic-demo"><CreativeWorkbench preview={preview}><ShaderRange label="Curve" value={curve} onChange={setCurve} max={1.6} step={.1} /><ShaderRange label="Visible choices" value={visible} onChange={setVisible} min={3} max={9} step={2} /><ShaderColor label="Accent" value={accent} onChange={setAccent} /><ShaderCheck label="Loop choices" value={loop} onChange={setLoop} /><p className="creative-help">Scroll or drag vertically to choose. Arrow keys, Home, End and typing the beginning of a choice also work. At the ends, scrolling returns to the page.</p></CreativeWorkbench></div>;
}

export function ApertureGalleryDemo({ appearance, thumbnail = false }: DemoProps) {
  const [selected, setSelected] = useState(PHOTOS[2].id), [trigger, setTrigger] = useState<"click" | "hover">("click"), [orientation, setOrientation] = useState<"horizontal" | "vertical">("horizontal"), [height, setHeight] = useState(360), [expand, setExpand] = useState(4), [parallax, setParallax] = useState(.5), [accent, setAccent] = useState("#b86c3b");
  const preview = <ApertureGallery items={PHOTOS} value={selected} onValueChange={setSelected} trigger={trigger} orientation={orientation} height={thumbnail ? 260 : height} expand={expand} parallax={parallax} accent={accent} appearance={appearance} />;
  return thumbnail ? preview : <div className="creative-demo kinetic-demo"><CreativeWorkbench preview={preview}><ShaderSelect label="Pointer trigger" value={trigger} options={["click", "hover"]} onChange={setTrigger} /><ShaderSelect label="Orientation" value={orientation} options={["horizontal", "vertical"]} onChange={setOrientation} /><ShaderRange label="Image height" value={height} onChange={setHeight} min={220} max={600} step={20} /><ShaderRange label="Open panel width" value={expand} onChange={setExpand} min={2} max={7} step={.5} /><ShaderRange label="Image drift" value={parallax} onChange={setParallax} max={1} step={.1} /><ShaderColor label="Accent" value={accent} onChange={setAccent} /><p className="creative-help">Open a panel with a click or keyboard focus. Small screens switch to a vertical frame so every photo stays reachable.</p></CreativeWorkbench></div>;
}
