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

export function PavilionFooter({ title = "A little wonder.\nA place to return.", brand = "oRangeUi", linkGroups = defaultGroups, pixelated = false, appearance, interactive = true, defaultLit = false, className, style }: PavilionFooterProps) {
  const root = useRef<HTMLElement>(null), art = useRef<SVGGElement>(null), reduced = useRef(false);
  const [lit, setLit] = useState(defaultLit), [flight, setFlight] = useState(0), id = useId().replaceAll(":", "");
  const pixel = pixelated || appearance === "pixel";
  useMotionActivity(root, { onStatus(status) { reduced.current = status === "reduced"; if (reduced.current) art.current?.setAttribute("transform", "translate(0 0)"); } });
  const arch = pixel ? "M0 92V40H8V28H16V20H24V12H32V4H48V12H56V20H64V28H72V40H80V92Z" : "M0 92V44Q0 33 11 30Q10 19 24 18Q26 9 40 4Q54 9 56 18Q70 19 69 30Q80 33 80 44V92Z";
  return <footer ref={root} className={cn("pavilion-footer", className)} style={style} data-lit={lit} data-pixel={pixel}>
    <div className="pavilion-footer-top"><div className="pavilion-footer-copy"><h2>{title}</h2><nav aria-label="Footer navigation" className="pavilion-footer-nav">{linkGroups.map(group => <div key={group.title}><h3>{group.title}</h3>{group.links.map(link => <a key={link.href} href={link.href}>{link.label}</a>)}</div>)}</nav></div>
      <div className="pavilion-footer-scene" onPointerMove={event => { if (!interactive || reduced.current) return; const bounds = event.currentTarget.getBoundingClientRect(); const x = (event.clientX - bounds.left) / bounds.width - .5, y = (event.clientY - bounds.top) / bounds.height - .5; art.current?.setAttribute("transform", `translate(${x * 12} ${y * 8})`); }} onPointerLeave={() => art.current?.setAttribute("transform", "translate(0 0)")}>
        <svg viewBox="0 0 580 510" aria-hidden="true" focusable="false">
          <defs>
            <pattern id={`${id}-tiles`} width="24" height="24" patternUnits="userSpaceOnUse"><path d={pixel ? "M12 0H16V8H24V16H16V24H8V16H0V8H8V0Z" : "M12 1Q23 12 12 23Q1 12 12 1ZM0 12H24M12 0V24"} fill="none" stroke="var(--pavilion-detail, #74afc3)" strokeWidth=".9" /></pattern>
            <pattern id={`${id}-petals`} width="40" height="48" patternUnits="userSpaceOnUse"><path d={pixel ? "M20 4H24V12H28V20H32V28H28V36H24V44H16V36H12V28H8V20H12V12H16V4Z" : "M20 3Q44 23 20 45Q-4 23 20 3ZM20 9V39M20 25 30 17M20 31 10 22"} fill="none" stroke="var(--pavilion-detail, #74afc3)" strokeWidth="1" /></pattern>
            <clipPath id={`${id}-dome`}><path d={pixel ? "M195 206V182H211V166H227V150H243V134H267V118H291V102H307V86H323V102H339V118H363V134H387V150H403V166H419V182H435V206Z" : "M191 206C191 143 286 147 313 78C344 146 438 143 438 206Z"} /></clipPath>
            <g id={`${id}-mandala`}>{Array.from({ length: 16 }, (_, index) => <path key={index} d={pixel ? "M0-18H8V-30H12V-50H8V-62H0V-50H-8V-30H0Z" : "M0-18Q-27-42 0-66Q27-42 0-18ZM0-24V-59"} transform={`rotate(${index * 22.5})`} fill="none" stroke="currentColor" strokeWidth="1" />)}<circle r="69" fill="none" stroke="currentColor" /></g>
          </defs>
          <g className="pavilion-mandala" color="var(--pavilion-detail, #74afc3)" opacity=".23"><use href={`#${id}-mandala`} transform="translate(495 96) scale(1.5)" /><use href={`#${id}-mandala`} transform="translate(133 411) scale(1.1)" /></g>
          <g className="pavilion-moon"><circle cx="121" cy="210" r="75" fill="var(--pavilion-moon, #9bcdd1)" /><use href={`#${id}-mandala`} transform="translate(121 210)" color="#467f9d" opacity=".35" /></g>
          <g ref={art} className="pavilion-building">
            <path d="M176 485H493V510H163V496Z" fill="var(--pavilion-blue, #163084)" />
            <path d={pixel ? "M197 224H429V485H197Z" : "M197 220H429V485H197Z"} fill="var(--pavilion-blue, #163084)" />
            {[218, 293, 368].map(x => <g key={x} transform={`translate(${x} 358)`}><path d={arch} transform="scale(.68 1.2)" fill="var(--pavilion-sky, #d7e8da)" /><path d={arch} transform="translate(4 8) scale(.58 1.07)" className="pavilion-window" /></g>)}
            <path d="M191 206C191 143 286 147 313 78C344 146 438 143 438 206Z" fill="var(--pavilion-blue, #163084)" clipPath={`url(#${id}-dome)`} />
            {pixel && <path d="M195 206V182H211V166H227V150H243V134H267V118H291V102H307V86H323V102H339V118H363V134H387V150H403V166H419V182H435V206Z" fill="var(--pavilion-blue, #163084)" />}
            <rect x="187" y="80" width="260" height="128" fill={`url(#${id}-petals)`} clipPath={`url(#${id}-dome)`} />
            <path d={pixel ? "M307 88V64H299V56H307V40H311V20H319V40H323V56H331V64H323V88Z" : "M309 87Q304 75 311 66Q299 52 310 42Q305 27 315 15Q325 27 320 42Q331 52 319 66Q327 75 321 87Z"} fill="var(--pavilion-blue, #163084)" />
            <path d="M182 204H447V224H182Z" fill="var(--pavilion-mid, #407c9c)" /><rect x="182" y="204" width="265" height="20" fill={`url(#${id}-tiles)`} />
            <path d={pixel ? "M170 224H458V232H482V240H458V248H170V240H146V232H170Z" : "M182 224Q156 237 145 238Q167 253 189 248H440Q465 253 486 238Q467 235 447 224Z"} fill="var(--pavilion-mid, #407c9c)" />
            {[212, 278, 344].map(x => <g key={x} transform={`translate(${x} 251)`}><path d={arch} fill="var(--pavilion-sky, #d7e8da)" /><path d={arch} transform="translate(5 9) scale(.875 .88)" className="pavilion-window" /><path d="M-3 0V92M83 0V92" stroke="#76b1bd" strokeWidth="3" /></g>)}
            {[200, 276, 352, 428].map(x => <path key={x} d={`M${x} 329h12v145h-12Z`} fill="var(--pavilion-mid, #407c9c)" />)}
            <path d="M182 344H447V365H182Z" fill="var(--pavilion-mid, #407c9c)" /><rect x="182" y="344" width="265" height="21" fill={`url(#${id}-tiles)`} />
            {Array.from({ length: 23 }, (_, i) => <path key={i} d={`M${194 + i * 11} 320v24m-3-22 3-5 3 5-3 5Z`} fill="#76b1bd" stroke="#76b1bd" strokeWidth="2" />)}
            <path d="M435 358H469V377H481V395H493V413H505V431H517V449H529V485H435Z" fill="var(--pavilion-mid, #407c9c)" /><path d="M435 358H469V377H481V395H493V413H505V431H517V449H529V485H435Z" fill={`url(#${id}-tiles)`} />
            <path d="M435 360H446V488H435Z" fill="#163084" />
          </g>
          <g key={flight} className={cn("pavilion-birds", flight > 0 && "pavilion-birds-flying")}>
            {[{ x: 92, y: 123, r: -12 }, { x: 151, y: 152, r: 8 }, { x: 178, y: 82, r: -10 }].map((bird, i) => <g key={i} transform={`translate(${bird.x} ${bird.y}) rotate(${bird.r})`}><path d={pixel ? "M-18 0V-4H-10V0H-4V4H4V0H10V-4H18V0H10V4H4V8H-4V4H-10V0Z" : "M-20 0Q-8-8 0 4Q9-10 23-2Q10-2 1 11Q-7 0-20 0Z"} fill="#284d63" /></g>)}
          </g>
        </svg>
        {interactive && <div className="pavilion-controls"><button type="button" aria-pressed={lit} onClick={() => setLit(value => !value)}>{lit ? "Dim the pavilion" : "Light the pavilion"}<svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M7 14h6m-5 3h4M6 9a4 4 0 1 1 8 0c0 2-2 2-2 5H8c0-3-2-3-2-5Z" /></svg></button><button type="button" onClick={() => setFlight(value => value + 1)}>Send the birds <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M3 10h14m-5-5 5 5-5 5" /></svg></button></div>}
      </div>
    </div>
    <div className="pavilion-footer-bottom"><a href="/" className="pavilion-wordmark">{brand}</a><span>Made for the curious.</span><a href="#top" onClick={event => { event.preventDefault(); window.scrollTo({ top: 0, behavior: reduced.current ? "instant" : "smooth" }); const heading = document.querySelector<HTMLElement>("h1"); if (heading) { heading.setAttribute("tabindex", "-1"); heading.focus({ preventScroll: true }); } }}>Back to top <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M10 17V3m-5 5 5-5 5 5" /></svg></a></div>
  </footer>;
}
