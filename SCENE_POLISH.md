# Scene polish, November 9, 2026

ChaiBreak404 pours from the kettle to the glass rim from above. The external stream is drawn before the glass; tea and foam stay clipped inside it. The tilt slider is removed. Pointer dragging remains, and the angle and fill ease back after release. The site 404 continues to use this scene.

NeonNotFound is the single playground composition. The sign follows the supplied reference's tall hanging proportions, broad orange faces, warm tube outlines, curled ends, clipped teal edge and light spill on brick. Small, Medium, Large and OPEN sample presentations are removed. Pixel artwork remains an inspector option.

PavilionFooter has finer dome leaves, medallions, finial carving, balcony supports and base ornament. Navigation spacing and the footer baseline are refined. Parallax eases to the cursor and returns to center. Lamps fade over 700ms. Birds complete a 3.8-second flight before another launch is available. Reduced motion rests the birds and keeps lighting and navigation usable.

WallSwitch uses a lazy Three.js model for the polished appearance: a beveled screwless plate, recessed plastic rocker, printed markers and cast light/shadow. Native Radix labels, keyboard, controlled state and form behavior remain. CSS supplies other appearances and a fallback during unavailable or lost WebGL. Context restoration restores the model; unmount releases observers, geometry, materials and context.

Source downloads include their shared palette/font styles and the switch's renderer and Three.js dependency. SVG definition IDs work with ES2020 compilation. No reference photograph is shipped.

Verification: desktop and mobile visual inspection plus one correction/confirmation pass; scene behavior at 320, 390, 900 and 1440 pixels; control focus, calendar, OTP and toast regression checks at 320, 390, 768 and 1440 pixels in light and dark palettes. The affected source-download batches compile and bundle 60 examples across all five appearances with zero diagnostics. Unit/source checks, lint, type checking, copy check, production build, bundle budgets and source traces pass.

Preview: http://127.0.0.1:3134

Start a production preview after building:

```powershell
npm run start -- --hostname 127.0.0.1 --port 3134
```

## Full-page chai and automatic pavilion flight, November 9, 2026

ChaiBreak404 now places its animation across the whole page, with a brass kettle bearing Hindi lettering, block-print sleeves, bangles, marigold toran and floral borders. ChaiPour exposes `fullscreen`, which ChaiBreak404 always enables. The pour still enters from above the glass rim, with tea and foam clipped inside. After pouring, a soft steam-cloud 404 appears above the full glass. Pointer dragging and eased release remain available; recovery copy and links stay readable in HTML. Reduced motion retains a still full glass and cloud.

PavilionFooter now has a symmetric central pavilion and three smaller neighbors in different softer blues. Four birds fly automatically on separate paths with articulated wingbeats, bodies, tails and intermittent glides. This replaces the earlier launch-and-return behavior recorded above; no flight control is shown. Visibility-aware scheduling pauses offscreen and hidden-tab motion. Reduced motion rests birds and parallax, while lighting and navigation remain usable. Back to top aligns its text and arrow and retains heading focus after scrolling.

ChaiYatra is a local CSS alias for the existing SIL OFL licensed Yatra One asset at `public/fonts/desi/yatra-one.woff2`. Scene artwork colors and lettering sizes remain component-specific. This extension introduces no new font or shared palette change.

Verification for this extension: 8 unit/source tests and 7 affected browser tests pass across 320, 390, 900 and 1440 pixels. Forty affected source examples compile and bundle across all five appearances without diagnostics. Type checking, lint, copy checking, production build, bundle budgets and source traces pass. Desktop and mobile finish review found no visible or source blocker. These are the existing verified checks; this documentation pass did not rerun them.

Production build: `CLmGpYdTrn-V_GX4WPqXe`. Preview: http://127.0.0.1:3134

## Chai, lamps and photographic film corrections, November 9, 2026

This section supersedes the earlier Hindi lettering and soft steam-cloud descriptions, the older pavilion lamp behavior, and any earlier flat-frame EndlessFilm presentation. Earlier verification and review statements above apply to their historical builds; they do not establish a verdict for this correction.

Both Hindi chai labels are removed from ChaiBreak404, including the kettle lettering. Original brass, block-print sleeves, bangles, marigold toran and floral borders remain. The rim-entering pour still keeps tea and foam clipped inside the glass, with kettle dragging and eased release. After pouring, clearly defined white steam strokes and cloud lobes form 404 above the full glass, with a warm outline for contrast. Reduced motion keeps the full glass and steam 404. HTML recovery links and the licensed ChaiYatra recovery heading remain.

PavilionFooter's Light the pavilion and Dim the pavilion button now visibly changes the arches of the central pavilion and all three smaller blue neighbors. The root's `data-lit` state changes inherited `--pavilion-window` and `--pavilion-window-glow`, so amber fill and glow reach all four SVG `use` instances instead of relying on a descendant state selector inside their referenced drawing. The 700ms transition retains the established material. Automatic birds, separate paths, wingbeats and glides remain, with no bird control. Reduced motion rests birds and parallax while retaining instant lighting and real footer navigation.

EndlessFilm now bends photographs continuously along an original lit spatial mesh. A shared texture registers photographs, frame borders and punched sprockets to the same path distance and feed phase. Transparent sprocket openings also participate in shadow rendering. Perspective, twist, a darker reverse face, depth-tested overlap, warm key light, cooler fill and soft offset shadows retain the photographic strip's construction. Its incumbent paper and olive palettes remain local to the component.

Wheel input over the reel and surrounding page or preview scrolling feed that phase in both directions. Pointer dragging, horizontal touch scrubbing, vertical touch scrolling, Previous, Next, Pause film, Reverse and keyboard photograph selection remain usable. Selection pauses automatic feed and announces the caption. Reduced motion, focus, explicit pause and visibility scheduling stop automatic movement while manual controls remain. Unavailable or lost WebGL exposes the photograph fallback; restoration restores the ribbon. Unmount aborts initialization, removes listeners and observers, and disposes mesh, material, texture, shadow-map and renderer resources. The renderer loads Three.js lazily, uses a 480,000-pixel backing-image budget and caps automatic painting at 30 frames per second.

FilmCormorant is a component alias for self-hosted Cormorant Garamond italic, weight 500, using `public/fonts/film/cormorant-garamond-italic-latin.woff2`. Keep the source notice in `public/fonts/film/NOTICE.md` and SIL OFL license in `public/fonts/film/OFL-cormorant-garamond.txt` with distribution. ChaiYatra remains the component alias for the existing licensed Yatra One recovery heading at `public/fonts/desi/yatra-one.woff2`; removing Hindi labels does not remove that font. The photographs retain their existing provenance in `public/photos/keepsakes/NOTICE.md`. Portable source downloads retain these assets and notices. This correction extends established scene worlds and introduces no shared design tokens.

Verification: `out/iteration/scene-film-final-checks.json` records passed production build `yVkyoX6M5ZlIXBtWQuAo3`, with final bundle budgets and source traces passing against that build. The preceding full review accepted scene and film construction and behavior, requiring only the pavilion pressed-hover contrast fix (F1). Pale hover styling now excludes the pressed button. All ten confirmation captures were refreshed, opened and validated; the hovered lit button retains cream `rgb(249, 237, 201)` on indigo `rgb(22, 48, 132)`, measuring 10.047:1 contrast on desktop and mobile. F1's final verdict is pass and the reviewer disposition is ship, based on the fix and scoped verification that earlier accepted behavior persists. Three final painted-lamp browser checks pass at 320, 390 and 1440 pixels. Before this CSS correction, the consolidated 10 browser tests passed with zero failures, covering lamps, wheel direction and photograph pixels, page and preview scroll, pause, dragging and selection, vertical touch scroll, context loss/fallback/restoration, chai pour and post-pour reveal, and automatic birds. Implementation evidence remains 18 passed unit/source tests and 60 selected affected source examples compiled and bundled across five appearances with zero diagnostics, not a whole-catalogue rerun. Lint and type checking passed before the CSS correction; the final production build also passed its TypeScript check. This documentation pass records those checks without rerunning them.

Preview: http://127.0.0.1:3134. Start after building:

```powershell
npm run start -- --hostname 127.0.0.1 --port 3134
```

## Film clarity and chai continuity, November 10, 2026

This correction supersedes the earlier paper and olive EndlessFilm background and chai placement, stream and steam-digit descriptions. Earlier verification statements remain specific to their historical builds.

EndlessFilm now uses pure black (#000) in both host palettes, with a light foreground and focus edge independent of the host theme. A matte front (roughness 0.94, metalness 0, no clearcoat), gentler lighting, shallow twist and fewer obscuring folds keep photographs clear. The shared photograph/perforation atlas, path-distance feed, controls, vertical touch scrolling and context-loss fallback/recovery remain.

Chai's resize observer matches the full-page SVG to the actual page aspect. Original hands and block-print sleeves reach the upper-left and lower-right page corners, with the mobile outer-right sleeve clear of recovery copy. Three independent steam 404 glyphs use 108-unit spacing and unclipped blur while retaining rounded cloud material. The external stream uses rendered transformation matrices to meet the rim; a clipped interior stream continues to the animated tea and foam surface. Both streams follow the pouring state and reduced-motion visibility. Kettle dragging and eased release remain, and both Hindi labels stay removed.

ChaiYatra and FilmCormorant remain unchanged licensed component font aliases. Original Indian SVG artwork and existing photograph provenance remain; no new raster assets or shared design tokens are introduced. The shared library palette, type ramp, appearances, focus and motion conventions continue to govern the shell.

Verification: production build FLXVD8YScewi9-2qSnaaB, scoped ESLint, TypeScript, 7 current unit/source tests and 12 targeted browser tests pass. Browser checks at 320, 390 and 1440 pixels cover black backgrounds and readable focus in both palettes, stream joins and liquid-surface endpoints within 1px, corners, copy clearance, digit gaps, wheel-driven photograph pixels, page/preview scroll, pause, drag, selection, vertical touch scrolling, context loss/recovery, kettle interaction and steam reveal. Bundle budgets and source traces pass against the same build. The historical 60-example compilation batch was not rerun.

All eight final captures in .impeccable/review/scene-clarity/confirmation were validated. Independent review resolves all five requested corrections: film clarity, black background, separated steam digits, the interior pour and corner anchoring. Its disposition is ship for that fix list; this does not claim a new whole-surface audit. This documentation pass records the supplied verification without rerunning it.

Live preview: http://127.0.0.1:3134. Start after building:

```powershell
npm run start -- --hostname 127.0.0.1 --port 3134
```

## Chai timing, hand grips and film sharpness, November 10, 2026

This correction replaces the earlier repeating pour and simultaneous stream visibility. The kettle's gripping hand now rotates with it, with curled fingertips, nails, palm creases, cuff detail and softer sleeve folds. The glass hand wraps around its sides with distinct fingers and thumb. The fuller upper toran uses layered marigold petals, hanging leaves and tassels, positioned inside the page edge. Mobile artwork retains clearance above recovery copy.

Chai releases only after at least 28 degrees of tilt. Its leading edge travels from the spout over 420ms and continues inside the glass over another 140ms before adding volume. The descending jet meets the rendered rim; the interior stream stays clipped and ends at the current tea surface. Liquid already released completes its journey after cutoff. The full glass retains its volume after the kettle returns. Dragging, eased release, visibility suspension and the reduced-motion still remain available.

EndlessFilm keeps its pure black background, matte material, shallow curves and existing controls. Its canvas now supports DPR 2 within a 2,500,000-pixel budget, with shared atlas cells up to 640 by 500 pixels, bounded by the device's maximum texture size. Photographs, frame edges and sprockets use the same higher-resolution atlas. Automatic painting remains capped at 30fps.

Verification in this continuation: 12 unit and source checks pass. Two affected download batches compile and bundle 40 examples across all five appearances with zero diagnostics. The broad browser run passed 33 of 34 cases; one mobile timing test advanced its frozen clock before hydration. After waiting for the motion observer to become active, all four new timing and DPR checks passed. They passed again on final production build `ykrtnJvTX2zNj3g9CQbqV`. Together, these runs cover all 34 targeted cases, including scrolling, dragging, selection, retained volume, reduced motion, stream joins, responsive copy clearance and graphics fallback/recovery. Type checking, scoped ESLint, copy checks, production build, bundle budgets and source traces pass. The build generates 129 pages. This is affected coverage, not a whole-catalogue rerun.

Desktop and mobile inspection and confirmation captures are under `.impeccable/review/chai-film-craft/`. The in-thread finish review accepts the four requested corrections at that scope. The mechanical detector reported the existing component font alias and local artwork styles, already described in DESIGN.md and SCENE_COMPONENTS.md; no new shared token or font was introduced. Physical-phone performance and user visual acceptance remain unverified.

Preview: http://127.0.0.1:3134. The server was restarted against the final build. Start command:

```powershell
npm.cmd run start -- --hostname 127.0.0.1 --port 3134
```
