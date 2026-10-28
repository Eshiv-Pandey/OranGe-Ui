# oRangeUi

34 reusable React components, five distinct appearances, and a little personality. oRangeUi is a React 19 and TypeScript source library with a Next.js catalogue, live examples, source downloads, and Storybook.

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

The older plans describe earlier milestones. The current catalogue has 34 components and five appearances.

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

This repository distributes source files. On a component page, choose an appearance and download its ZIP. The bundle contains an `Example.tsx`, the component's local dependencies, CSS, fonts, licenses, and setup instructions.

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

### Component inventory

| Category | Components |
| --- | --- |
| Forms and actions | Button, Input, Textarea, Select, Checkbox, RadioGroup, Switch, Slider, Toggle, ToggleGroup |
| Navigation and disclosure | Accordion, Tabs, Breadcrumb, Pagination, DropdownMenu, Command |
| Overlays and feedback | Dialog, Sheet, Popover, Tooltip, Toast, Alert, Progress, Skeleton |
| Content and layout | Badge, Avatar, AvatarGroup, AvatarEditor, Card, StatCard, Separator, Table, EmptyState |
| Play | GamerBoy |

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

## Development and checks

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
| `npm test -- --maxWorkers=1` | Unit and source-bundle tests |
| `npm run test:browser` | Playwright browser suites |
| `npm run test:viewport` | Every component in the four required viewports, five appearances, and both themes |
| `npm run test:avatar-redesign` | Custom colors, animation, reduced motion, clipboard, exports, and editor screenshots |

Before the first browser run, install Chromium with `npx playwright install chromium` and run `npm run build`. The browser configuration starts the production app on port 3107 and Storybook on port 6006. Reports and failure traces are written under `out/playwright-report` and `out/test-results`.

The viewport and avatar-redesign suites run their own production server on port 3108. Set `PLAYWRIGHT_PORT` to choose another port, or `PLAYWRIGHT_BASE_URL` to use an existing server. Their reports and screenshots live under `out/iteration/`.

Verify production builds as well as development previews: Next.js may order and combine CSS differently in production. Browser checks cover component interactions, keyboard behavior, active overlays, themes, responsive layouts, downloads, and avatar exports. See [STATUS.md](STATUS.md) for the latest measured results.

## License

MIT. Keep [LICENSE](LICENSE) with redistributed source. Bundled fonts retain their OFL notices in `public/fonts/`.
