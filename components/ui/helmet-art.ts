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
  { name: "Copper comet", colors: { shell: "#f56a32", stripe: "#172c43", stripeAlt: "#ffda52", visor: "#546b72", trim: "#1c2325", eye: "#ffe3b5" } },
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

/** Original side-profile shell with a pivoting visor and layered painted livery. */
export function helmetSvgBody(input: HelmetConfig, id: string, options: HelmetRenderOptions = {}): string {
  const config = normalizeHelmetConfig(input), ns = artworkNamespace(id), { parts } = config;
  const pixel = options.appearance === "pixel", bold = options.appearance === "neobrutalism";
  const paint = (key: keyof HelmetColors) => options.portable ? config.colors[key] : `var(--helmet-${key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}, ${config.colors[key]})`;
  const shade = (key: string, from: keyof HelmetColors, toward: string, amount: number) => options.portable ? artworkMix(config.colors[from], toward, amount) : `var(--helmet-${key}, ${artworkMix(config.colors[from], toward, amount)})`;
  const shell = paint("shell"), stripe = paint("stripe"), alternate = paint("stripeAlt"), ink = paint("trim"), visor = paint("visor");
  const light = shade("highlight", "shell", "#ffffff", .68), dark = shade("shadow", "shell", "#172631", .28);
  const line = bold ? 5.5 : pixel ? 4.5 : 4;
  const shellPath = "M26 133L37 92C47 47 83 21 131 21C183 20 214 55 222 101C228 136 224 170 210 191C195 212 157 220 113 223L57 222C38 221 29 209 25 193L20 171L28 153Z";
  const opening = "M28 130C61 116 119 117 176 123L181 143C166 159 139 168 103 169L38 167L27 159L29 145Z";
  const visorPath = "M38 81C75 74 129 82 176 98C187 100 191 109 186 119C180 131 169 141 151 143C106 145 71 130 22 140C12 141 14 132 18 122Z";
  const pivotX = 178, pivotY = 111;
  const visorTransform = options.portable && parts.visorOpen ? ` transform="rotate(30 ${pivotX} ${pivotY})"` : "";
  const defs = `<defs><clipPath id="${ns}-shell"><path d="${shellPath}"/></clipPath><clipPath id="${ns}-opening"><path d="${opening}"/></clipPath><clipPath id="${ns}-visor-clip"><path d="${visorPath}"/></clipPath>
    <linearGradient id="${ns}-paint" x1="0" y1="0" x2=".8" y2="1"><stop stop-color="${light}"/><stop offset=".14" stop-color="${shell}"/><stop offset=".78" stop-color="${shell}"/><stop offset="1" stop-color="${dark}"/></linearGradient>
    <linearGradient id="${ns}-chrome" x1="0" y1="0" x2=".3" y2="1"><stop stop-color="${light}"/><stop offset=".3" stop-color="${shell}"/><stop offset=".46" stop-color="#f3f5ec"/><stop offset=".5" stop-color="${ink}"/><stop offset=".7" stop-color="${shell}"/><stop offset="1" stop-color="${light}"/></linearGradient>
    <linearGradient id="${ns}-visor" x1="0" y1="0" x2="1" y2=".55"><stop stop-color="${visor}"/><stop offset=".5" stop-color="${shade("visor-shadow", "visor", "#111a24", .4)}"/><stop offset="1" stop-color="${visor}"/></linearGradient></defs>`;
  let stripes = "";
  if (parts.pattern === "bands") stripes = `<path d="M31 57L102 68L120 33L168 29L177 59L223 76L220 91L161 76L151 45L133 48L116 87L28 76Z" fill="${stripe}" stroke="${light}" stroke-width="2.5"/><path d="M153 28L191 30L207 60L223 69L228 130L205 125L194 81L166 68Z" fill="${alternate}" stroke="${light}" stroke-width="2.5"/><path d="M196 126L217 137L211 187L178 196L161 219L123 223L160 184L190 173Z" fill="${stripe}" stroke="${light}" stroke-width="3"/><path d="M22 180L95 188L123 177L136 187L107 207L35 209Z" fill="${alternate}" stroke="${light}" stroke-width="2"/><path d="M137 201L182 192L171 206L209 198" fill="none" stroke="${alternate}" stroke-width="5"/>`;
  else if (parts.pattern === "chevron") stripes = `<path d="M38 52L100 76L138 35L221 62L226 92L145 60L111 101L30 73Z" fill="${stripe}" stroke="${light}" stroke-width="2.5"/><path d="M69 23L109 61L126 40L103 15ZM156 47L168 30L228 53L230 68Z" fill="${alternate}"/><path d="M202 105L224 129L214 181L176 196L161 216L132 221L165 180L190 168Z" fill="${stripe}" stroke="${light}" stroke-width="3"/><path d="M24 183L98 193L129 177L145 184L106 211L33 204Z" fill="${stripe}" stroke="${light}" stroke-width="2"/><path d="M35 188L96 199L126 185" fill="none" stroke="${alternate}" stroke-width="5"/>`;
  else stripes = `<path d="M42 61Q109 77 127 26L143 25Q131 80 87 85L35 76Z" fill="${stripe}"/><path d="M33 195L96 207L181 189L185 201L98 219L39 209Z" fill="${stripe}"/><path d="M49 203L98 214L175 198" fill="none" stroke="${alternate}" stroke-width="4"/>`;
  const eye = (x: number) => `<g class="helmet-blink" style="transform-origin:${x}px 149px"><path d="M${x - 10} 146Q${x} 139 ${x + 10} 146L${x + 9} 154Q${x} 158 ${x - 9} 153Z" fill="${paint("eye")}"/><g class="helmet-pupil"><rect x="${x - 2}" y="143" width="5" height="12" rx="2" fill="${ink}"/></g></g>`;
  const finish = parts.finish === "matte" || pixel ? shell : `url(#${ns}-${parts.finish === "chrome" ? "chrome" : "paint"})`;
  const vents = parts.vents ? `<g fill="${ink}"><path d="M43 183L62 187L60 192L42 189ZM73 188L97 190L94 196L72 193Z"/><path d="M82 47L99 45L94 53L79 55ZM107 39L121 36L116 45L103 47Z"/><path d="M199 146L214 142L211 150L197 154Z"/></g>` : "";
  const shine = parts.finish === "matte" || pixel ? "" : `<path d="M57 63C72 35 103 27 131 28" fill="none" stroke="${light}" stroke-width="4" stroke-linecap="round"/><path d="M210 92Q224 150 207 180" fill="none" stroke="${light}" stroke-width="2" opacity=".55"/>`;
  return `${defs}<g class="helmet-shell-layer"><path d="${shellPath}" fill="${finish}" stroke="${ink}" stroke-width="${line}" stroke-linejoin="round"/><g clip-path="url(#${ns}-shell)"><g class="helmet-stripe-layer">${stripes}</g>${shine}</g>
    <path d="${opening}" fill="${ink}" stroke="${ink}" stroke-width="4"/><g clip-path="url(#${ns}-opening)"><path d="M35 139Q106 122 167 134L151 165L101 173L39 172Z" fill="${shade("lining", "trim", "#060b14", .5)}"/><g class="helmet-interior-face"${options.portable && !parts.visorOpen ? ' opacity="0"' : ""}>${eye(69)}${eye(119)}<path d="M94 159Q107 166 121 158" stroke="${light}" stroke-opacity=".6" stroke-width="2" fill="none"/></g></g>
    <path d="M28 150L39 163Q113 174 164 153" stroke="${shade("lining-edge", "trim", "#f3eee5", .15)}" stroke-width="5" fill="none" stroke-linecap="round"/>
    <g class="helmet-visor-orbit"><g class="helmet-visor-lift"${visorTransform}><path d="${visorPath}" fill="url(#${ns}-visor)" stroke="${ink}" stroke-width="${line}" stroke-linejoin="round"/><g clip-path="url(#${ns}-visor-clip)"><path d="M55 73L69 77L43 143L28 145ZM91 78L108 85L86 139L68 136ZM124 84L132 87L113 142L104 140Z" fill="${light}" opacity="${parts.finish === "matte" ? .2 : .42}"/><path d="M33 90Q98 83 177 106" fill="none" stroke="${light}" stroke-width="2" opacity=".4"/></g><path d="M38 82Q102 76 171 97" fill="none" stroke="${ink}" stroke-width="6"/></g></g>
    <circle cx="178" cy="111" r="13" fill="${ink}"/><circle cx="178" cy="111" r="8" fill="${shade("pivot", "trim", "#ffffff", .23)}"/><circle cx="176" cy="108" r="2.2" fill="${light}"/>
    ${vents}<g class="helmet-number-layer"><path d="M167 58L197 69L193 87L163 77Z" fill="${alternate}" stroke="${ink}" stroke-width="1.5"/><text x="180" y="75" transform="rotate(18 180 75)" fill="${ink}" text-anchor="middle" font-family="monospace" font-weight="900" font-size="10">${config.number}</text></g>
    <g transform="translate(183 166) rotate(-17)" fill="none" stroke="${light}" stroke-width="2"><circle r="7"/><path d="M-4 3L0 -4L4 3M-3 1H3"/></g><path d="M52 211Q114 230 186 205" fill="none" stroke="${ink}" stroke-width="4" stroke-linecap="round"/>
  </g>`;
}

/** Portable, settled frame with explicit colors and no animation or external files. */
export function helmetToSvgString(config: HelmetConfig, size = 256, options: Omit<HelmetRenderOptions, "portable"> & { id?: string } = {}): string {
  const pixels = artworkDimension(size, 256);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="${pixels}" height="${pixels}" shape-rendering="${options.appearance === "pixel" ? "crispEdges" : "auto"}" role="img" aria-label="Original motorsport helmet">${helmetSvgBody(config, options.id ?? "helmet-export", { ...options, portable: true })}</svg>`;
}
