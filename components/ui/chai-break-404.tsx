"use client";

import { useEffect, useId, useRef, useState, type CSSProperties, type PointerEvent, type RefObject } from "react";
import { cn } from "@/lib/utils";
import type { Appearance } from "./appearance";
import { useMotionActivity } from "./use-motion-activity";
import "../../styles/chai-break-404.css";

export type ChaiPourProps = { speed?: number; grain?: number; interactive?: boolean; sound?: boolean; fullscreen?: boolean; className?: string; style?: CSSProperties; };

export function ChaiPour({ speed = 1, grain = .035, interactive = true, sound = false, fullscreen = false, className, style }: ChaiPourProps) {
  const root = useRef<HTMLDivElement>(null), kettle = useRef<SVGGElement>(null), stream = useRef<SVGPathElement>(null);
  const tea = useRef<SVGGElement>(null), foam = useRef<SVGGElement>(null), steam = useRef<SVGGElement>(null);
  const id = useId().replace(/:/g, ""), dragging = useRef<{ x: number; y: number; angle: number } | null>(null);
  const manual = useRef<number | null>(null), current = useRef({ angle: 0, fill: 0, reduced: false });
  const audio = useRef<AudioContext | null>(null), [steamBoost, setSteamBoost] = useState(false);
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
  function draw(angle: number, fill: number, pouring: boolean, time = 0) {
    const radians = angle * Math.PI / 180;
    const x = 205 + 130 * Math.cos(radians) - 94 * Math.sin(radians), y = 104 + 130 * Math.sin(radians) + 94 * Math.cos(radians);
    kettle.current?.setAttribute("transform", `rotate(${angle.toFixed(2)} 205 104)`);
    // The external stream enters through the rim. Liquid and foam stay behind the glass.
    stream.current?.setAttribute("d", `M${x} ${y}C${x + 58} ${y + 8} ${478 + Math.sin(time / 230) * 1.2} ${y + 30} 478 336`);
    stream.current?.style.setProperty("opacity", pouring ? "1" : "0");
    stream.current?.style.setProperty("stroke-width", `${Math.max(1, Math.min(5.5, (angle - 7) / 5))}`);
    stream.current?.style.setProperty("stroke-dashoffset", `${Math.max(0, 1 - fill * 20) * 300}`);
    tea.current?.setAttribute("transform", `translate(0 ${(1 - fill) * 130})`);
    foam.current?.setAttribute("transform", `translate(0 ${422 - fill * 130})`);
    foam.current?.style.setProperty("opacity", fill > .03 ? "1" : "0");
    const wave = Math.sin(time / 310) * (pouring ? 1.8 : .5);
    foam.current?.querySelector("path")?.setAttribute("d", `M420 0Q441 ${-3 + wave} 460 0T498 0T538 0V7H420Z`);
    steam.current?.style.setProperty("opacity", fill > .65 ? pouring ? ".2" : ".75" : "0");
    root.current?.style.setProperty("--chai-steam-drift", `${Math.sin(time / 650) * 5}px`);
    if (root.current) root.current.dataset.poured = String(fill > .8 && !pouring);
  }
  useMotionActivity(root, {
    onStatus(status) {
      current.current.reduced = status === "reduced";
      if (status === "reduced") { current.current.angle = 0; current.current.fill = .85; draw(0, .85, false); }
    },
    onFrame({ time, delta }) {
      const phase = (time * Math.max(.25, Math.min(3, speed)) % 12000) / 12000;
      const ease = (value: number) => 1 - Math.pow(1 - Math.max(0, Math.min(1, value)), 3);
      const target = manual.current ?? (phase < .12 ? 35 * ease(phase / .12) : phase < .54 ? 35 : phase < .66 ? 35 * (1 - ease((phase - .54) / .12)) : 0);
      current.current.angle += (target - current.current.angle) * (1 - Math.exp(-delta / 120));
      const angle = current.current.angle;
      const progress = Math.max(0, Math.min(1, (phase - .12) / .42));
      const targetFill = phase < .54 ? .85 * progress * progress * (3 - 2 * progress) : phase < .86 ? .85 : .85 * (1 - ease((phase - .86) / .14));
      const fill = manual.current !== null ? Math.min(.85, current.current.fill + Math.max(0, angle - 8) * delta / 180000) : current.current.fill + (targetFill - current.current.fill) * (1 - Math.exp(-delta / 240));
      current.current.fill = fill;
      draw(angle, fill, angle > 9 && fill < .849 && (manual.current !== null || phase >= .12 && phase < .54), time);
    },
  });
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
    const scale = 720 / event.currentTarget.getBoundingClientRect().width;
    const angle = Math.max(0, Math.min(45, dragging.current.angle + ((event.clientX - dragging.current.x) * .18 + (event.clientY - dragging.current.y) * .26) * scale));
    manual.current = angle;
  }
  function release() { dragging.current = null; manual.current = null; }
  return <div ref={root} className={cn("chai-pour", fullscreen && "chai-pour-fullscreen", className)} style={{ "--chai-grain": Math.max(0, Math.min(.15, grain)), ...style } as CSSProperties} data-steam-boost={steamBoost}>
    <svg viewBox="0 0 720 550" role="img" aria-label="Chai being poured into a glass" onPointerDown={start} onPointerMove={move} onPointerUp={release} onPointerCancel={release} onLostPointerCapture={release}>
      <defs>
        <filter id={`${id}-grain`}><feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="3" stitchTiles="stitch" /><feColorMatrix type="saturate" values="0" /></filter>
        <clipPath id={`${id}-glass`}><path d="M427 291Q478 279 529 291L516 425Q478 443 440 425Z" /></clipPath>
        <linearGradient id={`${id}-chai`} x2="0" y2="1"><stop stopColor="var(--chai-tea-light, #c98a6a)" /><stop offset="1" stopColor="var(--chai-tea, #b5683f)" /></linearGradient>
        <pattern id={`${id}-cloth`} width="26" height="28" patternUnits="userSpaceOnUse"><path d="M13 5Q3 12 13 21Q23 12 13 5ZM13 8V18M8 13H18" fill="none" stroke="#f6e8bb" strokeWidth="1" /><circle cx="0" cy="0" r="2" fill="#f6e8bb" /></pattern>
        <filter id={`${id}-steam-soft`} x="-20%" y="-30%" width="140%" height="160%"><feGaussianBlur stdDeviation="1.7" /></filter>
      </defs>
      <g transform={fullscreen ? "translate(0 -55)" : undefined}>
      <ellipse cx="367" cy="510" rx="258" ry="12" fill="#c7bca5" opacity=".16" />
      <path d="M0 67 67 58 121 72 151 121 116 194 49 225 0 239Z" fill="var(--chai-teal, #17b3b8)" />
      <path d="M0 214 66 191 113 142 128 151 96 198 44 231 0 239Z" fill="#098c92" />
      <path d="M50 80 113 87 130 117 118 129 91 104Z" fill="#47c8c7" />
      <path d="M0 67 67 58 121 72 151 121 116 194 49 225 0 239Z" fill={`url(#${id}-cloth)`} opacity=".48" />
      <g ref={kettle} data-kettle="true" className="chai-kettle">
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
        <text x="206" y="256" textAnchor="middle" className="chai-kettle-lettering" lang="hi" transform="rotate(-11 206 240)">चाय</text>
        <path d="M175 267Q207 279 239 266M180 275Q208 285 234 276" fill="none" stroke="#b57b19" strokeWidth="1.5" />
      </g>
      <path d="M112 76Q153 63 187 62L236 75Q256 91 254 104 246 111 234 95L221 91 222 119Q214 128 206 113L194 92 187 99 193 122Q186 132 176 115L163 103Q148 106 129 119Z" fill="#e9b08b" />
      <path d="M132 106 163 92 176 114Q184 126 192 122 190 136 179 128L162 110 143 118 129 119Z" fill="#cb8c69" />
      <path d="M181 72 205 76 219 84 207 87 186 82Z" fill="#f4c6a5" />
      <path ref={stream} d="M335 198C393 206 478 228 478 336" className="chai-stream" stroke={`url(#${id}-chai)`} fill="none" strokeLinecap="round" strokeWidth="5" strokeDasharray="300" opacity="0" />
      <g className="chai-glass-hand" transform="translate(0 45)">
      <path d="M720 290 659 296 613 335 618 409 668 447 720 457Z" fill="var(--chai-yellow, #f2d21b)" />
      <path d="M720 436 666 421 641 375 618 386 618 409 668 447 720 457Z" fill="#d4af12" />
      <path d="M624 328 646 315 670 364 656 375Z" fill="#f9e465" />
      <path d="M720 290 659 296 613 335 618 409 668 447 720 457Z" fill={`url(#${id}-cloth)`} opacity=".5" />
      <path d="M616 338 561 334Q532 311 518 316L519 340 485 354 436 350Q417 352 421 365L429 379Q416 392 432 409L442 432Q465 446 500 434L553 405 619 401Z" fill="#e9b08b" />
      <path d="M447 424Q472 443 506 424L559 392 617 382 619 401 553 405 500 434Q461 450 442 432Z" fill="#cb8c69" />
      <path d="M550 350 601 352 608 372 555 373 532 367Z" fill="#f4c6a5" />
      <path d="M601 340Q617 366 606 398M608 339Q624 368 613 398" fill="none" stroke="#b97819" strokeWidth="3" /><path d="M603 340Q619 366 608 398" fill="none" stroke="#f8d063" strokeWidth="1.2" />
      <path d="M427 291Q478 279 529 291L516 425Q478 443 440 425Z" fill="#fff" opacity=".2" />
      <g clipPath={`url(#${id}-glass)`}>
        <g ref={tea} className="chai-tea" transform="translate(0 130)"><path d="M420 292H540V442H420Z" fill={`url(#${id}-chai)`} /><path d="M493 292H540V442H493Z" fill="#965634" opacity=".3" /></g>
        <g ref={foam} className="chai-foam" transform="translate(0 422)" opacity="0"><path d="M420 0Q441 -4 460 0T498 0T538 0V7H420Z" fill="#efcfa4" /><ellipse className="chai-ripple" cx="478" cy="1" rx="10" ry="2.5" fill="none" stroke="#f5ddbb" strokeWidth="1.2" /><circle cx="452" cy="4" r="2" fill="#fbebd1" /><circle cx="500" cy="3" r="3" fill="#fbebd1" /></g>
      </g>
      <path d="M432 295 446 420Q473 432 512 422L524 296Q479 312 432 295Z" fill="none" stroke="#fff" strokeOpacity=".55" strokeWidth="2" />
      <path d="M443 309 450 406 456 408 452 311ZM507 311 501 395 505 393 514 307Z" fill="#fff" opacity=".45" />
      <ellipse cx="478" cy="291" rx="50" ry="8" fill="none" stroke="#fff" strokeOpacity=".7" strokeWidth="2" />
      <path d="M519 329Q509 308 499 317 493 324 505 338L517 349Z" fill="#e9b08b" /><path d="M499 317Q493 324 505 338L511 336Q501 325 505 319Z" fill="#f4c6a5" />
      <g ref={steam} className="chai-steam" opacity="0" onPointerEnter={() => setSteamBoost(true)} onPointerLeave={() => setSteamBoost(false)}><path d="M457 278C441 259 473 250 457 230S465 200 460 187M482 277C501 259 468 249 485 229S480 200 489 182M506 277C521 260 494 248 511 233S505 208 515 200" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" /></g>
      <rect x="424" y="282" width="110" height="158" fill="transparent" onPointerEnter={() => setSteamBoost(true)} onPointerLeave={() => setSteamBoost(false)} />
      </g>
      {fullscreen && <g className="chai-cloud-404" aria-hidden="true">
        <g className="chai-cloud-trail" fill="none" stroke="#fffdf3" strokeWidth="5" strokeLinecap="round"><path d="M475 318C452 290 511 264 480 233S502 196 493 183M501 316C522 290 476 272 507 246S496 218 511 199" /></g>
        <g transform="translate(356 104)" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <g stroke="#d8c8a6" strokeWidth="28" opacity=".35" filter={`url(#${id}-steam-soft)`}><path d="M55 6 12 65H69M55 6V92M111 6C73 6 73 92 111 92S149 6 111 6M218 6 175 65H232M218 6V92" /></g>
          <g stroke="#fffdf3" strokeWidth="24" filter={`url(#${id}-steam-soft)`}><path d="M55 6 12 65H69M55 6V92M111 6C73 6 73 92 111 92S149 6 111 6M218 6 175 65H232M218 6V92" /></g>
          <g fill="#fffdf3" stroke="none" opacity=".86">{[[55,5,14],[39,31,13],[22,51,14],[53,68,14],[55,91,13],[97,10,13],[85,38,13],[87,74,12],[111,91,13],[133,70,13],[134,31,13],[121,7,14],[218,5,14],[203,28,13],[185,52,14],[215,67,14],[218,92,13]].map(([x,y,r], index) => <circle key={index} cx={x} cy={y} r={r} />)}</g>
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
    <div className="chai-page-ornament" aria-hidden="true"><svg viewBox="0 0 720 110" preserveAspectRatio="none"><path d="M0 8Q90 88 180 8Q270 88 360 8Q450 88 540 8Q630 88 720 8" fill="none" stroke="#b8832b" strokeWidth="1.2" />{Array.from({ length: 49 }, (_, index) => { const x = index * 15, local = x % 180, y = 8 + 80 * local / 180 * (1 - local / 180); return <g key={index} transform={`translate(${x} ${y})`}><circle r="5.5" fill={index % 2 ? "#de9c22" : "#df722d"} /><circle r="2" fill="#f3c550" /><path d="M0 6Q-4 15 0 19Q4 15 0 6Z" fill="#738143" /></g>; })}</svg><span className="chai-stall-sign" lang="hi">चाय</span><svg className="chai-border-flower" viewBox="0 0 100 160"><path d="M50 148V66M50 116Q4 84 14 68Q44 72 50 116M50 92Q96 62 88 43Q58 50 50 92M50 66Q15 33 29 17Q52 35 50 66M50 65Q83 29 69 11Q51 28 50 65" fill="none" stroke="currentColor" strokeWidth="1.2" /><path d="M50 150Q29 146 24 156M50 150Q71 146 76 156" fill="none" stroke="currentColor" /></svg></div>
    <div className="chai-recovery-art"><ChaiPour {...scene} fullscreen /></div>
    <span className="sr-only">404: page not found.</span>
    <div className="chai-recovery-copy"><h1>This page is out for a chai break.</h1><p>The page you&apos;re looking for doesn&apos;t exist or has moved. Meanwhile, chai?</p><a className="chai-home" href={homeHref}>Take me home <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" /></svg></a><a className="chai-report" href={reportHref}>Report a broken link</a></div>
  </main>;
}
