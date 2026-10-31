import type { Appearance } from "./appearance";

export const MASCOT_OPTIONS = [
  { value: "dune-hopper", label: "Dune hopper", description: "Long ears, soft paws, always listening." },
  { value: "puddle-puff", label: "Puddle puff", description: "A round river creature with a paddle tail." },
  { value: "lantern-moth", label: "Lantern moth", description: "Broad folded wings and two curious feelers." },
  { value: "moss-snail", label: "Moss snail", description: "A small explorer carrying a leafy spiral." },
  { value: "tumble-bird", label: "Tumble bird", description: "A plump ground bird with a fan of feathers." },
  { value: "cairn-sprite", label: "Cairn sprite", description: "Three friendly stones finding their balance." },
  { value: "burrow-bud", label: "Burrow bud", description: "A little digger with a leaf-shaped tail." },
  { value: "ribbon-ray", label: "Ribbon ray", description: "A floating kite creature with trailing fins." },
] as const;

export type MascotKind = typeof MASCOT_OPTIONS[number]["value"];
export type MascotState = "idle" | "thinking" | "talking" | "error";
export type MascotColors = {
  body: string;
  accent: string;
  background: string;
  backgroundEnd: string;
  eye: string;
};
export type MascotConfig = { version: 1; mascot: MascotKind; colors: MascotColors; detail: 0 | 1 | 2 };

export const MASCOT_PALETTES = [
  { name: "Apricot evening", colors: { body: "#fff4da", accent: "#278b80", background: "#f2bd4d", backgroundEnd: "#e8aa39", eye: "#252923" } },
  { name: "Lagoon day", colors: { body: "#b7e0d6", accent: "#427e88", background: "#ebd9af", backgroundEnd: "#dec99a", eye: "#183d46" } },
  { name: "Golden pollen", colors: { body: "#ffdc89", accent: "#d57f5a", background: "#abc4b0", backgroundEnd: "#8dad99", eye: "#40332c" } },
  { name: "Mint garden", colors: { body: "#d4e6b1", accent: "#729566", background: "#b7abc8", backgroundEnd: "#a496bb", eye: "#273d39" } },
  { name: "Berry milk", colors: { body: "#f8d2d9", accent: "#c86b83", background: "#b7c8e5", backgroundEnd: "#9dafd6", eye: "#342943" } },
  { name: "Cloud pebble", colors: { body: "#e0e4ed", accent: "#8897bc", background: "#d9bba5", backgroundEnd: "#cfa88d", eye: "#303249" } },
  { name: "Copper leaf", colors: { body: "#ffefd2", accent: "#db6b4f", background: "#c8d8a4", backgroundEnd: "#b5c58e", eye: "#403034" } },
  { name: "Lilac tide", colors: { body: "#d9c9f3", accent: "#9880c6", background: "#b2d3d4", backgroundEnd: "#94bdbf", eye: "#31354e" } },
] as const;

const DEFAULT_SEED = "orangeui:character";

function hashSeed(seed: string | number): number {
  let hash = 2166136261;
  const text = String(seed);
  for (let index = 0; index < text.length; index++) hash = Math.imul(hash ^ text.charCodeAt(index), 16777619);
  return hash >>> 0;
}

/** Stable identity data. The animation clock and transient reactions are never saved. */
export function generateMascotConfig(seed: string | number = DEFAULT_SEED): MascotConfig {
  const hash = hashSeed(seed);
  return {
    version: 1,
    mascot: MASCOT_OPTIONS[hash % MASCOT_OPTIONS.length].value,
    colors: { ...MASCOT_PALETTES[(hash >>> 8) % MASCOT_PALETTES.length].colors },
    detail: ((hash >>> 16) % 3) as 0 | 1 | 2,
  };
}

function normalizeColor(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const hex = value.trim().toLowerCase();
  if (/^#[a-f\d]{6}$/.test(hex)) return hex;
  if (/^#[a-f\d]{3}$/.test(hex)) return `#${[...hex.slice(1)].map((digit) => digit + digit).join("")}`;
  return fallback;
}

/** Whitelist saved values before any string becomes SVG. */
export function normalizeMascotConfig(value: unknown): MascotConfig {
  const fallback = generateMascotConfig(DEFAULT_SEED);
  if (!value || typeof value !== "object" || Array.isArray(value)) return fallback;
  const candidate = value as Partial<MascotConfig>;
  if (candidate.version !== undefined && candidate.version !== 1) return fallback;
  const colors = candidate.colors && typeof candidate.colors === "object" && !Array.isArray(candidate.colors) ? candidate.colors : {};
  return {
    version: 1,
    mascot: MASCOT_OPTIONS.some(({ value }) => value === candidate.mascot) ? candidate.mascot! : fallback.mascot,
    colors: Object.fromEntries(Object.entries(fallback.colors).map(([key, color]) => [key, normalizeColor((colors as Record<string, unknown>)[key], color)])) as MascotColors,
    detail: candidate.detail === 0 || candidate.detail === 1 || candidate.detail === 2 ? candidate.detail : fallback.detail,
  };
}

export function mascotLabel(kind: MascotKind): string {
  return MASCOT_OPTIONS.find(({ value }) => value === kind)?.label ?? "Character";
}

export type MascotRenderOptions = { appearance?: Appearance; state?: MascotState; portable?: boolean };

function namespace(value: string) {
  return `mc-${Array.from(value).map((character) => /^[a-z\d-]$/i.test(character) ? character : `_${character.codePointAt(0)?.toString(16)}_`).join("")}`;
}

/**
 * Original geometric layers on a 160 by 160 viewBox. No external assets, DOM,
 * system font, random value, or reference artwork is used by this renderer.
 */
export function mascotSvgBody(input: MascotConfig, id: string, options: MascotRenderOptions = {}): string {
  const config = normalizeMascotConfig(input);
  const ns = namespace(id);
  const state = ["idle", "thinking", "talking", "error"].includes(options.state ?? "") ? options.state! : "idle";
  const portable = options.portable ?? false;
  const color = (name: keyof MascotColors) => portable ? config.colors[name] : `var(--mascot-${name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}, ${config.colors[name]})`;
  const body = color("body"), accent = color("accent"), ink = color("eye");
  const cream = portable ? "#fff8e8" : "var(--mascot-eye-white, #fff8e8)";
  const pixel = options.appearance === "pixel";
  const outline = pixel ? "M28 4H132V8H144V16H152V28H156V132H152V144H144V152H132V156H28V152H16V144H8V132H4V28H8V16H16V8H28Z"
    : options.appearance === "terminal" ? "M12 4H148Q156 4 156 12V148Q156 156 148 156H12Q4 156 4 148V12Q4 4 12 4Z"
      : "M80 4C143 4 156 17 156 80C156 143 143 156 80 156C17 156 4 143 4 80C4 17 17 4 80 4Z";
  const defs: string[] = [
    `<linearGradient id="${ns}-background" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${color("background")}"/><stop offset="1" stop-color="${color("backgroundEnd")}"/></linearGradient>`,
    `<linearGradient id="${ns}-shine" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#ffffff" stop-opacity="0.13"/><stop offset="0.65" stop-color="#ffffff" stop-opacity="0"/></linearGradient>`,
    `<clipPath id="${ns}-tile"><path d="${outline}"/></clipPath>`,
  ];
  let eyeIndex = 0;
  const line = `stroke="${ink}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"`;
  function eyes(x: number, y: number, separation: number, rx = 11, ry = 14) {
    rx *= .48; ry *= .52;
    return [-1, 1].map((side) => {
      const eyeId = `${ns}-eye-${eyeIndex++}`;
      defs.push(`<clipPath id="${eyeId}"><ellipse rx="${rx}" ry="${ry}"/></clipPath>`);
      const eyebrow = state === "error" ? `<path d="M${-rx} ${-ry - 5}L${rx} ${-ry - (side < 0 ? 1 : 9)}" fill="none" ${line}/>` : "";
      return `<g transform="translate(${x + side * separation / 2} ${y})">${eyebrow}<g class="mascot-blink"><ellipse rx="${rx}" ry="${ry}" fill="${ink}"/><g clip-path="url(#${eyeId})"><g class="mascot-pupil"><ellipse cy="2" rx="${rx * .8}" ry="${ry * .85}" fill="${ink}"/><ellipse cx="-1.6" cy="-1.5" rx="1.1" ry="1.4" fill="${cream}"/></g></g></g></g>`;
    }).join("");
  }
  function mouth(x: number, y: number, width = 8) {
    if (state === "talking") return `<g transform="translate(${x} ${y})"><ellipse class="mascot-talking-mouth" cy="2" rx="${width * .8}" ry="${width}" fill="${ink}"/><path d="M-4 6Q0 3 4 6" fill="none" stroke="${accent}" stroke-width="3" stroke-linecap="round"/></g>`;
    const path = state === "error" ? `M${-width} 5Q0 -3 ${width} 5` : state === "thinking" ? `M${-width * .65} 3L${width * .65} 3` : `M${-width} 0Q0 8 ${width} 0`;
    return `<path d="${path}" transform="translate(${x} ${y})" fill="none" ${line}/>`;
  }
  function cheeks(x: number, y: number, separation = 47) {
    return `<ellipse cx="${x - separation / 2}" cy="${y}" rx="5" ry="2.5" fill="#e88285" opacity="0.78"/><ellipse cx="${x + separation / 2}" cy="${y}" rx="5" ry="2.5" fill="#e88285" opacity="0.78"/>`;
  }
  function freckles(x: number, y: number) {
    if (config.detail === 0) return `<path d="M${x - 4} ${y}h8" fill="none" stroke="${accent}" stroke-width="4" stroke-linecap="round"/>`;
    if (config.detail === 1) return `<circle cx="${x - 5}" cy="${y}" r="2" fill="${accent}"/><circle cx="${x + 5}" cy="${y}" r="2" fill="${accent}"/>`;
    return `<path d="M${x - 6} ${y + 2}l6 -5 6 5" fill="none" stroke="${accent}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;
  }
  let art = "";
  switch (config.mascot) {
    case "dune-hopper":
      art = `<g class="mascot-tail" style="transform-origin:115px 126px"><path d="M111 124Q143 113 139 133Q130 146 113 140Z" fill="${body}"/></g><g class="mascot-idle"><path d="M52 112Q76 98 108 112L119 147H43Z" fill="${body}"/><path d="M97 126Q113 122 115 145L96 149" fill="${body}"/><g class="mascot-face"><g class="mascot-ear" style="transform-origin:56px 56px"><path d="M43 63C33 39 33 15 45 15C55 16 62 38 63 56Z" fill="${body}"/><path d="M44 29L50 47" stroke="${accent}" stroke-width="6" stroke-linecap="round"/></g><g class="mascot-ear mascot-ear-late" style="transform-origin:104px 54px"><path d="M94 52C99 26 108 13 118 19Q130 29 111 58Z" fill="${body}"/><path d="M113 29L104 46" stroke="${accent}" stroke-width="6" stroke-linecap="round"/></g><path d="M40 67Q45 47 80 47Q114 45 125 69L131 88L124 93L130 99L123 103L127 110Q114 128 84 130Q60 129 43 116L36 109L42 105L35 99L41 92L35 86Z" fill="${body}"/><path d="M39 67Q43 40 77 39Q108 36 122 59L126 75Q93 63 58 74L29 77Q22 67 39 67Z" fill="${accent}"/><path d="M52 58Q75 49 101 60" fill="none" stroke="${cream}" stroke-width="2.5" stroke-linecap="round"/><path d="M81 45L91 46L96 54L84 58L77 51Z" fill="${cream}"/>${eyes(81, 88, 34, 10, 13)}${cheeks(81, 103, 50)}<path d="M74 104Q80 100 87 104L81 110Z" fill="${ink}"/>${mouth(81, 112, 6)}</g><path d="M42 111Q29 110 27 126Q28 142 42 141L52 130Q63 122 60 114Q55 107 49 110L49 101Q40 96 39 105Z" fill="${body}"/><path d="M32 126L39 133M40 123L47 130" fill="none" stroke="${ink}" stroke-width="2.5" stroke-linecap="round"/></g>`;
      break;
    case "puddle-puff":
      art = `<g class="mascot-tail" style="transform-origin:112px 115px"><path d="M110 118C120 105 125 88 142 91C151 93 147 111 138 120C127 131 119 130 110 126Z" fill="${accent}"/><path d="M123 120L138 101" fill="none" stroke="${body}" stroke-width="4" stroke-linecap="round"/></g>
        <g class="mascot-idle"><path d="M43 109L35 132Q45 141 61 132L68 117ZM90 119L96 135Q113 139 119 130L111 112Z" fill="${accent}"/><path d="M39 64C31 43 42 34 53 49L57 56ZM100 57C111 34 125 39 118 64Z" fill="${accent}"/>
        <path d="M27 91C26 62 48 49 78 49C110 48 132 65 129 94C127 124 107 135 79 134C47 135 27 123 27 91Z" fill="${body}"/><path d="M47 107Q78 91 111 107Q106 128 80 129Q54 129 47 107Z" fill="${cream}" opacity="0.5"/>
        <path d="M27 88Q16 91 24 109L42 111Z" fill="${accent}"/><path d="M128 88Q141 94 132 109L115 111Z" fill="${accent}"/><g class="mascot-face">${freckles(78, 61)}${eyes(79, 84, 37, 12, 14)}${cheeks(79, 102, 54)}${mouth(79, 105, 9)}</g></g>`;
      break;
    case "lantern-moth":
      art = `<g class="mascot-idle"><g class="mascot-wing" style="transform-origin:76px 79px"><path d="M70 60C51 28 20 29 17 54C13 73 34 86 55 88C26 87 25 113 47 120C63 125 70 107 76 88Z" fill="${body}"/><path d="M59 64C45 44 28 41 26 54C24 65 43 77 60 78Z" fill="${accent}"/><path d="M44 104Q44 94 59 95Q61 111 51 111Z" fill="${accent}"/></g>
        <g class="mascot-wing mascot-wing-late" style="transform-origin:84px 79px"><path d="M90 60C109 28 140 29 143 54C147 73 126 86 105 88C134 87 135 113 113 120C97 125 90 107 84 88Z" fill="${body}"/><path d="M101 64C115 44 132 41 134 54C136 65 117 77 100 78Z" fill="${accent}"/><path d="M116 104Q116 94 101 95Q99 111 109 111Z" fill="${accent}"/></g>
        <path d="M62 82Q80 71 98 82L93 118Q80 139 67 118Z" fill="${accent}"/><path d="M67 105H93M70 117H90" fill="none" stroke="${body}" stroke-width="5" stroke-linecap="round"/>
        <g class="mascot-face"><g class="mascot-ear" style="transform-origin:67px 54px"><path d="M67 56Q68 30 53 27" fill="none" stroke="${body}" stroke-width="6" stroke-linecap="round"/><circle cx="52" cy="27" r="5" fill="${accent}"/></g><g class="mascot-ear mascot-ear-late" style="transform-origin:92px 54px"><path d="M92 56Q90 32 105 25" fill="none" stroke="${body}" stroke-width="6" stroke-linecap="round"/><circle cx="105" cy="25" r="5" fill="${accent}"/></g>
        <path d="M53 69Q53 47 80 47Q107 47 107 69Q110 91 80 94Q50 91 53 69Z" fill="${body}"/>${eyes(80, 71, 27, 10, 13)}${mouth(80, 88, 6)}</g></g>`;
      break;
    case "moss-snail":
      art = `<g class="mascot-tail" style="transform-origin:58px 119px"><path d="M63 118C49 109 21 111 13 124C20 137 54 135 72 129Z" fill="${accent}"/></g>
        <g class="mascot-idle"><path d="M39 96C34 76 40 54 63 49C87 43 106 61 105 84C104 106 84 122 63 117Z" fill="${accent}"/><path d="M66 58C47 60 42 86 57 99C71 112 92 99 89 82C86 66 67 67 62 79C59 89 70 94 76 87" fill="none" stroke="${body}" stroke-width="8" stroke-linecap="round"/>
        <g class="mascot-ear" style="transform-origin:64px 54px"><path d="M64 54C46 51 48 33 48 30C64 30 69 40 64 54Z" fill="${body}"/><path d="M68 53C64 35 78 28 85 29C86 44 79 51 68 53Z" fill="${body}"/></g>
        <path d="M49 117Q77 115 82 99L86 83Q94 64 118 73Q134 82 132 103L127 119Q142 126 139 133H54Q34 132 37 122Z" fill="${body}"/>
        <g class="mascot-face"><path d="M92 81L90 60M117 80L123 59" fill="none" stroke="${body}" stroke-width="13" stroke-linecap="round"/>${eyes(106, 58, 34, 10, 13)}${cheeks(106, 93, 32)}${mouth(107, 95, 8)}${freckles(107, 115)}</g></g>`;
      break;
    case "tumble-bird":
      art = `<g class="mascot-tail" style="transform-origin:111px 111px"><path d="M108 111C128 92 141 72 143 54C131 53 120 65 115 80C126 62 122 46 114 44C103 54 101 77 103 100Z" fill="${accent}"/><path d="M114 111Q143 94 148 77Q133 74 115 99Z" fill="${body}"/></g>
        <g class="mascot-idle"><path d="M56 124L52 139H69L71 125ZM88 126L90 139H107L100 123Z" fill="${accent}"/><path d="M41 58C55 39 83 39 103 61C121 80 127 109 109 124C88 141 48 132 35 116C22 100 28 77 41 58Z" fill="${body}"/>
        <g class="mascot-wing" style="transform-origin:53px 89px"><path d="M40 87C25 111 43 130 60 116C75 104 69 90 58 87Z" fill="${accent}"/><path d="M41 101L51 111M47 95L59 105" fill="none" stroke="${body}" stroke-width="3" stroke-linecap="round"/></g>
        <g class="mascot-face"><g class="mascot-ear" style="transform-origin:72px 51px"><path d="M60 51Q49 32 66 27L74 45Q79 30 91 35L83 53Z" fill="${accent}"/></g>${eyes(77, 76, 28, 10, 14)}<path d="M69 92Q79 88 89 93L79 103Z" fill="${accent}"/>${mouth(79, 106, 5)}${cheeks(76, 93, 47)}</g></g>`;
      break;
    case "cairn-sprite":
      art = `<g class="mascot-tail" style="transform-origin:112px 116px"><path d="M109 116L136 108Q149 111 139 121L114 125Z" fill="${accent}"/></g>
        <g class="mascot-idle"><path d="M38 115Q47 106 73 109Q113 104 123 121Q127 138 83 139Q34 140 30 128Q28 120 38 115Z" fill="${accent}"/><path d="M48 96Q37 88 46 75Q55 67 84 67Q111 67 118 83Q127 101 98 108Q68 115 48 96Z" fill="${body}"/><path d="M35 86L21 91Q15 100 27 106L44 98ZM120 83L136 89Q143 99 132 103L117 95Z" fill="${accent}"/>
        <g class="mascot-face"><g class="mascot-ear" style="transform-origin:79px 41px"><path d="M75 43Q60 37 66 22Q80 22 84 34Q84 21 96 22Q103 38 87 43Z" fill="${accent}"/></g><path d="M44 57Q42 39 67 35Q94 29 111 43Q123 55 113 76Q96 88 66 83Q44 82 44 57Z" fill="${body}"/>${eyes(80, 61, 31, 10, 13)}${cheeks(80, 74, 48)}${mouth(80, 78, 6)}${freckles(79, 44)}</g><path d="M63 124L72 128M91 121L102 125" fill="none" stroke="${body}" stroke-width="4" stroke-linecap="round"/></g>`;
      break;
    case "burrow-bud":
      art = `<g class="mascot-tail" style="transform-origin:113px 126px"><path d="M109 122Q128 103 142 111Q147 134 116 139Z" fill="${accent}"/><path d="M121 128L135 118" stroke="${body}" stroke-width="3"/></g><g class="mascot-idle"><path d="M53 109Q77 98 105 111L120 149H43Z" fill="${body}"/><path d="M102 129L109 147" fill="none" stroke="${ink}" stroke-width="3" stroke-linecap="round"/><g class="mascot-face"><g class="mascot-ear" style="transform-origin:48px 62px"><path d="M40 67Q22 33 35 28L62 51Z" fill="${body}"/><path d="M38 43L48 56" stroke="${accent}" stroke-width="7" stroke-linecap="round"/></g><g class="mascot-ear mascot-ear-late" style="transform-origin:114px 64px"><path d="M101 51L127 30Q145 39 124 70Z" fill="${body}"/><path d="M125 45L115 58" stroke="${accent}" stroke-width="7" stroke-linecap="round"/></g><path d="M37 71Q47 47 81 48Q119 48 130 75L128 89L135 94L128 100L133 106L125 109Q112 129 84 130Q57 129 40 114L32 108L37 102L31 96L38 90Z" fill="${body}"/><path d="M44 57Q61 29 94 39Q119 47 123 63L115 73Q79 57 50 77L28 76L31 66Z" fill="${accent}"/><path d="M70 47L77 44L86 51L79 60L71 58Z" fill="${cream}"/><path d="M48 63Q77 52 103 65" fill="none" stroke="${ink}" stroke-width="2.5" stroke-linecap="round"/>${eyes(84, 89, 36, 10, 12)}${cheeks(83, 103, 50)}<path d="M77 102Q84 99 90 104L83 111Z" fill="${ink}"/>${mouth(83, 112, 6)}</g><path d="M50 113Q40 101 30 111L23 123Q24 139 38 142L49 134L58 126Z" fill="${body}"/><path d="M30 119Q40 114 45 123L48 134M29 128L36 135" fill="none" stroke="${ink}" stroke-width="2.5" stroke-linecap="round"/></g>`;
      break;
    case "ribbon-ray":
      art = `<g class="mascot-tail" style="transform-origin:80px 106px"><path d="M74 104C55 122 82 136 71 147L86 147C99 130 72 126 87 108Z" fill="${accent}"/><path d="M92 107C100 119 119 110 124 129L135 129C129 101 110 114 103 97Z" fill="${body}"/></g>
        <g class="mascot-idle"><g class="mascot-wing" style="transform-origin:53px 79px"><path d="M60 51C41 43 18 58 9 89Q30 98 51 91L65 70Z" fill="${body}"/><path d="M46 65Q30 63 21 82L49 83Z" fill="${accent}"/></g><g class="mascot-wing mascot-wing-late" style="transform-origin:107px 79px"><path d="M100 51C119 43 142 58 151 89Q130 98 109 91L95 70Z" fill="${body}"/><path d="M114 65Q130 63 139 82L111 83Z" fill="${accent}"/></g>
        <g class="mascot-face"><path d="M79 32C105 31 123 60 116 83Q108 106 81 119Q53 107 45 84C35 57 54 34 79 32Z" fill="${body}"/><path d="M62 40Q77 30 96 40L80 56Z" fill="${accent}"/>${eyes(80, 74, 34, 11, 15)}${cheeks(80, 92, 53)}${mouth(80, 98, 8)}${freckles(80, 111)}</g></g>`;
      break;
  }
  art = art.replace(/<(path|ellipse|circle)\b[^>]*>/g, (tag) => {
    if (tag.includes('stroke=') || ![body, accent].some((paint) => tag.includes(`fill="${paint}"`))) return tag;
    return tag.replace('/>', ` stroke="${ink}" stroke-width="${pixel ? 3.5 : 3}" stroke-linejoin="round" stroke-linecap="round"/>`);
  });
  const thought = state === "thinking" ? `<g class="mascot-thinking-dots" fill="${cream}" aria-hidden="true"><circle cx="115" cy="36" r="3"/><circle cx="126" cy="27" r="4"/><circle cx="140" cy="20" r="5"/></g>` : "";
  const marks = config.detail === 0 ? `<path d="M24 28v8m-4 -4h8M133 127v6m-3 -3h6" fill="none" stroke="${cream}" stroke-width="2" stroke-linecap="round" opacity="0.5"/>`
    : config.detail === 1 ? `<circle cx="25" cy="34" r="3" fill="${cream}" opacity="0.4"/><circle cx="136" cy="122" r="2" fill="${cream}" opacity="0.5"/>`
      : `<path d="M19 31h7M132 123h7" fill="none" stroke="${cream}" stroke-width="3" stroke-linecap="round" opacity="0.4"/>`;
  let edge = `<path d="${outline}" fill="none" stroke="${cream}" stroke-opacity="0.18" stroke-width="1.5"/>`;
  if (options.appearance === "neobrutalism" || pixel) edge = `<path d="${outline}" fill="none" stroke="${ink}" stroke-width="${pixel ? 3 : 5}"/>`;
  if (options.appearance === "retro-os") {
    defs.push(`<linearGradient id="${ns}-bevel" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#ffffff" stop-opacity="0.9"/><stop offset="1" stop-color="#101015" stop-opacity="0.7"/></linearGradient>`);
    edge = `<path d="${outline}" fill="none" stroke="url(#${ns}-bevel)" stroke-width="5"/>`;
  }
  if (options.appearance === "terminal") edge = `<path d="${outline}" fill="none" stroke="${body}" stroke-opacity="0.7" stroke-width="2"/>`;
  return `<defs>${defs.join("")}</defs><g clip-path="url(#${ns}-tile)"><path d="${outline}" fill="url(#${ns}-background)"/>${marks}<g class="mascot-reaction-layer">${art}</g>${thought}${edge}</g>`;
}

/** A settled, self-contained frame for documents or SVG/PNG download pipelines. */
export function mascotToSvgString(config: MascotConfig, size = 256, options: Omit<MascotRenderOptions, "portable"> & { id?: string } = {}): string {
  const pixels = Number.isFinite(size) ? Math.round(Math.min(4096, Math.max(16, size))) : 256;
  const value = normalizeMascotConfig(config);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${pixels}" height="${pixels}" viewBox="0 0 160 160" role="img" aria-label="${mascotLabel(value.mascot)}">${mascotSvgBody(value, options.id ?? "export", { ...options, portable: true })}</svg>`;
}
