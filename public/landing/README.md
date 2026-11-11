# Landing scene assets

The landscape comes from the user-supplied `image-5.png` reference, supplied on 1 November 2026 for this landing page. It is not a generated replacement and is not a component-library asset. Original third-party artwork rights remain with their respective owner.

`reference-scene.png` retains the reference's person, hill, flowers, clouds, color grade and depth of field. The reference's baked-in navigation, title, button, paragraphs and footer were removed with deterministic Navier-Stokes inpainting and Poisson blending from adjacent photographic texture. Those previously covered regions are reconstructed, rather than claimed to be recovered original detail. No image generation API was used.

The grayscale PNGs are generated from the photograph and align exactly at 1199 x 805. White means motion is allowed, except `reference-person-mask.png`, where white protects the static figure. PNG metadata records origin and processing; the standard `impeccable:prompt` field includes the owner-supplied origin and exact preparation recipe without personal attachment paths. The preparation script preserves this provenance when regenerating assets. See `LANDING_SCENE.md` in the project root for the renderer, configuration, preparation command and replacement-layer instructions.
