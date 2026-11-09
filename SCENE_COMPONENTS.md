# Neon, chai and pavilion components

The site 404 route uses `ChaiBreak404`. `NeonSign404`, `NeonNotFound`, `ChaiPour` and `PavilionFooter` are independently reusable and their docs include interactive previews and source downloads.

```tsx
import { NeonSign404 } from "./components/ui/neon-sign-404";
import { ChaiBreak404 } from "./components/ui/chai-break-404";
import { PavilionFooter } from "./components/ui/pavilion-footer";

<NeonSign404 glow={0.65} flickerInterval={[4000, 9000]} />
<NeonSign404 digits="OPEN" color="#ff65ad" borderColor="#58bcff" pixelated />
<ChaiBreak404 speed={0.8} grain={0.025} />
<PavilionFooter pixelated />
```

Neon `glow` changes bloom opacity between 0 and 1 without weakening the glass core. `flickerInterval` sets the random delay between sequences in milliseconds. `useNeonFlicker` returns unlit indices; pass an element ref for offscreen pausing.

Chai `speed` scales a 12-second pour cycle; smaller values pour more slowly. `grain` controls SVG noise opacity, capped at 0.15. Colors are scoped CSS variables documented on the component pages. Sound is procedural, optional and disabled by default. Motion respects reduced-motion settings and pauses in hidden tabs or offscreen.

All artwork is original inline SVG and CSS. Reference images are not distributed. The chai poster uses the existing locally licensed Yatra One font.
