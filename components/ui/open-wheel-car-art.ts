import { normalizeVehicleConfig, vehicleEffects, vehicleNamespace, vehiclePaint, vehicleScene, vehicleSize, vehicleWheel, type VehicleConfig, type VehicleRenderOptions } from "./vehicle-art";

export const OPEN_WHEEL_GEOMETRY = { width: 640, height: 260, rearAxle: { x: 151, y: 190 }, frontAxle: { x: 491, y: 190 }, wheelRadius: 34, pixelsPerMeter: 100, wheelbase: 3.4, ground: 224, bodyPivot: { x: 321, y: 190 } } as const;

/** Original long-wheelbase side profile, with independently sprung and flexing layers. */
export function openWheelCarSvgBody(input: VehicleConfig, id: string, options: VehicleRenderOptions = {}): string {
  const config = normalizeVehicleConfig(input), ns = vehicleNamespace(id), p = vehiclePaint(config, options), effects = vehicleEffects(config, ns, "car", options);
  const pixel = options.appearance === "pixel", bold = options.appearance === "neobrutalism", outline = bold ? 3.5 : pixel ? 3 : 2;
  const side = pixel ? "M183 174H218V156H258V137H293V151H337V163H390V174H456V195H443V210H198V203H178Z" : "M179 179L216 158C228 151 248 135 264 134L289 136L309 157C340 166 368 170 393 176L455 180L446 199Q405 213 359 211L217 211L183 200Z";
  const pattern = config.livery.pattern === "sweep" ? `<path d="M180 189Q254 165 310 182Q362 202 449 181L446 196Q358 224 298 199Q246 180 186 207Z" fill="${p.accent}"/><path d="M184 201Q244 178 299 197Q361 218 446 193" fill="none" stroke="${p.stripe}" stroke-width="5"/>`
    : config.livery.pattern === "split" ? `<path d="M264 133H302L320 215H264Z" fill="${p.accent}"/><path d="M303 144L315 147L332 211H322Z" fill="${p.stripe}"/>`
      : config.livery.pattern === "chevron" ? `<path d="M193 159L271 186L315 163L349 172L271 211L181 183Z" fill="${p.accent}"/><path d="M192 170L271 198L329 170" fill="none" stroke="${p.stripe}" stroke-width="5"/>` : `<path d="M209 204H437" stroke="${p.accent}" stroke-width="5"/>`;
  const defs = `<defs><clipPath id="${ns}-side"><path d="${side}"/></clipPath><linearGradient id="${ns}-body" x1="0" y1="0" x2="0" y2="1"><stop stop-color="${p.light}"/><stop offset=".36" stop-color="${p.base}"/><stop offset="1" stop-color="${p.dark}"/></linearGradient><linearGradient id="${ns}-intake" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#101d26"/><stop offset="1" stop-color="${p.dark}"/></linearGradient></defs>`;
  const fill = pixel || options.appearance === "terminal" ? p.base : `url(#${ns}-body)`;
  const suspension = `<g class="car-suspension" fill="none" stroke="${p.ink}" stroke-width="4" stroke-linecap="round"><path class="car-front-upper-link" d="M425 174L491 190"/><path class="car-front-lower-link" d="M412 204L491 190"/><path class="car-rear-upper-link" d="M211 166L151 190"/><path class="car-rear-lower-link" d="M215 204L151 190"/></g>`;
  const body = `<g class="car-sprung-body"><path d="M96 206H520L539 212H104Z" fill="${p.ink}"/><path d="M180 199L197 182L439 178L524 187L577 191L584 199L443 203L402 216L202 216Z" fill="${p.dark}" stroke="${p.ink}" stroke-width="${outline}"/>
    <g class="car-rear-wing"><path d="M54 106H119L141 122L78 125Z" fill="${p.accent}" stroke="${p.ink}" stroke-width="${outline}"/><path d="M48 112L56 105L64 106L74 143L63 148Z" fill="${p.base}" stroke="${p.ink}" stroke-width="${outline}"/><path d="M118 117L130 115L149 151L139 155Z" fill="${p.base}" stroke="${p.ink}" stroke-width="${outline}"/><path d="M66 130L134 125L140 135L71 141Z" fill="${p.dark}"/><path d="M101 136L117 174M126 137L137 169" stroke="${p.ink}" stroke-width="6"/><path d="M68 112L113 110" stroke="${p.stripe}" stroke-width="3"/></g>
    <path d="M179 169L220 150L250 135L266 134L285 143L305 162L288 181L204 188Z" fill="${fill}" stroke="${p.ink}" stroke-width="${outline}"/><path d="M224 153L257 139L273 143L269 153L235 167Z" fill="url(#${ns}-intake)" stroke="${p.light}" stroke-width="1.5"/>
    <path d="M288 159L323 145L351 144L383 158L396 175L365 183L316 176Z" fill="${p.dark}" stroke="${p.ink}" stroke-width="${outline}"/>
    <g class="car-driver"><path d="M325 146L330 128Q343 116 357 126L366 147Z" fill="${p.stripe}" stroke="${p.ink}" stroke-width="2"/><path d="M332 130L359 129L364 138L331 138Z" fill="${p.accent}"/><path d="M337 139L364 138L361 146L337 145Z" fill="#294b5a"/><path d="M317 151L354 150L363 160L328 168Z" fill="${p.accent}"/></g>
    <path d="M317 157L313 141Q336 126 364 143L384 161" stroke="${p.ink}" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M317 139L363 141" stroke="${p.stripe}" stroke-width="2" fill="none"/>
    <path d="${side}" fill="${fill}" stroke="${p.ink}" stroke-width="${outline}" stroke-linejoin="round"/><g clip-path="url(#${ns}-side)">${pattern}<path d="M194 176Q247 158 283 175L293 187L198 201Z" fill="${p.dark}" opacity=".65"/><path d="M194 177Q245 161 282 176" fill="none" stroke="${p.light}" stroke-width="2.5"/></g>
    <path d="M394 169L424 172L499 184L563 187L595 196L590 202L529 196L443 194L406 186Z" fill="${p.base}" stroke="${p.ink}" stroke-width="${outline}"/><path d="M426 176L514 187L562 190" stroke="${p.stripe}" stroke-width="4" fill="none"/>
    <g class="car-front-wing"><path d="M545 192L560 189L605 197L610 208L557 210L531 205Z" fill="${p.accent}" stroke="${p.ink}" stroke-width="${outline}"/><path d="M532 205L599 201L605 207L546 214Z" fill="${p.base}" stroke="${p.ink}" stroke-width="${outline}"/><path d="M604 192L612 194L613 211L604 216Z" fill="${p.stripe}" stroke="${p.ink}" stroke-width="${outline}"/></g>
    <path d="M397 165L404 154L418 151L425 155L423 161L411 161L407 173" fill="${p.accent}" stroke="${p.ink}" stroke-width="${outline}"/>
    <path d="M310 177L369 182L366 205L306 201Z" fill="${p.stripe}"/><text x="339" y="199" text-anchor="middle" font-family="monospace" font-weight="800" font-size="22" fill="${p.ink}">${config.number}</text>
    <path d="M280 185L287 202M290 187L297 203M300 188L307 204" stroke="${p.ink}" stroke-width="2"/>
    <path d="M181 160L194 155L204 161L198 166Z" fill="#697b83" stroke="${p.ink}" stroke-width="2"/><path d="M104 199L125 206M464 203L476 209" stroke="${p.rim}" stroke-width="2"/>
  </g>`;
  return `${defs}${effects.defs}${vehicleScene(config, ns, options)}${effects.lines}${effects.shadow}${effects.heat}${suspension}${body}${vehicleWheel(config, ns, 151, 190, 34, "car", options)}${vehicleWheel(config, ns, 491, 190, 34, "car", options)}`;
}

export function openWheelCarToSvgString(config: VehicleConfig, size = 640, options: VehicleRenderOptions & { id?: string } = {}): string {
  const pixels = vehicleSize(size);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 260" width="${pixels}" height="${pixels * 260 / 640}"${options.appearance === "pixel" ? ' shape-rendering="crispEdges"' : ""} role="img" aria-label="Original open-wheel race car">${openWheelCarSvgBody(config, options.id ?? "open-wheel-export", { ...options, portable: true })}</svg>`;
}
