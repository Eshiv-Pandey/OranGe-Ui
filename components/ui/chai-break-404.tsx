"use client";

import { useEffect, useId, useRef, useState, type CSSProperties, type PointerEvent, type RefObject } from "react";
import { cn } from "@/lib/utils";
import type { Appearance } from "./appearance";
import { useMotionActivity } from "./use-motion-activity";
import { advanceChaiFlow, chaiFlowDashes, chaiFlowSpans, chaiJet, createChaiFlow } from "./chai-pour-physics";
import "../../styles/chai-break-404.css";

export type ChaiPourProps = { speed?: number; grain?: number; interactive?: boolean; sound?: boolean; fullscreen?: boolean; className?: string; style?: CSSProperties; };

export function ChaiPour({ speed = 1, grain = .035, interactive = true, sound = false, fullscreen = false, className, style }: ChaiPourProps) {
  const root = useRef<HTMLDivElement>(null), kettle = useRef<SVGGElement>(null), stream = useRef<SVGPathElement>(null);
  const tea = useRef<SVGGElement>(null), foam = useRef<SVGGElement>(null), steam = useRef<SVGGElement>(null), interior = useRef<SVGPathElement>(null), rim = useRef<SVGEllipseElement>(null);
  const id = useId().replace(/:/g, ""), dragging = useRef<{ x: number; y: number; angle: number } | null>(null);
  const manual = useRef<number | null>(null), current = useRef({ angle: 0, reach: 0, reduced: false, time: 0 }), flow = useRef(createChaiFlow());
  const arm = useRef<SVGGElement>(null);
  const audio = useRef<AudioContext | null>(null), [steamBoost, setSteamBoost] = useState(false);
  const [size, setSize] = useState({ width: 720, height: 550 });
  const width = fullscreen ? size.width : 720, height = fullscreen ? size.height : 550, compact = fullscreen && width === 420;
  const kettleLayout = compact ? { x: -26, y: 195, scale: .72 } : { x: 0, y: fullscreen ? -55 : 0, scale: 1 };
  const glassScale = compact ? .9 : 1, glassCenter = compact ? width * .68 : 478, glassRim = fullscreen ? height * (compact ? .46 : .59) : 336;
  const glassX = glassCenter - 478 * glassScale, glassY = glassRim - 291 * glassScale;
  const localX = (x: number) => (x - glassX) / glassScale, localY = (y: number) => (y - glassY) / glassScale;
  const leftSleeve = fullscreen ? 'M-240 -320H72C83 -140 86 38 119 71Q136 78 137 101L119 134Q103 183 66 204C-5 244 -146 282 -240 320Z' : 'M0 67Q60 51 119 71Q136 78 137 101L119 134Q103 183 66 204Q34 225 0 239Z';
  const rightSleeve = !fullscreen ? 'M720 290 659 296 613 335 618 409 668 447 720 457Z' : compact
    ? `M613 335L${localX(width + 120)} ${localY(glassRim + 120)}V${localY(height + 120)}H${localX(width - 12)}Q${localX(width - 16)} ${localY(glassRim + 160)} 618 409Z`
    : `M613 335L${localX(width + 140)} ${localY(height + 120)}L${localX(width - 30)} ${localY(height + 150)}L618 409Z`;
  const cloudScale = compact ? .9 : 1, cloudX = (compact ? width / 2 : glassCenter) - 156 * cloudScale, cloudY = compact ? 114 : 70;
  useEffect(() => {
    const element = root.current;
    if (!fullscreen || !element) return;
    const observer = new ResizeObserver(() => {
      const bounds = element.getBoundingClientRect(), sceneWidth = bounds.width <= 650 ? 420 : 720;
      if (bounds.width && bounds.height) setSize(previous => {
        const sceneHeight = sceneWidth * bounds.height / bounds.width;
        return previous.width === sceneWidth && Math.abs(previous.height - sceneHeight) < .5 ? previous : { width: sceneWidth, height: sceneHeight };
      });
    });
    observer.observe(element); return () => observer.disconnect();
  }, [fullscreen]);
  function unlockSound() {
    if (!sound) return;
    const context = audio.current ??= new AudioContext();
    void context.resume().catch(() => {});
    if (context.state !== "running") return;
    const buffer = context.createBuffer(1, context.sampleRate * .3, context.sampleRate);
    const samples = buffer.getChannelData(0);
    for (let i = 0; i < samples.length; i++) samples[i] = (Math.random() * 2 - 1) * .12;
    const source = context.createBufferSource(), filter = context.createBiquadFilter(), gain = context.createGain();
    source.buffer = buffer; filter.type = "lowpass"; filter.frequency.value = 650;
    gain.gain.setValueAtTime(.06, context.currentTime); gain.gain.exponentialRampToValueAtTime(.0001, context.currentTime + .3);
    source.connect(filter); filter.connect(gain); gain.connect(context.destination); source.start();
    source.onended = () => { source.disconnect(); filter.disconnect(); gain.disconnect(); };
  }
  function draw(angle: number, time = 0) {
    const liquid = flow.current, fill = liquid.fill, exteriorSpans = chaiFlowSpans(liquid), interiorSpans = chaiFlowSpans(liquid, true), pouring = interiorSpans.length > 0;
    current.current.time = time;
    const radians = angle * Math.PI / 180;
    const x = 130 + 205 * Math.cos(radians) - 103 * Math.sin(radians), y = 95 + 205 * Math.sin(radians) + 103 * Math.cos(radians);
    kettle.current?.setAttribute("transform", `rotate(${angle.toFixed(2)} 130 95)`);
    const reach = current.current.reach;
    arm.current?.setAttribute('transform', `translate(${kettleLayout.x + reach * 145 * kettleLayout.scale} ${kettleLayout.y - reach * 28 * kettleLayout.scale}) scale(${kettleLayout.scale})`);
    // Use the rendered assemblies so the stream still meets the rim after responsive placement.
    const inverse = stream.current?.getScreenCTM?.()?.inverse(), kettleMatrix = kettle.current?.getScreenCTM?.(), rimMatrix = rim.current?.getScreenCTM?.();
    const start = inverse && kettleMatrix ? new DOMPoint(335, 198).matrixTransform(kettleMatrix).matrixTransform(inverse) : { x, y };
    const end = inverse && rimMatrix ? new DOMPoint(478, 291).matrixTransform(rimMatrix).matrixTransform(inverse) : { x: glassCenter, y: glassRim };
    const jet = chaiJet(start, end, angle);
    stream.current?.setAttribute("d", jet.path);
    stream.current?.style.setProperty("opacity", exteriorSpans.length ? "1" : "0");
    stream.current?.style.setProperty("stroke-width", '3.8');
    stream.current?.setAttribute('stroke-dasharray', chaiFlowDashes(exteriorSpans));
    const surface = 422 - fill * 130;
    interior.current?.setAttribute("d", `M478 291C${478 + jet.entrySlope * 14} 305 ${481 + Math.sin(time / 230) * .5} ${surface - 8} 478 ${surface}`);
    interior.current?.style.setProperty("opacity", pouring ? ".95" : "0");
    interior.current?.setAttribute('stroke-dasharray', chaiFlowDashes(interiorSpans));
    tea.current?.setAttribute("transform", `translate(0 ${(1 - fill) * 130})`);
    foam.current?.setAttribute("transform", `translate(0 ${surface})`);
    foam.current?.style.setProperty("opacity", fill > .03 ? "1" : "0");
    const wave = Math.sin(time / 310) * (pouring ? 1.8 : .5);
    foam.current?.querySelector("path")?.setAttribute("d", `M420 0Q441 ${-3 + wave} 460 0T498 0T538 0V7H420Z`);
    steam.current?.style.setProperty("opacity", fill > .65 ? pouring ? ".2" : ".75" : "0");
    root.current?.style.setProperty("--chai-steam-drift", `${Math.sin(time / 650) * 5}px`);
    if (root.current) { root.current.dataset.poured = String(fill > .8 && !exteriorSpans.length && !pouring); root.current.dataset.pourStage = pouring ? 'arriving' : exteriorSpans.length ? 'travelling' : fill > .8 ? 'settled' : 'preparing'; }
  }
  useMotionActivity(root, {
    onStatus(status) {
      current.current.reduced = status === "reduced";
      if (status === "reduced") { current.current.angle = 0; current.current.reach = 0; flow.current.fill = .85; flow.current.releases = []; flow.current.releasing = false; draw(0); }
    },
    onFrame({ time, delta }) {
      const rate = Math.max(.25, Math.min(3, speed)), clock = flow.current.time + delta * rate;
      const ease = (value: number) => { const t = Math.max(0, Math.min(1, value)); return t * t * (3 - 2 * t); };
      const pose = clock < 1800 ? ease((clock - 650) / 1150) : clock < 7050 ? 1 : 1 - ease((clock - 7050) / 1150);
      const target = manual.current ?? 35 * pose;
      current.current.angle += (target - current.current.angle) * (1 - Math.exp(-delta / 120));
      current.current.reach += (pose - current.current.reach) * (1 - Math.exp(-delta / 100));
      const angle = current.current.angle;
      advanceChaiFlow(flow.current, clock, angle >= 28 && (manual.current !== null || clock >= 1800 && clock < 6400));
      draw(angle, time);
    },
  });
  useEffect(() => { const state = current.current; draw(state.angle, state.time); }, [size.width, size.height]); // eslint-disable-line react-hooks/exhaustive-deps
  // Close the optional audio graph along with the observed scene.
  useMotionActivityAudioCleanup(audio);
  function start(event: PointerEvent<SVGSVGElement>) {
    if (!interactive || current.current.reduced) return;
    const element = event.target as SVGElement;
    if (!element.closest("[data-kettle]")) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragging.current = { x: event.clientX, y: event.clientY, angle: current.current.angle };
    manual.current = current.current.angle; unlockSound();
  }
  function move(event: PointerEvent<SVGSVGElement>) {
    if (!dragging.current) return;
    const scale = event.currentTarget.viewBox.baseVal.width / event.currentTarget.getBoundingClientRect().width;
    const angle = Math.max(0, Math.min(45, dragging.current.angle + ((event.clientX - dragging.current.x) * .18 + (event.clientY - dragging.current.y) * .26) * scale));
    manual.current = angle;
  }
  function release() { dragging.current = null; manual.current = null; }
  return <div ref={root} className={cn("chai-pour", fullscreen && "chai-pour-fullscreen", className)} style={{ "--chai-grain": Math.max(0, Math.min(.15, grain)), ...style } as CSSProperties} data-steam-boost={steamBoost}>
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Chai being poured into a glass" onPointerDown={start} onPointerMove={move} onPointerUp={release} onPointerCancel={release} onLostPointerCapture={release}>
      <defs>
        <filter id={`${id}-grain`}><feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="3" stitchTiles="stitch" /><feColorMatrix type="saturate" values="0" /></filter>
        <clipPath id={`${id}-glass`}><path d="M427 291Q478 279 529 291L516 425Q478 443 440 425Z" /></clipPath>
        <linearGradient id={`${id}-chai`} x2="0" y2="1"><stop stopColor="var(--chai-tea-light, #c98a6a)" /><stop offset="1" stopColor="var(--chai-tea, #b5683f)" /></linearGradient>
        <pattern id={`${id}-cloth`} width="26" height="28" patternUnits="userSpaceOnUse"><path d="M13 5Q3 12 13 21Q23 12 13 5ZM13 8V18M8 13H18" fill="none" stroke="#f6e8bb" strokeWidth="1" /><circle cx="0" cy="0" r="2" fill="#f6e8bb" /></pattern>
        <filter id={`${id}-steam-soft`} filterUnits="userSpaceOnUse" x="-45" y="-40" width="180" height="180"><feGaussianBlur stdDeviation="1.7" /></filter>
        <clipPath id={`${id}-sleeve`}><path d={rightSleeve} /></clipPath>
      </defs>
      <g>
      <ellipse cx={fullscreen ? width * .52 : 367} cy={fullscreen ? glassRim + 155 * glassScale : 510} rx={compact ? 190 : 258} ry="12" fill="#c7bca5" opacity=".16" />
      <g ref={arm} className="chai-kettle-arm" transform={`translate(${kettleLayout.x} ${kettleLayout.y}) scale(${kettleLayout.scale})`}>
      <path className="chai-left-sleeve" d={leftSleeve} fill="var(--chai-teal, #17b3b8)" />
      <path d="M-50 223Q25 202 71 168Q98 151 118 126L124 138Q105 184 67 205Q18 231 -50 249Z" fill="#098c92" />
      <path d="M35 62Q89 66 117 82L126 106Q102 88 67 91Z" fill="#47c8c7" />
      <path d={leftSleeve} fill={`url(#${id}-cloth)`} opacity=".24" />
      <path d="M16 163Q58 131 93 124M42 186Q78 173 100 143M68 69Q89 89 112 92" fill="none" stroke="#146365" strokeWidth="1.4" strokeLinecap="round" />
      <g ref={kettle} data-kettle="true" className="chai-kettle">
        <path d="M166 86C170 99 176 118 187 119Q198 119 195 108L188 91M190 82C195 101 198 116 209 117Q220 116 216 103L211 84M213 80Q221 98 232 106Q244 110 245 98L230 80" fill="#d69977" stroke="#664735" strokeWidth="1.2" strokeLinejoin="round" />
        <path d="M162 148C149 78 254 58 275 141L258 143C243 83 173 94 178 149Z" fill="var(--chai-gold-shadow, #b87b0e)" />
        <path d="M169 145C160 95 239 76 264 140L256 141C239 91 176 107 180 145Z" fill="var(--chai-gold-light, #f3c34b)" />
        <path d="M262 235Q294 244 307 219L324 195Q337 188 341 200L327 207Q315 267 262 268Z" fill="var(--chai-gold-shadow, #b87b0e)" />
        <path d="M265 234Q301 235 318 202L335 196 337 200Q315 250 266 253Z" fill="var(--chai-gold, #e0a21b)" />
        <path d="M148 164Q207 127 268 164L287 233Q278 295 218 306 153 289 133 236Z" fill="var(--chai-gold, #e0a21b)" />
        <path d="M148 174Q126 240 161 273 195 301 231 300L214 306Q157 297 135 249 119 209 148 174Z" fill="var(--chai-gold-shadow, #b87b0e)" />
        <path d="M173 178Q199 164 228 169L248 212Q221 194 193 202Z" fill="var(--chai-gold-light, #f3c34b)" />
        <path d="M151 162Q205 134 261 158L269 167Q209 188 146 174Z" fill="var(--chai-gold-shadow, #b87b0e)" />
        <path d="M151 162Q207 135 261 158 217 177 151 162Z" fill="var(--chai-gold-light, #f3c34b)" />
        <path d="M201 139 205 121Q211 115 220 123L219 144Z" fill="#292420" /><ellipse cx="213" cy="123" rx="8" ry="5" fill="#151414" />
        <path d="M175 267Q207 279 239 266M180 275Q208 285 234 276" fill="none" stroke="#b57b19" strokeWidth="1.5" />
        <g className="chai-kettle-grip" stroke="#664735" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M112 76C140 73 159 63 181 63C195 59 214 61 229 69C241 77 252 91 259 104Q264 114 256 118Q249 120 244 109L232 92Q225 88 219 88Q215 101 220 111Q222 121 213 122Q204 121 201 110L192 93Q185 94 181 99Q182 108 189 115Q197 123 189 128Q181 132 175 124L162 108Q146 111 129 119Z" fill="#eab08a" />
          <path d="M132 109Q148 107 161 99Q168 98 176 103L184 115Q190 120 185 124Q179 128 172 119L160 107Q145 116 132 119Z" fill="#cc8e6b" stroke="none" />
          <path d="M142 82Q164 73 185 74Q205 69 226 82" fill="none" stroke="#f8cfaa" strokeWidth="5" />
          <path d="M174 81Q184 82 192 89M199 76Q209 80 215 88M230 78Q232 85 237 91M173 112 180 109M204 110 213 108" fill="none" />
          <path d="M246 103Q250 98 255 104L258 110Q255 115 251 112Z" fill="#f3c7a3" strokeWidth=".8" />
          <path d="M180 119Q184 115 188 119L189 123Q185 127 182 124Z" fill="#f3c7a3" strokeWidth=".7" />
          <path d="M108 72Q118 70 122 78L125 89Q129 94 128 103L135 114Q128 123 119 128Q109 123 111 116L115 106Q109 94 113 85Z" fill="#36b8b7" stroke="#146365" />
          <path d="M115 79Q113 88 118 94M119 104Q125 108 124 117" fill="none" stroke="#0b8d91" />
        </g>
      </g>
      </g>
      <path ref={stream} d="M335 198Q393 206 478 336" className="chai-stream" stroke={`url(#${id}-chai)`} fill="none" strokeLinecap="round" strokeWidth="3.8" pathLength="1" opacity="0" />
      <g className="chai-glass-hand" transform={`translate(${glassX} ${glassY}) scale(${glassScale})`}>
      <path className="chai-right-sleeve" d={rightSleeve} fill="var(--chai-yellow, #f2d21b)" />
      <g clipPath={`url(#${id}-sleeve)`}>
      <path d="M720 436 666 421 641 375 618 386 618 409 668 447 720 457Z" fill="#d4af12" />
      <path d="M624 328 646 315 670 364 656 375Z" fill="#f9e465" />
      <path d={rightSleeve} fill={`url(#${id}-cloth)`} opacity=".5" />
      </g>
      <path d="M616 338C595 335 576 339 557 330Q535 311 520 316L505 337Q479 347 452 336Q434 333 427 348C414 372 425 406 442 426Q466 445 499 431L550 405Q581 399 619 401Z" fill="#e9b08b" stroke="#664735" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M445 416Q469 435 502 417L549 391Q581 385 615 386L619 400Q580 399 550 405L499 431Q466 445 442 426Z" fill="#cb8c69" />
      <path d="M543 348Q569 353 600 350L607 370Q570 376 540 363Z" fill="#f4c6a5" />
      <path d="M527 366Q526 385 507 393M536 376Q533 390 518 396M563 393Q590 391 606 392" fill="none" stroke="#9a6045" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M601 340Q617 366 606 398M608 339Q624 368 613 398" fill="none" stroke="#b97819" strokeWidth="3" /><path d="M603 340Q619 366 608 398" fill="none" stroke="#f8d063" strokeWidth="1.2" />
      <path d="M427 291Q478 279 529 291L516 425Q478 443 440 425Z" fill="#fff" opacity=".2" />
      <g clipPath={`url(#${id}-glass)`}>
        <g ref={tea} className="chai-tea" transform="translate(0 130)"><path d="M420 292H540V442H420Z" fill={`url(#${id}-chai)`} /><path d="M493 292H540V442H493Z" fill="#965634" opacity=".3" /></g>
        <path ref={interior} className="chai-interior-stream" d="M478 291V422" fill="none" stroke="#a45d36" strokeWidth="3.7" strokeLinecap="round" pathLength="1" opacity="0" />
        <g ref={foam} className="chai-foam" transform="translate(0 422)" opacity="0"><path d="M420 0Q441 -4 460 0T498 0T538 0V7H420Z" fill="#efcfa4" /><ellipse className="chai-ripple" cx="478" cy="1" rx="10" ry="2.5" fill="none" stroke="#f5ddbb" strokeWidth="1.2" /><circle cx="452" cy="4" r="2" fill="#fbebd1" /><circle cx="500" cy="3" r="3" fill="#fbebd1" /></g>
      </g>
      <path className="chai-glass-wall" d="M432 295 446 420Q473 432 512 422L524 296Q479 312 432 295Z" fill="none" stroke="#fff" strokeOpacity=".65" strokeWidth="2" />
      <path d="M443 309 450 406 456 408 452 311ZM507 311 501 395 505 393 514 307Z" fill="#fff" opacity=".45" />
      <ellipse ref={rim} className="chai-glass-rim" cx="478" cy="291" rx="50" ry="8" fill="none" stroke="#fff" strokeOpacity=".7" strokeWidth="2" />
      <g className="chai-glass-grip" fill="#e9b08b" stroke="#664735" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">
        <path d="M432 312Q427 302 419 309Q413 317 418 327Q422 334 435 333L437 325Z" />
        <path d="M435 342Q429 333 421 340Q414 348 419 358Q425 365 437 361L439 354Z" />
        <path d="M439 372Q431 364 425 372Q419 381 425 390Q431 397 442 392L443 383Z" />
        <path d="M446 401Q438 394 433 402Q429 411 437 418Q444 422 451 416L451 410Z" />
        <path d="M524 323Q510 307 502 314Q495 321 503 333Q509 343 519 350L528 342Q520 336 518 331Z" />
        <path d="M420 314Q425 309 430 315L432 322Q427 328 422 322ZM422 343Q428 337 433 344L435 351Q430 357 424 351ZM427 376Q432 369 437 376L440 382Q436 388 430 383ZM437 406Q440 399 445 405L448 411Q443 417 439 412Z" fill="#f3c7a3" strokeWidth=".7" />
        <path d="M504 317Q507 313 513 318L519 324Q517 330 511 327Z" fill="#f3c7a3" strokeWidth=".7" />
        <path d="M519 342Q524 351 533 356M422 328 428 329M423 359 430 360M429 390 436 392" fill="none" stroke="#9a6045" />
      </g>
      <g ref={steam} className="chai-steam" opacity="0" onPointerEnter={() => setSteamBoost(true)} onPointerLeave={() => setSteamBoost(false)}><path d="M457 278C441 259 473 250 457 230S465 200 460 187M482 277C501 259 468 249 485 229S480 200 489 182M506 277C521 260 494 248 511 233S505 208 515 200" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" /></g>
      <rect x="424" y="282" width="110" height="158" fill="transparent" onPointerEnter={() => setSteamBoost(true)} onPointerLeave={() => setSteamBoost(false)} />
      </g>
      {fullscreen && <g className="chai-cloud-404" aria-hidden="true">
        <g className="chai-cloud-trail" fill="none" stroke="#fffdf3" strokeWidth="5" strokeLinecap="round"><path d={`M${glassCenter - 4} ${glassRim - 18}C${glassCenter - 32} ${glassRim - 64} ${glassCenter + 26} ${cloudY + 154 * cloudScale} ${cloudX + 160 * cloudScale} ${cloudY + 104 * cloudScale}`} /></g>
        <g className="chai-cloud-digits" transform={`translate(${cloudX} ${cloudY}) scale(${cloudScale})`} fill="none" strokeLinecap="round" strokeLinejoin="round">
          {[0, 1, 2].map(index => { const path = index === 1 ? 'M43 6C5 6 5 92 43 92S81 6 43 6' : 'M55 6 12 65H69M55 6V92'; const circles = index === 1 ? [[29,10,13],[17,38,13],[19,74,12],[43,91,13],[65,70,13],[66,31,13],[53,7,14]] : [[55,5,14],[39,31,13],[22,51,14],[53,68,14],[55,91,13]]; return <g className="chai-cloud-digit" key={index} transform={`translate(${index * 108} 0)`}>
            <path d={path} stroke="#80684b" strokeWidth="31" opacity=".78" filter={`url(#${id}-steam-soft)`} />
            <path d={path} stroke="#fffdf3" strokeWidth="24" filter={`url(#${id}-steam-soft)`} />
            <g fill="#fffdf3" stroke="none" opacity=".86">{circles.map(([x,y,r], circle) => <circle key={circle} cx={x} cy={y} r={r} />)}</g>
          </g>; })}
        </g>
      </g>}
      </g>
      <rect width="720" height="550" filter={`url(#${id}-grain)`} opacity="var(--chai-grain, .035)" className="chai-grain" />
    </svg>
  </div>;
}

function useMotionActivityAudioCleanup(audio: RefObject<AudioContext | null>) { useEffect(() => () => { void audio.current?.close().catch(() => {}); audio.current = null; }, [audio]); }

export type ChaiBreak404Props = Omit<ChaiPourProps, "fullscreen"> & { reportHref?: string; homeHref?: string; appearance?: Appearance; };
export function ChaiBreak404({ reportHref = "https://github.com/Eshiv-Pandey/OranGe-Ui/issues", homeHref = "/", appearance, className, style, ...scene }: ChaiBreak404Props) {
  const id = useId().replace(/:/g, "");
  return <main className={cn("chai-recovery", className)} style={style} data-appearance={appearance}>
    <svg className="chai-recovery-grain" aria-hidden="true" width="100%" height="100%"><filter id={`${id}-page-grain`}><feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="3" stitchTiles="stitch" /><feColorMatrix type="saturate" values="0" /></filter><rect width="100%" height="100%" filter={`url(#${id}-page-grain)`} opacity={Math.max(0, Math.min(.15, scene.grain ?? .035))} /></svg>
    <div className="chai-page-ornament" aria-hidden="true">
      <svg className="chai-toran" width="100%" height="108">
        <defs>
          <g id={`${id}-marigold`}>
            {Array.from({ length: 10 }, (_, petal) => <ellipse key={petal} cx="0" cy="-4.4" rx="2.7" ry="4" transform={`rotate(${petal * 36})`} fill={petal % 2 ? '#ec9a23' : '#d96a22'} stroke="#b7571e" strokeWidth=".35" />)}
            {Array.from({ length: 7 }, (_, petal) => <ellipse key={petal} cx="0" cy="-2.6" rx="1.7" ry="2.8" transform={`rotate(${petal * 360 / 7})`} fill={petal % 2 ? '#f2b83b' : '#ed9821'} />)}
            <circle r="1.8" fill="#f7cc59" /><path d="M-1 -.5 1 .5M-.5 1 .5 -1" stroke="#bd7822" strokeWidth=".45" />
          </g>
          <pattern id={`${id}-toran`} patternUnits="userSpaceOnUse" width="240" height="108">
            <path d="M0 21Q120 103 240 21" fill="none" stroke="#a17a39" strokeWidth="1.1" />
            {Array.from({ length: 15 }, (_, index) => {
              const x = 8 + index * 16, u = x / 240, y = 21 + 164 * u * (1 - u);
              return <g key={index} transform={`translate(${x} ${y})`}>
                {index % 2 === 0 && <g><path d="M0 6Q-11 14 -8 25Q-1 22 0 6Q11 14 8 25Q1 22 0 6Z" fill="#637740" /><path d="M0 8 -7 22M0 8 7 22" fill="none" stroke="#a0a05b" strokeWidth=".7" /></g>}
                <use href={`#${id}-marigold`} transform={index % 2 ? 'scale(.82)' : 'scale(1)'} />
              </g>;
            })}
            <path d="M120 65V84" stroke="#a17a39" strokeWidth="1" /><use href={`#${id}-marigold`} x="120" y="83" transform="rotate(12 120 83)" />
            <path d="M120 92V99M117 94V98M123 94V98" stroke="#c47e2b" strokeWidth=".8" />
          </pattern>
        </defs>
        <rect width="100%" height="108" fill={`url(#${id}-toran)`} />
      </svg>
      <svg className="chai-border-flower" viewBox="0 0 100 160"><path d="M50 148V66M50 116Q4 84 14 68Q44 72 50 116M50 92Q96 62 88 43Q58 50 50 92M50 66Q15 33 29 17Q52 35 50 66M50 65Q83 29 69 11Q51 28 50 65" fill="none" stroke="currentColor" strokeWidth="1.2" /><path d="M50 150Q29 146 24 156M50 150Q71 146 76 156" fill="none" stroke="currentColor" /></svg>
    </div>
    <div className="chai-recovery-art"><ChaiPour {...scene} fullscreen /></div>
    <span className="sr-only">404: page not found.</span>
    <div className="chai-recovery-copy"><h1>This page is out for a chai break.</h1><p>The page you&apos;re looking for doesn&apos;t exist or has moved. Meanwhile, chai?</p><a className="chai-home" href={homeHref}>Take me home <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" /></svg></a><a className="chai-report" href={reportHref}>Report a broken link</a></div>
  </main>;
}
