import type { ComponentDefinition, PropDoc } from "./components";

const motion: PropDoc = { name: "className / style", type: "string / CSSProperties", defaultValue: "Not set", description: "Compose the host layout and override the documented CSS palette variables." };
export const SCENE_COMPONENTS: ComponentDefinition[] = [
  { slug: "neon-sign-404", name: "NeonSign404", category: "Content & layout", collection: "polished", customizerPreview: true,
    description: "A vintage neon sign with hot tube cores, curled glass and occasional single-character outages.", file: "components/ui/neon-sign-404.tsx", usage: '<NeonSign404 digits="404" size="md" glow={0.8} />',
    keyboard: "The sign is decorative, with a hidden text equivalent. NeonNotFound adds a real headline, home link and report link. Reduced motion keeps all tubes lit. Timers pause offscreen and in hidden tabs. Sound starts only after a user gesture and is disabled by default.",
    props: [
      { name: "digits / size", type: "string / sm | md | lg | number", defaultValue: "404 / md", description: "Up to eight uppercase characters and total SVG width. Preset widths are 180, 260 and 340 pixels. OPEN is supported with authored tube paths." },
      { name: "color / borderColor / glow", type: "string / string / number", defaultValue: "#ff4a1c / #19e6b0 / 0.8", description: "Tube color, border color and bloom opacity from 0 to 1. CSS equivalents are --neon-color, --neon-border-color and --neon-strength." },
      { name: "flicker / flickerInterval", type: "boolean / readonly [number, number]", defaultValue: "true / [3000, 8000]", description: "Enable startup and random outages. Interval bounds are in milliseconds; only one tube can be off at a time." },
      { name: "pixelated / sound", type: "boolean / boolean", defaultValue: "false / false", description: "Chunky pixel lettering with tight stepped bloom, and optional quiet procedural electrical clicks." }, motion,
    ], notes: ["useNeonFlicker(count, { enabled, flickerInterval, startup, sound, active, element }) returns the currently unlit indices. Pass a ref as element for intersection-based pausing. NeonNotFound is also exported for the complete recovery layout. The actual site uses the ChaiBreak404 design.", "Original SVG artwork; no reference photographs ship."],
  },
  { slug: "chai-break-404", name: "ChaiBreak404", category: "Content & layout", collection: "polished", customizerPreview: true,
    description: "An Indian chai-break recovery page with poster lettering and a kettle that pours into a filling glass.", file: "components/ui/chai-break-404.tsx", usage: '<ChaiBreak404 speed={1} grain={0.035} />',
    keyboard: "Drag the kettle or focus Tilt the kettle and use the arrow keys. Release to return to the automatic pour. Hover the glass to boost steam. Home and report links have visible focus rings. Reduced motion shows a full glass; motion pauses offscreen and in hidden tabs.",
    props: [
      { name: "speed / grain", type: "number / number", defaultValue: "1 / 0.035", description: "A 12-second cycle divided by speed (0.25 to 3), and turbulence opacity (0 to 0.15)." },
      { name: "interactive / sound", type: "boolean / boolean", defaultValue: "true / false", description: "Pointer and keyboard tilt controls; optional procedural pouring sound after a gesture." },
      { name: "homeHref / reportHref", type: "string / string", defaultValue: "/ / project issue tracker", description: "Recovery link destinations. The component never submits a report automatically." }, motion,
    ], notes: ["ChaiPour is exported independently for an illustration without the recovery copy. CSS variables include --chai-cream, --chai-red, --chai-gold, --chai-gold-shadow, --chai-gold-light, --chai-teal, --chai-yellow, --chai-tea and --chai-tea-light. The locally bundled Yatra One display face is licensed under SIL OFL.", "The site 404 route renders this component. All illustrations are original inline SVG, with no raster assets."],
  },
  { slug: "pavilion-footer", name: "PavilionFooter", category: "Content & layout", collection: "polished", customizerPreview: true,
    description: "A blue ornamental pavilion footer with real navigation, a lamp switch and birds you can send across the sky.", file: "components/ui/pavilion-footer.tsx", usage: '<PavilionFooter title={"A little wonder.\\nA place to return."} />',
    keyboard: "Tab follows navigation and reaches Light the pavilion and Send the birds. Enter or Space toggles the light or launches the flight. Back to top scrolls to the beginning. Reduced motion disables flight and pointer parallax; the light switch remains usable.",
    props: [
      { name: "title / brand / linkGroups", type: "string / ReactNode / readonly PavilionFooterLinkGroup[]", defaultValue: "Library copy / oRangeUi / library links", description: "Your heading, home wordmark and titled groups of label/href links." },
      { name: "pixelated / interactive / defaultLit", type: "boolean / boolean / boolean", defaultValue: "false / true / false", description: "Stepped pavilion geometry and pixel lettering; scene interaction; initial lamp state." }, motion,
    ], notes: ["Use --pavilion-sky, --pavilion-blue, --pavilion-mid, --pavilion-detail and --pavilion-moon for custom colors. The pavilion, ornaments and bird silhouettes are original SVG geometry inspired by the supplied blue architecture reference."],
  },
];
