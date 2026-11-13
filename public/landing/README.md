# Landing scene assets

The mounted landing uses the owner's 736 x 920 forest painting supplied on 5 November 2026. `sunset-scene.png` preserves the painting, locally reconstructs the former red sun's covered background, and places a photographed orange in its position. The original birds remain in front. No image generation was used. Artwork rights remain with the original owner.

The orange photograph is [Orange (1).jpg](https://commons.wikimedia.org/wiki/File:Orange_(1).jpg) by Renee Comet for the National Cancer Institute, in the public domain. Its attached leaf and stem come from [Clementine orange.jpg](https://commons.wikimedia.org/wiki/File:Clementine_orange.jpg) by Petr Kratochvil, under [CC0](https://creativecommons.org/publicdomain/zero/1.0/). `sunset-orange.png` combines the photographed silhouettes with transparent edges. The final composite includes that cutout, so no external image request is needed at runtime.

`sunset-flight-scene.png` is the WebGL background: the original bird ink is locally removed to reveal sky beneath flapping wings, then the photographed orange and leaf are composited in their exact positions. `sunset-scene.png` retains the original painted birds for the immediate CSS fallback.

`sunset-birds.png` contains thirteen painted ink silhouettes in a 4 by 4 padded sprite atlas. `components/landing/reference-birds.ts` records their source centers, wing spans and timing offsets. Alpha extraction and limited edge decontamination preserve the dark ink rather than copying orange or sky color onto moving wings. `sunset-birds-motion-mask.png` marks their tight motion envelopes for verification. No new bird artwork is generated.

`sunset-clouds-mask.png` allows cloud advection while excluding trees and the orange with its leaf, so clouds can flow behind the birds. `sunset-trees-mask.png` follows the actual tree silhouettes, fades toward anchored trunks, and drives wind sway. `sunset-still-mask.png` protects the orange and leaf. `sunset-empty-mask.png` disables the renderer's optional flower channel. All scene mattes align at 736 x 920.

Each PNG contains its origin and the complete deterministic preparation recipe in `impeccable:prompt` metadata. Regenerate them with `components/landing/sunset-assets.py`, using the original painting and downloaded orange and clementine photographs. Python, Pillow, NumPy and OpenCV are offline preparation tools, not runtime dependencies.

The older `reference-*.png` files belong to the previous landing. They remain as historical reference assets and are not mounted by the current scene.
