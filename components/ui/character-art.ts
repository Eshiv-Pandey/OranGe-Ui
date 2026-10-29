import type { Appearance } from "./appearance";

export const CHARACTER_HAIR = ["swept", "crop", "coil"] as const;
export const CHARACTER_GLASSES = ["round", "angular", "none"] as const;
export const CHARACTER_OUTFITS = ["jacket", "crew", "collar"] as const;
export const CHARACTER_FACES = ["soft", "long", "round"] as const;
export type CharacterColors = { skin: string; hair: string; outfit: string; accent: string; background: string; backgroundEnd: string; eye: string; frame: string };
export type CharacterParts = {
  hair: typeof CHARACTER_HAIR[number]; glasses: typeof CHARACTER_GLASSES[number];
  outfit: typeof CHARACTER_OUTFITS[number]; face: typeof CHARACTER_FACES[number];
  accents: boolean; earring: boolean;
};
export type CharacterConfig = { version: 1; colors: CharacterColors; parts: CharacterParts };

export const CHARACTER_PALETTES = [
  { name: "Lilac workshop", colors: { skin: "#d99a74", hair: "#38294f", outfit: "#27475e", accent: "#edd08a", background: "#b6a3d3", backgroundEnd: "#777baa", eye: "#2d2638", frame: "#382b40" } },
  { name: "Amber afternoon", colors: { skin: "#a96d51", hair: "#332b32", outfit: "#59694f", accent: "#f1b875", background: "#e4bc77", backgroundEnd: "#bd8060", eye: "#282a32", frame: "#443138" } },
  { name: "Quiet lagoon", colors: { skin: "#edbc98", hair: "#384751", outfit: "#69537c", accent: "#9cdac7", background: "#b4ddd2", backgroundEnd: "#6aa8ac", eye: "#2e3644", frame: "#30495b" } },
  { name: "Rose notebook", colors: { skin: "#85503e", hair: "#272e3c", outfit: "#3a6170", accent: "#ecb5ac", background: "#dbaab8", backgroundEnd: "#ab809e", eye: "#211e29", frame: "#efd3aa" } },
  { name: "Orchard morning", colors: { skin: "#c38763", hair: "#58413d", outfit: "#4f5781", accent: "#bdd991", background: "#c6d69f", backgroundEnd: "#8caa83", eye: "#302b37", frame: "#493345" } },
  { name: "Blue hour", colors: { skin: "#efc7a8", hair: "#51405d", outfit: "#355958", accent: "#e1b96b", background: "#a7bdd8", backgroundEnd: "#6c8aa7", eye: "#352d3e", frame: "#374052" } },
] as const;

function hashSeed(seed: string | number): number {
  const text = String(seed); let hash = 2166136261;
  for (let index = 0; index < text.length; index++) hash = Math.imul(hash ^ text.charCodeAt(index), 16777619);
  return hash >>> 0;
}

/** Stable fictional portrait parts and colors, with no ambient randomness. */
export function generateCharacterConfig(seed: string | number = "orangeui:portrait"): CharacterConfig {
  const hash = hashSeed(seed);
  return {
    version: 1, colors: { ...CHARACTER_PALETTES[hash % CHARACTER_PALETTES.length].colors },
    parts: { hair: CHARACTER_HAIR[(hash >>> 3) % 3], glasses: CHARACTER_GLASSES[(hash >>> 7) % 3], outfit: CHARACTER_OUTFITS[(hash >>> 11) % 3], face: CHARACTER_FACES[(hash >>> 15) % 3], accents: true, earring: Boolean(hash & 2) },
  };
}

function validColor(value: unknown, fallback: string) {
  if (typeof value !== "string") return fallback;
  const color = value.trim().toLowerCase();
  if (/^#[\da-f]{6}$/.test(color)) return color;
  if (/^#[\da-f]{3}$/.test(color)) return `#${[...color.slice(1)].map((digit) => digit + digit).join("")}`;
  return fallback;
}

function part<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === "string" && allowed.includes(value as T) ? value as T : fallback;
}

/** Saved data is whitelisted before it reaches the string SVG renderer. */
export function normalizeCharacterConfig(value: unknown): CharacterConfig {
  const fallback = generateCharacterConfig();
  if (!value || typeof value !== "object" || Array.isArray(value)) return fallback;
  const candidate = value as Partial<CharacterConfig>;
  if (candidate.version !== undefined && candidate.version !== 1) return fallback;
  const colors = candidate.colors && typeof candidate.colors === "object" ? candidate.colors : {};
  const parts = candidate.parts && typeof candidate.parts === "object" ? candidate.parts : {} as Partial<CharacterParts>;
  return {
    version: 1,
    colors: Object.fromEntries(Object.entries(fallback.colors).map(([key, color]) => [key, validColor((colors as Record<string, unknown>)[key], color)])) as CharacterColors,
    parts: {
      hair: part(parts.hair, CHARACTER_HAIR, fallback.parts.hair),
      glasses: part(parts.glasses, CHARACTER_GLASSES, fallback.parts.glasses),
      outfit: part(parts.outfit, CHARACTER_OUTFITS, fallback.parts.outfit),
      face: part(parts.face, CHARACTER_FACES, fallback.parts.face),
      accents: typeof parts.accents === "boolean" ? parts.accents : fallback.parts.accents,
      earring: typeof parts.earring === "boolean" ? parts.earring : fallback.parts.earring,
    },
  };
}

function mix(first: string, second: string, amount: number) {
  const channel = (hex: string, offset: number) => Number.parseInt(hex.slice(offset, offset + 2), 16);
  return `#${[1, 3, 5].map((offset) => Math.round(channel(first, offset) * (1 - amount) + channel(second, offset) * amount).toString(16).padStart(2, "0")).join("")}`;
}

function namespace(id: string) {
  return `ch-${Array.from(id).map((character) => /^[a-z\d-]$/i.test(character) ? character : `_${character.codePointAt(0)?.toString(16)}_`).join("")}`;
}

export type CharacterRenderOptions = { appearance?: Appearance; portable?: boolean };

/** Original layered portrait geometry. All coordinates use a 240 by 240 viewBox. */
export function characterSvgBody(input: CharacterConfig, id: string, options: CharacterRenderOptions = {}): string {
  const config = normalizeCharacterConfig(input), ns = namespace(id), { parts } = config;
  const paint = (key: keyof CharacterColors) => options.portable ? config.colors[key] : `var(--character-${key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}, ${config.colors[key]})`;
  const shade = (name: string, from: keyof CharacterColors, to: string, amount: number) => {
    const color = mix(config.colors[from], to, amount);
    return options.portable ? color : `var(--character-${name}, ${color})`;
  };
  const skin = paint("skin"), hair = paint("hair"), outfit = paint("outfit"), accent = paint("accent"), ink = paint("eye"), frame = paint("frame");
  const skinShadow = shade("skin-shadow", "skin", "#573449", .25), skinLight = shade("skin-highlight", "skin", "#fff4dc", .2);
  const hairLight = shade("hair-highlight", "hair", "#f1cad4", .15), hairShadow = shade("hair-shadow", "hair", "#101c32", .22);
  const outfitLight = shade("outfit-highlight", "outfit", "#e0d4c5", .16), outfitShadow = shade("outfit-shadow", "outfit", "#172033", .22);
  const mouth = shade("lip", "skin", "#773b58", .52);
  const tile = options.appearance === "pixel" ? "M40 7H200V13H218V24H227V40H233V200H227V217H217V227H200V233H40V227H23V217H13V200H7V40H13V23H23V13H40Z"
    : options.appearance === "terminal" ? "M17 7H223Q233 7 233 17V223Q233 233 223 233H17Q7 233 7 223V17Q7 7 17 7Z"
      : "M120 7C214 7 233 26 233 120C233 214 214 233 120 233C26 233 7 214 7 120C7 26 26 7 120 7Z";
  const face = parts.face === "long" ? "M79 61C101 39 151 37 173 66C185 91 179 131 166 156C155 178 136 190 116 181C90 173 73 151 68 122C62 94 64 77 79 61Z"
    : parts.face === "round" ? "M77 65C100 43 151 40 174 67C190 89 185 128 169 150C153 172 132 180 109 172C80 162 63 145 60 120C57 92 63 78 77 65Z"
      : "M80 60C102 39 152 37 173 65C187 91 179 132 165 154C152 174 132 182 113 175C86 166 71 146 67 119C62 93 66 76 80 60Z";
  const defs = [
    `<linearGradient id="${ns}-background" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${paint("background")}"/><stop offset="1" stop-color="${paint("backgroundEnd")}"/></linearGradient>`,
    `<linearGradient id="${ns}-light" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#ffffff" stop-opacity="0.22"/><stop offset=".8" stop-color="#ffffff" stop-opacity="0"/></linearGradient>`,
    `<clipPath id="${ns}-tile"><path d="${tile}"/></clipPath>`,
    `<clipPath id="${ns}-face"><path d="${face}"/></clipPath>`,
  ];
  const backHair = parts.hair === "swept" ? `<path d="M64 65C42 98 55 137 39 162Q56 169 69 154L71 182Q89 184 102 167L157 174Q184 181 206 164L189 147C186 125 197 96 182 67C170 37 144 25 115 29C87 21 63 35 56 57Z" fill="${hairShadow}"/><path d="M179 89Q169 132 192 158L180 157Q163 138 169 107Z" fill="${hairLight}" opacity=".5"/>`
    : parts.hair === "crop" ? `<path d="M62 112C47 82 54 49 78 34C94 21 114 28 124 19L139 29C168 27 191 50 191 79L179 124L163 131L77 129Z" fill="${hairShadow}"/>`
      : `<path d="M55 127C39 122 37 108 44 97C27 91 34 70 49 67C38 53 53 35 69 39C67 21 89 16 101 27C111 9 133 15 138 28C156 17 176 28 175 43C192 38 204 55 195 70C211 80 207 99 194 105C202 121 188 138 175 136L72 144Z" fill="${hairShadow}"/>`;
  let shoulders = `<path d="M23 243L33 205C43 181 71 173 103 169L145 170C176 174 199 186 209 212L217 243Z" fill="${outfit}"/>`;
  if (parts.outfit === "jacket") {
    shoulders += `<path d="M34 213Q55 187 80 183L65 240H22ZM164 181Q194 191 207 214L218 242H182Z" fill="${outfitShadow}"/><path d="M99 168L121 189L143 168L158 176L140 204L123 194L107 206L88 175Z" fill="${accent}"/><path d="M90 176L114 192L99 211L75 183ZM150 176L133 192L146 210L165 183Z" fill="${outfitLight}"/><path d="M122 193V240" fill="none" stroke="${accent}" stroke-width="3"/><path d="M125 211V240" fill="none" stroke="${outfitShadow}" stroke-width="2"/><rect x="118" y="202" width="8" height="10" rx="2" fill="${accent}"/><path d="M55 213L89 216L86 235L52 231Z" fill="${outfitLight}"/><path d="M56 213L73 225L89 216" fill="none" stroke="${outfitShadow}" stroke-width="2"/><path d="M156 215L181 212M44 206L36 239M193 206L203 239" fill="none" stroke="${outfitLight}" stroke-width="2" stroke-linecap="round"/>`;
  } else if (parts.outfit === "crew") {
    shoulders += `<path d="M94 171Q120 197 151 171L159 180Q121 215 86 180Z" fill="${accent}"/><path d="M99 180Q124 199 147 180" fill="none" stroke="${outfitShadow}" stroke-width="3"/><path d="M67 183L52 231M174 186L190 234" fill="none" stroke="${outfitLight}" stroke-width="3" stroke-linecap="round"/><path d="M87 228Q116 221 150 230" fill="none" stroke="${outfitLight}" stroke-width="4" stroke-linecap="round"/><path d="M99 173L99 185M109 181L109 191M119 185V195M130 184V194M141 178L143 188" fill="none" stroke="${outfit}" stroke-width="2"/>`;
  } else {
    shoulders += `<path d="M99 167L122 192L143 168L159 179L143 207L122 193L103 209L84 179Z" fill="${accent}"/><path d="M122 194V242" fill="none" stroke="${outfitLight}" stroke-width="12"/><path d="M52 213H91V237H52Z" fill="${outfitLight}"/><path d="M54 215L71 227L89 215" fill="none" stroke="${outfitShadow}" stroke-width="2"/><circle cx="122" cy="211" r="2.5" fill="${accent}"/><circle cx="122" cy="230" r="2.5" fill="${accent}"/><path d="M45 204L34 238M192 204L205 240" fill="none" stroke="${outfitLight}" stroke-width="3" stroke-linecap="round"/>`;
  }
  let frontHair = "";
  if (parts.hair === "swept") {
    frontHair = `<path d="M63 111C52 82 59 51 80 40C104 24 127 31 139 47C117 44 106 56 93 69C80 80 73 95 74 116Z" fill="${hair}"/><path d="M108 40C132 23 165 36 179 60C189 81 188 98 177 118L165 125L164 96C155 95 147 88 141 78C126 69 114 62 108 40Z" fill="${hair}"/><path d="M66 82Q76 50 108 42M76 92Q89 65 116 49M126 40Q153 43 167 67M134 49Q153 62 161 83" fill="none" stroke="${hairLight}" stroke-width="3.5" stroke-linecap="round"/><path d="M115 39Q119 58 140 77Q153 93 167 94" fill="none" stroke="${hairShadow}" stroke-width="5" stroke-linecap="round"/>`;
  } else if (parts.hair === "crop") {
    frontHair = `<path d="M61 108C52 76 58 47 83 35C102 26 115 32 124 24L135 34C164 30 183 50 186 75L177 113L165 116L160 76C143 85 123 79 105 64C95 84 82 91 75 112Z" fill="${hair}"/><path d="M70 69Q79 45 107 43M84 73Q96 60 104 49M117 41Q136 59 160 55M126 54Q147 68 167 65" fill="none" stroke="${hairLight}" stroke-width="4" stroke-linecap="round"/><path d="M161 78L175 83L174 104L166 110Z" fill="${hairShadow}"/>`;
  } else {
    frontHair = `<path d="M53 100C38 89 48 69 61 69C47 52 63 34 80 39C81 23 103 22 113 35C126 22 145 28 146 42C163 32 181 43 179 57C194 60 191 80 178 85L172 110L161 108L158 83C147 85 137 78 134 67C125 79 109 78 102 67C94 81 81 88 74 85L72 112L59 117Z" fill="${hair}"/><path d="M65 63C52 51 73 42 77 55M88 52C83 38 104 37 104 51M117 52C113 39 133 35 137 49M148 60C144 45 167 46 168 62M71 78Q86 62 94 66M106 61Q118 74 130 59M145 75Q163 84 176 72" fill="none" stroke="${hairLight}" stroke-width="3.5" stroke-linecap="round"/>`;
  }
  function eye(x: number, y: number, index: number, wide: number) {
    const path = `M${x - wide} ${y}Q${x} ${y - 15} ${x + wide} ${y}Q${x + 1} ${y + 14} ${x - wide} ${y}Z`;
    defs.push(`<clipPath id="${ns}-eye-${index}"><path d="${path}"/></clipPath>`);
    return `<g class="character-blink" style="transform-origin:${x}px ${y}px"><path d="${path}" fill="#fff4e6"/><g clip-path="url(#${ns}-eye-${index})"><g class="character-pupil"><ellipse cx="${x + 1}" cy="${y + 1}" rx="7" ry="11" fill="${ink}"/><ellipse cx="${x - 1}" cy="${y - 3}" rx="2" ry="3" fill="#fff9ef"/></g></g><path d="M${x - wide} ${y}Q${x} ${y - 15} ${x + wide} ${y}" fill="none" stroke="${mouth}" stroke-width="2" stroke-linecap="round"/></g>`;
  }
  const eyes = eye(97, 109, 0, 15) + eye(147, 107, 1, 14);
  let glasses = "";
  if (parts.glasses === "round") glasses = `<ellipse cx="96" cy="109" rx="23" ry="22" fill="#ffffff" fill-opacity=".065" stroke="${frame}" stroke-width="4"/><ellipse cx="147" cy="107" rx="23" ry="21" fill="#ffffff" fill-opacity=".065" stroke="${frame}" stroke-width="4"/><path d="M119 105Q122 101 125 105M73 103L64 97M170 102L179 95" fill="none" stroke="${frame}" stroke-width="4" stroke-linecap="round"/><path d="M81 98L87 118M133 94L138 113" fill="none" stroke="#ffffff" stroke-width="4" stroke-opacity=".22" stroke-linecap="round"/>`;
  if (parts.glasses === "angular") glasses = `<path d="M74 94Q96 87 120 94L117 122Q96 131 78 120ZM127 93Q150 87 172 93L168 120Q148 126 130 118Z" fill="#ffffff" fill-opacity=".07" stroke="${frame}" stroke-width="4" stroke-linejoin="round"/><path d="M120 102L127 101M74 100L64 95M171 98L180 92" fill="none" stroke="${frame}" stroke-width="4" stroke-linecap="round"/><path d="M82 97L88 120M135 95L140 117" fill="none" stroke="#ffffff" stroke-width="4" stroke-opacity=".22" stroke-linecap="round"/>`;
  const sparkles = parts.accents ? `<g fill="#fff4df" opacity=".85"><path d="M31 48L34 56L42 59L34 62L31 70L28 62L20 59L28 56Z"/><path d="M205 32L208 41L217 44L208 47L205 56L202 47L193 44L202 41Z"/><path d="M207 133L210 139L216 142L210 145L207 151L204 145L198 142L204 139Z"/><circle cx="31" cy="124" r="2.5"/><circle cx="212" cy="100" r="2"/><circle cx="38" cy="171" r="2"/></g>` : "";
  let border = `<path d="${tile}" fill="none" stroke="#fff4df" stroke-opacity=".7" stroke-width="2"/>`;
  if (options.appearance === "neobrutalism" || options.appearance === "pixel") border = `<path d="${tile}" fill="none" stroke="${frame}" stroke-width="${options.appearance === "pixel" ? 4 : 6}"/>`;
  if (options.appearance === "retro-os") {
    defs.push(`<linearGradient id="${ns}-bevel" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fff4df"/><stop offset="1" stop-color="${frame}"/></linearGradient>`);
    border = `<path d="${tile}" fill="none" stroke="url(#${ns}-bevel)" stroke-width="5"/>`;
  }
  if (options.appearance === "terminal") border = `<path d="${tile}" fill="none" stroke="${frame}" stroke-opacity=".7" stroke-width="2"/>`;
  return `<defs>${defs.join("")}</defs><g clip-path="url(#${ns}-tile)"><path d="${tile}" fill="url(#${ns}-background)"/><path d="${tile}" fill="url(#${ns}-light)"/>${sparkles}
    <g class="character-hair-back">${backHair}</g>
    <g class="character-neck"><path d="M99 155L99 177Q118 200 145 177L144 155Z" fill="${skin}"/><path d="M102 157L143 157L143 169Q123 181 103 169Z" fill="${skinShadow}"/></g>
    <g class="character-shoulders">${shoulders}</g>
    <g class="character-head"><path d="M68 98C52 89 50 108 57 123Q62 137 73 130ZM175 99C191 88 195 105 187 122Q182 135 172 130Z" fill="${skin}"/><path d="M60 106Q56 118 65 122M182 105Q190 111 179 123" fill="none" stroke="${skinShadow}" stroke-width="3.5" stroke-linecap="round"/>
      <path d="${face}" fill="${skin}"/><g clip-path="url(#${ns}-face)"><path d="M153 52Q181 74 164 105Q163 139 142 162Q128 180 111 176L161 191L195 151L199 49Z" fill="${skinShadow}"/><path d="M75 84Q83 61 113 54Q95 72 88 92Z" fill="${skinLight}"/><path d="M77 123Q87 118 94 128Q91 135 81 134ZM150 124Q162 120 167 129Q162 137 151 134Z" fill="${mouth}" opacity=".25"/>
      <path d="M128 108L122 128Q126 135 137 129" fill="none" stroke="${skinShadow}" stroke-width="4" stroke-linecap="round"/><path d="M107 147Q122 158 137 146" fill="none" stroke="${mouth}" stroke-width="3.5" stroke-linecap="round"/><path d="M116 160Q125 164 131 160" fill="none" stroke="${skinLight}" stroke-width="3" stroke-linecap="round"/>
      <path d="M81 89Q93 81 106 88M135 86Q148 77 160 85" fill="none" stroke="${hair}" stroke-width="4.5" stroke-linecap="round"/>${eyes}</g>
      ${parts.earring ? `<path d="M181 125C192 127 191 139 183 140C176 140 173 133 178 128" fill="none" stroke="${accent}" stroke-width="3.5" stroke-linecap="round"/>` : ""}</g>
    <g class="character-hair-front">${frontHair}</g><g class="character-glasses">${glasses}</g>${border}</g>`;
}

/** Standalone settled SVG, also suitable as input to an SVG-to-PNG helper. */
export function characterToSvgString(config: CharacterConfig, size = 256, options: Omit<CharacterRenderOptions, "portable"> & { id?: string } = {}): string {
  const pixels = Number.isFinite(size) ? Math.round(Math.min(4096, Math.max(16, size))) : 256;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${pixels}" height="${pixels}" viewBox="0 0 240 240" role="img" aria-label="Original illustrated character">${characterSvgBody(config, options.id ?? "export", { ...options, portable: true })}</svg>`;
}
