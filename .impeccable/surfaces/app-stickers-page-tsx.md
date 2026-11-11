# Sticker gallery, editor and placement playground

Mode: Experience for the collection; Operate for editing and placement. This is an extension of the existing neutral library workspace.

## Direction contract

The owner requested keeping the first fifty cartoon-like designs, introducing sharper finishes and commonly useful motifs, replacing the rejected peel animation, adding npm distribution, and building a sticker placement playground. The pack now has seventy designs and two finishes. Preserve the incumbent design system and the liked right-side preview.

FIRST VIEWPORT: expressive original stickers accompany a short introduction and a direct playground action. Collection/Playground and Sharp/Playful controls remain visible. The default collection starts with Everyday designs. Search, named categories and the selected preview remain quick to scan. At widths up to 700px, the introduction uses a compact two-line title and the categories occupy one horizontally scrollable row. Phones show the collection first and expand the inspector on selection. Desktop retains the sticker fan and the side-by-side selected preview.

Signature interaction: click, Enter or Space presses the sticker then lets it spring and settle. Alternate wiggle, spin and no-motion choices are explicit. The complete artwork remains visible during hover; there is no diagonal clipping or fold. Reduced motion overrides animation.

Editor: a native modal with a large rotation-safe stage, preview backgrounds, size, rotation, finish, animation, duration, intensity and shadow. Copy/download code reflects every editable component setting. Native Escape, focus confinement and focus restoration are required.

Playground: a responsive placement canvas with normalized coordinates, touch/pointer dragging, keyboard movement, layers, duplicate/remove/front, undo, captions and backgrounds. Export React, standalone HTML and JSON. Per-placement settings stay intact across dragging and workspace switches. No dependency is required by the standalone HTML export.

Package: orangeui-stickers contains all seventy components, ESM/CommonJS, types and standalone CSS, with React peer dependencies and no site/font dependencies. Registry installation of orangeui-stickers@0.1.0 is verified. The public versioned tarball remains an alternative npm install target.
