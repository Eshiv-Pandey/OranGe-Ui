"use client";
/* eslint-disable @next/next/no-html-link-for-pages -- Portable React components use native anchors. */

import { useId, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { Appearance } from "./appearance";
import { useMotionActivity } from "./use-motion-activity";
import "../../styles/pavilion-footer.css";

export type PavilionFooterLinkGroup = { title: string; links: readonly { label: string; href: string }[] };
export type PavilionFooterProps = {
  title?: string; brand?: ReactNode; linkGroups?: readonly PavilionFooterLinkGroup[];
  pixelated?: boolean; appearance?: Appearance; interactive?: boolean;
  defaultLit?: boolean; className?: string; style?: CSSProperties;
};
const defaultGroups: readonly PavilionFooterLinkGroup[] = [
  { title: "Explore", links: [{ label: "Components", href: "/components" }, { label: "Getting started", href: "/docs" }] },
  { title: "Elsewhere", links: [{ label: "GitHub", href: "https://github.com/Eshiv-Pandey/OranGe-Ui" }, { label: "Report an issue", href: "https://github.com/Eshiv-Pandey/OranGe-Ui/issues" }] },
];

const birds = [
  { offset: .16, duration: 23, size: .46, y: 104, direction: 1 },
  { offset: .61, duration: 28, size: .35, y: 156, direction: -1 },
  { offset: .4, duration: 25, size: .58, y: 82, direction: 1 },
  { offset: .78, duration: 31, size: .4, y: 198, direction: -1 },
];
function birdPose(index: number, time: number) {
  const bird = birds[index], phase = (time / bird.duration + bird.offset) % 1;
  const x = bird.direction > 0 ? -52 + phase * 864 : 812 - phase * 864;
  const y = bird.y + Math.sin(phase * Math.PI * 2) * 17 + Math.sin(time * .4 + index) * 4;
  return `translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${(Math.cos(phase * Math.PI * 2) * 4 * bird.direction).toFixed(2)}) scale(${bird.size * bird.direction} ${bird.size})`;
}

/** One symmetric architectural drawing, reused with distinct blue palettes. */
function PavilionArchitecture({ id, pixel }: { id: string; pixel: boolean }) {
  const arch = pixel ? "M0 96V42H8V30H16V22H24V14H32V6H48V14H56V22H64V30H72V42H80V96Z" : "M0 96V44Q0 33 11 30Q10 19 24 18Q26 9 40 4Q54 9 56 18Q70 19 69 30Q80 33 80 44V96Z";
  const dome = pixel ? "M250 230V206H270V186H294V170H318V154H342V130H360V110H372V90H388V110H400V130H418V154H442V170H466V186H490V206H510V230Z" : "M250 230C250 165 351 169 380 90C409 169 510 165 510 230Z";
  return <>
    <clipPath id={`${id}-dome`}><path d={dome} /></clipPath>
    <g id={`${id}-architecture`}>
      <path d="M263 270H497V506H263Z" fill="var(--pavilion-blue)" />
      <path d={dome} fill="var(--pavilion-blue)" />
      <g clipPath={`url(#${id}-dome)`} fill="none" stroke="var(--pavilion-detail)" strokeWidth="1.25">
        {[258, 299, 340, 380, 420, 461, 502].map(x => <path key={x} d={`M380 102Q${380 + (x - 380) * .34} 168 ${x} 231M${x} 222Q${x - 21} 190 ${380 + (x - 380) * .54} 157Q${x + 21} 190 ${x} 222ZM${x} 214Q${x - 11} 190 ${380 + (x - 380) * .56} 166`} />)}
        {[287, 333, 380, 427, 473].map(x => <g key={x} transform={`translate(${x} ${204 - Math.abs(x - 380) * .05})`}>{Array.from({ length: 8 }, (_, index) => <path key={index} d="M0-3Q-8-10 0-17Q8-10 0-3Z" transform={`rotate(${index * 45})`} />)}<circle r="3" /></g>)}
        <path d="M252 218Q315 200 380 208Q445 200 508 218M270 191Q325 173 380 184Q435 173 490 191" />
      </g>
      <path d={pixel ? "M373 92V70H365V58H374V38H378V18H382V38H386V58H395V70H387V92Z" : "M374 92Q368 78 376 68Q363 56 375 42Q370 28 380 15Q390 28 385 42Q397 56 384 68Q392 78 386 92Z"} fill="var(--pavilion-blue)" />
      <path d="M380 86V27M380 67Q370 57 380 48Q390 57 380 67M380 43Q375 34 380 28Q385 34 380 43" fill="none" stroke="var(--pavilion-detail)" strokeWidth="1.1" />
      <rect x="246" y="230" width="268" height="25" fill="var(--pavilion-mid)" /><rect x="246" y="230" width="268" height="25" fill={`url(#${id}-tiles)`} />
      <path d={pixel ? "M246 255H514V264H554V273H514V280H246V273H206V264H246Z" : "M246 255Q228 270 206 271Q228 287 252 280H508Q532 287 554 271Q532 270 514 255Z"} fill="var(--pavilion-mid)" />
      {[274, 352, 430].map(x => <g key={x} transform={`translate(${x} 289) scale(.7 1)`}><path d={arch} className="pavilion-window" /><path d={arch} transform="translate(3 5) scale(.925 .94)" fill="none" stroke="var(--pavilion-detail)" strokeWidth="1.8" /></g>)}
      {[263, 341, 419, 489].map(x => <g key={x}><rect x={x} y="285" width="8" height="96" fill="var(--pavilion-mid)" /><path d={`M${x + 4} 288v90m-4-83h8m-8 75h8`} fill="none" stroke="var(--pavilion-detail)" strokeWidth="1" /></g>)}
      <rect x="250" y="380" width="260" height="20" fill="var(--pavilion-mid)" /><rect x="250" y="380" width="260" height="20" fill={`url(#${id}-tiles)`} />
      {Array.from({ length: 23 }, (_, index) => <path key={index} d={`M${259 + index * 11} 354v26m-3-23 3-5 3 5-3 5Z`} fill="var(--pavilion-detail)" stroke="var(--pavilion-detail)" strokeWidth="1.5" />)}
      {[263.5, 300.5, 337.5, 374.5, 411.5, 448.5, 485.5].map(x => <path key={x} d={`M${x} 400h11v8q-2 7-6 10l-5-5Z`} fill="var(--pavilion-mid)" />)}
      {[274, 352, 430].map(x => <g key={x} transform={`translate(${x} 407) scale(.7 1)`}><path d={arch} className="pavilion-window" /><path d={arch} transform="translate(3 5) scale(.925 .94)" fill="none" stroke="var(--pavilion-detail)" strokeWidth="1.8" /></g>)}
      {[263, 341, 419, 489].map(x => <g key={x}><rect x={x} y="405" width="8" height="101" fill="var(--pavilion-mid)" /><path d={`M${x + 4} 408v93`} stroke="var(--pavilion-detail)" /></g>)}
      <rect x="234" y="506" width="292" height="12" fill="var(--pavilion-blue)" /><rect x="234" y="506" width="292" height="12" fill={`url(#${id}-tiles)`} />
      <path d="M334 518H426V523H438V528H450V534H310V528H322V523H334Z" fill="var(--pavilion-mid)" /><path d="M334 523H426M322 528H438" stroke="var(--pavilion-detail)" strokeWidth="1" />
    </g>
  </>;
}

export function PavilionFooter({ title = "A little wonder.\nA place to return.", brand = "oRangeUi", linkGroups = defaultGroups, pixelated = false, appearance, interactive = true, defaultLit = false, className, style }: PavilionFooterProps) {
  const root = useRef<HTMLElement>(null), art = useRef<SVGGElement>(null), birdNodes = useRef<(SVGGElement | null)[]>([]), reduced = useRef(false);
  const pointer = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const [lit, setLit] = useState(defaultLit), id = useId().replace(/:/g, ""), pixel = pixelated || appearance === "pixel";
  function paintBirds(time: number) {
    birdNodes.current.forEach((node, index) => {
      if (!node) return;
      node.setAttribute("transform", birdPose(index, time));
      const gliding = (time + index * 1.6) % 7 > 4.7;
      const beat = gliding ? .1 : Math.sin(time * (6.4 + index * .35) + index * 1.7);
      node.children[1]?.setAttribute("transform", `rotate(${(-beat * 15).toFixed(2)} -4 2) scale(1 ${(0.72 + beat * .22).toFixed(3)})`);
      node.children[2]?.setAttribute("transform", `rotate(${(beat * 18).toFixed(2)} 0 2) scale(1 ${(0.76 + beat * .24).toFixed(3)})`);
    });
  }
  useMotionActivity(root, {
    onStatus(status) {
      reduced.current = status === "reduced";
      if (root.current) root.current.dataset.flight = status;
      if (reduced.current) { pointer.current = { x: 0, y: 0, targetX: 0, targetY: 0 }; art.current?.setAttribute("transform", "translate(0 0)"); paintBirds(0); }
    },
    onFrame({ delta, time }) {
      const pose = pointer.current, ease = 1 - Math.exp(-delta / 180);
      pose.x += (pose.targetX - pose.x) * ease; pose.y += (pose.targetY - pose.y) * ease;
      art.current?.setAttribute("transform", `translate(${pose.x.toFixed(3)} ${pose.y.toFixed(3)})`);
      paintBirds(time / 1000);
    },
  });
  return <footer ref={root} className={cn("pavilion-footer", className)} style={style} data-lit={lit} data-pixel={pixel}>
    <div className="pavilion-footer-top"><div className="pavilion-footer-copy"><h2>{title}</h2><nav aria-label="Footer navigation" className="pavilion-footer-nav">{linkGroups.map(group => <div key={group.title}><h3>{group.title}</h3>{group.links.map(link => <a key={link.href} href={link.href}>{link.label}</a>)}</div>)}</nav></div>
      <div className="pavilion-footer-scene" onPointerMove={event => { if (!interactive || reduced.current || event.pointerType === "touch") return; const bounds = event.currentTarget.getBoundingClientRect(); pointer.current.targetX = ((event.clientX - bounds.left) / bounds.width - .5) * 8; pointer.current.targetY = ((event.clientY - bounds.top) / bounds.height - .5) * 5; }} onPointerLeave={() => { pointer.current.targetX = 0; pointer.current.targetY = 0; }}>
        <svg viewBox="0 0 760 560" aria-hidden="true" focusable="false">
          <defs>
            <pattern id={`${id}-tiles`} width="22" height="22" patternUnits="userSpaceOnUse"><path d={pixel ? "M11 0H15V7H22V15H15V22H7V15H0V7H7V0Z" : "M11 1Q21 11 11 21Q1 11 11 1ZM0 11H22M11 0V22"} fill="none" stroke="var(--pavilion-detail)" strokeWidth=".9" /></pattern>
            <g id={`${id}-mandala`}>{Array.from({ length: 16 }, (_, index) => <path key={index} d="M0-18Q-27-42 0-66Q27-42 0-18ZM0-24V-59" transform={`rotate(${index * 22.5})`} fill="none" stroke="currentColor" strokeWidth="1" />)}<circle r="69" fill="none" stroke="currentColor" /></g>
            <PavilionArchitecture id={id} pixel={pixel} />
          </defs>
          <g color="var(--pavilion-detail)" opacity=".2"><use href={`#${id}-mandala`} transform="translate(675 104) scale(1.35)" /><use href={`#${id}-mandala`} transform="translate(88 395) scale(1.3)" /></g>
          <circle cx="178" cy="204" r="83" fill="var(--pavilion-moon)" opacity=".75" /><use href={`#${id}-mandala`} transform="translate(178 204)" color="#467f9d" opacity=".22" />
          <path d="M20 520Q185 506 380 522Q569 506 742 520" fill="none" stroke="#80b5bc" strokeWidth="1" opacity=".5" />
          <g ref={art} className="pavilion-building">
            <use className="pavilion-neighbor" href={`#${id}-architecture`} transform="translate(-72 280) scale(.5)" style={{ "--pavilion-blue": "#6b99b2", "--pavilion-mid": "#86b4c4", "--pavilion-detail": "#b2d3d5" } as CSSProperties} />
            <use className="pavilion-neighbor" href={`#${id}-architecture`} transform="translate(-28 176) scale(.65)" style={{ "--pavilion-blue": "#426f9a", "--pavilion-mid": "#6798b1", "--pavilion-detail": "#98c5cc" } as CSSProperties} />
            <use className="pavilion-neighbor" href={`#${id}-architecture`} transform="translate(423 228) scale(.56)" style={{ "--pavilion-blue": "#5685ad", "--pavilion-mid": "#7ba8bc", "--pavilion-detail": "#add0d6" } as CSSProperties} />
            <use className="pavilion-main-building" href={`#${id}-architecture`} />
          </g>
          <g className="pavilion-birds" fill="#203e56">{birds.map((bird, index) => <g key={index} ref={node => { birdNodes.current[index] = node; }} className="pavilion-bird" transform={birdPose(index, 0)}>
            <path d={pixel ? "M-22 0H-10V-3H6V0H12V3H4V6H-10V3H-22V9H-26V3Z" : "M-12 2-25 11-20 2-25-3-10 0Q-3-6 5-3L13 0 6 1Q3 6-4 4Z"} />
            <g className="pavilion-bird-far-wing"><path d={pixel ? "M-6 0H-18V-6H-28V-12H-40V-16H-24V-8H-12V-3H-6Z" : "M-4 2C-17-5-27-22-39-17L-31-12-24-2-13 5Z"} /></g>
            <g className="pavilion-bird-near-wing"><path d={pixel ? "M-3 2H8V-4H20V-10H34V-14H42V-10H30V-4H16V3H4V6H-3Z" : "M-4 2C8-12 28-23 41-14L28-12 19-4 9 5 0 6Z"} /></g>
          </g>)}</g>
        </svg>
        {interactive && <div className="pavilion-controls"><button type="button" aria-pressed={lit} onClick={() => setLit(value => !value)}>{lit ? "Dim the pavilion" : "Light the pavilion"}<svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M7 14h6m-5 3h4M6 9a4 4 0 1 1 8 0c0 2-2 2-2 5H8c0-3-2-3-2-5Z" /></svg></button></div>}
      </div>
    </div>
    <div className="pavilion-footer-bottom"><a href="/" className="pavilion-wordmark">{brand}</a><span>Made for the curious.</span><a className="pavilion-back-top" href="#top" onClick={event => { event.preventDefault(); window.scrollTo({ top: 0, behavior: reduced.current ? "instant" : "smooth" }); const heading = document.querySelector<HTMLElement>("h1"); if (heading) { heading.setAttribute("tabindex", "-1"); heading.focus({ preventScroll: true }); } }}><span>Back to top</span><svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M10 16V4m-5 5 5-5 5 5" /></svg></a></div>
  </footer>;
}
