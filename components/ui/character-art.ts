import type { Appearance } from "./appearance";
import { characterWardrobe } from "./character-wardrobe";

export const CHARACTER_HAIR = ["swept", "crop", "coil", "bob", "bun", "braids", "shaved"] as const;
export const CHARACTER_MALE_HAIR = ["swept", "crop", "coil", "shaved"] as const;
export const CHARACTER_FEMALE_HAIR = ["swept", "bob", "bun", "braids", "coil"] as const;
export const CHARACTER_GLASSES = ["round", "angular", "none"] as const;
export const CHARACTER_OUTFITS = ["jacket", "crew", "collar", "hoodie", "racer", "knit", "overalls"] as const;
export const CHARACTER_FACES = ["soft", "long", "round", "angular"] as const;
export const CHARACTER_GENDERS = ["female", "male", "neutral"] as const;
export const CHARACTER_FACIAL_HAIR = ["none", "stubble", "beard", "mustache"] as const;
export type CharacterColors = { skin: string; hair: string; outfit: string; accent: string; background: string; backgroundEnd: string; eye: string; frame: string };
export type CharacterParts = {
  hair: typeof CHARACTER_HAIR[number]; glasses: typeof CHARACTER_GLASSES[number];
  outfit: typeof CHARACTER_OUTFITS[number]; face: typeof CHARACTER_FACES[number];
  accents: boolean; earring: boolean;
  /** Optional so saved version 1 configurations remain valid. */
  gender?: typeof CHARACTER_GENDERS[number]; facialHair?: typeof CHARACTER_FACIAL_HAIR[number];
};
export type CharacterConfig = { version: 1; colors: CharacterColors; parts: CharacterParts };
export type NormalizedCharacterConfig = Omit<CharacterConfig, "parts"> & { parts: Required<CharacterParts> };

export const CHARACTER_PALETTES = [
  { name: "Lilac workshop", colors: { skin: "#f0bd96", hair: "#37152f", outfit: "#2e3fc2", accent: "#ffcf28", background: "#b15bfa", backgroundEnd: "#7041c9", eye: "#2d2638", frame: "#382b40" } },
  { name: "Amber afternoon", colors: { skin: "#a96d51", hair: "#332b32", outfit: "#007d6d", accent: "#ffda3b", background: "#ffb836", backgroundEnd: "#ef6b32", eye: "#282a32", frame: "#443138" } },
  { name: "Quiet lagoon", colors: { skin: "#edbc98", hair: "#384751", outfit: "#813bed", accent: "#a6fa51", background: "#53e3c4", backgroundEnd: "#009aac", eye: "#2e3644", frame: "#30495b" } },
  { name: "Rose notebook", colors: { skin: "#85503e", hair: "#272e3c", outfit: "#1665c4", accent: "#ff8498", background: "#ff87b4", backgroundEnd: "#cf4186", eye: "#211e29", frame: "#efd3aa" } },
  { name: "Orchard morning", colors: { skin: "#c38763", hair: "#58413d", outfit: "#7334c9", accent: "#c1f528", background: "#afe956", backgroundEnd: "#32a789", eye: "#302b37", frame: "#493345" } },
  { name: "Blue hour", colors: { skin: "#efc7a8", hair: "#51405d", outfit: "#006f84", accent: "#ffc62c", background: "#52b7fa", backgroundEnd: "#2864d8", eye: "#352d3e", frame: "#374052" } },
] as const;

function hashSeed(seed: string | number): number {
  const text = String(seed); let hash = 2166136261;
  for (let index = 0; index < text.length; index++) hash = Math.imul(hash ^ text.charCodeAt(index), 16777619);
  return hash >>> 0;
}

/** Stable fictional portrait parts and colors, with no ambient randomness. */
export function generateCharacterConfig(seed: string | number = "orangeui:portrait", gender?: "male" | "female"): NormalizedCharacterConfig {
  const hash = hashSeed(seed);
  const identity = gender ?? ((hash >>> 19) % 2 === 0 ? "female" : "male");
  const hairstyles = identity === "male" ? CHARACTER_MALE_HAIR : CHARACTER_FEMALE_HAIR;
  return {
    version: 1, colors: { ...CHARACTER_PALETTES[hash % CHARACTER_PALETTES.length].colors },
    parts: { hair: hairstyles[(hash >>> 3) % hairstyles.length], glasses: CHARACTER_GLASSES[(hash >>> 7) % 3], outfit: CHARACTER_OUTFITS[(hash >>> 11) % CHARACTER_OUTFITS.length], face: CHARACTER_FACES[(hash >>> 15) % CHARACTER_FACES.length], accents: true, earring: identity === "female" && Boolean(hash & 2), gender: identity, facialHair: identity === "male" ? CHARACTER_FACIAL_HAIR[(hash >>> 23) % 4] : "none" },
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
export function normalizeCharacterConfig(value: unknown): NormalizedCharacterConfig {
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
      gender: part(parts.gender, CHARACTER_GENDERS, "female"),
      facialHair: parts.gender === "male" ? part(parts.facialHair, CHARACTER_FACIAL_HAIR, "none") : "none",
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

/** Original three-quarter portrait, layered for gaze and exported from the same geometry. */
export function characterSvgBody(input: CharacterConfig, id: string, options: CharacterRenderOptions = {}): string {
  const config = normalizeCharacterConfig(input), ns = namespace(id), { parts } = config;
  const paint = (key: keyof CharacterColors) => options.portable ? config.colors[key] : `var(--character-${key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}, ${config.colors[key]})`;
  const shade = (name: string, from: keyof CharacterColors, to: string, amount: number) => {
    const color = mix(config.colors[from], to, amount);
    return options.portable ? color : `var(--character-${name}, ${color})`;
  };
  const skin = paint("skin"), hair = paint("hair"), outfit = paint("outfit"), accent = paint("accent"), ink = paint("eye"), frame = paint("frame");
  const skinShadow = shade("skin-shadow", "skin", "#743c43", .31), skinLight = shade("skin-highlight", "skin", "#fff4dc", .27);
  const hairLight = shade("hair-highlight", "hair", "#a84786", .25), hairShadow = shade("hair-shadow", "hair", "#180d22", .35);
  const outfitLight = shade("outfit-highlight", "outfit", "#8c8aa2", .16), outfitShadow = shade("outfit-shadow", "outfit", "#11121e", .35);
  const mouth = shade("lip", "skin", "#723842", .56), iris = shade("iris", "eye", "#b48057", .32);
  const male = parts.gender === "male";
  const tile = options.appearance === "pixel" ? "M20 4H220V12H232V20H236V220H228V232H220V236H20V228H8V220H4V20H12V8H20Z" : "M22 4H218Q236 4 236 22V218Q236 236 218 236H22Q4 236 4 218V22Q4 4 22 4Z";
  const face = male
    ? parts.face === "round" ? "M86 45Q59 50 54 83L55 117Q58 139 73 151Q90 165 111 157L132 143L150 115L151 78L127 45Z"
      : parts.face === "long" ? "M87 42Q62 48 57 80L58 119L67 146L82 166L105 165L126 148L148 116L151 76L125 43Z"
      : parts.face === "angular" ? "M88 43L64 56L55 85L58 118L69 144L84 160L106 160L128 145L149 116L151 76L126 44Z"
      : "M87 44Q63 49 56 82L58 117Q61 137 74 150L87 159L107 159L128 143L148 116L151 77L125 44Z"
    : parts.face === "angular" ? "M88 45L66 58L56 88L55 109Q54 128 67 145L89 159L116 148L144 118L151 78L126 48Z" : parts.face === "long" ? "M88 46C66 54 56 78 57 98Q55 121 64 141Q72 161 94 163L118 150L145 119L148 81L124 49Z" : parts.face === "round" ? "M86 48C64 54 53 79 54 100Q51 130 64 145Q78 163 99 158Q113 157 125 142L146 116L146 78L123 49Z" : "M87 46C65 55 56 79 57 99Q55 121 65 140Q77 155 95 156L119 144L145 117L148 78L123 47Z";
  const defs = [
    `<linearGradient id="${ns}-background" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${paint("background")}"/><stop offset="1" stop-color="${paint("backgroundEnd")}"/></linearGradient>`,
    `<linearGradient id="${ns}-skin" x1="0" y1="0" x2="1" y2=".45"><stop stop-color="${skinLight}"/><stop offset=".42" stop-color="${skin}"/><stop offset="1" stop-color="${skinShadow}"/></linearGradient>`,
    `<linearGradient id="${ns}-fabric" x1=".1" y1="0" x2=".85" y2="1"><stop stop-color="${outfitLight}"/><stop offset=".4" stop-color="${outfit}"/><stop offset="1" stop-color="${outfitShadow}"/></linearGradient>`,
    `<clipPath id="${ns}-tile"><path d="${tile}"/></clipPath>`,
    `<clipPath id="${ns}-face"><path d="${face}"/></clipPath>`,
  ];
  let backHair = parts.hair === "swept" ? `<path d="M62 60C66 30 95 21 115 28C144 18 175 36 183 63C195 82 181 104 186 121L202 145L179 143L190 159L163 153L152 172L131 152L103 151L71 136L60 106Z" fill="${hair}" stroke="${hairShadow}" stroke-width="3" stroke-linejoin="round"/><path d="M157 71Q181 87 166 114L175 146L159 137L154 154L140 139Z" fill="${hairShadow}"/>` : parts.hair === "crop" ? `<path d="M57 99C47 71 53 39 80 28L99 32L114 21L126 30Q172 24 177 62L169 117L145 137L77 129Z" fill="${hairShadow}"/>` : `<path d="M60 122C45 120 40 104 49 95C32 87 38 67 53 63C44 48 57 31 73 36C76 20 94 18 106 30C119 14 139 19 143 32C162 24 179 38 177 52C195 53 203 71 191 82C201 97 192 114 177 115L173 137L145 145L90 144Z" fill="${hairShadow}"/>`;
  let shoulders = `<path d="M76 168L103 153L140 151L158 163C189 169 209 191 217 216L224 247H52L57 208C59 189 65 177 76 168Z" fill="url(#${ns}-fabric)" stroke="${outfitShadow}" stroke-width="2.4" stroke-linejoin="round"/>`;
  if (parts.outfit === "jacket") shoulders += `<path d="M82 162L97 160L119 179L131 164L152 160L167 176L146 188L126 183L102 182Z" fill="${outfitShadow}"/><path d="M91 167L102 165L119 180L110 191L82 179Z" fill="${outfitLight}"/><path d="M126 184L133 240" fill="none" stroke="${outfitShadow}" stroke-width="5"/><path d="M128 184L135 240" fill="none" stroke="${accent}" stroke-width="1.5"/><rect x="126" y="184" width="5" height="10" rx="1" fill="${accent}"/><path d="M79 194L108 198L107 204L77 200ZM78 209L100 211" fill="none" stroke="${accent}" stroke-width="3"/><path d="M161 196L174 196L179 202L173 210L161 207Z" fill="none" stroke="${accent}" stroke-width="2"/><path d="M167 197V206M164 201H173" stroke="${accent}" stroke-width="2"/><path d="M188 213L208 206M187 219L210 212" stroke="${accent}" stroke-width="3"/><path d="M80 224L91 217L104 220L112 231L101 227L90 231Z" fill="${accent}"/><path d="M145 226L151 217L169 218L178 228L168 225L157 234Z" fill="${accent}"/><path d="M174 175Q187 189 184 210L195 239M72 184L63 236" fill="none" stroke="${outfitShadow}" stroke-width="3"/>`;
  else if (parts.outfit === "crew") shoulders += `<path d="M90 158Q114 181 147 158L158 166Q121 196 81 173Z" fill="${accent}"/><path d="M88 172Q116 189 148 171" fill="none" stroke="${outfitShadow}" stroke-width="3"/><path d="M73 188L66 236M181 188L202 238" fill="none" stroke="${outfitLight}" stroke-width="3"/><path d="M100 215Q124 209 152 220" fill="none" stroke="${outfitLight}" stroke-width="4"/><path d="M99 170L97 180M111 174V186M124 175V187M138 170L142 182" stroke="${outfit}" stroke-width="2"/>`;
  else if (parts.outfit === "collar") shoulders += `<path d="M97 152L119 176L142 153L157 166L145 188L120 177L104 193L79 167Z" fill="${accent}"/><path d="M121 182L132 242" fill="none" stroke="${outfitLight}" stroke-width="10"/><circle cx="124" cy="199" r="2" fill="${accent}"/><circle cx="129" cy="224" r="2" fill="${accent}"/><path d="M76 207L105 211L101 231L75 226Z" fill="${outfitLight}"/><path d="M77 210L90 219L104 213" fill="none" stroke="${outfitShadow}" stroke-width="2"/>`;
  let frontHair = parts.hair === "swept" ? `<path d="M99 31C77 22 54 42 52 67Q48 77 36 87L56 86L64 79L62 102L72 108L79 92L79 68Q85 54 98 46C106 67 126 75 135 88L134 112L145 99L150 83Q168 88 182 77L167 67Q163 38 131 27Z" fill="${hair}" stroke="${hairShadow}" stroke-width="2.8" stroke-linejoin="round"/><path d="M97 34Q111 58 128 67L141 81M77 41Q60 53 60 76M119 32Q151 40 157 61" fill="none" stroke="${hairLight}" stroke-width="3" stroke-linecap="round"/>` : parts.hair === "crop" ? `<path d="M56 95C43 68 55 39 80 30L97 36L112 25L128 35Q163 29 174 63L161 100L146 109L145 80Q114 80 95 62L79 82L72 102Z" fill="${hair}" stroke="${hairShadow}" stroke-width="3"/><path d="M65 58L81 43L94 49M111 42Q131 61 157 58M64 75L76 66" fill="none" stroke="${hairLight}" stroke-width="4" stroke-linecap="round"/>` : `<path d="M53 91C39 77 49 59 63 61C53 43 72 27 85 38C92 21 110 27 117 38C132 25 150 33 152 47C171 38 187 52 181 67C191 78 178 95 164 87L150 109L142 101L142 82Q125 90 119 73Q99 86 91 70Q80 85 70 82L69 101Z" fill="${hair}" stroke="${hairShadow}" stroke-width="3"/><path d="M63 62Q61 44 80 48M93 49Q90 35 105 40M120 56Q120 40 137 47M151 63Q159 47 172 62M77 70Q88 58 99 64" fill="none" stroke="${hairLight}" stroke-width="3" stroke-linecap="round"/>`;
  const wardrobe = characterWardrobe(parts.hair, parts.outfit, { hair, hairLight, hairShadow, outfit, outfitLight, outfitShadow, accent });
  if (wardrobe.back !== undefined) backHair = wardrobe.back;
  if (wardrobe.front !== undefined) frontHair = wardrobe.front;
  if (parts.gender === "male" && parts.hair === "swept") {
    backHair = `<path d="M56 99Q45 71 57 47Q71 23 107 25Q148 16 174 47Q184 64 169 97L151 121L146 83L62 80Z" fill="${hairShadow}"/>`;
    frontHair = `<path d="M57 98Q42 65 61 45Q77 25 105 27Q139 16 170 46L173 64Q151 76 128 69Q110 62 101 48Q88 71 64 77L64 96Z" fill="${hair}" stroke="${hairShadow}" stroke-width="2.8" stroke-linejoin="round"/><path d="M64 56Q81 36 97 37M108 32Q133 56 161 53M105 42Q123 65 146 64" fill="none" stroke="${hairLight}" stroke-width="3" stroke-linecap="round"/>`;
  }
  shoulders += wardrobe.clothing;
  shoulders += `<g class="character-fabric-detail" fill="none" stroke-linecap="round"><path d="M74 177Q65 190 65 211L60 237M176 178Q186 189 187 204L205 238" stroke="${outfitShadow}" stroke-width="2"/><path d="M72 181Q66 191 67 204M179 183Q185 194 184 204M66 220L73 214M190 218L185 210" stroke="${outfitLight}" stroke-width="1.6"/><path d="M70 182Q64 197 64 210M180 182Q187 195 189 209" stroke="${accent}" stroke-opacity=".4" stroke-width=".7" stroke-dasharray="2 2.6"/><path d="M63 236L79 233M198 234L207 238" stroke="${outfitShadow}" stroke-width="1.5"/></g>`;
  function eye(x: number, y: number, index: number, wide: number) {
    if (male) {
      const path = `M${x - wide} ${y + 1}Q${x} ${y - 5} ${x + wide} ${y}Q${x + wide - 3} ${y + 7} ${x} ${y + 7}Q${x - wide + 4} ${y + 6} ${x - wide} ${y + 1}Z`;
      defs.push(`<clipPath id="${ns}-eye-${index}"><path d="${path}"/></clipPath>`);
      return `<g class="character-blink character-male-eye" style="transform-origin:${x}px ${y}px"><path d="${path}" fill="#fff7e9"/><g clip-path="url(#${ns}-eye-${index})"><g class="character-pupil"><circle cx="${x - 1}" cy="${y + 2}" r="5" fill="${iris}"/><circle cx="${x - 1}" cy="${y + 2}" r="3" fill="${ink}"/><circle cx="${x - 2.5}" cy="${y}" r="1.3" fill="#fff9ef"/></g></g><path d="M${x - wide} ${y + 1}Q${x} ${y - 5} ${x + wide} ${y}" fill="none" stroke="${ink}" stroke-width="1.5" stroke-linecap="round"/></g>`;
    }
    const path = `M${x - wide} ${y + 1}Q${x - 1} ${y - 9} ${x + wide} ${y}Q${x + wide - 2} ${y + 10} ${x} ${y + 9}Q${x - wide + 3} ${y + 8} ${x - wide} ${y + 1}Z`;
    defs.push(`<clipPath id="${ns}-eye-${index}"><path d="${path}"/></clipPath>`);
    return `<g class="character-blink" style="transform-origin:${x}px ${y}px"><path d="${path}" fill="#fff7e9"/><g clip-path="url(#${ns}-eye-${index})"><g class="character-pupil"><ellipse cx="${x - 2}" cy="${y + 3}" rx="5.8" ry="7.2" fill="${iris}"/><ellipse cx="${x - 2}" cy="${y + 3}" rx="3.4" ry="5.2" fill="${ink}"/><circle cx="${x - 3.5}" cy="${y}" r="1.6" fill="#fff9ef"/><circle cx="${x}" cy="${y + 6}" r=".65" fill="${skinLight}"/></g><path d="M${x - wide} ${y}Q${x - 1} ${y - 7} ${x + wide} ${y}" stroke="${skinShadow}" stroke-opacity=".35" stroke-width="4" fill="none"/></g><path d="M${x - wide} ${y + 1}Q${x - 1} ${y - 9} ${x + wide} ${y}" fill="none" stroke="${ink}" stroke-width="1.8" stroke-linecap="round"/><path d="M${x - wide + 3} ${y + 8}Q${x} ${y + 12} ${x + wide - 3} ${y + 6}" fill="none" stroke="${skinShadow}" stroke-width="1" stroke-linecap="round"/></g>`;
  }
  const eyes = eye(73, 97, 0, 11) + eye(114, 98, 1, 14);
  const facialHair = parts.facialHair === "none" ? "" : parts.facialHair === "mustache" ? `<path class="character-facial-hair" d="M66 131Q75 125 82 130Q90 126 99 134Q89 140 82 134Q74 138 66 131Z" fill="${hair}"/>` : `<g class="character-facial-hair"><path d="M62 120Q70 137 81 139Q104 146 136 119L131 142Q105 166 81 157Q64 151 62 120Z" fill="${hair}" opacity="${parts.facialHair === "stubble" ? .25 : .92}"/><path d="M70 136Q82 137 96 139" fill="none" stroke="${skin}" stroke-width="3" stroke-linecap="round"/></g>`;
  let glasses = "";
  if (parts.glasses === "round") glasses = `<path d="M55 91Q69 83 88 90L87 111Q82 123 66 119Q55 116 55 105ZM98 90Q115 82 136 90L133 112Q128 125 109 121Q98 118 97 107Z" fill="#fff8ef" fill-opacity=".12" stroke="${frame}" stroke-width="3.7" stroke-linejoin="round"/><path d="M89 99Q94 96 98 99M136 94L151 87" fill="none" stroke="${frame}" stroke-width="3.5" stroke-linecap="round"/>`;
  if (parts.glasses === "angular") glasses = `<path d="M53 89L87 87L88 112L63 117L56 109ZM97 88L136 87L134 111L105 118L98 109Z" fill="#fff8ef" fill-opacity=".12" stroke="${frame}" stroke-width="3.7" stroke-linejoin="round"/><path d="M88 98L98 97M136 91L151 85" fill="none" stroke="${frame}" stroke-width="3.5" stroke-linecap="round"/>`;
  if (glasses) glasses += `<path d="M61 91L66 111M105 91L111 115" stroke="#ffffff" stroke-opacity=".26" stroke-width="3" stroke-linecap="round"/>`;
  const facialDetails = male ? `<g class="character-face-detail character-male-face"><path d="M57 112L69 137L88 152L109 151L132 133L146 111L134 144L110 160L85 160L69 145Z" fill="${skinShadow}" opacity=".45"/><path d="M62 84L73 80L85 83M101 82L116 78L132 82" fill="none" stroke="${hair}" stroke-width="4.5" stroke-linecap="round"/><path d="M91 105L87 118Q89 124 96 121" fill="none" stroke="${skinShadow}" stroke-width="2.2" stroke-linecap="round"/><path d="M86 108L83 117" fill="none" stroke="${skinLight}" stroke-width="2"/><path d="M75 134Q86 140 100 133" fill="none" stroke="${ink}" stroke-opacity=".8" stroke-width="1.8" stroke-linecap="round"/><path d="M82 145L99 145" fill="none" stroke="${skinShadow}" stroke-opacity=".45" stroke-width="1.4" stroke-linecap="round"/></g>` : `<g class="character-face-detail"><path d="M58 119Q65 126 76 132Q81 143 95 147Q111 146 134 120L128 143Q101 167 73 154Z" fill="${skinShadow}" opacity=".65"/><path d="M88 56Q74 70 66 88L62 102Q66 74 79 61Z" fill="${skinLight}" opacity=".65"/><path d="M100 112Q115 108 127 113Q120 123 104 122Z" fill="${skinLight}" opacity=".24"/><path d="M61 85Q71 78 84 83L83 85Q72 82 63 87Z M101 83Q115 75 129 82L129 85Q113 80 102 86Z" fill="${hair}"/><path d="M86 108Q82 115 78 120Q78 125 86 122" fill="none" stroke="${mouth}" stroke-width="1.5" stroke-linecap="round"/><path d="M81 111L78 117" fill="none" stroke="${skinLight}" stroke-width="2" stroke-linecap="round"/><path d="M82 124Q85 126 88 124" fill="none" stroke="${skinShadow}" stroke-width="1"/><path d="M69 134Q75 132 80 134Q86 134 94 138Q81 145 70 137Z" fill="${mouth}" opacity=".86"/><path d="M70 136Q82 138 93 138" fill="none" stroke="${ink}" stroke-opacity=".65" stroke-width="1.1" stroke-linecap="round"/><path d="M76 140Q83 142 88 140M83 147Q90 149 95 146" fill="none" stroke="${skinLight}" stroke-opacity=".7" stroke-width="1.5" stroke-linecap="round"/><path d="M96 135L97 138" stroke="${skinShadow}" stroke-width="1.2" stroke-linecap="round"/></g>`;
  const sparkles = parts.accents ? `<g fill="#fff0d9"><path d="M27 50L30 58L38 61L30 64L27 72L24 64L16 61L24 58ZM207 36L211 45L220 48L211 51L207 60L204 51L195 48L204 45ZM31 173L35 182L44 185L35 188L31 198L28 188L19 185L28 182Z"/><circle cx="210" cy="112" r="2.5"/><circle cx="34" cy="137" r="2"/><path d="M201 136L204 141L210 143L204 146L201 152L199 146L193 143L199 141Z"/></g>` : "";
  const borderColor = options.appearance === "neobrutalism" || options.appearance === "pixel" ? frame : "#fff0d9";
  return `<defs>${defs.join("")}</defs><g clip-path="url(#${ns}-tile)"><path d="${tile}" fill="url(#${ns}-background)"/><path d="M22 13H218Q226 13 226 23V217Q226 227 215 227H23Q13 227 13 216V24Q13 13 22 13Z" fill="none" stroke="${borderColor}" stroke-width="${options.appearance === "neobrutalism" ? 4 : 2.5}"/>${sparkles}<g class="character-hair-back">${backHair}</g><g class="character-neck"><path d="M98 130L95 159Q119 181 143 159L141 119Z" fill="${skin}"/><path d="M99 136L132 127L114 156L123 168L97 157Z" fill="${skinShadow}"/></g><g class="character-shoulders">${shoulders}</g><g class="character-head"><path d="${face}" fill="url(#${ns}-skin)" stroke="${skinShadow}" stroke-width="1.2"/><g clip-path="url(#${ns}-face)">${facialDetails}${facialHair}${eyes}</g><path d="M139 96C149 81 164 88 159 107Q155 122 140 119L133 113Z" fill="${skin}"/><path d="M143 105Q154 91 153 103L145 113" fill="none" stroke="${skinShadow}" stroke-width="4" stroke-linecap="round"/>${parts.earring ? `<path d="M150 115Q161 126 151 129Q143 129 143 121" fill="none" stroke="${accent}" stroke-width="3.5" stroke-linecap="round"/>` : ""}</g><g class="character-hair-front">${frontHair}</g><g class="character-glasses">${glasses}</g></g>`;
}

/** Standalone settled SVG, also suitable as input to an SVG-to-PNG helper. */
export function characterToSvgString(config: CharacterConfig, size = 256, options: Omit<CharacterRenderOptions, "portable"> & { id?: string } = {}): string {
  const pixels = Number.isFinite(size) ? Math.round(Math.min(4096, Math.max(16, size))) : 256;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${pixels}" height="${pixels}" viewBox="0 0 240 240" role="img" aria-label="Original illustrated character">${characterSvgBody(config, options.id ?? "export", { ...options, portable: true })}</svg>`;
}
