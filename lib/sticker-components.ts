import type { ComponentDefinition } from "./components";

export const STICKER_PACK_COMPONENT: ComponentDefinition = {
  slug: "sticker-pack", name: "Sticker", category: "Play", collection: "polished",
  description: "Fifty original vinyl stickers, from tiny oddlings to pocket objects. Scalable artwork, optional peel and portable SVG exports.",
  file: "components/ui/sticker-pack.tsx", usage: '<Sticker name="orbit-snail" size={160} hoverPeel />',
  keyboard: "Stickers have image semantics. Wrap a sticker in a native button or link to add an action; keyboard focus on the wrapper also previews the peel. Reduced motion keeps the artwork flat.",
  notes: ["Browse all 50 designs at /stickers. Every design is original oRangeUi artwork under the repository MIT license.", "Use the generic Sticker with a typed name, or one of 50 named exports such as OrbitSnailSticker. SVG exports contain no fonts, linked images or scripts."],
  props: [
    { name: "name", type: "StickerName", defaultValue: "Required", description: "One of the 50 names exported in STICKERS." },
    { name: "size", type: "number | string", defaultValue: "128", description: "Width in pixels or a CSS length. Numeric sizes are bounded from 24 to 2048. The square canvas preserves the die-cut silhouette." },
    { name: "hoverPeel", type: "boolean", defaultValue: "false", description: "Fold the lower corner on hover or when a wrapping control receives keyboard focus. Reduced motion disables the peel." },
    { name: "rotate", type: "number", defaultValue: "0", description: "Rotation in degrees, from -180 to 180." },
    { name: "label / decorative", type: "string / boolean", defaultValue: "Sticker title / false", description: "Custom image label, or hide decorative artwork from assistive technology." },
    { name: "className / style", type: "string / CSSProperties", defaultValue: "Not set", description: "Style the outer span without changing the self-contained artwork." }
  ]
};
