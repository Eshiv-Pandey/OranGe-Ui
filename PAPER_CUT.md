# Paper Cut

An original cursor-interactive paper surface inspired by the material in the supplied [Pinterest reference](https://in.pinterest.com/pin/772015561122496111/). Discover it at `/components/paper-cut`.

The reference shows blue paper-cut banners with flowing contours, depth shadows and white negative space. The component uses original mathematical paths, an ocean palette and depth-weighted sheet parallax. The reference image, its stock graphics, watermarks and copy are not included in the shipped source.

## Use

```tsx
import { PaperCut } from "./components/ui/paper-cut";

<PaperCut palette="ocean" seed={7} layers={8} interactive />
```

The detail page supplies a complete source ZIP and shadcn-compatible registry installation. Keep the included folders and font licenses together. React and local CSS are sufficient; no animation package, remote image or graphics context is required.

Palette, seed, sheet count, paper depth, cursor strength, response time and aspect ratio are configurable. `children` can overlay application content; position it for the selected crop and check contrast. Existing appearances adjust the component's corners while its artwork palette stays independent of light/dark library themes.

Pointer movement shifts individual sheets and their shadows. Leaving the artwork returns it to center. Arrow keys adjust perspective when the artwork itself is focused; Home or Escape centers it. Nested controls retain their own keyboard events. Touch interaction keeps vertical page scrolling native.

Artwork is visible in server-rendered HTML. The single demand-driven animation loop stops when the stack settles and is cleaned up on unmount. Reduced motion, `paused`, hidden tabs and offscreen surfaces show a centered still composition. Noninteractive catalogue miniatures have no keyboard stop or animation loop.

## Verification

```sh
npx vitest run tests/paper-cut.test.tsx tests/paper-cut-source.test.ts --maxWorkers=1 --fileParallelism=false
npx playwright test --config=playwright.paper-cut.config.ts
```

The browser suite expects a production preview at `http://127.0.0.1:3140`. Verification artifacts and the fetched reference remain local under ignored `out/iteration/cursor-reactive/` and `.impeccable/review/paper-cut/`.
