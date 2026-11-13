# Morphing icons

Forty original React icons connect two useful interface states through continuous SVG geometry. They use a shared `24 × 24` grid, rounded caps and joins, and `currentColor`. The component collection is available at `/components/morphing-icons`.

The reusable icon follows application state. The catalogue preview supplies the automatic switching, hover pause and click interaction separately.

## Install and use

Use the install command shown on the component page. For a local catalogue running on port 3000:

```sh
npx shadcn@latest add "http://localhost:3000/r/morphing-icons.json?style=polished"
```

Replace the origin with the running or hosted catalogue. The existing shadcn-compatible registry installs editable source in the project-root `orangeui/` namespace, including an example at `orangeui/examples/morphing-icons.tsx`.

The page also offers a complete source ZIP through `/api/components/morphing-icons?style=polished`. Keep the included files and license notices together. Adjust relative imports to match the location of your application file.

```tsx
"use client";

import { useState } from "react";
import { HeartMorphIcon } from "./orangeui/components/ui/morphing-icons";

export function FavoriteButton() {
  const [favorite, setFavorite] = useState(false);

  return (
    <button
      type="button"
      aria-pressed={favorite}
      onClick={() => setFavorite(value => !value)}
    >
      <HeartMorphIcon active={favorite} size={24} />
      <span>Favorite</span>
    </button>
  );
}
```

The generic export is useful when the icon is chosen dynamically:

```tsx
import { MorphIcon, type MorphIconName } from "./orangeui/components/ui/morphing-icons";

const name: MorphIconName = "play-pause";

<MorphIcon name={name} active={playing} size={24} duration={260} />;
```

## Component API

`MorphIcon` accepts ordinary React SVG props, including `className`, `style`, ARIA attributes, event handlers and `ref`. Named exports accept the same props with `name` already chosen.

| Prop | Default | Behavior |
| --- | --- | --- |
| `name` | Required | Typed name from the forty-icon collection. |
| `active` | `false` | Chooses the alternate state. The containing application owns this value. |
| `size` | `24` | Equal width and height. Numbers are clamped to 12 through 1024 pixels; strings accept CSS dimensions. |
| `strokeWidth` | `2` | Line weight on the 24-unit grid, clamped to 0.75 through 3. |
| `duration` | `260` | Full-transition milliseconds, clamped to 120 through 1200. A reversal scales its duration to the remaining distance. |
| `reducedMotion` | `false` | Immediately displays the chosen state. The system reduced-motion preference also disables transitions. |
| `label` | Unset | Accessible name for an informative SVG. |
| `decorative` | Automatic | Unlabeled icons are hidden from assistive technology. Set `false` to expose an informative image with its state label. |
| `appearance` | Unset | Records the existing library appearance. The glyph still inherits its surrounding text color. |

Use `style={{ color: "..." }}` or a surrounding text color to change the icon color. The core icon needs React and its bundled geometry/motion source; it imports no Next.js runtime, site stylesheet, font or network asset.

Changing `active` interpolates matching path coordinates and opacity with a short eased transition. Reversing during a transition continues from the displayed geometry. Changing `name` starts the new icon in its requested state. The initial SVG contains the requested state before hydration.

Application semantics belong to the containing native control. Give buttons an accessible action name. A toggle such as Favorite uses a stable label with `aria-pressed`; a disclosure uses `aria-expanded`. Feedback states such as Copied or Downloaded should follow the result of the application action.

## Collection

`active={false}` displays the first state; `active={true}` displays the second. `MORPH_ICONS` exports the name, title, category and pair of state labels for each definition. `MorphIconName` and `MorphIconCategory` provide the corresponding TypeScript types.

| Name | Named export | First state / alternate state |
| --- | --- | --- |
| `menu` | `MenuMorphIcon` | Menu / Close |
| `chevron` | `ChevronMorphIcon` | Collapsed / Expanded |
| `arrow` | `ArrowMorphIcon` | Forward / Back |
| `fullscreen` | `FullscreenMorphIcon` | Windowed / Fullscreen |
| `sidebar` | `SidebarMorphIcon` | Compact sidebar / Expanded sidebar |
| `layout` | `LayoutMorphIcon` | Grid / Rows |
| `sort` | `SortMorphIcon` | Ascending / Descending |
| `filter` | `FilterMorphIcon` | All results / Filtered |
| `folder` | `FolderMorphIcon` | Closed / Open |
| `lock` | `LockMorphIcon` | Locked / Unlocked |
| `search` | `SearchMorphIcon` | Search / Close search |
| `settings` | `SettingsMorphIcon` | Default settings / Adjusted settings |
| `sun-moon` | `ThemeMorphIcon` | Light / Dark |
| `eye` | `VisibilityMorphIcon` | Visible / Hidden |
| `link` | `LinkMorphIcon` | Disconnected / Linked |
| `bookmark` | `BookmarkMorphIcon` | Unsaved / Saved |
| `pin` | `PinMorphIcon` | Unpinned / Pinned |
| `calendar` | `CalendarMorphIcon` | Calendar / Scheduled |
| `edit` | `EditMorphIcon` | Edit / Edited |
| `trash` | `TrashMorphIcon` | Closed / Open |
| `play-pause` | `PlayPauseMorphIcon` | Play / Pause |
| `volume` | `VolumeMorphIcon` | Sound on / Muted |
| `microphone` | `MicrophoneMorphIcon` | Microphone / Listening |
| `camera` | `CameraMorphIcon` | Camera / Captured |
| `record` | `RecordMorphIcon` | Record / Stop |
| `repeat` | `RepeatMorphIcon` | Repeat / Repeat one |
| `shuffle` | `ShuffleMorphIcon` | Straight / Shuffle |
| `heart` | `HeartMorphIcon` | Unselected / Selected |
| `star` | `StarMorphIcon` | Unstarred / Starred |
| `check` | `CheckMorphIcon` | Unchecked / Checked |
| `plus` | `PlusMorphIcon` | Add / Close |
| `copy` | `CopyMorphIcon` | Copy / Copied |
| `send` | `SendMorphIcon` | Send / Sent |
| `download` | `DownloadMorphIcon` | Download / Downloaded |
| `upload` | `UploadMorphIcon` | Upload / Uploaded |
| `cloud` | `CloudMorphIcon` | Cloud / Synced |
| `notification` | `NotificationMorphIcon` | Notifications on / Muted |
| `mail` | `MailMorphIcon` | Closed / Open |
| `message` | `MessageMorphIcon` | Message / Typing |
| `user` | `UserMorphIcon` | Follow / Following |

## Preview behavior

The collection groups icons into Navigation, Workspace, Media, Actions and Communication. Search matches their titles, names and state labels. An empty result offers Clear filters.

Visible previews alternate automatically in staggered groups with a resting interval between transitions. Hover pauses an icon; clicking switches its state and selects it. Leaving resumes automatic switching. Keyboard focus pauses switching, Enter or Space changes state, and blur resumes it. A touch press holds that preview for manual control; Resume releases held previews.

The shared Pause control stops automatic switching. Automatic previews also stop under reduced motion, when the collection is offscreen or when the tab is hidden. Individual offscreen tiles do not advance. Reduced motion leaves the controls available and shows chosen states immediately.

The selected preview has controls for either state, icon size, stroke and duration. Choosing a state holds that icon until Resume. Copy React uses the current values and offers selectable code if clipboard access is unavailable.

SVG downloads contain the selected still state. The animated React source is available through the registry and source ZIP.

`morphIconSvg(name, active, size, strokeWidth)` also returns that portable SVG string directly. Its defaults are `active=false`, `size=128` and `strokeWidth=2`; numeric size is clamped to 12 through 2048. The SVG includes a state label and a default dark color that can be changed when embedding the markup.

## Design and reference research

The behavioral reference was [Kobra's morphing icons](https://kobra.systems/components/morphing-icons): small monochrome icons with meaningful state changes. The owner's clarified preview behavior guided automatic switching, hover pause and click control. The forty-icon family uses independently authored geometry and matching path topology. Reference SVG paths, source code and captures are not distributed as product assets.

Consistency and accessibility research also used [Lucide's icon design principles](https://lucide.dev/contribute/icons/design-principles), [Material animated icon guidance](https://m2.material.io/design/iconography/animated-icons.html), the [WAI button pattern](https://www.w3.org/WAI/ARIA/apg/patterns/button/) and [WCAG guidance on interaction animation](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html). The implemented 260ms default is the collection's own timing choice.
