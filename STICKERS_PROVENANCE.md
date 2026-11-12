# Original sticker artwork

All seventy stickers in `components/ui/sticker-artwork.ts` were authored for oRangeUi in this workstream. The repository MIT license covers the artwork and reusable components. The source contains explicit vector coordinates and flat fills, with no linked fonts, images, logos or imported character artwork. Individual SVG and PNG exports are derived from these original vectors.

## Research, not shipping assets

- [Stick It Up catalogue](https://stickitupx.vercel.app/stickers): named browsing, category counts, compact die-cut previews, optional peel, React usage and vector downloads. Inspected the supplied reference capture and refreshed public HTML. No reference source, SVG or character art was used to author the pack.
- [Pinterest Pen Pals and Throwback Kid research](https://business.pinterest.com/hi/pinterest-predicts/): stationery, tiny collectible objects and playful color as broad inspiration. Public Pinterest pin-search HTML loaded without usable pin images; this is not a claim of inspecting individual pins.
- [Dirtybarn colorful sticker research](https://www.behance.net/gallery/148647911/Colorful-and-Retro-Sticker-Pack-90-Pieces): research on variety, color and graphic collections. No downloaded pack or commercial artwork was used.
- [Shine Sticker Studio die-cut collection](https://shinestickerstudio.com/products/feelin-groovy-sticker-die-cut-collection-july-2025-subscription): visually inspected saturated color and white die-cut margins.
- [Smarty Pants Paper robot sticker sheet](https://smartypantspaper.com/products/robot-sticker-sheet): visually inspected the readability of bold silhouettes and limited flat fills.
- [Magiclily retro sticker bundle](https://www.creativefabrica.com/fr/product/80s-stickers-retro-sticker-pack-bundle/): visually inspected as a contrasting, more painterly object treatment. This pack instead uses clean flat vectors.

Reference captures live in ignored local research output. They are excluded from source ZIPs, registry payloads and contribution commits.

## Use and exports

`Sticker` accepts one of seventy typed names. Seventy named exports provide the same API, for example `OrbitSnailSticker`, `MisoMothSticker` and `TinyTerrariumSticker`. `STICKERS` exposes names, titles, categories and metadata. `stickerSvg(name, size, finish)` returns standalone SVG with no network, font or script dependencies. Browser PNG exports rasterize that exact SVG on a transparent 1024-pixel canvas.

The gallery's hover treatment is presentation only. Exported files retain the full artwork. Interactive React stickers and standalone HTML scene stickers rise and wiggle on hover or keyboard focus; static React artwork can opt in with `hoverPeel`. Reduced motion disables click animations and hover movement, and touch-only devices disable hover movement. Wrapping buttons provide the gallery's keyboard preview.

## November 2026 workspace expansion

The original fifty playful artwork definitions were retained exactly. Twenty independently authored Everyday designs add familiar expressive motifs: heart, sparkle, approval, pointer, thumbs up, smile, coffee, headphones, camera, music, globe, paper plane, pin, chat, links, code, bookmark, peace, rainbow and a small-win badge. The sharper finish uses saturated fills, white trim, finer contours and individually specified facets. All 140 SVG renderings remain standalone original vectors without imported artwork or font dependencies.

The public [Stick It Up home page](https://stickitupx.vercel.app/) and catalogue UI were inspected again through public HTML and client behavior metadata because the browser connection was unavailable. Home-page controls describe draggable/tilting stickers and click rotations; the catalogue editor exposes size, preview backgrounds, peel and code. This is behavioral research, with no reference source or artwork copied into shipping files. The rejected oRangeUi fold was removed; our press-and-bounce response and expanded editing controls are independently implemented.

Npm packaging is authored locally for [`orangeui-stickers@0.1.0`](https://www.npmjs.com/package/orangeui-stickers). The registry package and versioned downloadable tarball have matching integrity. Fresh registry installation, all seventy designs in both finishes, ESM/CommonJS rendering, React/CSS bundling and NodeNext declarations were verified without Next.js, Tailwind, image or font dependencies.

## Fourth refinement, November 12, 2026

This pass supersedes the earlier exact-retention statement for the revised designs. The requested hand, pencil, moon, comet, satellite, sun, cube, flag, pinwheel, music note and ribbon motifs were independently redrawn in the existing flat-vector style. No new reference artwork, raster image, font or external asset was introduced.

`components/ui/sticker-contours.ts` records painted silhouettes for composite artwork, retaining detached marks and actual gaps between shapes. The renderer uses those boundaries for internal paint containment and a final black contour, then adds the die-cut paper margin with headroom inside the SVG viewBox. Playful and sharp share the same geometry and black outlines; sharp keeps its color remapping and applicable facets. React instances and standalone HTML placements use scoped SVG clip identifiers so repeated stickers resolve their own local silhouettes.

All 140 SVGs passed bounds and transparent-export checks. Source ZIP and registry delivery includes the contour source, and the packed package includes its declarations. `orangeui-stickers@0.1.1` was built locally, copied to `/downloads/orangeui-stickers-0.1.1.tgz`, and published publicly as npm latest. The final `--release --registry` check verified isolated local and registry installation, all seventy designs in both finishes through ESM/CommonJS rendering, React/CSS bundling, Bundler declarations and both NodeNext declaration modes. Registry and local tarballs have matching exact SHA-512 integrity, recorded in `out/iteration/stickers/npm/package-report.json`. The `0.1.0` registry verification above remains historical evidence of that earlier release.

## Fifth refinement, November 13, 2026

Peace hand, Moka morning, Pocket play, Comet tail, Bubble tea, Infinity ribbon and Link knot were independently refined using explicit flat-vector geometry. Their matching contours preserve recognisable defining details, genuine holes and the black boundary around each colored body. Both finishes keep the same geometry. No reference source, image, font or external artwork was introduced; all seventy identities and the other sixty-three definitions were preserved.

All fourteen revised padded variants fit their SVG viewBox, and browser export checks passed all 140 variants. The stronger hover lift, wiggle and optional shadow remain presentation behavior, with reduced-motion and touch overrides. Responsive React/HTML scene exports match full-viewport Preview with normalized anchors and square art; each repeated SVG still has scoped clip identifiers.

The `0.1.2` tarball passed isolated local consumer checks and is downloadable from the gallery. Publication and matching registry integrity verification follow npm account 2FA. The earlier public tarballs remain intact.
