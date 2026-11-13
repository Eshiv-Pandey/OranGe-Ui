# Component polish

Completed November 6, 2026 in the UI library workspace. No commit or push was made.

## Implemented files

- `components/ui/portfolio/social-sticker-presets.ts`, `components/ui/sticker-social-icons.tsx`, and `styles/portfolio-social.module.css`: export 15 typed sticker presets with the existing irregular SVG, cutline, shading, highlights and rotations. Added Instagram, Discord, YouTube, Reddit, Dribbble, Behance, Twitch, Bluesky, Telegram and Pinterest.
- `components/library/portfolio-demos.tsx`, `styles/portfolio-demos.css`, and `lib/portfolio-components.ts`: a centered five-column desktop and three-column mobile gallery, optional profile cards, typed prop documentation and a portable installation example. Registry and ZIP downloads include the preset module and its existing react-icons dependency.
- `components/ui/retro-camera.tsx` and `styles/creative-devices.css`: visible Enable camera, Take photo and Stop camera controls below the device; separate screen, button and brand areas; a minimum flip-container height; loading feedback and zero-dimension capture guards. Stop camera releases the stream.
- `components/library/creative-demos.tsx`, `styles/creative-demos.css`, and `lib/creative-components.ts`: a larger camera demo and documented capture workflow. Decorative thumbnails omit the new capture action row.
- `styles/interaction-controls.css`: MorphInput uses one rounded outer keyboard focus indicator and removes the inner search outline and shadow.
- `styles/globals.css`, `styles/library-components.css`, and `styles/library-workspace.css`: native and Radix selects indicate keyboard focus through their existing border, with no extra outline or shadow frame. Highlighted menu options remain visible.
- `components/library/preview-card.tsx`, `components/library/catalogue.tsx`, and `styles/preview-card.css`: ordinary controls and simple content previews stay inert and static without simulated cursors or playback slots. Rich interactions and animated effects retain playback.
- `styles/library-workspace.css`: FocusCards and FilmStrip fill the library preview stage.
- `components/ui/race-start-lights.tsx`, `styles/race-widgets.css`, `components/library/motorsport-demos.tsx`, and `lib/components.ts`: a matte gantry with five paired LED columns, lens hoods and stronger red illumination. Start/reset controls stay beside the preview; interval editing moves into the inspector. The existing sequence API and completion timing are preserved.

## Reusable sticker presets

After installing StickerSocialIcons through the registry or source download:

```tsx
import { StickerSocialIcons, SOCIAL_STICKER_PRESETS } from "./components/ui/sticker-social-icons";

const profiles = SOCIAL_STICKER_PRESETS.map(preset => ({
  ...preset,
  href: `https://example.com/${preset.appearance}`,
}));

export default function Socials() {
  return <StickerSocialIcons profiles={profiles} />;
}
```

Supply your own destinations and optional hoverCard data. Per-profile color, shade, markColor, rotation, label and icon overrides remain available. No additional package was added to the library.

## Validation

- `npm run typecheck`, `npm run lint`, `npm run check:copy`, `git diff --check`, and `npm run build` passed.
- 103 affected unit and source tests passed across eight suites. Regressions cover static preview lifecycle, portable preset installation, camera crop dimensions and PNG callback, permission denial, delayed permission cleanup, paired race lenses and sequence timing.
- 11 Playwright cases passed using `playwright.component-polish.config.ts`. Layouts were verified at 320, 390, 768 and 1440px in both themes, including reduced motion, keyboard focus, optional hover-card removal and absence of page horizontal overflow.
- Touch capture produced a 640:480 PNG from a browser-generated video MediaStream. Stop camera ended every track; denied permissions retained demo capture. Physical camera hardware was not exercised.
- Race lights completed, restarted and reset through keyboard controls. Simple catalogue previews contained no synthetic cursor and remained static.
- Desktop and mobile screenshots were reviewed together, followed by the final confirmation batch. Evidence and the browser report are under `.impeccable/review/nov6-next/`.
- Bundle and source-trace checks passed against build `Mwm79-5YWv1Hs0LG8Hcc_`. Both download routes trace the required support source and public assets.

The final production preview is running at http://127.0.0.1:3134. Start command:

```powershell
npm.cmd run start -- --hostname 127.0.0.1 --port 3134
```

## Filter and catalogue focus follow-up

The reported remaining outlines came from the shared input wrapper and catalogue card focus-within rule.

- `styles/primitives.css`: inputs use one 2px orange edge fitted inside the existing frame, without an external gray ring. This also applies to portable Input installations.
- `styles/library.css`: catalogue cards show the same fitted edge for keyboard focus. The title link and live-preview group no longer add another focus frame. Mouse focus does not trigger the old full-card outline.
- `tests/component-polish.spec.ts`: added light/dark regressions for navigation filtering, focus on the title link and preview group, mobile card overflow, and keyboard navigation to Calendar.

The follow-up passed 15 primitive tests and two browser cases, including desktop and 390px card layouts in both themes. Typecheck, lint, copy, whitespace, build, bundle and source-trace checks passed. Light/dark element screenshots were reviewed. The current preview build is `XKyjbunostyEqS4UCuiK2` at http://127.0.0.1:3134. No commit or push was made.
