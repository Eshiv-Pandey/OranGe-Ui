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

`Sticker` accepts one of fifty typed names. Fifty named exports provide the same API, for example `OrbitSnailSticker`, `MisoMothSticker` and `TinyTerrariumSticker`. `STICKERS` exposes names, titles, categories and metadata. `stickerSvg(name, size)` returns standalone SVG with no network, font or script dependencies. Browser PNG exports rasterize that exact SVG on a transparent 1024-pixel canvas.

The gallery's hover treatment is presentation only. Exported files retain the full artwork. Reduced motion disables the fold, and wrapping buttons provide the keyboard preview.
