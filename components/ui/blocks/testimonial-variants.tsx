"use client";

import { useRef, useState, type CSSProperties } from "react";
import { ArrowLeft, ArrowRight, Pause, Play, Quote, Sparkles, Star, ThumbsUp } from "lucide-react";
import { BlockFrame, type BlockProps } from "./shared";
import { customerStories, type CustomerStory } from "./testimonial-data";
import { useMotionActivity } from "../use-motion-activity";
import "../../../styles/testimonial-variants.css";

export type TestimonialBlockProps = BlockProps & { title?: string; description?: string; testimonials?: CustomerStory[] };
function StoryAvatar({ story }: { story: CustomerStory }) {
  // eslint-disable-next-line @next/next/no-img-element -- Portable sample portraits, bundled with their notice.
  return story.imageSrc ? <img className="mt-avatar" src={story.imageSrc} alt="" width={60} height={60} loading="lazy" decoding="async" /> : <span className="mt-avatar mt-initials" aria-hidden="true">{story.name.split(" ").map(word => word[0]).slice(0, 2).join("")}</span>;
}
function StoryRating({ value = 5 }: { value?: number }) {
  const rating = Math.min(5, Math.max(0, Number.isFinite(value) ? value : 5));
  return <span className="mt-rating" role="img" aria-label={`${rating} out of 5 stars`}><span className="mt-stars" aria-hidden="true">{Array.from({ length: 5 }, (_, index) => <span key={index}><Star /><span style={{ width: `${Math.min(1, Math.max(0, rating - index)) * 100}%` }}><Star fill="currentColor" /></span></span>)}</span><span aria-hidden="true">{rating}/5</span></span>;
}
function StoryControls({ index, total, onChange }: { index: number; total: number; onChange: (index: number) => void }) {
  return total > 1 ? <div className="mt-controls"><button type="button" aria-label="Previous testimonial" onClick={() => onChange((index - 1 + total) % total)}><ArrowLeft size={18} aria-hidden="true" /></button><span aria-live="polite">{index + 1} / {total}</span><button type="button" aria-label="Next testimonial" onClick={() => onChange((index + 1) % total)}><ArrowRight size={18} aria-hidden="true" /></button></div> : null;
}

export function StackedTestimonials({ title = "Good people.\nGood words.", testimonials = customerStories.slice(0, 3), ...props }: TestimonialBlockProps) {
  const [index, setIndex] = useState(0);
  const currentIndex = index < testimonials.length ? index : 0;
  const story = testimonials[currentIndex];
  return <BlockFrame {...props} className={`sb-section mt-stack ${props.className ?? ""}`}><h2>{title}</h2>{story ? <><div className="mt-stack-deck"><div className="mt-stack-back" aria-hidden="true" /><article className="mt-stack-card" aria-live="polite"><Quote size={40} fill="currentColor" aria-hidden="true" /><blockquote>{story.quote}</blockquote><footer><div className="mt-person"><StoryAvatar story={story} /><div><h3>{story.name}</h3><p>{story.role}</p></div></div><StoryRating value={story.rating} /><span className="mt-stack-seal" aria-hidden="true"><ThumbsUp size={30} fill="currentColor" /></span></footer></article></div><StoryControls index={currentIndex} total={testimonials.length} onChange={setIndex} /></> : <p className="mt-empty">No stories to show yet.</p>}</BlockFrame>;
}

export function CollageTestimonials({ title = "Good things,\nsaid by good people.", description = "Different voices. A shared feeling.", testimonials = customerStories.slice(0, 3), ...props }: TestimonialBlockProps) {
  return <BlockFrame {...props} className={`sb-section mt-collage ${props.className ?? ""}`}><header><h2>{title}</h2><p>{description}</p></header><div className="mt-collage-cards">{testimonials.length ? testimonials.map((story, index) => <article key={`${story.name}-${index}`} data-color={index % 3}><StoryRating value={story.rating} /><blockquote>{story.quote}</blockquote><div className="mt-person"><StoryAvatar story={story} /><div><h3>{story.name}</h3><p>{story.role}</p></div></div><Sparkles className="mt-card-spark" size={46} strokeWidth={1} aria-hidden="true" /></article>) : <p className="mt-empty">No stories to show yet.</p>}</div></BlockFrame>;
}

export function PortraitTestimonials({ title = "A fresh perspective.", description = "The people behind the good words.", testimonials = customerStories.slice(0, 4), ...props }: TestimonialBlockProps) {
  const [index, setIndex] = useState(0);
  const currentIndex = index < testimonials.length ? index : 0;
  const story = testimonials[currentIndex];
  return <BlockFrame {...props} className={`sb-section mt-portrait ${props.className ?? ""}`}><header><h2>{title}</h2><p>{description}</p></header>{story ? <><article className="mt-portrait-frame" aria-live="polite"><div className="mt-portrait-photo">{story.imageSrc ? <>
    {/* eslint-disable-next-line @next/next/no-img-element -- Portable sample photograph, not reference likeness or pixels. */}
    <img src={story.imageSrc} alt="Illustrative portrait" width={800} height={600} loading="lazy" decoding="async" /></> : <StoryAvatar story={story} />}<Quote size={66} fill="currentColor" aria-hidden="true" /></div><div className="mt-portrait-quote"><blockquote>{story.quote}</blockquote><div><strong>{story.name}</strong><span>{story.role}</span></div></div></article><StoryControls index={currentIndex} total={testimonials.length} onChange={setIndex} /></> : <p className="mt-empty">No stories to show yet.</p>}</BlockFrame>;
}

export type InfiniteTestimonialsProps = TestimonialBlockProps & { duration?: number; animate?: boolean };
export function InfiniteTestimonials({ title = "Good words travel.", description = "A few voices from the people making things.", testimonials = customerStories, duration = 55, animate = true, ...props }: InfiniteTestimonialsProps) {
  const root = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  useMotionActivity(root);
  const seconds = Math.min(180, Math.max(15, Number.isFinite(duration) ? duration : 55));
  return <BlockFrame {...props} className={`sb-section mt-infinite ${props.className ?? ""}`}><div ref={root} className="mt-stream-root" data-animate={animate} data-paused={paused}><header><div><h2>{title}</h2><p>{description}</p></div>{testimonials.length > 0 && animate && <button type="button" className="mt-motion-toggle" aria-pressed={paused} onClick={() => setPaused(value => !value)}>{paused ? <Play size={16} aria-hidden="true" /> : <Pause size={16} aria-hidden="true" />}{paused ? "Resume motion" : "Pause motion"}</button>}</header>{testimonials.length ? <div className="mt-stream-viewport" tabIndex={0} role="region" aria-label="Moving testimonials. Focus to pause.">{Array.from({ length: 4 }, (_, row) => {
    const stories = testimonials.filter((_, index) => index % 4 === row);
    const source = stories.length ? stories : testimonials.slice(0, 1);
    const repeated = Array.from({ length: Math.ceil(8 / source.length) }, () => source).flat();
    return <div className="mt-stream-row" key={row} data-direction={row % 2 === 0 ? "left" : "right"}><div className="mt-stream-track" style={{ "--stream-duration": `${seconds + row * 4}s`, "--stream-delay": `${-row * 9}s` } as CSSProperties}>{[0, 1].map(copy => <ul key={copy} className="mt-stream-group" aria-label={copy === 0 ? `Testimonials row ${row + 1}` : undefined} aria-hidden={copy === 1 || undefined}>{repeated.map((story, index) => <li key={`${story.name}-${index}`} className="mt-stream-pill" aria-hidden={index >= source.length || stories.length === 0 || undefined}><StoryAvatar story={story} /><div><p>{story.shortQuote ?? story.quote}</p><span>{story.name}</span></div></li>)}</ul>)}</div></div>;
  })}</div> : <p className="mt-empty">No stories to show yet.</p>}</div></BlockFrame>;
}
