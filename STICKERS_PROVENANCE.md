# Original sticker artwork

All fifty stickers in `components/ui/sticker-artwork.ts` were authored for oRangeUi in this workstream. The repository MIT license covers the artwork and reusable components. The source contains explicit vector coordinates and flat fills, with no linked fonts, images, logos or imported character artwork. Individual SVG and PNG exports are derived from these original vectors.

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

The gallery's hover treatment is presentation only. Exported files retain the full artwork. Reduced motion disables click animations and hover movement. Wrapping buttons provide the keyboard preview.

## November 2026 workspace expansion

The original fifty playful artwork definitions were retained exactly. Twenty independently authored Everyday designs add familiar expressive motifs: heart, sparkle, approval, pointer, thumbs up, smile, coffee, headphones, camera, music, globe, paper plane, pin, chat, links, code, bookmark, peace, rainbow and a small-win badge. The sharper finish uses saturated fills, white trim, finer contours and individually specified facets. All 140 SVG renderings remain standalone original vectors without imported artwork or font dependencies.

The public [Stick It Up home page](https://stickitupx.vercel.app/) and catalogue UI were inspected again through public HTML and client behavior metadata because the browser connection was unavailable. Home-page controls describe draggable/tilting stickers and click rotations; the catalogue editor exposes size, preview backgrounds, peel and code. This is behavioral research, with no reference source or artwork copied into shipping files. The rejected oRangeUi fold was removed; our press-and-bounce response and expanded editing controls are independently implemented.

Npm packaging is authored locally for [`orangeui-stickers@0.1.0`](https://www.npmjs.com/package/orangeui-stickers). The registry package and versioned downloadable tarball have matching integrity. Fresh registry installation, all seventy designs in both finishes, ESM/CommonJS rendering, React/CSS bundling and NodeNext declarations were verified without Next.js, Tailwind, image or font dependencies.
