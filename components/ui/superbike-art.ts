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
  const pixel = options.appearance === "pixel", bold = options.appearance === "neobrutalism", outline = bold ? 3 : pixel ? 2.5 : 1.3;
  const fairing = pixel ? "M319 96H349V82H377V70H448V74H476V81H503V94H492V107H472V117H451V143H433V171H419V193H397V209H302V202H281V186H267V145H280V117H303Z" : "M284 124L327 95Q360 65 408 66L450 69Q482 69 503 84L495 103Q467 111 451 126L433 171L405 207L307 213L275 196L267 164Z";
  const pattern = config.livery.pattern === "sweep" ? `<path d="M267 172Q332 114 445 122L428 153Q348 146 291 202Z" fill="${p.accent}"/><path d="M279 190Q338 141 432 142" fill="none" stroke="${p.stripe}" stroke-width="7"/>`
    : config.livery.pattern === "split" ? `<path d="M372 63H408L376 218H339Z" fill="${p.accent}"/><path d="M405 65H416L385 217H373Z" fill="${p.stripe}"/>`
      : config.livery.pattern === "chevron" ? `<path d="M291 111L359 160L459 109L447 145L357 191L278 142Z" fill="${p.accent}"/><path d="M289 137L358 179L450 132" fill="none" stroke="${p.stripe}" stroke-width="7"/>` : `<path d="M298 201L391 200L417 177" fill="none" stroke="${p.accent}" stroke-width="8"/>`;
  const defs = `<defs><clipPath id="${ns}-fairing"><path d="${fairing}"/></clipPath><linearGradient id="${ns}-fairing-paint" x1="0" y1="0" x2=".7" y2="1"><stop stop-color="${p.light}"/><stop offset=".25" stop-color="${p.base}"/><stop offset=".7" stop-color="${p.base}"/><stop offset="1" stop-color="${p.dark}"/></linearGradient><linearGradient id="${ns}-alloy" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#d5dcdd"/><stop offset=".22" stop-color="#8c999e"/><stop offset=".56" stop-color="#59676f"/><stop offset=".8" stop-color="#b2bdc0"/><stop offset="1" stop-color="#34434c"/></linearGradient><linearGradient id="${ns}-windscreen" x1="0" y1="0" x2=".8" y2="1"><stop stop-color="#d9e6eb" stop-opacity=".56"/><stop offset=".45" stop-color="#9fb5c1" stop-opacity=".2"/><stop offset="1" stop-color="#344753" stop-opacity=".82"/></linearGradient></defs>`;
  const fill = pixel || options.appearance === "terminal" ? p.base : `url(#${ns}-fairing-paint)`;
  const rearAssembly = `<g class="bike-rear-assembly"><path d="M190 157L278 145L309 157L317 174L283 181L193 168Z" fill="url(#${ns}-alloy)" stroke="#1b272e" stroke-width="${outline}"/><path d="M206 160L269 153L286 158L279 168L212 167Z" fill="#354149"/><path d="M212 160L265 157" stroke="#bac6ca" stroke-width="1.3"/><path d="M187 177Q240 182 292 162" stroke="#152128" stroke-width="4" fill="none"/><path d="M187 177Q240 182 292 162" stroke="#9da6a5" stroke-width="1.4" stroke-dasharray="2 2" fill="none"/><circle cx="291" cy="159" r="11" fill="#22323b" stroke="#a0acb0" stroke-width="2"/><circle cx="291" cy="159" r="5" fill="#747f83"/><path d="M225 132L271 151L268 163L249 169L170 150L156 138L162 128Z" fill="url(#${ns}-alloy)" stroke="#15252f" stroke-width="${outline}"/><path d="M156 132L165 130L177 148L170 150L159 140Z" fill="#17232b"/><path d="M176 135L229 148L244 147L251 151L244 158L185 145Z" fill="#2b3338"/><path d="M180 136L224 147" stroke="#dde1d8" stroke-width="1"/><path d="M257 161L271 165L276 176" stroke="#e0e2db" stroke-width="2" fill="none"/><circle cx="197" cy="164" r="3" fill="#b8c4c5"/></g>`;
  const rearShock = `<g class="bike-rear-shock"><path d="M265 111L280 164" stroke="${p.ink}" stroke-width="8"/><path d="M259 116L277 119L262 126L279 131L266 137L283 144L271 151" stroke="${p.accent}" stroke-width="5" fill="none" stroke-linejoin="round"/><path d="M277 151L281 165" stroke="${p.rim}" stroke-width="5"/></g>`;
  const forkLower = `<g class="bike-fork-lower"><path d="M460 123L480 160" stroke="${p.ink}" stroke-width="10"/><path d="M460 123L480 160" stroke="${p.rim}" stroke-width="6"/><path d="M468 132L476 148" stroke="${p.stripe}" stroke-width="2"/><circle cx="480" cy="160" r="7" fill="${p.ink}" stroke="${p.rim}" stroke-width="2"/></g>`;
  const rider = `<g class="bike-rider"><path d="M273 105Q309 111 332 140L307 181L331 187L328 196L298 192L290 182L307 143L269 131Z" fill="${p.dark}" stroke="${p.ink}" stroke-width="${outline}"/><path d="M281 118L316 140L298 180" stroke="${p.accent}" stroke-width="7" fill="none"/><path d="M302 180L330 184L344 184L348 192L325 197L297 192Z" fill="${p.ink}" stroke="${p.ink}" stroke-width="2"/><path d="M304 187L333 191" stroke="${p.stripe}" stroke-width="3"/>
    <path d="M202 91L233 102L254 105" stroke="#62717a" stroke-width="1.2" fill="none"/><path class="bike-rider-torso" d="${bikeRiderTorsoPath()}" fill="${p.dark}" stroke="${p.ink}" stroke-width="${outline}"/>
    <g class="bike-rider-head"><path d="M342 72L367 72L360 87L346 94L330 81Z" fill="${p.accent}"/><g transform="translate(0 30)"><path d="M337 30C336 15 344 7 358 8C375 7 385 18 387 33L379 48L350 48L339 40Z" fill="${p.stripe}" stroke="${p.ink}" stroke-width="${outline}"/><path d="M341 20Q360 12 380 24L383 29L343 28Z" fill="${p.accent}"/><path d="M358 28L386 29L382 37L358 36Z" fill="#2c5968" stroke="${p.ink}" stroke-width="1.5"/><path d="M344 38L353 45L373 44" stroke="${p.base}" stroke-width="3" fill="none"/><path d="M347 13L354 11" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/></g></g>
    <path class="bike-rider-arm-outline" d="${bikeRiderArmPath()}" stroke="${p.ink}" stroke-width="16" stroke-linecap="round" fill="none"/><path class="bike-rider-arm" d="${bikeRiderArmPath()}" stroke="${p.base}" stroke-width="11" stroke-linecap="round" fill="none"/><path d="M428 101L440 100L444 107L433 111Z" fill="${p.accent}" stroke="${p.ink}" stroke-width="2"/>
  </g>`;
  const sprung = `<g class="bike-sprung-body">${rearShock}<path d="M144 68L178 65L205 80L240 91L274 108L267 122L229 111L177 94L149 83Z" fill="${p.base}" stroke="${p.ink}" stroke-width="${outline}"/><path d="M150 70L174 69L198 80L182 86L153 79Z" fill="${p.accent}"/><path d="M202 85L228 91L256 95L285 112L276 120L232 108L208 98Z" fill="${p.ink}"/><path d="M266 106C268 84 287 67 314 64C334 60 353 71 363 87L343 117Z" fill="${fill}" stroke="${p.ink}" stroke-width="${outline}"/><path d="M282 83Q311 65 334 76" fill="none" stroke="${p.light}" stroke-width="4" stroke-linecap="round"/>
    <path d="M420 70Q431 44 449 29Q468 35 493 70L484 78Z" fill="url(#${ns}-windscreen)" stroke="#273843" stroke-width="${outline}"/><path d="M432 58L451 34Q468 41 481 59" fill="none" stroke="#f1f9fb" stroke-opacity=".75" stroke-width="1.5"/>
    <g class="bike-fork-upper"><path d="M439 91L465 142" stroke="${p.ink}" stroke-width="11"/><path d="M439 91L465 142" stroke="${p.accent}" stroke-width="7"/><path d="M446 104L454 121" stroke="${p.stripe}" stroke-width="2.5"/></g>
    <path d="M425 106L444 100L451 104" stroke="${p.ink}" stroke-width="6" fill="none" stroke-linecap="round"/>
    <path d="${fairing}" fill="${fill}" stroke="${p.ink}" stroke-width="${outline}" stroke-linejoin="round"/><g clip-path="url(#${ns}-fairing)">${pattern}<path d="M278 163L314 187L386 199L398 210H300L275 185Z" fill="${p.dark}" opacity=".6"/><path d="M361 91Q409 69 480 83" stroke="${p.light}" stroke-width="3" fill="none"/></g>
    <path d="M451 91L493 86L489 94L453 99Z" fill="${p.stripe}"/><path d="M432 122L450 115L441 138L424 147Z" fill="#111c24"/><path d="M432 127L441 122M429 133L438 128" stroke="#70828a" stroke-width="1.5"/><path d="M416 161L428 147M409 172L421 158M402 183L414 169" stroke="#15242d" stroke-width="3" stroke-linecap="round"/>
    <path d="M306 179L337 188L388 182L402 202L396 211L307 213L284 198Z" fill="#162733"/><path d="M312 199L389 200" stroke="${p.stripe}" stroke-width="1.5"/><text x="353" y="196" text-anchor="middle" font-family="sans-serif" font-size="7" letter-spacing="2.1" fill="${p.stripe}">ORANGE RACING</text>
    <path d="M341 133L389 128L389 154L343 160L331 150Z" fill="${p.stripe}"/><text x="360" y="151" text-anchor="middle" fill="#172832" font-family="sans-serif" font-size="24" font-style="italic" font-weight="800" transform="rotate(-6 360 151)">${config.number}</text>
    <path d="M336 111Q375 85 429 84L455 91M325 176Q366 187 410 170" fill="none" stroke="${p.light}" stroke-width="1.2"/><path d="M340 163L381 159" stroke="${p.accent}" stroke-width="2.5"/>
    <g fill="#e1e7e4" stroke="#4a5a61" stroke-width=".6">${[[304,123],[341,113],[411,93],[463,82],[399,175],[322,200],[428,140]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="1.7"/>`).join("")}</g>
    <path d="M297 189L304 185L312 189L307 196Z" fill="${p.accent}"/>
    <path d="M277 91Q287 77 305 79L321 89L316 108L292 116L274 106Z" fill="#28343d" stroke="#53626b" stroke-width="1.1"/><path d="M279 92L291 85M279 98L289 91" stroke="#475964" stroke-width="1.2"/>
    ${options.rider === false ? "" : rider}
  </g>`;
  const fender = `<path d="M430 108Q480 80 519 117L511 122Q478 98 436 118Z" fill="${p.base}" stroke="${p.ink}" stroke-width="${outline}"/><path d="M442 106Q477 91 504 108" stroke="${p.stripe}" stroke-width="3" fill="none"/>`;
  return `${defs}${effects.defs}${vehicleScene(config, ns, options)}${effects.lines}${effects.shadow}${effects.heat}<g class="bike-corner-lean"><g class="bike-wheelie">${vehicleWheel(config, ns, 190, 160, 64, "bike", options)}${rearAssembly}${sprung}${vehicleWheel(config, ns, 480, 160, 64, "bike", options)}${fender}${forkLower}</g></g>`;
}

export function superbikeToSvgString(config: VehicleConfig, size = 640, options: VehicleRenderOptions & { id?: string } = {}): string {
  const pixels = vehicleSize(size);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 260" width="${pixels}" height="${pixels * 260 / 640}"${options.appearance === "pixel" ? ' shape-rendering="crispEdges"' : ""} role="img" aria-label="${options.rider === false ? "Original superbike" : "Original superbike with rider"}">${superbikeSvgBody(config, options.id ?? "superbike-export", { ...options, portable: true })}</svg>`;
}
