import { artworkMix, type HelmetConfig, type HelmetRenderOptions } from "./helmet-art";

/** Original front-facing helmet. Its open eye aperture is independent of visor motion. */
export function miniDriverFace(config: HelmetConfig, ns: string, options: HelmetRenderOptions): string {
  const c = config.colors;
  const color = (key: keyof typeof c) => options.portable ? c[key] : `var(--helmet-${key}, ${c[key]})`;
  const shell = color("shell"), stripe = color("stripe"), accent = color("stripeAlt"), ink = color("trim");
  const dark = artworkMix(c.shell, "#080d1a", .52), light = artworkMix(c.shell, "#ffffff", .3);
  const outline = options.appearance === "neobrutalism" ? 4.5 : 2.4;
  const flat = options.appearance === "pixel" || options.appearance === "terminal";
  const shellFill = flat || config.parts.finish === "matte" ? shell : `url(#${ns}-${config.parts.finish === "chrome" ? "front-chrome" : "front-shell"})`;
  const shellPath = "M29 85C28 39 61 12 117 11C177 8 211 40 212 87L207 128Q200 159 170 170Q120 185 70 170Q38 160 31 128Z";
  const bands = config.parts.pattern === "chevron" ? `<path d="M49 26L118 56L188 25L198 42L120 72L39 43Z" fill="${stripe}"/><path d="M66 20L119 43L171 19" fill="none" stroke="${accent}" stroke-width="7"/>` : config.parts.pattern === "bands" ? `<path d="M82 15L80 65M157 15L160 65" stroke="${stripe}" stroke-width="17"/><path d="M99 12L97 62M140 13L142 62" stroke="${accent}" stroke-width="5"/>` : `<path d="M45 40Q76 16 114 19" fill="none" stroke="${stripe}" stroke-width="9"/>`;
  const eyes = [87, 153].map((x, index) => `<g class="driver-eye-blink" style="transform-origin:${x}px 106px"><ellipse cx="${x}" cy="105" rx="19" ry="22" fill="#fff8ed"/><g class="driver-pupil"><ellipse cx="${x + (index ? -1 : 1)}" cy="108" rx="12" ry="18" fill="${color("eye")}"/><ellipse cx="${x}" cy="103" rx="11" ry="12" fill="#20151b"/><circle cx="${x - 4}" cy="98" r="5" fill="#fff"/><circle cx="${x + 5}" cy="113" r="2" fill="#f8b465"/></g><path d="M${x - 18} 95Q${x} 79 ${x + 17} 94" fill="none" stroke="#20151b" stroke-width="3.5" stroke-linecap="round"/></g>`).join("");
  return `<defs><linearGradient id="${ns}-front-chrome" x1="0" y1="0" x2=".3" y2="1"><stop stop-color="#f5ffff"/><stop offset=".34" stop-color="${shell}"/><stop offset=".49" stop-color="#334955"/><stop offset=".51" stop-color="#e2f7ff"/><stop offset=".8" stop-color="${stripe}"/><stop offset="1" stop-color="#273948"/></linearGradient><linearGradient id="${ns}-front-shell" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${light}"/><stop offset=".28" stop-color="${shell}"/><stop offset=".74" stop-color="${shell}"/><stop offset="1" stop-color="${dark}"/></linearGradient><linearGradient id="${ns}-visor-glass"><stop stop-color="${color("visor")}"/><stop offset=".3" stop-color="#d6fff1"/><stop offset=".52" stop-color="${color("visor")}"/><stop offset=".85" stop-color="#c1f7ff"/><stop offset="1" stop-color="${color("visor")}"/></linearGradient><clipPath id="${ns}-front-shell-clip"><path d="${shellPath}"/></clipPath></defs>
  <g class="driver-front-helmet">
    <path d="M31 105Q18 100 20 118Q22 133 36 127M208 105Q221 100 219 118Q217 133 204 127" fill="#e3a57a" stroke="${ink}" stroke-width="2"/>
    <path d="${shellPath}" fill="${shellFill}" stroke="${ink}" stroke-width="${outline}"/>
    <g clip-path="url(#${ns}-front-shell-clip)">${bands}<path d="M32 133L77 156L90 173L62 161ZM208 133L163 156L150 174L178 162Z" fill="${stripe}"/><path d="M40 140L76 159M201 140L165 159" stroke="${accent}" stroke-width="4"/></g>
    <path d="M40 83Q120 54 201 83L193 129Q122 153 48 130Z" fill="#121722" stroke="${ink}" stroke-width="2"/>
    <path d="M53 92Q63 71 119 72Q179 72 190 96L181 128Q120 145 61 128Z" fill="#f3c195"/>
    <path d="M52 98Q54 71 81 67Q133 53 183 77L191 100L176 88L160 94L165 78L145 94L145 80L119 96L126 80L101 97L104 82L77 99L82 84Z" fill="#18202a"/>
    ${eyes}<path d="M116 126Q121 129 126 126" fill="none" stroke="#bd805d" stroke-width="1.5" stroke-linecap="round"/>
    <g class="driver-front-visor" transform="translate(0 ${config.parts.visorOpen ? -12 : 0})"><path d="M40 78Q118 54 201 78L194 91Q119 69 47 93Z" fill="url(#${ns}-visor-glass)" stroke="${ink}" stroke-width="2"/><path d="M51 78Q120 59 189 78" fill="none" stroke="#e7ffff" stroke-width="2" opacity=".85"/>${config.parts.visorOpen ? "" : `<path d="M49 91Q122 69 193 91L188 127Q123 144 54 128Z" fill="${color("visor")}" opacity=".12"/>`}</g>
    <g fill="${stripe}" stroke="${ink}" stroke-width="2"><circle cx="41" cy="84" r="7"/><circle cx="200" cy="84" r="7"/></g><g fill="#d3e3e4"><circle cx="41" cy="84" r="3"/><circle cx="200" cy="84" r="3"/></g>
    <path d="M43 128Q120 148 197 128L188 153Q121 183 54 153Z" fill="${shellFill}" stroke="${ink}" stroke-width="${outline}"/><path d="M52 137Q119 158 188 137" fill="none" stroke="${stripe}" stroke-width="6"/>
    ${config.parts.vents ? `<path d="M90 148Q120 155 150 148L143 157Q120 162 97 157Z" fill="${ink}"/><path d="M105 153H135M40 51L57 45L61 54L42 61ZM180 45L198 51L197 61L177 54Z" fill="${ink}" stroke="${dark}" stroke-width="1.5"/>` : ""}
    <path d="M88 31Q119 26 153 32" fill="none" stroke="${light}" stroke-width="2"/><rect x="107" y="38" width="27" height="15" rx="3" fill="${accent}" stroke="${ink}" stroke-width="1.3"/><text x="120" y="49" text-anchor="middle" font-size="9" font-weight="800" font-family="sans-serif" fill="#111827">${config.number}</text>
  </g>`;
}
