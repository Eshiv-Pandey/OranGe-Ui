# Portfolio components

The four components preserve artwork and support files from Eshiv Pandey's portfolio, with the requested library refinements below. The portfolio was treated as a read-only source. The retained source map and initial file hashes are recorded in [docs/portfolio-source.json](docs/portfolio-source.json).

| Component | Live demo | Source |
| --- | --- | --- |
| PortfolioBanner | `/components/portfolio-banner` | `components/ui/portfolio-banner.tsx` |
| PortfolioFooter | `/components/portfolio-footer` | `components/ui/portfolio-footer.tsx` |
| AnimatedTruck | `/components/animated-truck` | `components/ui/animated-truck.tsx` |
| StickerSocialIcons | `/components/sticker-social-icons` | `components/ui/sticker-social-icons.tsx` |

The combined banner/footer demo is `/portfolio`. It uses Sample Studio, sample contact details and reserved example.com profile links without personal profiles or avatars, with the 26vh homepage banner, 90 marigold petals, Doto clock, animated nebula, SVG monument skyline, social cards and transparent lorry. The red footer character and its assets are removed. Its truck callback resumes paused decoration and switches between the original pixel cloud and classic cursor trail within the demo session. No portfolio storage is imported.

## Installation

Use the install command shown in each component page, or install from the registry:

```sh
npx shadcn@latest add http://localhost:3000/r/portfolio-banner
npx shadcn@latest add http://localhost:3000/r/portfolio-footer
npx shadcn@latest add http://localhost:3000/r/animated-truck
npx shadcn@latest add http://localhost:3000/r/sticker-social-icons
```

Use the site origin hosting your copy of oRangeUi if it differs. Registry installations keep files under `orangeui/`, retain component-scoped CSS, and embed font and image bytes in their consuming files. No Tailwind configuration, Next image remote pattern, root alias, or separate asset copy is needed. Permit `data:` image and font sources if your Content Security Policy restricts them.

Source ZIP installation preserves normal asset paths. Copy `components/`, `styles/`, and any `lib/` directory beside `Example.tsx`, and merge the included `public/` tree into your public directory. Keep the artwork credit and OFL font notices. The external packages are included in each ZIP's installation instructions. The extracted tree requires React 19, Three.js, react-icons, lucide-react, framer-motion and the existing radix-ui package according to which component is installed. It has no Next-specific runtime imports.

Geist and Pixelify Sans reuse the library's licensed assets. Doto, Geist Mono and Noto Sans Devanagari are self-hosted WOFF2 files. CSS variables are namespaced under `--portfolio-*`. The library's `data-theme` convention resolves the source light and `.dark` colors without replacing the global stylesheet.

## Composition

```tsx
"use client";
import { PortfolioBanner } from "./components/ui/portfolio-banner";
import { PortfolioFooter } from "./components/ui/portfolio-footer";
import {
  PORTFOLIO_BRAND, PORTFOLIO_CONTACT, PORTFOLIO_LINK_GROUPS, PORTFOLIO_SOCIALS,
} from "./components/ui/portfolio/demo-content";

export default function PortfolioExample() {
  return <div>
    <div style={{ position: "relative", height: "26vh" }}>
      <PortfolioBanner height="26vh" particleCount={90}
        onTruckClick={() => console.log("Truck clicked")} />
    </div>
    <PortfolioFooter brand={PORTFOLIO_BRAND} contact={PORTFOLIO_CONTACT}
      linkGroups={PORTFOLIO_LINK_GROUPS} profiles={PORTFOLIO_SOCIALS} />
  </div>;
}
```

The banner is absolutely positioned. Its parent must be positioned and must reserve the same height. The component default is 22vh; the exact homepage demo uses 26vh. The footer defaults to the host's width. For full bleed, set `fullBleed` and define `--portfolio-page-inset` to match the host padding. This avoids the source page's implicit `w-screen` and gutter-dependent negative margin.

Portfolio demos keep their scene dimensions inside the artwork preview and allow scrolling when needed. Their scoped workspace CSS removes inherited mobile automatic-width and maximum-height restrictions without changing the library shell elsewhere.

## Typed props

The exported `PortfolioBannerProps`, `PortfolioFooterProps`, `AnimatedTruckProps`, `StickerSocialIconsProps`, `StickerProfile`, `SocialProfile`, `PortfolioFooterLink` and `PortfolioFooterLinkGroup` provide complete TypeScript APIs. The component pages include defaults and prop descriptions.

| Component | Data and interaction | Appearance and motion |
| --- | --- | --- |
| Banner | `onTruckClick`, `truckInteractionLabel`, `timeZone`, `truckImageSrc` | `height`, `particleCount`, `showClock`, `showTruck`, `paused`, `theme` |
| Footer | required `brand`, `linkGroups`; optional `contact`, `profiles`, `brandMark`, `id`, `onTruckClick` | `truckImageSrc`, `showTruck`, `showNebula`, `fullBleed`, `paused`, `theme` |
| Truck | `onTruckClick`, `interactionLabel`, `imageSrc`, `restartOnInteract` | `width`, `height`, `duration`, `road`, `paused`, `theme` |
| Stickers | required `profiles`; `showLabels`, navigation `label` | per-profile `appearance`, `color`, `shade`, `markColor`, `rotation`; `theme` |

Each sticker profile has `name`, `href`, `Icon` and `appearance`, plus optional label, accessible name, target and hover-card data. An absent card renders an ordinary accessible link. `SocialProfile` contains `name`, `handle`, `bio`, optional `avatar`, `location`, `accent` and `stats`. Avatar URLs are configurable and use ordinary images. The supplied sample profiles have no avatars. Cards open on focus as well as hover. Mobile tiles are 44px, desktop tiles are 48px, and wrapped social rows remain centered. The footer uses container queries: two link columns by default, three at a container width of 680px, and a fourth contact column at 1240px. Below 1240px the contact block spans the whole row and centers its content and social stickers. Optional `brandMark?: ReactNode` supplies consumer artwork beside the wordmark.

The truck retains its 570:328 alpha artwork, contact shadow, separate driving and suspension transforms, and five puffs at 0, -540, -1080, -1620 and -2160ms. Its root fills the host width, and the route runs from 4% to `96% - truck width` so the artwork stays visible. The banner truck uses width `clamp(76px, 8vw, 140px)` and 18s; the skyline truck uses `clamp(76px, 15%, 180px)` and 14s, with a skyline minimum height of 64px. The native button is labeled Restart truck. Tap, click, Enter or Space restarts the drive animation by default; `restartOnInteract={false}` disables that behavior. The optional callback still runs. Hover and touch focus allow driving to continue. Explicit pause and reduced motion are respected; the library demo resumes its Pause decoration toggle through its callback.

## Rendering and motion

The original nebula shader is lazy-loaded only when visible, capped at 260,000 pixels and 24 fps, and stopped offscreen or in a hidden tab. It handles context loss and restoration, disposes Three.js resources, and retains a themed background if WebGL fails. Petals observe their container, wait for their image to decode and stop offscreen, hidden or paused. Reduced motion retains a still nebula, scattered petals and settled truck while disabling decorative transitions.

AudioOrb supports optional `tracks` and `showControls`. Its default cyan (#13f4da), blue (#1d8bff), magenta (#ef41ff) and yellow (#ffe866) crystal has stronger audio-driven pulse, ripples and gradient displacement. `sensitivity` defaults to 1.6 and accepts 0.25 to 4; the demo exposes it alongside three bright palettes. Play music and Listen connect the shader to actual playback or local microphone analysis. Listen is gesture-gated, reports denied permission, and stops media tracks on stop, hide and unmount. External `getAnalyser`, `audioLevel` and `audioActive` integrations remain available.

WavePlayer leaves the unplayed progress straight and reveals waves only to the playhead. VinylPlayer expands its cover upright to the full card on disk hover or keyboard focus, resets rotation, and keeps the expanded photo still. Touch devices use a tap toggle. Emberling's arms now match, and waving is limited to character hover/click. The visor rotates farther around its fixed side hinge. LiquidMetal uses broad flowing chrome loops with open centers and high-contrast studio reflections, based on the inspected material reference.

Light-mode footer links and contact copy use a component-scoped `--portfolio-fx-muted: #5b3e35` override for contrast over the animated card. The original token palette and artwork remain preserved. This accessibility correction does not change the global library palette.

## Validation

Verified on 4 November 2026 with the installed Next.js 16.4.3 runtime:

- `npm run typecheck`, `npm run lint`, `npm run check:copy` and `npm run build` pass. The production build generates 119 static pages.
- The latest focused correction checks pass: 52 cases across the portfolio-source, creative-source, creative-behavior and creative-webgl test files.
- The new-component download batch compiles and bundles all four exports in all five appearances: 20 standalone examples with zero TypeScript diagnostics. This is a focused batch, not a claim that the entire download suite ran.
- All 29 distinct production Chromium cases have successful results from combined full and focused runs. The latest focused run passes 18 cases on the final build: composition and standalone footer/truck layouts at 320, 390, 768 and 1440px in both themes, touch restart and continued driving, the resume callback, real orb reaction and settling, simulated microphone start/stop, and upright Vinyl hover after playback rotation. The other 11 distinct cases passed earlier full or focused runs and cover the remaining catalogue, reduced-motion, optional-card, revised-artwork, fallback and helmet checks. No horizontal overflow or page errors were observed in the successful cases.
- All four production registry and ZIP endpoints return HTTP 200 with portable support files and assets. Removed character assets are absent, and the retained truck image matches its source SHA-256 hash.
- The light-footer muted copy measures 8.7726:1 against the nominal card (#fcf3ec) and 4.8879:1 against the conservative shader-plus-veil background lower bound (RGB 192, 185, 159). The final browser run checks the actual computed link color against that bound at all four light widths; every assertion passes. The light-footer captures are refreshed from the final build.

Browser checks use emulated viewports and simulated microphone input. Physical phones, their graphics drivers and real microphone levels have not been measured. Captures and endpoint receipts remain local in `out/portfolio/`.

The latest finish reviewer requested the light-footer contrast correction and a documentation refresh. Both are implemented, and the final focused browser confirmation passes.
