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

The neon playground shows one complete recovery scene. Its hanging sign uses broad orange faces, warm outlined tubes, curled glass ends, a teal edge and light spilling onto brick. Component sizing remains available through props; the playground does not show size samples. Pixel tubes and Pixel pavilion remain optional inspector controls.

ChaiBreak404 fills its page with cream, a brass kettle with Hindi lettering, block-print sleeves, bangles, marigold toran and floral borders. Its recovery copy and links remain HTML above the full-stage SVG. ChaiPour exposes an optional `fullscreen` prop; ChaiBreak404 always enables it. After the pour, 404 condenses into a soft steam cloud above the glass.

Chai `speed` scales a 12-second pour cycle; smaller values pour more slowly. `grain` controls SVG noise opacity, capped at 0.15. Colors are scoped CSS variables documented on the component pages. Sound is procedural, optional and disabled by default. Motion pauses in hidden tabs or offscreen; reduced motion shows a still full glass and steam-cloud 404.

Chai pours from above the top rim. The external stream is painted before the glass, while tea and foam remain clipped inside it. Dragging the kettle changes its angle; releasing eases the angle and fill back into the automatic sequence. No tilt slider is shown.

PavilionFooter uses a symmetric central pavilion with floral dome carving, balcony supports, ornamental columns and steps. Three smaller neighboring buildings use different softer blues. Four birds follow separate automatic paths with articulated wings, bodies, tails and intermittent glides; there is no flight control. Motion pauses in hidden tabs or offscreen. Pointer parallax eases toward the cursor and returns to center on leave, while lamps fade over 700ms. Reduced motion rests the birds and removes parallax; navigation and lighting remain usable. Back to top keeps its text and arrow aligned, scrolls to the beginning and focuses the heading.

WallSwitch uses a lazy Three.js solid model for the polished appearance, with a beveled plastic plate, recessed rocker and cast shadows. The Radix switch retains labels, focus, keyboard, controlled state and native form support. CSS supplies the fallback for unavailable WebGL or a lost context and for other appearances. Its portable bundle includes the renderer, Three.js and Three.js types. Resources and observers are released on unmount.

Neon, chai and pavilion artwork is original inline SVG and CSS. The wall switch uses original solid geometry. Reference images are not distributed. ChaiYatra is a local CSS alias for the existing SIL OFL licensed Yatra One asset at `public/fonts/desi/yatra-one.woff2`, used for chai lettering and the recovery heading. Scene colors and lettering sizes remain scoped to these components.
