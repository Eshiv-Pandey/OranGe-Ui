import { normalizeVehicleConfig, vehicleEffects, vehicleNamespace, vehiclePaint, vehicleScene, vehicleSize, vehicleWheel, type VehicleConfig, type VehicleRenderOptions } from "./vehicle-art";

export const OPEN_WHEEL_GEOMETRY = { width: 640, height: 260, rearAxle: { x: 151, y: 190 }, frontAxle: { x: 491, y: 190 }, wheelRadius: 34, pixelsPerMeter: 100, wheelbase: 3.4, ground: 224, bodyPivot: { x: 321, y: 190 } } as const;

/** Original modern single-seater: sculpted sidepods, carbon floor and separate sprung aero. */
export function openWheelCarSvgBody(input: VehicleConfig, id: string, options: VehicleRenderOptions = {}): string {
  const config = normalizeVehicleConfig(input), ns = vehicleNamespace(id), p = vehiclePaint(config, options), effects = vehicleEffects(config, ns, "car", options);
  const pixel = options.appearance === "pixel", outline = options.appearance === "neobrutalism" ? 3 : pixel ? 2 : 1.2;
  const side = "M186 170Q224 153 270 153L303 158L356 165Q387 164 411 171L437 188L411 200L365 209L226 209L187 197Z";
  const pattern = config.livery.pattern === "sweep" ? `<path d="M186 177Q257 158 306 179Q353 198 433 181L427 190Q355 217 300 192Q244 170 186 190Z" fill="${p.accent}"/><path d="M187 185Q247 166 306 187Q359 208 431 186" stroke="${p.stripe}" stroke-width="2.5" fill="none"/>`
    : config.livery.pattern === "split" ? `<path d="M267 151H301L324 213H287Z" fill="${p.accent}"/><path d="M302 155L313 157L336 212H328Z" fill="${p.stripe}"/>`
    : config.livery.pattern === "chevron" ? `<path d="M182 171L283 187L334 161L360 166L286 208L184 184Z" fill="${p.accent}"/><path d="M187 180L285 198L348 166" stroke="${p.stripe}" stroke-width="3" fill="none"/>`
    : `<path d="M202 198Q309 213 422 191" stroke="${p.accent}" stroke-width="5" fill="none"/>`;
  const defs = `<defs><clipPath id="${ns}-side"><path d="${side}"/></clipPath><linearGradient id="${ns}-paint" x1="0" y1="0" x2=".2" y2="1"><stop stop-color="${p.light}"/><stop offset=".28" stop-color="${p.base}"/><stop offset=".72" stop-color="${p.base}"/><stop offset="1" stop-color="${p.dark}"/></linearGradient><linearGradient id="${ns}-carbon" x1="0" y1="0" x2=".3" y2="1"><stop stop-color="#3c4246"/><stop offset=".35" stop-color="#151b1f"/><stop offset="1" stop-color="#080d11"/></linearGradient><linearGradient id="${ns}-glass"><stop stop-color="#182b35"/><stop offset=".6" stop-color="#7aa1ad"/><stop offset="1" stop-color="#192c35"/></linearGradient></defs>`;
  const fill = pixel || options.appearance === "terminal" ? p.base : `url(#${ns}-paint)`, carbon = `url(#${ns}-carbon)`;
  const suspension = `<g class="car-suspension" fill="none" stroke="#202a30" stroke-width="3.3" stroke-linecap="round"><path class="car-front-upper-link" d="M425 174L491 190"/><path class="car-front-lower-link" d="M412 204L491 190"/><path class="car-rear-upper-link" d="M211 166L151 190"/><path class="car-rear-lower-link" d="M215 204L151 190"/></g>`;
  const body = `<g class="car-sprung-body">
    <path d="M94 212L178 203L223 199L421 200L480 209L537 211L539 217L435 222L185 220L99 218Z" fill="${carbon}" stroke="#080d11" stroke-width="1.3"/>
    <path d="M201 198Q255 205 279 216L393 216L433 198L447 201L438 217L400 222L204 219Z" fill="#151b20"/>
    <path d="M216 216L398 219L432 212M209 212L276 218" stroke="#636d70" stroke-width="1" fill="none"/>
    <g class="car-rear-wing"><path d="M65 115L131 119L139 131L65 128Z" fill="${fill}" stroke="#121b20" stroke-width="${outline}"/><path d="M70 115L127 119" stroke="${p.light}" stroke-width="2"/><path d="M66 130L138 132L140 139L70 139Z" fill="${carbon}"/><path d="M64 111L73 115L75 163L68 166L59 132Z" fill="${p.base}" stroke="#182329" stroke-width="${outline}"/><path d="M127 117L141 120L149 162L136 164L132 137Z" fill="${p.dark}" stroke="#182329" stroke-width="${outline}"/><path d="M102 141L110 175M126 144L133 173" stroke="#1c252a" stroke-width="5"/><path d="M73 151L135 147" stroke="${p.accent}" stroke-width="2"/></g>
    <path d="M178 165L204 155L231 143L259 126L268 112L288 114L302 129L321 151L361 170L321 181L208 181Z" fill="${fill}" stroke="#182329" stroke-width="${outline}"/>
    <path d="M267 113L270 103L286 104L287 113Z" fill="#14212a"/><path d="M271 106L282 107" stroke="#71858a" stroke-width="1.5"/>
    <path d="M234 145L265 125L280 123L300 132L316 150" fill="none" stroke="${p.light}" stroke-opacity=".68" stroke-width="2"/>
    <path d="M277 132L291 134L300 145L282 145Z" fill="#14212a"/><path d="M284 136L294 140" stroke="#43575c" stroke-width="2"/>
    <path d="M313 155Q334 143 355 150L382 162L407 172L377 183L332 177Z" fill="#101b22"/>
    <g class="car-driver"><path d="M337 146L341 133Q352 125 361 133L369 147L364 157L344 156Z" fill="${p.stripe}" stroke="#1a252c" stroke-width="1.3"/><path d="M341 135L362 135L366 140L340 140Z" fill="${p.accent}"/><path d="M350 141L368 141L366 148L350 148Z" fill="url(#${ns}-glass)"/><path d="M347 132L355 131" stroke="#fff" stroke-opacity=".8" stroke-width="1.5"/></g>
    <path d="M319 158L320 141Q338 128 368 142L388 164" stroke="#10191f" stroke-width="5.5" fill="none" stroke-linecap="round"/><path d="M324 140Q344 133 365 143" stroke="#6b7376" stroke-width="1.5" fill="none"/>
    <path d="${side}" fill="${fill}" stroke="#172329" stroke-width="${outline}"/>
    <g clip-path="url(#${ns}-side)">${pattern}<path d="M188 183Q221 175 257 179Q290 183 304 198L356 209L206 212Z" fill="${p.dark}" opacity=".75"/><path d="M194 172Q241 158 289 167L309 173" stroke="${p.light}" stroke-width="2" fill="none"/><path d="M307 202Q357 213 412 198" stroke="${p.light}" stroke-opacity=".45" stroke-width="1" fill="none"/></g>
    <path d="M193 178Q215 165 249 168L247 177L208 186Z" fill="#10212a"/><path d="M202 176L238 172" stroke="#56727b" stroke-width="1.6"/>
    <path d="M197 197Q232 188 262 196L302 211L285 216L204 208Z" fill="${carbon}"/><path d="M203 199Q236 194 258 200L278 211" stroke="#566269" stroke-width="1.5" fill="none"/>
    <path d="M390 170L419 173L500 182L559 187L589 194L586 202L548 198L463 193L421 191L403 183Z" fill="${fill}" stroke="#172329" stroke-width="${outline}"/><path d="M421 177L510 186L555 190" fill="none" stroke="${p.stripe}" stroke-width="2.5"/>
    <g class="car-front-wing"><path d="M536 199L567 193L607 198L608 206L555 210L524 208Z" fill="${p.base}" stroke="#101a20" stroke-width="${outline}"/><path d="M538 205L599 201L601 208L545 214L531 212Z" fill="${p.accent}" stroke="#101a20" stroke-width="1"/><path d="M540 211L603 207L605 213L547 217Z" fill="${carbon}"/><path d="M600 193L611 195L613 215L604 218Z" fill="${p.base}" stroke="#101a20" stroke-width="${outline}"/><path d="M604 198L607 211" stroke="${p.stripe}" stroke-width="2"/></g>
    <path d="M398 169L403 157L414 154L424 158L423 163L411 163L409 174" fill="${p.base}" stroke="#172329" stroke-width="1.3"/>
    <path d="M316 175L363 179L366 198L320 197Z" fill="${p.stripe}"/><text x="342" y="192" text-anchor="middle" font-family="sans-serif" font-weight="800" font-style="italic" font-size="17" fill="#14242b">${config.number}</text>
    <path d="M269 164L273 176M278 165L282 178M287 167L291 179" stroke="${p.dark}" stroke-width="1.5"/>
    <path d="M224 154L242 153M184 191L189 188M419 194L426 192" stroke="${p.stripe}" stroke-width="1.5"/>
    <g fill="#d5ddda">${[[217,162],[300,174],[375,179],[410,188]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="1"/>`).join("")}</g>
  </g>`;
  return `${defs}${effects.defs}${vehicleScene(config, ns, options)}${effects.lines}${effects.shadow}${effects.heat}${suspension}${body}${vehicleWheel(config, ns, 151, 190, 34, "car", options)}${vehicleWheel(config, ns, 491, 190, 34, "car", options)}`;
}

export function openWheelCarToSvgString(config: VehicleConfig, size = 640, options: VehicleRenderOptions & { id?: string } = {}): string {
  const pixels = vehicleSize(size);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 260" width="${pixels}" height="${pixels * 260 / 640}"${options.appearance === "pixel" ? ' shape-rendering="crispEdges"' : ""} role="img" aria-label="Original open-wheel race car">${openWheelCarSvgBody(config, options.id ?? "open-wheel-export", { ...options, portable: true })}</svg>`;
}
