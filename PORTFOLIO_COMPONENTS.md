# Portfolio components

The four components use the live files on disk from Eshiv Pandey's portfolio. The portfolio was treated as a read-only source. The source map and initial file hashes are recorded in [docs/portfolio-source.json](docs/portfolio-source.json).

| Component | Live demo | Source |
| --- | --- | --- |
| PortfolioBanner | `/components/portfolio-banner` | `components/ui/portfolio-banner.tsx` |
| PortfolioFooter | `/components/portfolio-footer` | `components/ui/portfolio-footer.tsx` |
| AnimatedTruck | `/components/animated-truck` | `components/ui/animated-truck.tsx` |
| StickerSocialIcons | `/components/sticker-social-icons` | `components/ui/sticker-social-icons.tsx` |

The combined banner/footer demo is `/portfolio`. It uses the original profile content, 26vh homepage banner, 90 marigold petals, Doto clock, animated nebula, SVG monument skyline, social cards and transparent lorry. Its truck callback switches between the original pixel cloud and classic cursor trail within the demo session. No portfolio storage is imported.

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

## Typed props

The exported `PortfolioBannerProps`, `PortfolioFooterProps`, `AnimatedTruckProps`, `StickerSocialIconsProps`, `StickerProfile`, `SocialProfile`, `PortfolioFooterLink` and `PortfolioFooterLinkGroup` provide complete TypeScript APIs. The component pages include defaults and prop descriptions.

| Component | Data and interaction | Appearance and motion |
| --- | --- | --- |
| Banner | `onTruckClick`, `truckInteractionLabel`, `timeZone`, `truckImageSrc` | `height`, `particleCount`, `showClock`, `showTruck`, `paused`, `theme` |
| Footer | required `brand`, `linkGroups`; optional `contact`, `profiles`, `id`, `onTruckClick` | `faviconSrc`, `truckImageSrc`, `showTruck`, `showNebula`, `fullBleed`, `paused`, `theme` |
| Truck | `onTruckClick`, `interactionLabel`, `imageSrc` | `width`, `height`, `duration`, `road`, `paused`, `theme` |
| Stickers | required `profiles`; `showLabels`, navigation `label` | per-profile `appearance`, `color`, `shade`, `markColor`, `rotation`; `theme` |

Each sticker profile has `name`, `href`, `Icon` and `appearance`, plus optional label, accessible name, target and hover-card data. An absent card renders an ordinary accessible link. `SocialProfile` contains `name`, `handle`, `bio`, optional `avatar`, `location`, `accent` and `stats`. Avatar URLs are configurable and use ordinary images. Cards open on focus as well as hover. Mobile tiles are 44px, desktop tiles are 48px, and wrapped social rows remain centered. The footer Connect With Me block spans both columns on phones.

The truck retains its 570:328 alpha artwork, contact shadow, separate driving and suspension transforms, and five puffs at 0, -540, -1080, -1620 and -2160ms. The banner truck uses width `clamp(76px, 8vw, 140px)` and 18s; the skyline truck uses 15% and 14s. Focus parks an interactive truck inside the visible band.

## Rendering and motion

The original nebula shader is lazy-loaded only when visible, capped at 260,000 pixels and 24 fps, and stopped offscreen or in a hidden tab. It handles context loss and restoration, disposes Three.js resources, and retains a themed background if WebGL fails. Petals observe their container, wait for their image to decode and stop offscreen, hidden or paused. Reduced motion retains a still nebula, scattered petals, settled truck and visible favicon while disabling decorative transitions.

The existing AudioOrb now supports optional `tracks` and `showControls`. Its Play music and Listen controls connect the crystal shader to actual playback or local microphone analysis. Listen is gesture-gated, reports denied permission, and stops media tracks on stop, hide and unmount. External `getAnalyser`, `audioLevel` and `audioActive` integrations remain available.

WavePlayer leaves the unplayed progress straight and reveals waves only to the playhead. VinylPlayer expands its cover to the full card on disk hover or keyboard focus, with a tap toggle on touch devices. Emberling's arms now match, and waving is limited to character hover/click. The visor rotates farther around its fixed side hinge. LiquidMetal now uses broad flowing chrome loops with open centers and high-contrast studio reflections, based on the inspected material reference.

## Validation

Verified on 4 November 2026 with the installed Next.js 16.4.3 runtime:

- `npm run typecheck`, `npm run lint`, `npm run check:copy` and `npm run build` pass. The production build generates 119 static pages.
- The focused component, shader, helmet, source-import, portfolio and registry checks pass: 78 cases across seven test files, using combined focused runs. The visor export expectation now matches the 68-degree hinge opening.
- The new-component download batch compiles and bundles all four exports in all five appearances: 20 standalone examples with zero TypeScript diagnostics. This is a focused batch, not a claim that the entire download suite ran.
- All 20 cases in `npm run test:portfolio` are covered by passing full and focused production Chromium runs. The composition and six revised components fit 320, 390, 768 and 1440px in light and dark themes. Checks cover keyboard focus, profile cards, missing optional cards, truck callbacks, reduced motion, real playback timing, simulated microphone start/stop, vinyl expansion, Wave seeking, the raised Emberling hand, visor toggling, complete portable visor framing and unavailable WebGL. No horizontal overflow or page errors were observed.
- All four production registry and ZIP endpoints return HTTP 200 with portable support files and assets. The two image copies match their source SHA-256 hashes.

Browser checks use emulated viewports and simulated microphone input. Physical phones, their graphics drivers and real microphone levels have not been measured. Captures and endpoint receipts remain local in `out/portfolio/`.

The independent finish reviewer scored all three material corrections resolved: the visible waving hand, complete raised-visor export and current design documentation. The scoped verdict is ship.
