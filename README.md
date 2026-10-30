# oRangeUi

Reusable React components, five distinct appearances, and a little personality. oRangeUi is a React 19 and TypeScript source library with a Next.js catalogue, live examples, source downloads, and Storybook.

The shared palette uses vivid orange, neutral light surfaces, and OLED black in dark mode. Illustrated StatCards and the purple GamerBoy display keep their own artwork colors.

## Run locally

Use Node.js 22 LTS and npm.

```sh
npm ci
npm run dev
```

Open `http://localhost:3000`. The main routes are:

| Route | Purpose |
| --- | --- |
| `/` | Landing page, interactive playground, and GamerBoy |
| `/components` | Searchable component catalogue |
| `/components?style=terminal` | Direct link to an appearance |
| `/components/[slug]` | Live preview, usage, source, props, and keyboard guidance |
| `/docs` | Installation, theming, and Infinite Avatar guide |
| `/api/components/[slug]?style=retro-os` | Download a component source ZIP |

## Project context

Start with this README, then read:

1. [THEMES_AVATAR_PLAN.md](THEMES_AVATAR_PLAN.md) for the five-appearance and Infinite Avatar scope.
2. [STATUS.md](STATUS.md) for measured verification results, saved evidence, and outstanding work.
3. [LIBRARY_PLAN.md](LIBRARY_PLAN.md) for the earlier component-library architecture and discovery flow.
4. [REVAMP_PLAN.md](REVAMP_PLAN.md) for the landing-page design history.

The older plans describe earlier milestones. The current catalogue spans five appearances, with new work tracked in STATUS.md.

| Location | What lives there |
| --- | --- |
| `components/ui/` | Reusable components and their typed props |
| `components/ui/appearance.ts` | Appearance values, labels, types, and URL parsing |
| `components/library/` | Catalogue, documentation, and interactive examples |
| `components/landing/` | Landing-page composition and hero scene |
| `lib/components.ts` | Component registry, API descriptions, and downloadable examples |
| `lib/source-bundle.ts` | ZIP generation with transitive local imports and styles |
| `lib/avatar/` | Deterministic avatar data, generation, normalization, and exports |
| `styles/` | Shared tokens, appearance rules, and component styles |
| `stories/` | Storybook examples |
| `tests/` | Unit, source-bundle, browser, and accessibility checks |
| `index.ts` | Public component and avatar-helper exports |

## Use a component

This repository distributes editable source files. Every component page includes a shadcn registry install command, Copy prompt, Copy code, a live preview, prop documentation and a source ZIP.

With the catalogue running locally, an example installation is:

```sh
npx shadcn@latest add "http://localhost:3000/r/button.json?style=terminal"
```

Use the origin of your hosted catalogue when it is deployed. The command on each component page includes the current origin and chosen appearance. Registry files stay together in a project-root `orangeui/` folder, with examples in `orangeui/examples/`. Import `./orangeui/components/ui/button` from a file at your project root, or adjust the relative path from `src/`. Existing shadcn component aliases and your root license are preserved. Registry fonts are embedded in CSS; permit `data:` fonts in your Content Security Policy or extract them and update the font URLs.

The ZIP contains an `Example.tsx`, the component's local dependencies, CSS, fonts, licenses, and setup instructions.

Copy the included folders into a React 19 project and install the dependencies listed in that bundle. Merge `public/fonts/` into your app's public assets. Component CSS imports are included; the downloaded components do not require Tailwind.

Examples below use this repository's `@/` alias, which points to the project root. Adjust imports to match your copied source layout.

```tsx
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Appearance } from "@/components/ui/appearance";

const appearance: Appearance = "neobrutalism";

export function WorkspaceFields() {
  return (
    <div>
      <Input appearance={appearance} label="Workspace name" placeholder="Orange studio" />
      <Button appearance={appearance}>Create workspace</Button>
    </div>
  );
}
```

Every component accepts `appearance` and `className`. Pass the selected appearance to nested controls as well.

### Five appearances

| Value | Label | Styling |
| --- | --- | --- |
| `polished` | Polished | Soft corners, quiet borders, smooth depth |
| `pixel` | Pixelated | Pixel type, square controls, stepped details |
| `neobrutalism` | Neobrutalism | Heavy outlines, offset shadows, bold selections |
| `retro-os` | Retro OS | Beveled controls, inset fields, desktop window details |
| `terminal` | Terminal | Monospace type, square geometry, precise orange accents |

The default is `polished`. `APPEARANCE_VALUES` and `APPEARANCES` expose the shared registry. `isAppearance` validates unknown values; `parseAppearance` falls back to `polished` for unsupported or missing values.

Appearance and color theme are independent. Set `data-theme="dark"` or `data-theme="light"` on the HTML element so portalled menus, tooltips, and dialogs receive the same palette. Without an explicit theme, the tokens follow the system preference.

Customize colors in `styles/tokens.css`. Shared appearance rules load through `styles/library-base.css`, including in source downloads. Font URLs resolve from `/fonts/`; adjust them when deploying under a base path.

The docs header provides custom accent colors, readable palette tokens and Copy theme. Accent preferences persist locally across routes. Use Ctrl+K or Command+K to search and open a component.

### Component inventory

| Category | Components |
| --- | --- |
| Forms and actions | Button, Input, Textarea, Label, Select, Checkbox, RadioGroup, Switch, Slider, Toggle, ToggleGroup, Form, Combobox, Calendar, DatePicker, InputOTP, FileUpload, Rating, Stepper |
| Navigation and disclosure | Accordion, Tabs, Breadcrumb, Pagination, DropdownMenu, Command, NavigationMenu, Navbar, Sidebar, ContextMenu |
| Overlays and feedback | Dialog, Sheet, Popover, Tooltip, Toast, Alert, Progress, Skeleton, HoverCard |
| Content and layout | Badge, Avatar, AvatarGroup, AvatarEditor, Card, StatCard, Separator, Table, EmptyState, Kbd, ScrollArea, Carousel, CodeBlock |
| Play | MascotAvatar, CharacterAvatar, Helmet, MiniDriver, GamerBoy, OpenWheelCar, Superbike, RaceStartLights, RaceProgress, LiveryEditor, HelmetEditor |
| AI and chat | ChatMessage, PromptInput, ToolCallCard, AgentStatus, ThinkingIndicator, ModelPicker, Markdown, LiveOrb |

There are 84 public catalogue components. Table already provides sorting and pagination. Form uses Zod validation; FileUpload selects local files and leaves uploading to the consuming app. AI components expose application-owned callbacks. The chat demo streams a fixed local response and makes no model request. Markdown supports GFM with safe URL handling and raw HTML omitted.

### Creative components

Batch 2 adds SeasonTree, RetroPlayer, RetroCamera, SwingKeychain, CustomStamp, TiltStamp3D, IslandPlayer, GlassPlayer, NeonPillPlayer, AnimeFire, GrainGradient, HindiText, HinglishText and FrostedGlass. SeasonTree belongs to Pixelated, the two pocket devices to Retro OS, and the remaining creative pieces to Polished. The 70 core components retain all five appearances.

All four players share real playback, seeking and audio state through useAudioPlayer. Original Orange sessions recordings are dedicated to CC0 1.0, with complete notices in public/audio/orangeui/. Source ZIPs include their public assets; registry examples embed sample audio for portability. Camera access and every sound require a user gesture. Decorative animation observes visibility and reduced motion.

HindiText and HinglishText share the StyledText generator. Yatra One and Baloo 2 use SIL OFL 1.1, with font files and credits in public/fonts/desi/. Override --font-hindi-display and --font-hinglish-display to swap licensed fonts without changing the API. Users own the text they create. Roman-to-Hindi transliteration runs locally. Stamp and lettering editors export standalone SVG or PNG.

The supplied references guided layout and materials. Shipped illustrations, decals, shader code and audio are original; reference artwork, characters, lettering and brand marks are excluded. See BATCH_2_PLAN.md and the component pages for APIs, keyboard guidance and license details.

LiveOrb is by jay sharma (@radiumcoders), distributed under MIT. Its shader and interaction engine are retained, with the supplied warning-string repairs and local stylesheet/appearance integration. Full attribution travels with the component; see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Infinite Avatar

Infinite Avatar generates SVG identities locally from a stable seed. It combines 64 curated gradient palettes, 36 original glyphs, patterns, lighting, and depth. Generation is deterministic and does not upload images, make network requests, or use ambient randomness.

### Seed or saved config

```tsx
import { Avatar } from "@/components/ui/avatar";

export function Profile() {
  return (
    <Avatar
      seed="user-42"
      name="Maya Patel"
      size="lg"
      shape="squircle"
      appearance="polished"
      status="online"
    />
  );
}
```

`config` takes priority over `seed`. If neither is provided, the component uses `name`, then a stable guest seed. Supply `name` or `aria-label` for an accessible identity; an optional presence status is included in the default accessible name.

Named sizes are `xs` (24px), `sm` (32px), `md` (48px), `lg` (72px), and `xl` (112px). Numeric pixel sizes are supported. Shapes are `squircle`, `circle`, `rounded`, and `square`; Pixelated appearance uses a stepped outline.

### Groups

```tsx
import { AvatarGroup } from "@/components/ui/avatar-group";

export function Team() {
  return (
    <AvatarGroup
      avatars={[
        { seed: "user-42", name: "Maya Patel" },
        { seed: "user-17", name: "Alex Chen" },
        { seed: "user-09", name: "Ravi Shah" },
        { seed: "user-63", name: "Sam Green" },
      ]}
      max={3}
      size="md"
      label="Design team"
      appearance="terminal"
    />
  );
}
```

Group members may be seed strings or Avatar props. `max` limits visible members and adds an accessible overflow count. The group's `size` and `appearance` apply to every member.

### Controlled editor and JSON persistence

The editor emits complete `AvatarConfig` objects. Your application owns the state and decides when and where to save it.

The live preview stays beside the controls on desktop. Palette and glyph lists expand in the page, and the editor includes custom color pickers, Randomize, Reset, Copy config, and SVG/PNG export. The in-context row renders the same identity at 16, 32, 64, and 128 px.

The Animate toggle smoothly shifts the gradient and glyph together. Reduced motion disables it. Animation is a display preference, so it is not added to saved identity data. Exports always use the settled frame.

The Characters tab offers eight original animated SVG companions with `idle`, `thinking`, `talking`, and `error` states. Optional `characterValue` and `onCharacterChange` props control that identity independently; the existing glyph `value` and `onChange` API is unchanged. Both tabs support copy and export.

```tsx
import { MascotAvatar } from "@/components/ui/mascot-avatar";

<MascotAvatar seed="studio-helper" state="thinking" size={128} />
```

Mascot eyes follow the pointer, blink, and glance around after three seconds of inactivity. Their motion pauses off screen and in hidden tabs; reduced motion holds a settled pose. Interactive mascots are native buttons with matching hover, focus, and click reactions. Set `interactive={false}` for a named image with no extra tab stop.

For server-side character config or SVG generation, import `generateMascotConfig`, `normalizeMascotConfig`, and `mascotToSvgString` from the pure `components/ui/mascot-art` module. Saved configs contain identity data, separate from expression and animation clocks.

```tsx
"use client";

import { useState } from "react";
import { AvatarEditor } from "@/components/ui/avatar-editor";
import { generateAvatarConfig } from "@/lib/avatar";

export function ProfileAvatarEditor() {
  const seed = "user-42";
  const [config, setConfig] = useState(() => generateAvatarConfig(seed));

  return (
    <AvatarEditor
      seed={seed}
      value={config}
      onChange={setConfig}
      appearance="retro-os"
    />
  );
}
```

The editor provides palette, glyph, angle, pattern, and shape controls, plus shuffle and reset. Reset returns to the config generated from its `seed`. It does not persist data itself.

Store the versioned JSON config to preserve an edited avatar:

```ts
import { generateAvatarConfig, normalizeAvatarConfig } from "@/lib/avatar";

const config = generateAvatarConfig("user-42");
const savedJson = JSON.stringify(config);

// Read JSON from your database, storage, or API.
const parsed: unknown = JSON.parse(savedJson);
const restored = normalizeAvatarConfig(parsed);
```

Render the result with `<Avatar config={restored} name="Maya Patel" />`. Handle malformed JSON at the storage boundary. `normalizeAvatarConfig` validates supported fields, bounds numeric values, ignores unknown fields, and recalculates glyph tone for the selected palette. Unsupported versions fall back to the guest config.

An optional `customColors` tuple overrides the palette with two or three opaque hex stops. Existing version-1 configs remain supported:

```tsx
const custom = normalizeAvatarConfig({
  ...generateAvatarConfig("studio"),
  customColors: ["#6236e8", "#df97fa"],
});

<Avatar config={custom} size={128} animate />
```

Normalization accepts `#RGB` and `#RRGGBB`, copies and canonicalizes valid colors, and rejects the entire override when a stop is invalid. Clear `customColors` to return to the saved palette. Every glyph includes a separately drawn pixel-grid version for the Pixelated appearance.

The current config is version 1 and contains `palette`, `glyph`, `angle`, `pattern`, `shape`, `glyphTone`, `depth`, `glyphScale`, and `highlight`. Palette order and glyph IDs are persistence contracts. Keep them stable when extending the library.

### Server rendering and exports

`Avatar` renders inline SVG from a synchronous React Server Component. Its SVG definition IDs are unique per component instance. `AvatarEditor` uses client state. Keep the same seed or normalized config on the server and client for stable visuals.

SVG export helpers run on the server or in the browser:

```ts
import { generateAvatarConfig, avatarToSvgString, avatarToDataUrl } from "@/lib/avatar";

const config = generateAvatarConfig("user-42");
const svg = avatarToSvgString(config, 256, { appearance: "terminal" });
const dataUrl = avatarToDataUrl(config, 256, { appearance: "terminal" });
```

`avatarToSvgString` returns standalone SVG markup. `avatarToDataUrl` returns an encoded SVG data URL. Both accept render options for `appearance`, `shape`, and `id`. Pass a distinct `id` when manually inserting multiple exported SVG strings into the same document.

PNG export is a separate browser helper and returns a `Promise<Blob>`:

```ts
import { avatarToPng } from "@/lib/avatar/png";
import type { AvatarConfig } from "@/lib/avatar";

export async function downloadAvatar(config: AvatarConfig) {
  const blob = await avatarToPng(config, 256, { appearance: "polished" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "avatar.png";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
```

Call PNG export from a browser interaction. Use the returned Blob directly for an upload, or create and later revoke an object URL for a local download.

## Cursor-following artwork

`CharacterAvatar`, `Helmet`, and `MiniDriver` are original, layered SVG illustrations. Each supports `seed`, `size`, `config`, `colors`, `parts`, `interactive`, `blink`, `appearance`, and `className`. A saved config takes precedence over the seed; explicit part and color overrides take precedence over the config. Their documentation pages include a live customizer with randomize, reset, copy config, and SVG/PNG export.

```tsx
import { CharacterAvatar } from "@/components/ui/character-avatar";
import { Helmet } from "@/components/ui/helmet";
import { MiniDriver } from "@/components/ui/mini-driver";

<CharacterAvatar seed="studio-portrait" parts={{ glasses: "round" }} />
<Helmet seed="lagoon-helmet" pattern="chevron" finish="chrome" number="247" />
<MiniDriver seed="little-pit-crew" helmet={{ number: "318" }} />
```

The shared `usePointerGaze` hook eases normalized pointer coordinates, starts seeded idle glances after three seconds, and manages blinking. It pauses when off screen or the tab is hidden and settles with reduced motion. Helmet uses a native button to flip its visor, with optional `visorOpen` and `onVisorOpenChange` control. MiniDriver uses one gaze host for its full body and helmet; keyboard or pointer activation triggers a wave. Noninteractive helmets and drivers are named images.

Pure config and SVG helpers live in `components/ui/character-art`, `helmet-art`, and `mini-driver-art`. Use `characterToSvgString`, `helmetToSvgString`, or `miniDriverToSvgString` on the server for settled portable artwork. Pass the result to `svgToPng` from `components/ui/svg-export` in a browser when PNG is needed. `size` is the square width for the portrait and helmet, and the full height for the 3:4 driver. Theme parts with `--character-*`, `--helmet-*`, and `--driver-*` color variables; pass explicit config colors when exporting those changes.

The reusable controlled `ArtworkCustomizer` provides a sticky preview, accessible tabs, normalized updates, clipboard fallback, and settled SVG/PNG downloads. Its `CustomizerColor`, `CustomizerRange`, `CustomizerSelect`, and `CustomizerToggle` fields use native inputs.

## Motorsport components

`OpenWheelCar` and `Superbike` use original side-view SVG artwork and a shared visibility-aware animation loop. Their `speed` prop is a normalized target from 0 to 1. Acceleration and braking drive a damped suspension model, pitch, proportional wheel travel, high-speed blur, parallax track motion, ground shadow and exhaust shimmer. Car wings flex independently. The bike adds fork compression, rear squat, rider tuck with fixed grips, normalized `lean` from -1 to 1, and an optional `wheelie` on launch from rest.

```tsx
import { OpenWheelCar } from "@/components/ui/open-wheel-car";
import { Superbike } from "@/components/ui/superbike";

<OpenWheelCar speed={0.7} number="247" livery={{ base: "#247b83", pattern: "sweep" }} />
<Superbike speed={0.5} lean={0.3} wheelie tireCompound="medium" />
```

Both vehicles accept a saved `VehicleConfig` from `generateVehicleConfig(seed)`, partial `livery` overrides (`base`, `accent`, `stripe`, `pattern`), a fictional `number`, `tireCompound`, `size`, `track`, and optional `theme`. Patterns are `solid`, `sweep`, `split`, and `chevron`; compounds are `soft`, `medium`, `hard`, and `wet`. Width defaults to 640px and preserves the 640:260 ratio. Set `track={false}` for a transparent cutout. Without an explicit `theme`, scene colors follow the page and system preference.

`LiveryEditor` controls `value: VehicleConfig` and `onChange`. Omit its `vehicle` prop to offer both vehicles, or set `car` or `bike` to fix the preview. Motion and scene choices are local preferences, separate from saved livery. `HelmetEditor` similarly controls `HelmetConfig`, including visor clicks. Both editors randomize, reset from `seed`, copy normalized JSON, and export settled SVG/PNG. Vehicle exports are 640x260; helmet exports are 512x512. Pure `openWheelCarToSvgString` and `superbikeToSvgString` helpers work on the server and accept explicit `appearance`, `theme`, and `track` options.

Motion freezes off screen and in hidden tabs, resumes without catching up hidden time, and settles under reduced motion. No animation library is required. The pure `vehicle-motion` module exposes the travel and suspension model separately from the `useVehicleMotion` React adapter.

`RaceStartLights` lights five lamps in sequence, then extinguishes them together. Set `running`, use `sequenceKey` to replay, choose `intervalMs`, and handle its once-per-sequence `onComplete`. Hidden and offscreen time is excluded. Reduced motion retains the discrete countdown and completion. `RaceProgress` provides a named determinate progressbar with `label`, `value`, `max`, a `car` or `bike` silhouette, optional colors, and a `renderVehicle` slot.

## Development and checks

On machines with limited memory, use `npm run test:serial`. It runs one Vitest worker at a time and avoids shell-specific argument forwarding through `npm test`.

| Command | Purpose |
| --- | --- |
| `npm run dev` | Next.js development server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run storybook` | Storybook on port 6006 |
| `npm run build-storybook` | Static Storybook in `out/storybook` |
| `npm run lint` | ESLint |
| `npm run typecheck` | Strict TypeScript check |
| `npm run check:copy` | Project copy checks |
| `npm run check:bundle -- --build-id <build-id>` | Minified/gzip bundle sizes and Button dependency isolation |
| `npm run check:traces -- --build-id <build-id>` | Public source allowlist and required assets in production route traces |
| `npm run test:serial` | Unit and source-bundle tests with one worker |
| `npm run test:browser` | Playwright browser suites |
| `npm run test:viewport` | Every component in the four required viewports, five appearances, and both themes |
| `npm run test:avatar-redesign` | Custom colors, animation, reduced motion, clipboard, exports, and editor screenshots |
| `npm run test:mascot` | Characters, chat states, gaze lifecycle, keyboard behavior, and portable exports |
| `npm run test:artwork-customizers` | Character, helmet, and driver customizers, viewport captures, keyboard controls, motion, and decoded SVG/PNG exports |
| `npm run test:motorsport` | Motorsport layouts, editors, portable exports, live vehicle physics, race lights, and progress controls |
| `npm run test:launch` | Launch viewports, accessibility, forms, navigation, AI components, theme tools, copying, LiveOrb and SEO |

Run the bundle and trace checks after `npm run build` finishes, with no build running. Replace `<build-id>` with the value in `.next/BUILD_ID` and keep that build unchanged during verification. Reports are written under `out/iteration/`. Standalone bundle sizes exclude host React and React DOM; Next.js totals include every emitted chunk, rather than one route's initial transfer.

In Windows PowerShell, invoke commands that forward flags through `npm.cmd`, for example `npm.cmd run check:traces -- --build-id <build-id>`.

Before the first browser run, install Chromium with `npx playwright install chromium` and run `npm run build`. The browser configuration starts the production app on port 3107 and Storybook on port 6006. Reports and failure traces are written under `out/playwright-report` and `out/test-results`.

The viewport and avatar-redesign suites run their own production server on port 3108. Set `PLAYWRIGHT_PORT` to choose another port, or `PLAYWRIGHT_BASE_URL` to use an existing server. Their reports and screenshots live under `out/iteration/`.

The launch suite also uses port 3108 with one worker. Keep the production build unchanged while a browser suite is running. Set `NEXT_PUBLIC_SITE_URL` to your deployed catalogue origin for canonical metadata and the sitemap; deployments on Vercel can use its production-domain fallback.

Verify production builds as well as development previews: Next.js may order and combine CSS differently in production. Browser checks cover component interactions, keyboard behavior, active overlays, themes, responsive layouts, downloads, and avatar exports. See [STATUS.md](STATUS.md) for the latest measured results.

## License

MIT. Keep [LICENSE](LICENSE) with redistributed source. Bundled fonts retain their OFL notices in `public/fonts/`.
