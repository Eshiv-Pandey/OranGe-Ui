"use client";

import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import type { Appearance } from "../ui/appearance";
import { components } from "../../lib/components";
import { CreativeWorkbench } from "../ui/creative-editor-slot";
import { useCreativeTheme } from "../ui/creative-surface";
import { BloomTrail } from "../ui/bloom-trail";
import { JournalStack } from "../ui/journal-stack";
import { PhotoGarland } from "../ui/photo-garland";
import { FilmStrip } from "../ui/film-strip";
import { BubbleWrap } from "../ui/bubble-wrap";
import { FocusCards } from "../ui/focus-cards";
import { DraggableCards } from "../ui/draggable-cards";
import { HaloButton } from "../ui/halo-button";
import { FloatingDock } from "../ui/floating-dock";
import { MorphInput } from "../ui/morph-input";
import { FluidColorPicker } from "../ui/fluid-color-picker";
import { KEEPSAKE_PHOTOS, type KeepsakePhoto } from "../ui/keepsake-photos";
import { ShaderRange as Range, ShaderSelect as Select, ShaderColor as Color, ShaderCheck as Check } from "./shader-demo-controls";
import "../../styles/reference-demos.css";

type DemoProps = { appearance: Appearance; thumbnail?: boolean };
import LiquidMetalDemo from "./liquid-metal-demo";

function Demo({ preview, thumbnail, children }: { preview: ReactNode; thumbnail?: boolean; children: ReactNode }) {
  const theme = useCreativeTheme();
  return <div className={`creative-surface reference-demo ${thumbnail ? "reference-thumbnail" : "creative-demo"}`} data-theme={theme}>{thumbnail ? preview : <CreativeWorkbench preview={preview}>{children}</CreativeWorkbench>}</div>;
}

function useDemoPhotos() {
  const [uploads, setUploads] = useState<KeepsakePhoto[]>([]), [error, setError] = useState("");
  useEffect(() => () => { uploads.forEach((photo) => URL.revokeObjectURL(photo.src)); }, [uploads]);
  return { photos: uploads.length ? uploads : KEEPSAKE_PHOTOS, editor: <><label className="creative-wide">Use your photos<input type="file" accept="image/*" multiple onChange={(event) => { const files = Array.from(event.target.files ?? []).slice(0, 10); if (!files.length) return; if (files.some((file) => !file.type.startsWith("image/") || file.size > 10_000_000)) { setError("Choose image files smaller than 10 MB each."); return; } setUploads(files.map((file, index) => ({ id: `upload-${index}`, src: URL.createObjectURL(file), alt: file.name, title: file.name.replace(/\.[^.]+$/, ""), note: "Your photograph, kept on this device." }))); setError(""); }} /></label>{uploads.length > 0 && <button className="creative-button creative-wide" type="button" onClick={() => setUploads([])}>Restore sample photos</button>}{error && <p className="creative-feedback creative-wide" role="alert">{error}</p>}</> };
}

const BLOOM_PALETTES = { meadow: ["#b55235", "#d8a643", "#768753", "#647eb3", "#d4899d"], citrus: ["#eb6c3b", "#e8ae35", "#e8ca67", "#648758", "#ab6d43"], blue: ["#4c7196", "#7f9ebc", "#a8bcca", "#788e66", "#dfc47e"] };
function subscribeSmallScreen(listener: () => void) { const query = window.matchMedia("(max-width: 800px)"); query.addEventListener("change", listener); return () => query.removeEventListener("change", listener); }
const readSmallScreen = () => window.matchMedia("(max-width: 800px)").matches;
const serverSmallScreen = () => false;
function BloomDemo({ appearance, thumbnail }: DemoProps) {
  const [seed, setSeed] = useState("wildflower"), [density, setDensity] = useState(65), [size, setSize] = useState(15), [palette, setPalette] = useState<keyof typeof BLOOM_PALETTES>("meadow");
  return <Demo thumbnail={thumbnail} preview={<BloomTrail appearance={appearance} seed={seed} density={density} flowerSize={size} colors={BLOOM_PALETTES[palette]} />}><label>Arrangement seed<input value={seed} onChange={(event) => setSeed(event.target.value)} /></label><Range label="Starting flowers" value={density} onChange={setDensity} min={0} max={140} step={1} /><Range label="Flower size" value={size} onChange={setSize} min={6} max={30} step={1} /><Select label="Petal palette" value={palette} options={["meadow", "citrus", "blue"]} onChange={setPalette} /></Demo>;
}
function GalleryDemo({ appearance, thumbnail, kind }: DemoProps & { kind: "journal-stack" | "photo-garland" | "film-strip" | "focus-cards" | "draggable-cards" }) {
  const { photos, editor } = useDemoPhotos(), [count, setCount] = useState(kind === "focus-cards" ? 3 : kind === "draggable-cards" ? 4 : 6), [label, setLabel] = useState(kind === "film-strip" ? "The moments between" : "Collected days"), [lights, setLights] = useState(true), [sway, setSway] = useState(true), [selected, setSelected] = useState("");
  const items = photos.slice(0, count), selection = (photo: KeepsakePhoto) => setSelected(photo.title);
  const preview = kind === "journal-stack" ? <JournalStack appearance={appearance} photos={items} label={label} /> : kind === "photo-garland" ? <PhotoGarland appearance={appearance} photos={items} lights={lights} sway={sway} onSelect={selection} /> : kind === "film-strip" ? <FilmStrip appearance={appearance} photos={items} label={label} onSelect={selection} /> : kind === "focus-cards" ? <FocusCards appearance={appearance} items={items} onSelect={selection} /> : <DraggableCards appearance={appearance} items={items} />;
  return <Demo thumbnail={thumbnail} preview={preview}><Range label="Photo count" value={Math.min(count, photos.length)} onChange={setCount} min={1} max={Math.max(1, photos.length)} step={1} />{(kind === "journal-stack" || kind === "film-strip") && <label>Collection title<input value={label} onChange={(event) => setLabel(event.target.value)} /></label>}{kind === "photo-garland" && <><Check label="Warm lights" value={lights} onChange={setLights} /><Check label="Gentle sway" value={sway} onChange={setSway} /></>}{editor}{selected && <p className="creative-feedback creative-wide" role="status">Selected: {selected}</p>}</Demo>;
}
function BubbleDemo({ appearance, thumbnail }: DemoProps) {
  const { photos, editor } = useDemoPhotos(), [rows, setRows] = useState(9), [customColumns, setColumns] = useState<number | null>(null), [sound, setSound] = useState(true), [volume, setVolume] = useState(.65), [showImage, setShowImage] = useState(false), [image, setImage] = useState("2");
  const small = useSyncExternalStore(subscribeSmallScreen, readSmallScreen, serverSmallScreen), columns = customColumns ?? (small ? 6 : 9);
  const photo = photos[Math.min(photos.length - 1, Number(image))];
  return <Demo thumbnail={thumbnail} preview={<BubbleWrap appearance={appearance} rows={rows} columns={columns} sound={sound} volume={volume} image={showImage ? photo.src : ""} imageAlt={photo.alt} />}><Range label="Bubble rows" value={rows} onChange={setRows} min={2} max={16} step={1} /><Range label="Bubble columns" value={columns} onChange={setColumns} min={3} max={18} step={1} /><Check label="Show photograph" value={showImage} onChange={setShowImage} /><label>Photograph<select value={image} onChange={(event) => setImage(event.target.value)}>{photos.map((photo, index) => <option key={photo.id} value={String(index)}>{photo.title}</option>)}</select></label><Check label="Pop sound" value={sound} onChange={setSound} /><Range label="Pop volume" value={volume} onChange={setVolume} />{editor}</Demo>;
}
function HaloDemo({ appearance, thumbnail }: DemoProps) {
  const [label, setLabel] = useState("Make something good"), [color, setColor] = useState("#ff854c"), [loading, setLoading] = useState(false), [disabled, setDisabled] = useState(false), [clicks, setClicks] = useState(0);
  return <Demo thumbnail={thumbnail} preview={<div className="reference-exhibit"><HaloButton appearance={appearance} color={color} loading={loading} disabled={disabled} onClick={() => setClicks(clicks + 1)}>{label}</HaloButton><p className="ix-caption" role="status">{clicks ? `Activated ${clicks} ${clicks === 1 ? "time" : "times"}.` : "Move around the edge. Try it with Tab, too."}</p></div>}><label>Button label<input value={label} onChange={(event) => setLabel(event.target.value)} /></label><Color label="Border color" value={color} onChange={setColor} /><Check label="Loading" value={loading} onChange={setLoading} /><Check label="Disabled" value={disabled} onChange={setDisabled} /></Demo>;
}
function DockDemo({ appearance, thumbnail }: DemoProps) {
  const [selected, setSelected] = useState("library"), [scale, setScale] = useState(1.65);
  return <Demo thumbnail={thumbnail} preview={<div className="reference-exhibit"><FloatingDock appearance={appearance} value={selected} onValueChange={setSelected} magnification={scale} /><p className="ix-caption" role="status">{selected.charAt(0).toUpperCase() + selected.slice(1)} selected</p></div>}><Range label="Icon magnification" value={scale} onChange={setScale} min={1} max={2} step={.05} /><Select label="Selected shortcut" value={selected} options={["home", "library", "palette", "music", "display"]} onChange={setSelected} /></Demo>;
}
function MorphDemo({ appearance, thumbnail }: DemoProps) {
  const [label, setLabel] = useState("Find your next component"), [value, setValue] = useState(""), [query, setQuery] = useState(""), [disabled, setDisabled] = useState(false);
  const results = query ? components.filter((component) => `${component.name} ${component.description}`.toLowerCase().includes(query.toLowerCase())).slice(0, 4) : [];
  return <Demo thumbnail={thumbnail} preview={<div className="reference-exhibit"><MorphInput appearance={appearance} label={label} placeholder="Try cards, avatars, text..." value={value} onValueChange={setValue} onSubmit={setQuery} disabled={disabled} />{query && <><p className="ix-caption" role="status">{results.length ? `Matches for "${query}"` : `No components found for "${query}".`}</p><ul className="reference-search-results">{results.map((component) => <li key={component.slug}><a href={`/components/${component.slug}`}>{component.name}</a></li>)}</ul></>}</div>}><label>Search label<input value={label} onChange={(event) => setLabel(event.target.value)} /></label><Check label="Disabled" value={disabled} onChange={setDisabled} /><p className="creative-feedback creative-wide">This example searches the real component catalogue.</p></Demo>;
}
function ColorDemo({ appearance, thumbnail }: DemoProps) {
  const [value, setValue] = useState("#ff8040"), [label, setLabel] = useState("Find your color"), [alpha, setAlpha] = useState(true), [disabled, setDisabled] = useState(false);
  return <Demo thumbnail={thumbnail} preview={<FluidColorPicker appearance={appearance} value={value} onValueChange={setValue} label={label} alpha={alpha} disabled={disabled} defaultOpen />}><label>Picker label<input value={label} onChange={(event) => setLabel(event.target.value)} /></label><Check label="Opacity controls" value={alpha} onChange={setAlpha} /><Check label="Disabled" value={disabled} onChange={setDisabled} /><p className="creative-feedback creative-wide" role="status">Selected value: {value.toUpperCase()}</p></Demo>;
}

export default function ReferenceDemo({ slug, ...props }: DemoProps & { slug: string }) {
  if (slug === "liquid-metal") return <LiquidMetalDemo {...props} />;
  if (slug === "bloom-trail") return <BloomDemo {...props} />;
  if (slug === "bubble-wrap") return <BubbleDemo {...props} />;
  if (slug === "journal-stack" || slug === "photo-garland" || slug === "film-strip" || slug === "focus-cards" || slug === "draggable-cards") return <GalleryDemo {...props} kind={slug} />;
  if (slug === "halo-button") return <HaloDemo {...props} />;
  if (slug === "floating-dock") return <DockDemo {...props} />;
  if (slug === "morph-input") return <MorphDemo {...props} />;
  if (slug === "fluid-color-picker") return <ColorDemo {...props} />;
  return null;
}
