import type { ComponentDefinition } from "./components";

export const STICKER_PACK_COMPONENT: ComponentDefinition = {
  slug: "sticker-pack", name: "Sticker", category: "Play", collection: "polished",
  description: "Seventy original stickers in playful and sharp finishes. Click animations, a placement playground and a standalone npm package.",
  file: "components/ui/sticker-pack.tsx", usage: '<Sticker name="essential-heart" finish="sharp" size={160} motion="bounce" interactive />',
  keyboard: "Interactive stickers animate on click, Enter or Space. Static stickers use image semantics without a focus stop. Reduced motion disables movement. Wrap static artwork in your own button or link for other actions.",
  notes: ["Browse 70 designs, edit their appearance and arrange them at /stickers. All artwork is original and MIT licensed.", "Install orangeui-stickers@0.1.0 from npm and import orangeui-stickers/styles.css. The versioned tarball is also available from the gallery.", "Use Sticker with a typed name or one of 70 named exports. SVGs contain no fonts, external images or scripts. Playground exports include React, standalone HTML and JSON."],
  props: [
    { name: "name", type: "StickerName", defaultValue: "Required", description: "One of 70 names exported in STICKERS." },
    { name: "finish", type: '"playful" | "sharp"', defaultValue: "playful", description: "The original warm colorful treatment, or sharper saturated colors, finer contours and enamel facets." },
    { name: "size", type: "number | string", defaultValue: "128", description: "Width in pixels or a CSS length. Numeric widths are bounded from 24 to 2048; parent width can constrain the preview." },
    { name: "interactive", type: "boolean", defaultValue: "false", description: "Add a keyboard-accessible button role and play the chosen motion on click, Enter or Space. Avoid nesting interactive stickers inside other controls." },
    { name: "motion", type: '"bounce" | "wiggle" | "spin" | "none"', defaultValue: "bounce", description: "Click animation; none keeps the artwork still. Reduced motion overrides all animation options." },
    { name: "duration / intensity", type: "number / number", defaultValue: "650 / 1", description: "Duration in milliseconds (200 to 2000) and motion strength (.25 to 2)." },
    { name: "animationKey", type: "number", defaultValue: "Not set", description: "Increment from your wrapping control to replay an animation on static artwork." },
    { name: "shadow / rotate", type: "boolean / number", defaultValue: "true / 0", description: "Optional soft offset shadow and rotation from -180 to 180 degrees." },
    { name: "hoverPeel", type: "boolean", defaultValue: "false", description: "Legacy option now provides a gentle full-sticker hover lift. The previous clipping/fold animation was removed." },
    { name: "label / decorative", type: "string / boolean", defaultValue: "Sticker title / false", description: "Accessible name or decorative static artwork hidden from assistive technology." },
    { name: "className / style", type: "string / CSSProperties", defaultValue: "Not set", description: "Customize the outer span without changing the self-contained artwork." }
  ]
};
