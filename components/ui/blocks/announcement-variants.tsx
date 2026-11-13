"use client";

import { useRef, useState } from "react";
import { ArrowUpRight, Pause, Play, Sparkles } from "lucide-react";
import { BlockFeedback, BlockFrame, useBlockSubmission, type BlockProps } from "./shared";
import { KEEPSAKE_PHOTOS } from "../keepsake-photos";
import { useMotionActivity } from "../use-motion-activity";
import { SectionArt } from "./section-visuals";
import "../../../styles/announcement-variants.css";

export type AnnouncementProps = BlockProps & { title?: string; description?: string; dateLabel?: string; actionLabel?: string; onAction?: () => void | Promise<void> };
function AnnouncementAction({ label, onAction }: { label: string; onAction?: () => void | Promise<void> }) {
  const submission = useBlockSubmission();
  return <div className="oa-action"><button type="button" disabled={!onAction || submission.pending} onClick={() => onAction && submission.run(onAction)}>{submission.pending ? "Opening..." : label}<ArrowUpRight size={18} aria-hidden="true" /></button><BlockFeedback {...submission} success="Your request is complete." /></div>;
}
export function PosterAnnouncement({ title = "SOMETHING GOOD\nIS ON ITS WAY.", description = "A fresh collection, a few familiar faces, and a new reason to get together.", dateLabel = "The next chapter", actionLabel = "Keep me in the loop", onAction, ...props }: AnnouncementProps) {
  return <BlockFrame {...props} className={`sb-section oa-poster ${props.className ?? ""}`}><div className="oa-poster-note"><div className="oa-note-top"><Sparkles size={28} aria-hidden="true" /><span>{dateLabel}</span></div><h2>{title}</h2><p>{description}</p><AnnouncementAction label={actionLabel} onAction={onAction} /><div className="oa-note-sticker" aria-hidden="true"><SectionArt kind="smile" /></div></div></BlockFrame>;
}
export type ReminderAnnouncementProps = AnnouncementProps & { imageSrc?: string; reminder?: string; progress?: number };
export function ReminderAnnouncement({ title = "A LITTLE LONGER.\nA LOT TO LOOK FORWARD TO.", description = "We're making room for something new.", dateLabel = "See you in the next chapter", actionLabel = "Keep me posted", onAction, imageSrc = KEEPSAKE_PHOTOS.find(photo => photo.id === "water")!.src, reminder = "A friendly reminder", progress = 75, ...props }: ReminderAnnouncementProps) {
  const value = Math.min(100, Math.max(0, Number.isFinite(progress) ? progress : 0));
  return <BlockFrame {...props} className={`sb-section oa-reminder ${props.className ?? ""}`}><div className="oa-reminder-bg" style={{ backgroundImage: `url(${JSON.stringify(imageSrc)})` }} aria-hidden="true" /><div className="oa-reminder-back" aria-hidden="true" /><article className="oa-reminder-card"><div className="oa-reminder-label">{reminder}</div><div><h2>{title}</h2><p>{description}</p><div className="oa-progress" role="progressbar" aria-label="Preparation progress" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}><i style={{ width: `${value}%` }} /></div><AnnouncementAction label={actionLabel} onAction={onAction} /></div><Sparkles className="oa-reminder-spark" size={42} aria-hidden="true" /></article><p className="oa-reminder-date">{dateLabel}</p></BlockFrame>;
}

export type SceneAnnouncementProps = AnnouncementProps & { brand?: string; backgrounds?: string[]; interval?: number; animate?: boolean };
const scenePhotos = ["mist", "city", "forest"].map(id => KEEPSAKE_PHOTOS.find(photo => photo.id === id)!.src);
export function SceneAnnouncement({ title = "GOOD THINGS\nCOME TOGETHER.", description = "A little gathering for curious minds and good ideas.", dateLabel = "Your next shared chapter", actionLabel = "Save me a place", onAction, brand = "DAYLIGHT STUDIO", backgrounds = scenePhotos, interval = 6, animate = true, ...props }: SceneAnnouncementProps) {
  const root = useRef<HTMLDivElement>(null), elapsed = useRef(0), current = useRef(0);
  const [index, setIndex] = useState(0), [paused, setPaused] = useState(false);
  const duration = Math.min(60, Math.max(3, Number.isFinite(interval) ? interval : 6));
  useMotionActivity(root, { onFrame: ({ delta }) => { if (!animate || paused || backgrounds.length < 2) return; elapsed.current += delta; const next = Math.floor(elapsed.current / (duration * 1000)) % backgrounds.length; if (next !== current.current) { current.current = next; setIndex(next); } } });
  const active = index % Math.max(1, backgrounds.length);
  return <BlockFrame {...props} className={`sb-section oa-scene ${props.className ?? ""}`}><div ref={root} className="oa-scene-root" data-animate={animate} data-paused={paused}><div className="oa-scene-backgrounds" aria-hidden="true">{backgrounds.map((src, position) => <div key={`${src}-${position}`} data-active={active === position} style={{ backgroundImage: `url(${JSON.stringify(src)})` }} />)}</div><article className="oa-scene-card"><div className="oa-scene-brand"><span>{brand}</span><SectionArt kind="sun" /></div><h2>{title}</h2><p>{description}</p><strong>{dateLabel}</strong><AnnouncementAction label={actionLabel} onAction={onAction} /></article>{animate && backgrounds.length > 1 && <button className="oa-scene-pause" type="button" aria-pressed={paused} onClick={() => setPaused(value => !value)}>{paused ? <Play size={16} aria-hidden="true" /> : <Pause size={16} aria-hidden="true" />}{paused ? "Resume backgrounds" : "Pause backgrounds"}</button>}</div></BlockFrame>;
}
