import type { Appearance } from "./appearance";

export const LIVERY_PATTERNS = ["solid", "sweep", "split", "chevron"] as const;
export const TIRE_COMPOUNDS = ["soft", "medium", "hard", "wet"] as const;
export type LiveryPattern = typeof LIVERY_PATTERNS[number];
export type TireCompound = typeof TIRE_COMPOUNDS[number];
export type VehicleLivery = { base: string; accent: string; stripe: string; pattern: LiveryPattern };
export type VehicleConfig = { version: 1; livery: VehicleLivery; number: string; tireCompound: TireCompound };
export type VehicleRenderOptions = { appearance?: Appearance; theme?: "light" | "dark"; portable?: boolean; track?: boolean };
export const VEHICLE_PALETTES = [
  { name: "Tidal copper", base: "#247b83", accent: "#dc9765", stripe: "#eee5bf" },
  { name: "Orchard relay", base: "#668147", accent: "#e2ba67", stripe: "#eaf0d7" },
  { name: "Dusk violet", base: "#675383", accent: "#cf8f91", stripe: "#e8d4a8" },
  { name: "Alpine note", base: "#4b789e", accent: "#a8d4c6", stripe: "#edf0dc" },
  { name: "Copper drift", base: "#b6674c", accent: "#4a677a", stripe: "#eee1bd" },
  { name: "Sand velocity", base: "#d0b27a", accent: "#54716a", stripe: "#efe9d7" },
] as const;
export const TIRE_COLORS: Record<TireCompound, string> = { soft: "#ec796e", medium: "#e6bd65", hard: "#e4e8df", wet: "#78b8db" };

export function vehicleSeed(seed: string | number): number {
  const text = String(seed); let value = 2166136261;
  for (let index = 0; index < text.length; index++) value = Math.imul(value ^ text.charCodeAt(index), 16777619);
  return value >>> 0;
}
export function vehicleColor(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const hex = value.trim().toLowerCase();
  return /^#[\da-f]{6}$/.test(hex) ? hex : /^#[\da-f]{3}$/.test(hex) ? `#${[...hex.slice(1)].map((digit) => digit + digit).join("")}` : fallback;
}
export function vehicleMix(first: string, second: string, amount: number): string {
  return `#${[1, 3, 5].map((offset) => Math.round(Number.parseInt(first.slice(offset, offset + 2), 16) * (1 - amount) + Number.parseInt(second.slice(offset, offset + 2), 16) * amount).toString(16).padStart(2, "0")).join("")}`;
}
export function vehicleNamespace(value: string): string {
  return `vehicle-${Array.from(String(value)).map((character) => /^[a-z\d-]$/i.test(character) ? character : `_${character.codePointAt(0)!.toString(16)}_`).join("")}`;
}
export function vehicleSize(value: number, fallback = 640): number { return Number.isFinite(value) ? Math.max(80, Math.min(2560, Math.round(value))) : fallback; }

export function generateVehicleConfig(seed: string | number = "orangeui:motorsport"): VehicleConfig {
  const hash = vehicleSeed(seed), palette = VEHICLE_PALETTES[hash % VEHICLE_PALETTES.length];
  return { version: 1, livery: { base: palette.base, accent: palette.accent, stripe: palette.stripe, pattern: LIVERY_PATTERNS[(hash >>> 5) % LIVERY_PATTERNS.length] }, number: String(200 + hash % 700), tireCompound: TIRE_COMPOUNDS[(hash >>> 9) % TIRE_COMPOUNDS.length] };
}

export function normalizeVehicleConfig(value: unknown): VehicleConfig {
  const fallback = generateVehicleConfig();
  if (!value || typeof value !== "object" || Array.isArray(value)) return fallback;
  const item = value as Partial<VehicleConfig>;
  if (item.version !== undefined && item.version !== 1) return fallback;
  const livery = item.livery && typeof item.livery === "object" ? item.livery : {} as Partial<VehicleLivery>;
  const number = typeof item.number === "number" || typeof item.number === "string" ? String(item.number) : "";
  return { version: 1, number: /^\d{1,3}$/.test(number) ? number : fallback.number, tireCompound: TIRE_COMPOUNDS.includes(item.tireCompound!) ? item.tireCompound! : fallback.tireCompound,
    livery: { base: vehicleColor(livery.base, fallback.livery.base), accent: vehicleColor(livery.accent, fallback.livery.accent), stripe: vehicleColor(livery.stripe, fallback.livery.stripe), pattern: LIVERY_PATTERNS.includes(livery.pattern!) ? livery.pattern! : fallback.livery.pattern } };
}

export function vehiclePaint(config: VehicleConfig, options: VehicleRenderOptions) {
  const portable = options.portable, darkTheme = options.theme === "dark";
  const color = (name: string, fallback: string) => portable ? fallback : `var(--vehicle-${name}, ${fallback})`;
  const base = color("base", config.livery.base), accent = color("accent", config.livery.accent), stripe = color("stripe", config.livery.stripe);
  return { color, base, accent, stripe, ink: color("outline", "#203039"), dark: color("body-shadow", vehicleMix(config.livery.base, "#112b36", .5)), light: color("body-highlight", vehicleMix(config.livery.base, "#f8f3db", .45)), tire: color("tire", "#20252a"), rim: color("rim", "#8a9da4"), tireMark: color("tire-mark", TIRE_COLORS[config.tireCompound]), sky: color("sky", darkTheme ? "#18222b" : "#edf1ec"), distant: color("distant", darkTheme ? "#293943" : "#cbd9d4"), barrier: color("barrier", darkTheme ? "#3d4c52" : "#a6b7b4"), road: color("road", darkTheme ? "#273138" : "#d0d7d3"), marking: color("marking", darkTheme ? "#78908f" : "#f5f5e9") };
}

export function vehicleScene(config: VehicleConfig, ns: string, options: VehicleRenderOptions): string {
  if (options.track === false) return "";
  const p = vehiclePaint(config, options), pixel = options.appearance === "pixel";
  const ridge = pixel ? "M0 145H64V138H112V149H174V132H232V142H292V126H361V137H419V130H469V148H522V136H581V145H640V212H0Z" : "M0 145Q34 133 64 138T112 149Q144 141 174 132T232 142Q263 140 292 126T361 137Q391 141 419 130T469 148Q499 139 522 136T581 145L640 145V212H0Z";
  const far = [0, 640].map((x) => `<g transform="translate(${x} 0)"><path d="${ridge}" fill="${p.distant}" opacity=".7"/><path d="M0 186H640" stroke="${p.barrier}" stroke-width="2" opacity=".5"/></g>`).join("");
  const near = [0, 640].map((x) => `<g transform="translate(${x} 0)"><path d="M0 198H640V211H0Z" fill="${p.barrier}"/><path d="M0 196H640" stroke="${p.marking}" stroke-width="3"/>${[32, 176, 320, 464, 608].map((post) => `<path d="M${post} 177V198" stroke="${p.barrier}" stroke-width="4"/>`).join("")}</g>`).join("");
  const road = Array.from({ length: 6 }, (_, index) => `<path d="M${index * 160} 251H${index * 160 + 31}M${index * 160 + 76} 228H${index * 160 + 91}" stroke="${p.barrier}" stroke-width="2" stroke-linecap="round" opacity=".6"/>`).join("");
  const markings = Array.from({ length: 4 }, (_, index) => `<path d="M${index * 240 + 24} 239H${index * 240 + 104}" stroke="${p.marking}" stroke-width="4"/>`).join("");
  return `<defs><clipPath id="${ns}-scene"><rect width="640" height="260" rx="${pixel || options.appearance === "terminal" ? 0 : 12}"/></clipPath></defs><g clip-path="url(#${ns}-scene)"><path d="M0 0H640V260H0Z" fill="${p.sky}"/><g class="vehicle-far-background">${far}</g><g class="vehicle-background">${near}</g><path d="M0 211H640V260H0Z" fill="${p.road}"/><g class="vehicle-road">${road}</g><g class="vehicle-markings">${markings}</g></g>`;
}

/** Crisp spoke geometry crossfades to rotationally symmetric blur at high speed. */
export function vehicleWheel(config: VehicleConfig, ns: string, cx: number, cy: number, radius: number, kind: "car" | "bike", options: VehicleRenderOptions): string {
  const p = vehiclePaint(config, options), r = radius, rim = r * (kind === "car" ? .68 : .7), pixel = options.appearance === "pixel";
  const spokes = Array.from({ length: 6 }, (_, index) => `<path d="M${cx - 3} ${cy - 4}L${cx + rim * .76} ${cy - rim * .22}L${cx + rim * .85} ${cy + rim * .03}L${cx + 3} ${cy + 5}Z" transform="rotate(${index * 60} ${cx} ${cy})" fill="${p.rim}"/>`).join("");
  const grooves = config.tireCompound === "wet" ? Array.from({ length: 12 }, (_, index) => `<path d="M${cx + r * .8} ${cy - 3}L${cx + r * .9} ${cy + 1}" transform="rotate(${index * 30} ${cx} ${cy})" stroke="${p.rim}" stroke-width="${r * .04}" opacity=".65"/>`).join("") : "";
  return `<g class="vehicle-wheel vehicle-wheel-${cx < 320 ? "rear" : "front"}" data-wheel-radius="${r}"><circle cx="${cx}" cy="${cy}" r="${r}" fill="${p.tire}" stroke="${p.ink}" stroke-width="${options.appearance === "neobrutalism" ? 3.5 : 2}"/><circle cx="${cx}" cy="${cy}" r="${r * .88}" fill="none" stroke="${p.tireMark}" stroke-width="${r * .045}"/><circle cx="${cx}" cy="${cy}" r="${rim}" fill="#293239" stroke="${p.rim}" stroke-width="${r * .05}"/>
    <g class="vehicle-wheel-crisp" opacity="1"><g class="vehicle-wheel-rotor" style="transform-origin:${cx}px ${cy}px">${kind === "bike" ? `<circle cx="${cx}" cy="${cy}" r="${rim * .68}" fill="none" stroke="${p.rim}" stroke-width="${r * .1}" stroke-dasharray="${r * .065} ${r * .08}"/>` : ""}${spokes}${grooves}</g></g>
    <g class="vehicle-wheel-blur" opacity="0"><circle cx="${cx}" cy="${cy}" r="${rim * .79}" fill="none" stroke="${p.rim}" stroke-opacity=".58" stroke-width="${rim * .36}" filter="url(#${ns}-wheel-soft)"/><circle cx="${cx}" cy="${cy}" r="${rim * .56}" fill="none" stroke="${p.rim}" stroke-opacity=".52" stroke-width="${rim * .09}"/></g>
    <circle cx="${cx}" cy="${cy}" r="${r * .17}" fill="${p.ink}" stroke="${p.rim}" stroke-width="${r * .04}"/><circle cx="${cx}" cy="${cy}" r="${r * .068}" fill="${p.stripe}"/>${kind === "bike" ? `<path d="M${cx + rim * .55} ${cy - rim * .45}Q${cx + rim * .83} ${cy - rim * .15} ${cx + rim * .75} ${cy + rim * .2}" stroke="${p.accent}" stroke-width="${r * .11}" fill="none" stroke-linecap="${pixel ? "square" : "round"}"/>` : ""}</g>`;
}

export function vehicleEffects(config: VehicleConfig, ns: string, kind: "car" | "bike", options: VehicleRenderOptions): { defs: string; shadow: string; heat: string; lines: string } {
  const p = vehiclePaint(config, options), x = kind === "car" ? 321 : 335, heatX = kind === "car" ? 37 : 99, heatY = kind === "car" ? 148 : 171;
  return {
    defs: `<defs><filter id="${ns}-wheel-soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.3"/></filter><filter id="${ns}-heat-soft" x="-30%" y="-60%" width="160%" height="220%"><feGaussianBlur stdDeviation="1.5"/></filter></defs>`,
    shadow: `<g class="vehicle-shadow" style="transform-origin:${x}px 224px" opacity=".2"><ellipse cx="${x}" cy="224" rx="${kind === "car" ? 246 : 202}" ry="7" fill="${p.ink}"/></g>`,
    heat: `<g class="vehicle-heat" opacity="0" filter="url(#${ns}-heat-soft)"><path d="M${heatX - 28} ${heatY - 3}Q${heatX - 9} ${heatY - 11} ${heatX + 8} ${heatY - 2}T${heatX + 53} ${heatY - 1}" fill="none" stroke="${p.marking}" stroke-width="6"/><path d="M${heatX - 12} ${heatY + 5}Q${heatX + 8} ${heatY - 5} ${heatX + 31} ${heatY + 4}T${heatX + 64} ${heatY + 2}" fill="none" stroke="${p.accent}" stroke-width="3" stroke-opacity=".4"/></g>`,
    lines: `<g class="vehicle-speed-lines" opacity="0">${[0, 320, 640].map((offset) => `<g transform="translate(${offset} 0)"><path d="M5 102H62M99 84H121M204 114H239M35 157H88M158 143H201" fill="none" stroke="${p.barrier}" stroke-width="2" stroke-linecap="round"/></g>`).join("")}</g>`,
  };
}
