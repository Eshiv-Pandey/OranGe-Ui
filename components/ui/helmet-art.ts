import type { Appearance } from "./appearance";

export const HELMET_PATTERNS = ["plain", "bands", "chevron"] as const;
export const HELMET_FINISHES = ["gloss", "matte", "chrome"] as const;
export type HelmetPattern = typeof HELMET_PATTERNS[number];
export type HelmetFinish = typeof HELMET_FINISHES[number];
export type HelmetColors = { shell: string; stripe: string; stripeAlt: string; visor: string; trim: string; eye: string };
export type HelmetParts = { pattern: HelmetPattern; finish: HelmetFinish; vents: boolean; visorOpen: boolean };
export type HelmetConfig = { version: 1; number: string; colors: HelmetColors; parts: HelmetParts };
export type HelmetRenderOptions = { appearance?: Appearance; portable?: boolean; backdrop?: boolean };

export const HELMET_PALETTES = [
  { name: "Lagoon sprint", colors: { shell: "#e4efe4", stripe: "#228c8c", stripeAlt: "#dfb455", visor: "#3f7587", trim: "#203842", eye: "#f4dca3" } },
  { name: "Copper comet", colors: { shell: "#dd8159", stripe: "#393b69", stripeAlt: "#eadcae", visor: "#5b677f", trim: "#322f42", eye: "#ffe3b5" } },
  { name: "Plum circuit", colors: { shell: "#8c79a9", stripe: "#ecd3a1", stripeAlt: "#d37773", visor: "#584667", trim: "#302839", eye: "#ffe8b9" } },
  { name: "Glacier club", colors: { shell: "#75b6c9", stripe: "#e6ead6", stripeAlt: "#da9c66", visor: "#264d75", trim: "#233445", eye: "#edf7d9" } },
  { name: "Moss relay", colors: { shell: "#adbd78", stripe: "#385659", stripeAlt: "#edb876", visor: "#466971", trim: "#293d39", eye: "#ffefc2" } },
  { name: "Dusk run", colors: { shell: "#536780", stripe: "#dfb1b5", stripeAlt: "#edcb7a", visor: "#70547d", trim: "#222d40", eye: "#f4e4ad" } },
] as const;

export function motorsportSeed(seed: string | number): number {
  const text = String(seed); let hash = 2166136261;
  for (let index = 0; index < text.length; index++) hash = Math.imul(hash ^ text.charCodeAt(index), 16777619);
  return hash >>> 0;
}

export function artworkColor(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const hex = value.trim().toLowerCase();
  if (/^#[\da-f]{6}$/.test(hex)) return hex;
  if (/^#[\da-f]{3}$/.test(hex)) return `#${[...hex.slice(1)].map((digit) => digit + digit).join("")}`;
  return fallback;
}

export function artworkMix(first: string, second: string, amount: number): string {
  return `#${[1, 3, 5].map((offset) => Math.round(Number.parseInt(first.slice(offset, offset + 2), 16) * (1 - amount) + Number.parseInt(second.slice(offset, offset + 2), 16) * amount).toString(16).padStart(2, "0")).join("")}`;
}

export function artworkNamespace(id: string): string {
  return `ms-${Array.from(String(id)).map((character) => /^[a-z\d-]$/i.test(character) ? character : `_${character.codePointAt(0)!.toString(16)}_`).join("")}`;
}

export function artworkDimension(size: number, fallback: number): number {
  return Number.isFinite(size) ? Math.min(2048, Math.max(24, Math.round(size))) : fallback;
}

/** Deterministic fictional helmet identity. No reference designs, marks or names. */
export function generateHelmetConfig(seed: string | number = "orangeui:helmet"): HelmetConfig {
  const hash = motorsportSeed(seed);
  return { version: 1, number: String(200 + hash % 700), colors: { ...HELMET_PALETTES[hash % HELMET_PALETTES.length].colors }, parts: { pattern: HELMET_PATTERNS[(hash >>> 5) % 3], finish: HELMET_FINISHES[(hash >>> 9) % 3], vents: true, visorOpen: false } };
}

/** Whitelist saved data before any value reaches the SVG string renderer. */
export function normalizeHelmetConfig(value: unknown): HelmetConfig {
  const fallback = generateHelmetConfig();
  if (!value || typeof value !== "object" || Array.isArray(value)) return fallback;
  const candidate = value as Partial<HelmetConfig>;
  if (candidate.version !== undefined && candidate.version !== 1) return fallback;
  const colors = candidate.colors && typeof candidate.colors === "object" ? candidate.colors : {} as Partial<HelmetColors>;
  const parts = candidate.parts && typeof candidate.parts === "object" ? candidate.parts : {} as Partial<HelmetParts>;
  const number = typeof candidate.number === "string" || typeof candidate.number === "number" ? String(candidate.number) : "";
  return {
    version: 1, number: /^\d{1,3}$/.test(number) ? number : fallback.number,
    colors: Object.fromEntries(Object.entries(fallback.colors).map(([key, color]) => [key, artworkColor(colors[key as keyof HelmetColors], color)])) as HelmetColors,
    parts: {
      pattern: HELMET_PATTERNS.includes(parts.pattern!) ? parts.pattern! : fallback.parts.pattern,
      finish: HELMET_FINISHES.includes(parts.finish!) ? parts.finish! : fallback.parts.finish,
      vents: typeof parts.vents === "boolean" ? parts.vents : fallback.parts.vents,
      visorOpen: typeof parts.visorOpen === "boolean" ? parts.visorOpen : fallback.parts.visorOpen,
    },
  };
}

/** Original three-quarter helmet, shared verbatim by Helmet and MiniDriver. */
export function helmetSvgBody(input: HelmetConfig, id: string, options: HelmetRenderOptions = {}): string {
  const config = normalizeHelmetConfig(input), ns = artworkNamespace(id), { parts } = config;
  const pixel = options.appearance === "pixel", bold = options.appearance === "neobrutalism", terminal = options.appearance === "terminal";
  const paint = (key: keyof HelmetColors) => options.portable ? config.colors[key] : `var(--helmet-${key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}, ${config.colors[key]})`;
  const shade = (key: string, from: keyof HelmetColors, toward: string, amount: number) => options.portable ? artworkMix(config.colors[from], toward, amount) : `var(--helmet-${key}, ${artworkMix(config.colors[from], toward, amount)})`;
  const shell = paint("shell"), stripe = paint("stripe"), alternate = paint("stripeAlt"), ink = paint("trim"), visor = paint("visor");
  const light = shade("highlight", "shell", "#ffffff", .62), dark = shade("shadow", "shell", "#172631", .44);
  const outline = bold ? 5 : pixel ? 4 : terminal ? 2 : 2.6;
  const shellPath = pixel ? "M91 25H151V31H174V43H190V61H200V88H207V143H201V166H190V184H175V198H151V208H97V204H69V194H49V180H36V162H30V136H35V95H43V65H54V46H71V33H91Z" : "M36 114C37 62 63 26 107 25C151 15 188 40 201 79C212 113 207 148 192 174C176 201 149 211 112 210C68 209 40 190 32 166C26 148 34 133 36 114Z";
  const opening = pixel ? "M58 102H80V96H127V102H187V111H194V145H183V156H151V166H100V161H69V149H50V133H47V113H58Z" : "M54 104C82 91 118 98 142 106L188 108C198 120 193 141 182 151C159 170 97 173 62 150C46 139 42 120 54 104Z";
  const visorPath = pixel ? "M54 94H91V98H128V104H186V113H191V133H179V145H151V154H108V151H78V144H57V134H45V114H46V103H54Z" : "M50 97C77 86 105 95 131 103C151 109 172 109 187 107C197 121 189 136 178 143C151 161 106 162 76 148C53 139 38 120 50 97Z";
  const visorTransform = options.portable && parts.visorOpen ? ' transform="translate(0 -42) translate(59 112) rotate(-5) scale(1 .76) translate(-59 -112)"' : "";
  const defs = `<defs>
    <clipPath id="${ns}-shell"><path d="${shellPath}"/></clipPath>
    <clipPath id="${ns}-opening"><path d="${opening}"/></clipPath>
    <linearGradient id="${ns}-shell-paint" x1="0" y1="0" x2=".8" y2="1"><stop stop-color="${light}"/><stop offset=".24" stop-color="${shell}"/><stop offset=".74" stop-color="${shell}"/><stop offset="1" stop-color="${dark}"/></linearGradient>
    <linearGradient id="${ns}-chrome" x1="0" y1="0" x2=".25" y2="1"><stop stop-color="${light}"/><stop offset=".22" stop-color="${shell}"/><stop offset=".41" stop-color="#f3f5ec"/><stop offset=".47" stop-color="#d4e0df"/><stop offset=".5" stop-color="${ink}"/><stop offset=".59" stop-color="${dark}"/><stop offset=".82" stop-color="${shell}"/><stop offset="1" stop-color="#f6eed9"/></linearGradient>
    <linearGradient id="${ns}-visor" x1="0" y1="0" x2="1" y2=".6"><stop stop-color="${visor}"/><stop offset=".55" stop-color="${visor}" stop-opacity=".62"/><stop offset="1" stop-color="${shade("visor-shadow", "visor", "#172431", .35)}"/></linearGradient>
    <linearGradient id="${ns}-reflection" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fff9e3" stop-opacity=".6"/><stop offset="1" stop-color="#fff9e3" stop-opacity="0"/></linearGradient>
  </defs>`;
  let stripes = "";
  if (parts.pattern === "bands") stripes = `<path d="M20 68C86 75 122 36 210 55L215 71C128 50 90 99 18 85Z" fill="${stripe}"/><path d="M22 90C95 106 125 56 209 79L211 87C130 70 97 115 23 101Z" fill="${alternate}"/><path d="M27 182Q116 221 199 166L208 188Q116 235 28 199Z" fill="${stripe}"/>`;
  if (parts.pattern === "chevron") stripes = `<path d="M78 14L136 79L199 40L215 65L135 102L54 28Z" fill="${stripe}"/><path d="M71 17L136 90L204 52L211 63L133 108L57 29Z" fill="${alternate}"/><path d="M30 161L107 191L177 172L178 184L106 205L28 178Z" fill="${stripe}"/>`;
  if (parts.pattern === "plain") stripes = `<path d="M40 179Q78 199 119 196L120 202Q74 204 37 186Z" fill="${stripe}"/>`;
  const eye = (x: number) => `<g class="helmet-blink" style="transform-origin:${x}px 127px"><rect x="${x - 9}" y="116" width="18" height="23" rx="${pixel ? 0 : 8}" fill="${paint("eye")}"/><g class="helmet-pupil"><rect x="${x - 2}" y="119" width="6" height="15" rx="${pixel ? 0 : 3}" fill="${ink}"/></g></g>`;
  const vents = parts.vents ? `<g fill="${ink}"><path d="M67 63L88 55L91 64L70 72Z"/><path d="M71 65L88 60" stroke="${light}" stroke-opacity=".6" stroke-width="1.5"/><path d="M82 179L99 185L97 191L81 184ZM105 185L121 186L121 193L104 192ZM128 185L142 181L143 188L129 192Z"/><path d="M178 77L188 83L190 96L180 93Z"/></g>` : "";
  const glint = parts.finish === "matte" || terminal ? "" : `<path d="M53 83C64 41 97 32 128 36C93 41 78 60 72 81Z" fill="${light}" opacity=".7"/><path d="M158 37Q183 49 193 76" fill="none" stroke="#ffffff" stroke-opacity=".5" stroke-width="3" stroke-linecap="round"/>`;
  const visorGlint = parts.finish === "matte" ? "" : `<path d="M67 99L84 103L67 140L56 132ZM96 104L104 106L87 148L79 145Z" fill="url(#${ns}-reflection)"/>`;
  const finish = parts.finish === "matte" || pixel ? shell : `url(#${ns}-${parts.finish === "chrome" ? "chrome" : "shell-paint"})`;
  const backdrop = options.backdrop === false ? "" : `<ellipse cx="121" cy="223" rx="77" ry="7" fill="${ink}" opacity=".12"/>`;
  const trim = options.appearance === "retro-os" ? `<path d="M48 88C56 46 84 29 117 29" stroke="#ffffff" stroke-width="4" fill="none"/><path d="M44 176Q93 224 168 196" stroke="${ink}" stroke-opacity=".6" stroke-width="5" fill="none"/>` : "";
  return `${defs}${backdrop}<g class="helmet-shell-layer"><path d="${shellPath}" fill="${finish}" stroke="${ink}" stroke-width="${outline}" stroke-linejoin="round"/>
    <g clip-path="url(#${ns}-shell)"><g class="helmet-stripe-layer">${stripes}</g>${glint}${trim}</g>
    <path d="${opening}" fill="${ink}" stroke="${ink}" stroke-width="4"/>
    <g clip-path="url(#${ns}-opening)"><path d="M61 115Q130 95 182 126L175 157L95 169L56 147Z" fill="${shade("lining", "trim", "#060b14", .45)}"/>${eye(100)}${eye(146)}<path d="M114 155Q126 164 141 154" stroke="${light}" stroke-opacity=".6" stroke-width="2.5" stroke-linecap="round" fill="none"/></g>
    <g class="helmet-visor-orbit"><g class="helmet-visor-lift"${visorTransform}><path d="${visorPath}" fill="url(#${ns}-visor)" stroke="${ink}" stroke-width="${pixel ? 4 : 3.5}" stroke-linejoin="round"/>${visorGlint}<path d="M61 98Q97 93 130 107Q159 115 184 111" fill="none" stroke="${light}" stroke-opacity=".65" stroke-width="2"/></g></g>
    <circle cx="52" cy="115" r="11" fill="${ink}"/><circle cx="52" cy="115" r="7" fill="${alternate}"/><path d="M49 115H55" stroke="${ink}" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M36 151Q41 170 72 180" fill="none" stroke="${stripe}" stroke-width="8" stroke-linecap="${pixel ? "square" : "round"}"/>
    ${vents}<g class="helmet-number-layer"><path d="M151 57L168 61L165 88L149 83Z" fill="${alternate}"/><text x="159" y="76" transform="rotate(10 159 76)" fill="${ink}" text-anchor="middle" font-family="monospace" font-weight="700" font-size="10">${config.number}</text></g>
    <path d="M53 189Q111 221 175 187" fill="none" stroke="${ink}" stroke-width="${bold ? 5 : 3}" stroke-linecap="round"/>
  </g>`;
}

/** Portable, settled frame with explicit colors and no animation or external files. */
export function helmetToSvgString(config: HelmetConfig, size = 256, options: Omit<HelmetRenderOptions, "portable"> & { id?: string } = {}): string {
  const pixels = artworkDimension(size, 256);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="${pixels}" height="${pixels}" shape-rendering="${options.appearance === "pixel" ? "crispEdges" : "auto"}" role="img" aria-label="Original motorsport helmet">${helmetSvgBody(config, options.id ?? "helmet-export", { ...options, portable: true })}</svg>`;
}
