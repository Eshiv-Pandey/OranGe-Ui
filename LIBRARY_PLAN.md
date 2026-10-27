# Component library expansion

Goal: at least 30 distinct, reusable components, with polished and pixelated appearances for every component, a complete discovery/documentation flow, the purple handheld available as GamerBoy, and end-to-end verification. Variants do not count as separate components.

## Reference review, 26 October 2026

- [shadcn/ui catalogue](https://ui.shadcn.com/docs/components): persistent component navigation and an index for discovery.
- [shadcn/ui Button](https://ui.shadcn.com/docs/components/base/button): preview followed by installation, usage, examples, API properties, and previous/next navigation.
- [Vengeance UI catalogue](https://www.vengenceui.com/components): categorized discovery, documentation search, short component descriptions, and direct paths to live demos and source.
- [Vengeance UI setup](https://www.vengenceui.com/docs/install-nextjs): setup documentation stays in the same navigation shell as the component pages.

Apply the navigation and information hierarchy, keeping oRangeUi's orange, ivory, purple, and pixel identity. Implement original styling rather than copying either site's components.

## Deliverables

- `/components`: searchable, categorized catalogue with honest counts and real preview tiles.
- `/components?style=pixel`: Pixelated category; each component also supports `appearance="pixel"` independently.
- `/components/[slug]`: usable preview, appearance/theme controls, usage/source copy, source download including dependencies and styles, API documentation, keyboard guidance, and previous/next navigation.
- `/docs`: installation and theming documentation with working links.
- Responsive sidebar/mobile navigation and keyboard-accessible search. Style selection persists across component navigation and can be linked directly.
- Landing navigation and featured cards lead to actual component pages; existing illustrations and working hero remain intact.

## Component inventory (32 distinct components)

Forms and actions: Button, Input, Textarea, Select, Checkbox, RadioGroup, Switch, Slider, Toggle, ToggleGroup.

Navigation and disclosure: Accordion, Tabs, Breadcrumb, Pagination, DropdownMenu, Command.

Overlays and feedback: Dialog, Sheet, Popover, Tooltip, Toast, Alert, Progress, Skeleton.

Content and layout: Badge, Avatar, Card, StatCard, Separator, Table, EmptyState.

Play: GamerBoy (the purple-screen handheld with the four-star game).

Use accessible headless primitives for complex focus/keyboard behaviors. Each component has a typed API, both appearances, a realistic demo, documentation, and meaningful behavior verification. Preserve native input behavior and support controlled/uncontrolled state where relevant.

## Completion audit

- Inventory contains at least 30 real exports and corresponding reachable detail pages; no count inflation from utilities or colour variants.
- Every component renders and works in both appearances and both themes. Pixel styling includes geometry, borders, shadows, and relevant motion, not only a font change.
- Source downloads include the component's transitive local dependencies and styles; imports resolve in the distributed layout.
- Keyboard, validation, selection, overlays, focus restoration, disabled states, notifications, pagination/sorting, and the full GamerBoy lifecycle are tested.
- All detail routes, catalogue search/filter/navigation, source/usage copy, download, direct URLs, and mobile navigation are verified in a real browser.
- Visual review at desktop and 360/390px mobile, plus tablet; no overflow or obstructed controls. Axe checks include both styles/themes and active interactive states.
- Lint, typecheck, unit tests, copy check, production build, Storybook build, registry/download integrity, and browser checks pass. Save current screenshots/reports and update STATUS.md with exact outcomes.

Status: complete and verified, 27 October 2026. All 32 components, discovery/documentation flows, both appearances/themes, source bundles, and interactive/mobile checks are delivered. See `STATUS.md` for exact outcomes and evidence.
