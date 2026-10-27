# oRangeUi revamp direction

Status: implemented and verified, 26 October 2026. The original analysis and design direction from 25 October are retained below. See `STATUS.md` for the completion evidence and final screenshots.

## Request being addressed

Keep the cards that already work visually. Improve the components and match the supplied controller reference more closely. Reduce the amount of pixel styling. Study Gladeye's immersive landing experience before implementing the revamp.

## What the review found

Reviewed the live [Gladeye homepage](https://www.gladeye.com/), its menu and [Work page](https://www.gladeye.com/work), all three supplied reference images, the existing desktop screenshot, and the current component/CSS source.

| Evidence | Finding | Design consequence |
| --- | --- | --- |
| Gladeye homepage at 1536 x 720 | The document and its single canvas both occupy one viewport. One central headline, one main CTA, and sparse navigation sit over a full-bleed floral scene. Soft foreground blur and a sharper middle distance create depth. | Build one coherent opening scene with a strong focal point and readable HTML content. Keep the component catalogue directly reachable. |
| Gladeye menu and Work page | The menu uses a large, uncluttered navigation surface. Work changes to a light, spacious, media-led layout. | Give the immersive opening and the practical library distinct visual rhythms. Use space and scale to establish hierarchy. |
| Existing landing page | Pixel headings, trees, mascot, grass, icons, cursors, notched controls, hard shadows and controller all repeat the same treatment. The search and three feature boxes precede the actual component collection. | Concentrate the pixel identity in the liked cards and a few deliberate details. Bring the library closer to the opening. |
| `references/landing1.png` | Even the original pixel reference uses smooth, rounded feature panels and clear separation between illustrated scenery and usable controls. | Use softer component surfaces and cleaner typography. |
| `references/landing2.png` | A pale yellow rounded shell contains a large purple rounded screen, oversized lime lettering, a rounded purple Play cross and four circular lavender controls. | Rebuild the controller's silhouette, proportions and palette around this reference. |
| Current controller | The shell and screen are square, the display is green, the controls are small amber rectangles and heavy outlines dominate. | Changing the colour alone would leave the main mismatch unresolved. |
| `references/landing3.png` and current StatCards | Colour blocks, dithered art, compact statistics and distinctive typography give the cards a clear identity. | Preserve that visual language and provide more room around it. |
| `styles/globals.css` and `styles/primitives.css` | Pixel rendering applies to every image/SVG; Button and Input default to notched frames, offset shadows and stepped transitions. | Scope pixel rendering to actual pixel art. Redesign the shared primitives, including their Storybook examples. |

The Gladeye homepage itself is a single viewport, so a long pinned scroll sequence would be our own invention. The useful reference is its composition, depth, restraint and transition between experiences.

## Proposed experience

### 1. An immersive orange opening

- One full-viewport scene built around an original, softly lit orange sculpture/mascot, with curved foliage and a small number of floating component shapes at different depths.
- A warm ivory base, orange focal object and charcoal text. Use lighting and depth to establish atmosphere; avoid repeating the current flat trees, grass bands and grid across the page.
- Keep the headline, "Play with pixels. Ship with polish.", in a clean display face. Limit pixel typography to the brand details, cards and controller display.
- Compact navigation: brand, Components, Playground, theme toggle and GitHub. A clear "Explore components" action moves directly to the collection.
- Gentle scene drift and bounded pointer-driven camera movement on desktop. Enter with a short, coordinated reveal of the scene, headline and action.

### 2. A calmer collection that preserves the cards

- Follow the opening with the existing five coloured cards, retaining their art, two-stat structure, labels and working links.
- Place search beside the collection heading, where filtering has an immediate visible result.
- Replace the three large introductory feature boxes with a compact supporting line or small row after the collection.
- Use clean headings, larger gaps and quiet surfaces around the cards. Let their pixel character be the focal detail in this section.

### 3. Components that feel finished

- Rework the actual shared Button and Input components, so the landing page and Storybook demonstrate the same design.
- Buttons: softly rounded corners, balanced text/icon spacing, subtle depth, fluid hover response and a small press movement. Maintain distinct primary, secondary and ghost variants.
- Inputs: a rounded frame, quiet border, readable placeholder, clear label/helper/error hierarchy and an unmistakable focus ring.
- Keep loading, disabled, validation, keyboard, refs and `asChild` behaviour intact. Preserve schemas and component metadata.
- Present these in one spacious interactive playground, with compact component controls and a Preview/Code switch instead of several competing bordered boxes.

### 4. A controller faithful to the reference

- Give the closing section a purple background and a prominent pale yellow controller.
- Match the reference's broad corner curves, large purple display, lime uppercase screen text, rounded Play cross and circular lavender direction buttons.
- Keep pixel lettering inside the device; use clean surrounding copy and lighter external framing.
- Make Play start a small local demo. Direction buttons move an on-screen character or selection, with equivalent keyboard controls when the device has focus. Include a clear reset and status feedback.
- Scale the controller as one composition on mobile, maintaining its shape and touch targets.

## Motion, responsiveness and implementation

Use an original Three.js scene, preferably through React Three Fiber, for the hero only. Keep navigation, headings, buttons and content as normal HTML. Load the scene separately from the usable page, cap rendering density, and stop rendering when the scene is offscreen or the tab is hidden. Provide a matching static scene for reduced motion or unavailable graphics support. Mobile gets a simpler composition and no pointer-dependent interaction.

Use normal document scrolling. Keep focus indicators visible, controls operable with keyboard/touch and contrast readable in both themes. Provide an ambient-motion pause control. Essential content and actions must be available before the scene loads. The initial implementation should stay silent; audio is not needed to establish the visual direction.

## Implementation order and parallel work

1. Establish shared typography, colour, radius, spacing and motion choices. Build the new hero composition and controller silhouette first, and review them against the supplied images at desktop and mobile sizes.
2. Run independent implementation tracks: hero/scene; shared primitives and stories; controller and local interaction. Coordinate shared token/CSS edits through one integration owner.
3. Integrate navigation, collection/search and playground into the final page flow. Preserve the liked card treatment.
4. Verify the integrated result visually and functionally; update screenshots, relevant browser expectations and status documentation.

Likely files: `app/page.tsx`, `styles/tokens.css`, `styles/globals.css`, `styles/landing.css`, `styles/primitives.css`, `styles/cursor.css`, `components/ui/button.tsx`, `components/ui/input.tsx`, `components/landing/component-showcase.tsx`, `components/landing/handheld-console.tsx`, their stories/tests, and new hero-scene files. Keep `components/ui/stat-card.tsx` and its core design stable unless integration exposes a concrete issue.

## Completion criteria for the implementation

- The opening has a clear focal object, headline and primary action, with usable static content while the scene loads.
- Ordinary headings, controls and navigation use the calmer style; the liked cards retain their identity.
- The controller matches the supplied reference's geometry, relative proportions and colour roles, with working Play, direction and reset interactions.
- Search, previews, theme persistence, keyboard navigation and component states still work.
- Desktop, tablet and 360/390px mobile layouts are visually reviewed in both themes; no horizontal overflow or obscured controls.
- Motion pause, reduced motion, touch, hidden-tab pause and unavailable-graphics fallback are verified.
- Lint, typecheck, unit tests, copy check, production build, Storybook build and relevant browser/accessibility checks pass. Update obsolete style assertions to test the new intended design while retaining behavioural coverage.

## Implementation outcome

The proposed experience is implemented. The hero uses Three.js directly in a dynamically imported module, keeping the renderer separate from the usable HTML and static scene. The controller includes the local four-star game, and the shared primitives, collection, search, and playground are integrated.

All completion criteria above have been checked. The eight desktop/tablet/mobile palette audits report zero accessibility violations, layout shift, horizontal overflow, and runtime errors. The 20 landing checks, 29 unit tests, all 22 Storybook stories in both palettes, source checks, production build, and Storybook build pass. Eleven affected browser checks were refreshed after the final readability adjustments. The full evidence list and verification limits are recorded in `STATUS.md`.
