import { normalizeVehicleConfig, vehicleEffects, vehicleNamespace, vehiclePaint, vehicleScene, vehicleSize, vehicleWheel, type VehicleConfig, type VehicleRenderOptions } from "./vehicle-art";

export const SUPERBIKE_GEOMETRY = { width: 640, height: 260, rearAxle: { x: 190, y: 160 }, frontAxle: { x: 480, y: 160 }, wheelRadius: 64, pixelsPerMeter: 200, wheelbase: 1.45, ground: 224, bodyPivot: { x: 335, y: 160 } } as const;
const tuckValue = (value: number) => Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
const coordinate = (value: number) => Number(value.toFixed(3));

/** Keeps hips planted on the seat as the shoulders lower and move forward. */
export function bikeRiderTorsoPath(tuck = 0): string {
  const t = tuckValue(tuck);
  return `M267 108Q${coordinate(287 + t * 20)} ${coordinate(78 + t * 10)} ${coordinate(308 + t * 34)} ${coordinate(54 + t * 16)}Q${coordinate(329 + t * 34)} ${coordinate(45 + t * 16)} ${coordinate(343 + t * 34)} ${coordinate(67 + t * 16)}L${coordinate(353 + t * 34)} ${coordinate(83 + t * 16)}Q315 95 303 116Z`;
}

/** The right-hand grip stays at (434,106) throughout the rider tuck. */
export function bikeRiderArmPath(tuck = 0): string {
  const t = tuckValue(tuck);
  return `M${coordinate(338 + t * 34)} ${coordinate(75 + t * 16)}Q${coordinate(368 + t * 22)} ${coordinate(118 + t * 3)} 434 106`;
}

/** Original fully faired side view with separate fork, rear shock and rider joints. */
export function superbikeSvgBody(input: VehicleConfig, id: string, options: VehicleRenderOptions = {}): string {
  const config = normalizeVehicleConfig(input), ns = vehicleNamespace(id), p = vehiclePaint(config, options), effects = vehicleEffects(config, ns, "bike", options);
  const pixel = options.appearance === "pixel", bold = options.appearance === "neobrutalism", outline = bold ? 3.5 : pixel ? 3 : 2.2;
  const fairing = pixel ? "M319 96H349V82H377V70H448V74H476V81H503V94H492V107H472V117H451V143H433V171H419V193H397V209H302V202H281V186H267V145H280V117H303Z" : "M303 110L345 85C373 60 411 63 449 71L503 81L495 100L471 113L447 131L433 169L397 207L304 211L275 187L266 154L279 128Z";
  const pattern = config.livery.pattern === "sweep" ? `<path d="M267 172Q332 114 445 122L428 153Q348 146 291 202Z" fill="${p.accent}"/><path d="M279 190Q338 141 432 142" fill="none" stroke="${p.stripe}" stroke-width="7"/>`
    : config.livery.pattern === "split" ? `<path d="M372 63H408L376 218H339Z" fill="${p.accent}"/><path d="M405 65H416L385 217H373Z" fill="${p.stripe}"/>`
      : config.livery.pattern === "chevron" ? `<path d="M291 111L359 160L459 109L447 145L357 191L278 142Z" fill="${p.accent}"/><path d="M289 137L358 179L450 132" fill="none" stroke="${p.stripe}" stroke-width="7"/>` : `<path d="M298 201L391 200L417 177" fill="none" stroke="${p.accent}" stroke-width="8"/>`;
  const defs = `<defs><clipPath id="${ns}-fairing"><path d="${fairing}"/></clipPath><linearGradient id="${ns}-fairing-paint" x1="0" y1="0" x2=".7" y2="1"><stop stop-color="${p.light}"/><stop offset=".35" stop-color="${p.base}"/><stop offset="1" stop-color="${p.dark}"/></linearGradient></defs>`;
  const fill = pixel || options.appearance === "terminal" ? p.base : `url(#${ns}-fairing-paint)`;
  const rearAssembly = `<g class="bike-rear-assembly"><path d="M190 160L293 153L324 179L193 168Z" fill="#83989c" stroke="${p.ink}" stroke-width="${outline}"/><path d="M194 162L282 155" stroke="${p.stripe}" stroke-width="3"/><path d="M190 171Q238 183 293 166" stroke="${p.ink}" stroke-width="5" fill="none"/><path d="M190 171Q238 183 293 166" stroke="#82959a" stroke-width="2" stroke-dasharray="3 3" fill="none"/><circle cx="291" cy="159" r="11" fill="${p.ink}" stroke="${p.rim}" stroke-width="3"/><path d="M236 142L264 159L249 173L157 164L140 151L147 143Z" fill="#778b93" stroke="${p.ink}" stroke-width="${outline}"/><path d="M142 147L150 145L154 159L148 160Z" fill="#142731"/><path d="M166 149L229 152" stroke="${p.stripe}" stroke-opacity=".8" stroke-width="3"/></g>`;
  const rearShock = `<g class="bike-rear-shock"><path d="M265 111L280 164" stroke="${p.ink}" stroke-width="8"/><path d="M259 116L277 119L262 126L279 131L266 137L283 144L271 151" stroke="${p.accent}" stroke-width="5" fill="none" stroke-linejoin="round"/><path d="M277 151L281 165" stroke="${p.rim}" stroke-width="5"/></g>`;
  const forkLower = `<g class="bike-fork-lower"><path d="M460 123L480 160" stroke="${p.ink}" stroke-width="10"/><path d="M460 123L480 160" stroke="${p.rim}" stroke-width="6"/><path d="M468 132L476 148" stroke="${p.stripe}" stroke-width="2"/><circle cx="480" cy="160" r="7" fill="${p.ink}" stroke="${p.rim}" stroke-width="2"/></g>`;
  const rider = `<g class="bike-rider"><path d="M273 105Q309 111 332 140L307 181L331 187L328 196L298 192L290 182L307 143L269 131Z" fill="${p.dark}" stroke="${p.ink}" stroke-width="${outline}"/><path d="M281 118L316 140L298 180" stroke="${p.accent}" stroke-width="7" fill="none"/><path d="M302 180L330 184L344 184L348 192L325 197L297 192Z" fill="${p.ink}" stroke="${p.ink}" stroke-width="2"/><path d="M304 187L333 191" stroke="${p.stripe}" stroke-width="3"/>
    <path class="bike-rider-torso" d="${bikeRiderTorsoPath()}" fill="${p.dark}" stroke="${p.ink}" stroke-width="${outline}"/>
    <g class="bike-rider-head"><path d="M342 72L367 72L360 87L346 94L330 81Z" fill="${p.accent}"/><g transform="translate(0 30)"><path d="M337 30C336 15 344 7 358 8C375 7 385 18 387 33L379 48L350 48L339 40Z" fill="${p.stripe}" stroke="${p.ink}" stroke-width="${outline}"/><path d="M341 20Q360 12 380 24L383 29L343 28Z" fill="${p.accent}"/><path d="M358 28L386 29L382 37L358 36Z" fill="#2c5968" stroke="${p.ink}" stroke-width="1.5"/><path d="M344 38L353 45L373 44" stroke="${p.base}" stroke-width="3" fill="none"/><path d="M347 13L354 11" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/></g></g>
    <path class="bike-rider-arm-outline" d="${bikeRiderArmPath()}" stroke="${p.ink}" stroke-width="16" stroke-linecap="round" fill="none"/><path class="bike-rider-arm" d="${bikeRiderArmPath()}" stroke="${p.base}" stroke-width="11" stroke-linecap="round" fill="none"/><path d="M428 101L440 100L444 107L433 111Z" fill="${p.accent}" stroke="${p.ink}" stroke-width="2"/>
  </g>`;
  const sprung = `<g class="bike-sprung-body">${rearShock}<path d="M151 84L187 82L239 101L276 109L268 121L231 116L182 103L156 98Z" fill="${p.base}" stroke="${p.ink}" stroke-width="${outline}"/><path d="M152 85L181 86L205 95L188 99L158 92Z" fill="${p.accent}"/><path d="M214 97L263 103L285 113L276 120L233 113Z" fill="${p.ink}"/><path d="M266 106C268 84 287 67 314 64C334 60 353 71 363 87L343 117Z" fill="${fill}" stroke="${p.ink}" stroke-width="${outline}"/><path d="M282 83Q311 65 334 76" fill="none" stroke="${p.light}" stroke-width="4" stroke-linecap="round"/>
    <path d="M425 64L447 42L475 45L489 74" fill="${p.stripe}" fill-opacity=".32" stroke="${p.ink}" stroke-width="${outline}"/><path d="M449 45L470 48L480 62" fill="none" stroke="#ffffff" stroke-opacity=".65" stroke-width="2"/>
    <g class="bike-fork-upper"><path d="M439 91L465 142" stroke="${p.ink}" stroke-width="11"/><path d="M439 91L465 142" stroke="${p.accent}" stroke-width="7"/><path d="M446 104L454 121" stroke="${p.stripe}" stroke-width="2.5"/></g>
    <path d="M425 106L444 100L451 104" stroke="${p.ink}" stroke-width="6" fill="none" stroke-linecap="round"/>
    <path d="${fairing}" fill="${fill}" stroke="${p.ink}" stroke-width="${outline}" stroke-linejoin="round"/><g clip-path="url(#${ns}-fairing)">${pattern}<path d="M278 163L314 187L386 199L398 210H300L275 185Z" fill="${p.dark}" opacity=".6"/><path d="M361 91Q409 69 480 83" stroke="${p.light}" stroke-width="3" fill="none"/></g>
    <path d="M451 91L493 86L489 94L453 99Z" fill="${p.stripe}"/><path d="M432 122L450 115L441 138L424 147Z" fill="${p.ink}"/><path d="M416 161L428 147M409 172L421 158M402 183L414 169" stroke="${p.ink}" stroke-width="4" stroke-linecap="round"/>
    <path d="M322 139L386 132L387 171L324 179L310 165Z" fill="${p.stripe}"/><text x="349" y="165" text-anchor="middle" fill="${p.ink}" font-family="monospace" font-size="32" font-weight="800" transform="rotate(-6 349 165)">${config.number}</text>
    <path d="M297 189L304 185L312 189L307 196Z" fill="${p.accent}"/>
    ${rider}
  </g>`;
  const fender = `<path d="M430 108Q480 80 519 117L511 122Q478 98 436 118Z" fill="${p.base}" stroke="${p.ink}" stroke-width="${outline}"/><path d="M442 106Q477 91 504 108" stroke="${p.stripe}" stroke-width="3" fill="none"/>`;
  return `${defs}${effects.defs}${vehicleScene(config, ns, options)}${effects.lines}${effects.shadow}${effects.heat}<g class="bike-corner-lean"><g class="bike-wheelie">${vehicleWheel(config, ns, 190, 160, 64, "bike", options)}${rearAssembly}${sprung}${vehicleWheel(config, ns, 480, 160, 64, "bike", options)}${fender}${forkLower}</g></g>`;
}

export function superbikeToSvgString(config: VehicleConfig, size = 640, options: VehicleRenderOptions & { id?: string } = {}): string {
  const pixels = vehicleSize(size);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 260" width="${pixels}" height="${pixels * 260 / 640}"${options.appearance === "pixel" ? ' shape-rendering="crispEdges"' : ""} role="img" aria-label="Original superbike with rider">${superbikeSvgBody(config, options.id ?? "superbike-export", { ...options, portable: true })}</svg>`;
}
