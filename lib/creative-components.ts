import type { ComponentDefinition, PropDoc } from "./components";
import type { Appearance } from "../components/ui/appearance";
type Row = [string, string, string, string];
const theme: Row = ["theme", "light | dark | auto", "auto", "Live HTML classes, then data-theme, then system palette."];
const volume: Row = ["volume / muted", "number / boolean", "0.65 / false", "Gesture-gated audio volume and visible mute control."];
const tracks: Row = ["tracks", "readonly AudioTrack[]", "required", "Title, artist, playable src and optional cover, avatar and share href."];
const sampleImports = ['import { CREATIVE_PLAYLIST } from "./components/ui/creative-playlist";'];
const playerNotes = [
  "Uses the shared useAudioPlayer engine with real HTMLAudioElement playback, seeking, track changes, volume, mute, loading and errors. Same-origin, blob and data tracks use audio analysis; remote tracks preserve playback and use the visual fallback.",
  "The three original Orange sessions recordings are dedicated to CC0 1.0. Complete credits and license text travel with source downloads. Supply your own licensed playlist for production.",
];
function definition(slug: string, name: string, collection: Appearance, description: string, usage: string, keyboard: string, rows: Row[], notes: string[] = [], options: Partial<ComponentDefinition> = {}): ComponentDefinition {
  return { slug, name, collection, customizerPreview: true, category: collection === "retro-os" || ["season-tree", "swing-keychain"].includes(slug) ? "Play" : "Content & layout", description, file: "components/ui/" + slug + ".tsx", usage, keyboard, props: [...rows, theme].map(([name, type, defaultValue, description]): PropDoc => ({ name, type, defaultValue, description })), notes, ...options };
}
const textRows: Row[] = [
  ["text / onTextChange", "string / callback", "Original sample", "Controlled or local text. Preserve mixed scripts, line breaks and punctuation."],
  ["font", "hindi | hinglish", "Component-specific", "Swappable Hindi or matching Latin/Devanagari display family."],
  ["transliterate", "boolean", "false", "Offline phonetic transliteration: namaste becomes नमस्ते."],
  ["fontSize", "number", "88", "Size in the 720px export space. Long text wraps at grapheme boundaries."],
  ["fill / shadowColor / shadowDistance", "string / string / number", "Component palette / 0 or 8", "Letter fill and independently configurable offset shadow."],
  ["outline / outlineColor", "number / string", "0 / dark ink", "Optional text outline."],
  ["pattern / background", "none | mandala | paisley / string", "Component-specific", "Original geometric ornament and output background."],
  ["editable / showControls", "boolean / boolean", "true / true", "Show the input and expandable styling panel."],
  ["onChange", "(config: StyledTextConfig) => void", "Not set", "Reports styling choices for application-owned persistence."],
  ["fontUrl", "string", "Bundled OFL URL", "Font asset for an alternate licensed package and standalone exports."],
];
const textNotes = [
  "You own the text you create. You may use and export generated artwork commercially. The supplied fonts remain licensed to their authors under SIL Open Font License 1.1; keep the OFL notices when redistributing fonts.",
  "Hindi uses Yatra One by Catherine Leigh Schmidt. Hinglish uses Baloo 2 by Ek Type, with matching Latin and Devanagari letterforms. Both are self-hosted in public/fonts/desi/ with complete licenses and credits.",
  "Override --font-hindi-display and --font-hinglish-display for your own licensed or premium fonts without changing the component API. Transliteration is phonetic with a common-word dictionary, rather than translation.",
];
export const CREATIVE_COMPONENTS: ComponentDefinition[] = [
  definition("season-tree", "SeasonTree", "pixel", "An original pixel tree that moves through blossom, summer, autumn, maple and winter.", '<SeasonTree season="yellow" showPicker />', "Tab through the season picker; Enter or Space changes season.", [
    ["season / onSeasonChange", "TreeSeason / callback", "yellow", "Controlled or local pink, green, yellow, red or winter season."],
    ["showPicker", "boolean", "true", "Built-in season picker."],
    ["windStrength / fallRate", "number / number", "0.6 / 1", "Canopy sway, drift and falling leaves per second."],
    ["pixelSize", "number", "3", "Hard-edged canvas pixel scale."],
    ["background", "string", "Season sky", "Custom backdrop or transparent."],
    ["paused / size", "boolean / number | string", "false / 340", "Freeze decorative motion; responsive maximum width."],
  ], ["All foliage and branch geometry is procedural and original. Seasons change density, shapes, sky, ground and separate foliage/falling palettes. Reduced motion retains a settled tree."]),
  definition("retro-player", "RetroPlayer", "retro-os", "A sticker-covered pocket player with a working click wheel and real music.", "<RetroPlayer tracks={CREATIVE_PLAYLIST} showEarbuds />", "Wheel buttons use Enter/Space. Focus the ring and use arrows to seek or change volume. Sticker arrows move, plus/minus resize, Delete removes.", [
    tracks, ["autoPlay", "boolean", "false", "Starts only after a gesture inside the player."],
    ["bodyColor / screenColor", "string / string", "#e6e5df / #f6f5ee", "Customize body and screen colors."],
    ["stickers / onStickersChange", "readonly CreativeSticker[] / callback", "Original decals", "Add, drag, resize, remove or upload decals."],
    ["showEarbuds", "boolean", "true", "Original decorative earbuds and cable."], volume,
  ], [...playerNotes, "Menu cycles between music, playlist and volume. Drag the ring to scrub or change volume. Decals contain no reference characters or device logo."], { usageImports: sampleImports }),
  definition("retro-camera", "RetroCamera", "retro-os", "A pocket camera with live view, digital zoom, filters and an in-memory gallery.", '<RetroCamera facingMode="user" mirror />', "Enable camera requests permission. W/T zoom, shutter captures, d-pad browses, Menu exposes filters and stickers.", [
    ["bodyColor", "string", "#a7cf59", "Camera body color."],
    ["stickers / onStickersChange", "readonly CreativeSticker[] / callback", "Original decals", "Editable or controlled decorative stickers."],
    ["facingMode / mirror", "user | environment / boolean", "user / true", "Camera selection and mirrored front-camera preview."],
    ["onCapture", "(blob: Blob) => void", "Not set", "Receives the captured PNG."],
    ["filters", "readonly CameraFilter[]", "none, warm, mono, grain", "Available photo filters."],
    ["brandText / megapixelLabel", "string / string", "ORANGE / 12.0 MP", "Editable decorative labels, not hardware claims."],
    ["muted / volume / size", "boolean / number / number | string", "true / 0.35 / 360", "Synthesized shutter sound and responsive width."],
  ], ["Access requires a secure context and a user request. Denied, no-camera and stopped states retain an explicitly labeled original demo scene. No camera audio is requested. All media tracks stop while hidden or unmounted.", "Photos stay in memory for the mounted session. Capture and download include digital zoom, mirror and the selected filter; use onCapture for your own storage."]),
  definition("swing-keychain", "SwingKeychain", "polished", "Grab an acrylic charm and swing an original silver keychain.", "<SwingKeychain chainLength={6} muted />", "Drag a charm or link. Focus the canvas and use arrows or Space to swing. Sound has a visible keyboard-accessible toggle.", [
    ["charms", "readonly KeychainCharm[]", "Five original charms", "Original shapes or user images; up to 12 charms."],
    ["chainLength / gravity / damping", "number / number / number", "6 / 850 / 0.96", "Link count, downward acceleration and retained velocity."],
    ["muted / volume", "boolean / number", "true / 0.35", "Synthesized collision clinks with impact-based volume."],
    ["clipColor / background / size", "string / string / number | string", "#91afc3 / #ffe28b / 340", "Metal finish, backdrop and responsive width."],
  ], ["A small lazily loaded custom Verlet solver handles gravity, chain constraints and collisions. Canvas shading gives the clip and acrylic charms depth without a large 3D dependency. Reduced motion retains a settled pose."]),
  definition("custom-stamp", "CustomStamp", "polished", "Make a perforated paper stamp, edit every detail, and export a stamp sheet.", '<CustomStamp title="CITRUS CLUB" value="50" editable />', "Use native editor inputs, image position/zoom controls and PNG/SVG export buttons.", [
    ["image / title / subtitle", "string", "Original citrus / CITRUS CLUB / A LITTLE SUNSHINE", "Artwork and editable face text."],
    ["value / year / country", "string / string | number / string", "50 / 2026 / INDIA", "Decorative denomination, year and country."],
    ["colors", "Partial<StampColors>", "Paper, border, green ink", "Independent background, border and text colors."],
    ["font", "sans | serif | mono", "sans", "Typography selection."],
    ["perforation", "StampPerforation", "round", "Round/square holes with optional size."],
    ["editable / showEditor", "boolean / boolean", "true / false", "Enable the editor and optionally start it open."],
    ["config / onChange", "StampConfig / callback", "Not set", "Controlled artwork, position, zoom, text, colors and postmark."],
    ["postmark / sheet / background", "boolean / boolean / string", "false / false / #579253", "Postmark, four-stamp sheet and display surface."],
  ], ["All sample artwork is original. Exports embed artwork and the bundled font. Remote images must allow fetching; local uploads avoid cross-origin export restrictions.", "Use config/onChange for controlled editing. Individual props initialize the editor. The decorative postmark has no postal validity."], { customizerPreview: true }),
  definition("tilt-stamp-3d", "TiltStamp3D", "polished", "A blue floral paper card with pointer tilt, free drag, glare and an embossed seal.", '<TiltStamp3D label="ORANGE STUDIO" code="MIDNIGHT BLOOM / 1038 U" />', "Arrows rotate; Home or Escape resets. Drag freely, release to spring back. Device tilt uses its permission button.", [
    ["image / label / code", "string", "Original flowers / ORANGE STUDIO / MIDNIGHT BLOOM", "Top artwork and label."],
    ["accent / seal", "string / ReactNode", "#4e419b / original spark", "Swatch color and embossed seal."],
    ["intensity / glare / autoRotate", "number / boolean / boolean", "1 / true / false", "Pointer intensity, glare and idle rotation."],
    ["foil / size", "boolean / number | string", "false / 340", "Holographic foil and responsive width."],
  ], ["CSS 3D transforms preserve a small bundle. Original blue flowers spill beyond paper with thickness, a soft shadow and optional foil. No swatch brand or reference artwork is used."]),
  definition("island-player", "IslandPlayer", "polished", "A quiet black music island with real playback, timing and an audio-driven equalizer.", "<IslandPlayer tracks={CREATIVE_PLAYLIST} />", "Tab to transport, progress, mute and output. Arrow keys scrub the native progress slider.", [
    tracks, ["index / onTrackChange", "number / callback", "Local first track", "Controlled track selection."],
    ["showOutputIcon", "boolean", "true", "Output selection where supported, browser/system guidance otherwise."],
    ["size", "number | string", "360", "Responsive width."], volume,
  ], playerNotes, { usageImports: sampleImports }),
  definition("glass-player", "GlassPlayer", "polished", "Full-bleed cover art, a blurred backdrop, and music, like and share controls.", "<GlassPlayer tracks={CREATIVE_PLAYLIST} blur={26} />", "Like, share, transport and mute are buttons; arrows scrub the native slider.", [
    tracks, ["liked / onLike", "boolean / callback", "false", "Controlled or local animated like preference."],
    ["onShare", "(track: AudioTrack) => void | Promise<void>", "Web Share or copied link", "Application-owned share action."],
    ["blur / size", "number / number | string", "26 / 340", "Cover-derived backdrop blur and width."], volume,
  ], [...playerNotes, "Share uses onShare or Web Share, with a copied-link fallback. Like is controlled through liked/onLike or works locally."], { usageImports: sampleImports }),
  definition("neon-pill-player", "NeonPillPlayer", "polished", "A glowing compact player that opens on hover, keyboard focus or touch.", '<NeonPillPlayer tracks={CREATIVE_PLAYLIST} expandOn="hover" />', "Focus opens hover details; Enter activates cover/play. Tab reaches controls, Escape collapses. Touch opens with a tap and closes outside.", [
    tracks, ["glowColor", "string", "#ce72ef", "Cover and progress glow."],
    ["expandOn / defaultExpanded", "hover | click / boolean", "hover / false", "Expansion mode and initial state."], volume,
  ], [...playerNotes, "Starts minimized with the original glowing cover and equalizer. A generic original music icon replaces service branding."], { usageImports: sampleImports }),
  definition("anime-fire", "AnimeFire", "polished", "Original cel-shaded fire with ink edges, bright core, rising sparks and optional crackle.", "<AnimeFire speed={0.6} intensity={1} height={0.45} />", "Arrows move the focused canvas attraction point. The visible sound toggle starts or mutes synthesized crackle.", [
    ["colors", "readonly string[]", "Ember / flame / core", "Three cel-band colors."],
    ["speed / intensity / height", "number / number / number", "0.6 / 1 / 0.45", "Exact compatible motion, flame strength and normalized-height defaults."],
    ["interactive / dither / pixelSize", "boolean / boolean / number", "true / false / 1", "Smoothed pointer attraction, Bayer print and pixel scale."],
    ["sound / volume / muted", "boolean / number / boolean", "false / 0.3 / false", "Gesture-gated crackle and low rumble."],
  ], ["Independent original shader with the requested base prop surface. No 23rd.dev code, artwork or sound is copied. Context loss/restoration and a CSS/SVG fallback are handled.", "Decorative frames and crackle pause off screen and in hidden tabs. Reduced motion keeps a still; sound defaults off."]),
  definition("grain-gradient", "GrainGradient", "polished", "A flowing grain gradient with editable mesh points, presets and image export.", '<GrainGradient preset="sunset" mode="mesh" />', "Drag color points or use their arrow keys. Save image exports the current frame.", [
    ["colors / positions / onPositionsChange", "readonly string[] / readonly GradientPoint[] / callback", "Theme palette / distributed points", "Up to 12 colors with independently draggable positions."],
    ["speed / blur / intensity / grain", "number", "0.14 / 0.7 / 0.95 / 0.35", "Exact compatible defaults; blur, intensity and grain range from 0 to 1."],
    ["interactive / preset", "boolean / keyof GRAIN_PRESETS", "true / theme palette", "Pointer interaction; sunset, aurora, ocean, Holi, Diwali or Pongal."],
    ["angle / direction / turbulence / waveScale", "number / forward | reverse / number / number", "25 / forward / 0.65 / 2.5", "Flow direction and evolving-field scale."],
    ["pointerEffect", "swirl | repel | attract | ripple", "swirl", "Pointer deformation."],
    ["grainStyle / vignette / posterize / dither", "film | dots | noise / number / number / boolean", "film / 0 / 0 / false", "Texture, edge shading, band count and Bayer print."],
    ["mode / showPoints / showExportButton / paused", "mesh | radial | conic / boolean / boolean / boolean", "mesh / false / true / false", "Shape, editable handles, export and manual pause."],
  ], ["An independent original shader with more than four colors, named Indian-festival palettes, radial/conic modes and mesh points. No referenced gradient source is used.", "Reduced motion keeps a static field. Hidden frames pause; context restoration and a fallback image export are supported."]),
  definition("hindi-text", "HindiText", "polished", "Your words in a licensed Hindi display face, with offline transliteration and exports.", '<HindiText text="रंगों की दुनिया" />', "Type, paste, toggle transliteration, style your lettering and export using native controls.", textRows, textNotes, { customizerPreview: true }),
  definition("hinglish-text", "HinglishText", "polished", "Mixed Latin and Devanagari lettering with one visual voice and an original patterned backdrop.", '<HinglishText text="good वक्त" />', "Type mixed-script text, choose styling and use PNG/SVG export buttons.", textRows, textNotes, { customizerPreview: true }),
  definition("frosted-glass", "FrostedGlass", "polished", "Write through grainy glass to reveal the sharp garden beneath.", '<FrostedGlass text={"MAKE\\nROOM\\nFOR JOY"} />', "Pointer, touch and pen write. Arrows draw, Space clears, R resets. Reset, clear and mute are visible buttons.", [
    ["background", "string | ReactNode", "Original garden", "Image, CSS color/gradient or GrainGradient component."],
    ["frostBlur / tint / grain", "number / string / number", "18 / translucent green / 0.18", "Blur, tint and fine grain."],
    ["brushSize / brushSoftness", "number / number", "38 / 0.55", "Pressure-aware diameter and feathered edge."],
    ["regrowMs", "number", "0", "Regrowth duration; 0 preserves clear strokes."],
    ["text / font", "string / string", "Empty / italic bold 66px Georgia", "Initial text cutout, including line breaks."],
    ["onClear / showResetButton", "() => void / boolean", "Not set / true", "Clear-glass callback and reset control."],
    ["condensationDrips / muted / volume", "boolean / boolean / number", "false / true / 0.2", "Optional drips and synthesized wipe sound."],
  ], ["An offscreen alpha mask erases frost along quadratic, pressure-aware strokes with independent paths for multiple touches. Sharp and blurred layers share the crop.", "Regrowth and condensation pause while hidden and are omitted under reduced motion. Wipe sound is muted by default."]),
];
export const CREATIVE_COMPONENT_SLUGS = CREATIVE_COMPONENTS.map(({ slug }) => slug);
