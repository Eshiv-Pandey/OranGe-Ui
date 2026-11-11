# Footer blocks

The Footer collection contains seven layouts at `/blocks/category/footer`. The five reference-led additions appear first; the existing SiteFooter closes the list.

| Export | Reference and composition | Detail page |
| --- | --- | --- |
| BlueHourFooter | [Reference 1](https://in.pinterest.com/pin/1079104760742428689/): blue, cream serif navigation, newsletter and original engraved landscape. | `/blocks/blue-hour-footer` |
| StudioFooter | [Reference 2](https://in.pinterest.com/pin/1152006779747756161/): blue contact board, oversized Pacifico wordmark and original sticker ornaments. | `/blocks/studio-footer` |
| ColonyFooter | Supplied purple/white reference: tilted purple ground, compact navigation and original ink characters. | `/blocks/colony-footer` |
| HillsideFooter | Supplied village reference: cream sky, olive grove, colorful hillside and a quiet serif masthead. | `/blocks/hillside-footer` |
| SkylineFooter | [Eshiv's portfolio](https://eshiv.in): the existing portfolio skyline, ambient sky and interactive truck. | `/blocks/skyline-footer` |
| PavilionFooter | Existing interactive pavilion composition. | `/blocks/pavilion-footer` |
| SiteFooter | Existing simple navigation footer, shown last. | `/blocks/site-footer` |

All third-party-inspired artwork, brands and copy are original. The portfolio remains a read-only source; SkylineFooter composes the existing PortfolioFooter extraction. This implementation makes no legal guarantee about visual similarity.

## Use and customize

Open an example's documentation for its typed props, usage and registry command. Preview/Code, Full/Tablet/Phone, palette and Reset controls remain available in the collection. Changing views, width or palette preserves interaction state.

```tsx
"use client";
import { BlueHourFooter } from "./components/ui/blocks/landscape-footers";

export default function Example() {
  return <BlueHourFooter brand="Your studio" email="hello@example.com"
    homeHref="/" onSubscribe={async (email) => { /* Connect your mailing service. */ }} />;
}
```

BlueHourFooter validates email, prevents duplicate pending submissions and offers recoverable callback feedback. Submission is disabled without `onSubscribe`. The library demo never subscribes an address. Replace navigation destinations, contact details and legal copy before production use.

LandscapeFooterProps accepts `brand`, `homeHref`, `groups`, `email`, `description`, `copyright`, `artworkSrc`, `theme`, `className` and `id`. BlueHourFooter also accepts `onSubscribe` and `successMessage`. StudioFooter adds office/directions and careers/contact actions. ColonyFooter adds contact/support actions. SkylineFooter accepts the existing PortfolioFooter props, with optional default brand and link groups. See `lib/footer-blocks.ts` and the source exports for the complete signatures.

## Assets

ZIPs include public assets and their notices. Registry transport embeds local artwork and fonts as data URLs. Preserve `public/art/footer/NOTICE.md`, the project MIT license and the bundled SIL Open Font License notices. The artwork is reproducible through `tools/generate-footer-landscapes.py` and `tools/generate-footer-playful-art.py`; it does not use reference image pixels. Cormorant Garamond and Pacifico are self-hosted under `public/fonts/footer/`. SkylineFooter retains the existing portfolio artwork notice.

The neutral Blocks shell keeps the existing type and controls. Reference-specific footer fonts and palettes are intentional example materials, not a change to the global design system.

## Verification

Final production build: `GgoJ8O1loDIOkb-3g0EBV`. TypeScript, scoped lint and copy checks passed. Seven focused source/behavior checks passed, including compilation of all 42 standalone block examples. Four footer browser tests passed: all five new layouts at 1440px and 390px in both palettes, no horizontal overflow or page errors, zero WCAG2A/AA Axe findings in those 20 renders, embedded phone/tablet widths, portable endpoints and newsletter failure/recovery. Three affected Auth browsing/state/manual-copy checks also passed. These checks cover the tested demonstration data, not every consumer configuration or physical device.

Independent review found one missing base typography dependency in the two playful exports. The import is fixed. Both downloaded ZIPs were rendered in a plain Vite app with a monospace host body; they loaded the bundled Geist font and all artwork. The reviewer scored the correction resolved and returned ship. Review and verification receipts remain local under `out/iteration/footer-expansion/`.

Preview: `http://127.0.0.1:3140/blocks/category/footer`.

```powershell
node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3140
```

For a memory-constrained build, set `$env:ORANGEUI_BUILD_WORKERS = '2'` before `npm run build`.
