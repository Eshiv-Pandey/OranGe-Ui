# oRangeUi stickers

Original SVG stickers for React 18 and 19. Includes a playful collection, a sharper finish and everyday symbols, with no Next.js, Tailwind, font, network or image dependency. The runtime peer dependency is React.

## Installation

Install from npm:

```sh
npm install orangeui-stickers@0.1.1
```

You can also download the versioned package from the sticker gallery, or pack this repository and install its tarball:

```sh
cd packages/stickers
npm pack
# In your application's folder, install the resulting tarball by its path:
npm install /path/to/orangeui-stickers-0.1.1.tgz
```

Import the package stylesheet once in your application's CSS entry point. In Next.js, use your root layout; in Vite, use your main entry point.

```tsx
import { Sticker, OrbitSnailSticker } from "orangeui-stickers";
import "orangeui-stickers/styles.css";

export function Favorites() {
  return (
    <div>
      <Sticker name="orbit-snail" finish="sharp" size={128} interactive motion="bounce" />
      <OrbitSnailSticker size={96} rotate={-8} />
    </div>
  );
}
```

`Sticker` is visual content by default. `interactive` enables a keyboard-accessible click action. When placing a sticker inside your own button, leave `interactive` off and use `animationKey` to replay its animation from your click handler. Avoid nesting interactive controls.

## API

| Prop | Purpose |
| --- | --- |
| `name` | A typed name from `STICKERS`. Named components omit this prop. |
| `size` | Pixel number or CSS width string. The default is 128. |
| `finish` | `playful` or `sharp`. |
| `rotate` | Rotation in degrees. |
| `interactive` | Enables click and keyboard activation. |
| `motion` | `bounce`, `wiggle`, `spin` or `none`. |
| `duration` | Animation duration in milliseconds. |
| `intensity` | Animation strength. |
| `animationKey` | Increment this number to replay a motion in an external control. |
| `hoverPeel` | Compatibility option to enable hover lift and wiggle on static artwork. |
| `shadow` | Whether to render the sticker's shadow. |
| `label` | Overrides the accessible artwork title. |
| `decorative` | Hides non-interactive artwork from assistive technology. |
| `className`, `style` | Layout and styling hooks. |

Interactive stickers rise and wiggle on hover or keyboard focus. Set the older `hoverPeel` prop on static artwork to enable the same treatment. Reduced-motion preferences and touch-only devices disable the hover animation.

Version 0.1.1 redraws the hand, pencil, moon, comet, satellite, sun, cube, flag, pinwheel, music note and ribbon designs. Both finishes share precise painted silhouettes, with black outlines and white die-cut borders that stay inside the exported SVG.

The package also exports the named sticker components, `STICKERS`, `STICKER_CATEGORIES`, `STICKER_FINISHES`, `getSticker` and `stickerSvg`.

```ts
import { STICKERS, stickerSvg } from "orangeui-stickers";

const names = STICKERS.map(sticker => sticker.name);
const svg = stickerSvg("orbit-snail", 512, "sharp");
```

SVG exports are standalone vectors. They contain no scripts, fonts or external image references. They can be embedded in HTML, rasterized to PNG, or used as a background image. React components require React; SVG files do not.

## Local build and verification

From the repository with its existing dependencies installed:

```sh
node packages/stickers/scripts/build.mjs
node packages/stickers/scripts/test-package.mjs
```

The build reads the canonical sticker component, artwork and CSS from the repository, emits ESM and CommonJS bundles with the client directive, and emits TypeScript declarations. It strips the website's base styles and ships only the component stylesheet. The package test packs and installs a tarball in an isolated React consumer, checks ESM and CommonJS rendering, and compiles TypeScript imports. Generated artifacts and test output are local.

`node packages/stickers/scripts/test-package.mjs --release` additionally copies the verified tarball into `public/downloads/` for the gallery. Users can install that download URL with `npm install`. After publication, `--registry` verifies that an isolated registry installation has the same integrity and API as this tarball.

## Publication

The package name is `orangeui-stickers`. Check the registry name and log in to the intended npm account before publishing:

```sh
npm whoami
cd packages/stickers
npm run test:package
npm publish --access public
```

Publication requires npm authentication and permission to create or update the package. `npm install orangeui-stickers` only works after a successful publication. Local tarball installation works before that step.

MIT license. Copyright 2026 Eshiv Pandey. All artwork was authored for oRangeUi.
