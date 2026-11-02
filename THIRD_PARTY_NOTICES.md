# Third-party notices

## LiveOrb

`components/ui/live-orb.tsx` is LiveOrb by **jay sharma (@radiumcoders)**.

- Component and MIT designation: https://21st.dev/@radiumcoders/components/live-orb
- Author's source registry: https://www.23rd.dev/r/live-orb.json
- Integrated from the source supplied in the project brief. The two malformed warning string literals were repaired. Local integration adds stylesheet and appearance metadata; the shader and interaction engine are retained.

The source registry does not state a copyright year. No year is inferred here.

## AnimeFire shader

`components/ui/anime-fire-shader.ts` adapts **Shader Anime Fire** by **jay sharma (@radiumcoders)**.

- Component and MIT designation: https://21st.dev/@radiumcoders/components/shader-anime-fire
- Author's source registry: https://www.23rd.dev/r/shader-anime-fire.json
- Integrated on 2 November 2026. The reference's turbulence, cel bands and linear-light color math are retained. Local changes adapt uniform names and add the library's appearances, pixel mode and embers. The surrounding React component, rendering lifecycle and crackle audio remain local.

The registry does not state a copyright year. No year is inferred here.

## DriftingClouds shader

`components/ui/shader-canvas/clouds-field.ts` and `clouds-noise.ts` adapt **Shader Sky** by **jay sharma (@radiumcoders)**.

- Component and MIT designation: https://21st.dev/@radiumcoders/components/shader-sky
- Author's source registry: https://www.23rd.dev/r/shader-sky.json
- Integrated on 2 November 2026. Retains texture-based noise, the cloud height profile and atmospheric scattering. The local version uses a 24-step bounded march, a single coarse lighting probe, a lower pixel/frame budget, editable sun direction and the shared renderer lifecycle. The color studies and editor are original to this project.

The registry does not state a copyright year. No year is inferred here.

## MIT License for LiveOrb, Shader Anime Fire and Shader Sky

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Fonts and dependencies

Geist and Pixelify Sans are distributed under the SIL Open Font License. Their
notices are included in `public/fonts/OFL-Geist.txt` and
`public/fonts/OFL-PixelifySans.txt`. npm dependencies retain their respective
licenses in the installed packages.
