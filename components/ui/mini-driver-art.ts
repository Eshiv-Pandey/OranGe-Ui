import type { Appearance } from "./appearance";
import { artworkColor, artworkDimension, artworkMix, artworkNamespace, generateHelmetConfig, motorsportSeed, normalizeHelmetConfig, type HelmetConfig } from "./helmet-art";
import { miniDriverFace } from "./mini-driver-face";

export const DRIVER_SUITS = ["panel", "sash", "seamed"] as const;
export const DRIVER_BOOTS = ["round", "high"] as const;
export type MiniDriverColors = { suit: string; panels: string; gloves: string; boots: string; zip: string };
export type MiniDriverParts = { suit: typeof DRIVER_SUITS[number]; boots: typeof DRIVER_BOOTS[number]; belt: boolean };
export type MiniDriverConfig = { version: 1; helmet: HelmetConfig; colors: MiniDriverColors; parts: MiniDriverParts };
export type MiniDriverRenderOptions = { appearance?: Appearance; portable?: boolean };

export function generateMiniDriverConfig(seed: string | number = "orangeui:driver"): MiniDriverConfig {
  const hash = motorsportSeed(seed), helmet = generateHelmetConfig(`${seed}:helmet`);
  return { version: 1, helmet, colors: { suit: helmet.colors.stripe, panels: helmet.colors.shell, gloves: helmet.colors.stripeAlt, boots: helmet.colors.trim, zip: helmet.colors.stripeAlt }, parts: { suit: DRIVER_SUITS[(hash >>> 3) % 3], boots: DRIVER_BOOTS[(hash >>> 7) % 2], belt: true } };
}

export function normalizeMiniDriverConfig(value: unknown): MiniDriverConfig {
  const fallback = generateMiniDriverConfig();
  if (!value || typeof value !== "object" || Array.isArray(value)) return fallback;
  const candidate = value as Partial<MiniDriverConfig>;
  if (candidate.version !== undefined && candidate.version !== 1) return fallback;
  const colors = candidate.colors && typeof candidate.colors === "object" ? candidate.colors : {} as Partial<MiniDriverColors>;
  const parts = candidate.parts && typeof candidate.parts === "object" ? candidate.parts : {} as Partial<MiniDriverParts>;
  return {
    version: 1, helmet: candidate.helmet ? normalizeHelmetConfig(candidate.helmet) : fallback.helmet,
    colors: Object.fromEntries(Object.entries(fallback.colors).map(([key, color]) => [key, artworkColor(colors[key as keyof MiniDriverColors], color)])) as MiniDriverColors,
    parts: { suit: DRIVER_SUITS.includes(parts.suit!) ? parts.suit! : fallback.parts.suit, boots: DRIVER_BOOTS.includes(parts.boots!) ? parts.boots! : fallback.parts.boots, belt: typeof parts.belt === "boolean" ? parts.belt : fallback.parts.belt },
  };
}

/** Original compact driver silhouette. Helmet geometry shares the same gaze host. */
export function miniDriverSvgBody(input: MiniDriverConfig, id: string, options: MiniDriverRenderOptions = {}): string {
  const config = normalizeMiniDriverConfig(input), ns = artworkNamespace(id), pixel = options.appearance === "pixel";
  const paint = (key: keyof MiniDriverColors) => options.portable ? config.colors[key] : `var(--driver-${key}, ${config.colors[key]})`;
  const shade = (key: string, from: keyof MiniDriverColors, toward: string, amount: number) => options.portable ? artworkMix(config.colors[from], toward, amount) : `var(--driver-${key}, ${artworkMix(config.colors[from], toward, amount)})`;
  const suit = paint("suit"), panel = paint("panels"), boots = paint("boots"), gloves = paint("gloves"), zip = paint("zip");
  const ink = options.portable ? config.helmet.colors.trim : `var(--helmet-trim, ${config.helmet.colors.trim})`;
  const shadow = shade("shadow", "suit", "#162936", .36), light = shade("highlight", "suit", "#fff4d9", .25);
  const outline = options.appearance === "neobrutalism" ? 5 : 4;
  const torso = pixel ? "M95 135H144V141H165V156H174V218H165V231H78V220H69V157H79V145H95Z" : "M97 135C80 139 70 146 68 164L77 225Q119 239 166 224L175 165C173 147 155 139 140 136Z";
  const panelPaths = config.parts.suit === "panel" ? `<path d="M78 150L97 143L99 198L82 207L72 167ZM145 144L166 153L172 171L161 207L144 195Z" fill="${panel}"/><path d="M84 171L99 178M146 178L166 171" stroke="${shadow}" stroke-width="3"/>`
    : config.parts.suit === "sash" ? `<path d="M79 151L95 141L167 198L165 223L155 223L72 170Z" fill="${panel}"/><path d="M78 145L169 212" stroke="${zip}" stroke-width="5"/>`
      : `<path d="M81 151L91 175L88 214M161 151L151 175L156 214" stroke="${panel}" stroke-width="9" fill="none" stroke-linecap="${pixel ? "square" : "round"}"/><path d="M77 154L87 177L84 214M166 154L156 177L160 214" stroke="${zip}" stroke-width="2" fill="none"/>`;
  const legs = `<path d="M79 220L116 224L118 278L84 286L75 270Z" fill="${suit}" stroke="${ink}" stroke-width="${outline}" stroke-linejoin="round"/><path d="M119 225L164 222L167 273L151 286L123 280Z" fill="${suit}" stroke="${ink}" stroke-width="${outline}" stroke-linejoin="round"/><path d="M77 233L86 275L96 272L89 232ZM151 231L151 278L160 275L162 231Z" fill="${shadow}"/><path d="M88 248L108 250L108 260L87 258ZM132 249L153 247L154 258L132 261Z" fill="${panel}"/>`;
  const shoeTop = config.parts.boots === "high" ? 267 : 279;
  const shoes = `<path d="M82 ${shoeTop}L116 ${shoeTop + 1}L118 298Q112 305 72 302L70 296Q73 285 82 284Z" fill="${boots}" stroke="${ink}" stroke-width="${outline}" stroke-linejoin="round"/><path d="M126 ${shoeTop + 1}L157 ${shoeTop}L162 285Q175 289 177 298L173 303L124 302Z" fill="${boots}" stroke="${ink}" stroke-width="${outline}" stroke-linejoin="round"/><path d="M73 297L116 298M127 298L174 298" stroke="${panel}" stroke-width="3"/><path d="M86 ${shoeTop + 6}L106 ${shoeTop + 8}M137 ${shoeTop + 8}L156 ${shoeTop + 6}" stroke="${zip}" stroke-width="4" stroke-linecap="round"/>`;
  const leftArm = `<g class="mini-driver-arm-rest"><path d="M82 147C62 147 55 170 53 187L60 210L79 205L81 178L90 159Z" fill="${suit}" stroke="${ink}" stroke-width="${outline}"/><path d="M60 174L79 181L77 192L55 185Z" fill="${panel}"/><path d="M60 205L78 205L84 224Q82 234 70 235L58 230L54 216Z" fill="${gloves}" stroke="${ink}" stroke-width="${outline}" stroke-linejoin="round"/><path d="M60 211L76 216M71 221L76 225" stroke="${ink}" stroke-opacity=".55" stroke-width="2" fill="none"/></g>`;
  const waveArm = `<g class="mini-driver-arm-wave"><path d="M157 159Q181 159 187 186L180 211L165 210L158 187L149 173Z" fill="${suit}" stroke="${ink}" stroke-width="${outline}"/><path d="M165 183L184 182L186 194L167 197Z" fill="${panel}"/><g class="driver-hand-rest"><path d="M165 207L182 208L188 222Q187 234 177 236L164 231L160 218Z" fill="${gloves}" stroke="${ink}" stroke-width="3"/><path d="M167 214L180 217M167 221L178 224" stroke="${ink}" stroke-width="1.7"/></g><g class="driver-hand-wave" opacity="0"><path d="M165 210L162 222L153 229Q150 235 156 236L165 232L166 247Q169 252 172 247L173 235L175 250Q179 253 181 248L181 234L185 246Q190 250 191 244L188 229L193 236Q198 237 198 232L185 210Z" fill="${gloves}" stroke="${ink}" stroke-width="2.5" stroke-linejoin="round"/></g></g>`;
  // A separate bent sleeve keeps the thumb upright rather than rotating a hand with a straight arm.
  const thumbArm = `<g class="mini-driver-arm-thumb" opacity="0"><path d="M157 157Q170 153 178 166L188 184L198 165L213 173L200 199Q191 212 180 206L159 185L151 169Z" fill="${suit}" stroke="${ink}" stroke-width="${outline}" stroke-linejoin="round"/><path d="M160 167L173 163L187 185L179 194Z" fill="${panel}"/><path d="M183 200Q191 204 197 193" fill="none" stroke="${shadow}" stroke-width="2.5" stroke-linecap="round"/><path d="M196 164L211 170L207 180L192 173Z" fill="${zip}" stroke="${ink}" stroke-width="2"/><g class="driver-hand-thumb"><path d="M195 169L189 156Q186 150 190 146Q193 143 198 147L201 150L201 133Q201 126 207 126Q213 126 213 133L212 145L220 146Q226 147 226 153L224 170Q223 178 215 180L202 177Z" fill="${gloves}" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/><path d="M209 152L223 154M207 159L223 161M205 166L222 168M201 150L201 160" fill="none" stroke="${ink}" stroke-width="1.7" stroke-linecap="round"/><path d="M205 133V141M214 149L219 150" stroke="${light}" stroke-width="2" stroke-linecap="round"/></g></g>`;
  const belt = config.parts.belt ? `<path d="M78 215Q121 225 166 216L165 225Q120 236 78 225Z" fill="${boots}"/><rect x="111" y="218" width="20" height="13" rx="${pixel ? 0 : 3}" fill="${zip}" stroke="${ink}" stroke-width="2"/><path d="M118 225H126" stroke="${ink}" stroke-width="2.5"/>` : "";
  return `<g class="mini-driver-body">${legs}${shoes}${leftArm}${waveArm}<path d="${torso}" fill="${suit}" stroke="${ink}" stroke-width="${outline}" stroke-linejoin="round"/>${panelPaths}<path d="M96 138Q120 151 143 139L146 150Q120 165 93 150Z" fill="${shadow}"/><path d="M119 157L121 218" stroke="${zip}" stroke-width="4"/><rect x="116" y="163" width="9" height="13" rx="${pixel ? 0 : 2}" fill="${zip}" stroke="${ink}" stroke-width="1.5"/><path d="M97 190L108 192L107 204L93 202ZM135 192L150 189L153 200L136 204Z" fill="${light}"/><path d="M95 191L102 198L108 193M136 193L143 198L150 191" fill="none" stroke="${shadow}" stroke-width="2"/>${belt}${thumbArm}<g class="mini-driver-patches"><path d="M87 180L102 180L105 184L101 188L87 187Z" fill="${zip}"/><path d="M137 177L155 180L154 186L138 184Z" fill="${panel}"/><path d="M99 194L111 198L118 188L127 199L139 194L134 206L119 203L103 207Z" fill="${zip}"/><path d="M110 184L121 181L129 183" fill="none" stroke="${panel}" stroke-width="2.5" stroke-linecap="round"/><path d="M83 238L91 243M84 249L93 254M87 262L96 267M155 239L148 245M157 253L149 259M157 266L150 272" stroke="${zip}" stroke-width="3"/><path d="M89 286L77 293M99 288L90 297M146 287L157 295M153 284L167 294" stroke="${panel}" stroke-width="2"/><path d="M56 195L72 197M171 195L186 191" stroke="${zip}" stroke-width="3"/></g></g><g class="mini-driver-head">${miniDriverFace(config.helmet, `${ns}-helmet`, options)}</g>`;
}

/** Size is the full body's height; width follows the original 3:4 viewBox. */
export function miniDriverToSvgString(config: MiniDriverConfig, size = 320, options: MiniDriverRenderOptions & { id?: string } = {}): string {
  const pixels = artworkDimension(size, 320);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 320" width="${pixels * .75}" height="${pixels}" shape-rendering="${options.appearance === "pixel" ? "crispEdges" : "auto"}" role="img" aria-label="Original miniature motorsport driver">${miniDriverSvgBody(config, options.id ?? "driver-export", { ...options, portable: true })}</svg>`;
}
