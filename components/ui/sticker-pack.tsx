"use client";

import { useState, type CSSProperties, type HTMLAttributes } from "react";
import type { Appearance } from "./appearance";
import { getSticker, stickerMarkup, type StickerName, type StickerFinish } from "./sticker-artwork";
import "../../styles/library-base.css";
import "../../styles/sticker-pack.css";

export { STICKERS, STICKER_CATEGORIES, STICKER_FINISHES, getSticker, stickerSvg } from "./sticker-artwork";
export type { StickerName, StickerDefinition, StickerCategory, StickerFinish } from "./sticker-artwork";
export type StickerMotion = "bounce" | "wiggle" | "spin" | "none";
export type StickerProps = Omit<HTMLAttributes<HTMLSpanElement>, "children"> & {
  name: StickerName;
  size?: number | string;
  hoverPeel?: boolean;
  finish?: StickerFinish;
  motion?: StickerMotion;
  duration?: number;
  intensity?: number;
  shadow?: boolean;
  interactive?: boolean;
  animationKey?: number;
  rotate?: number;
  label?: string;
  decorative?: boolean;
  appearance?: Appearance;
};

/** A scalable sticker. Interactive stickers animate on click, Enter or Space. */
export function Sticker({ name, size = 128, hoverPeel = false, finish = "playful", motion = "bounce", duration = 650, intensity = 1, shadow = true, interactive = false, animationKey, rotate = 0, label, decorative = false, appearance, className = "", style, onClick, onKeyDown, ...props }: StickerProps) {
  const [activation, setActivation] = useState(0);
  const artwork = getSticker(name);
  const dimension = typeof size === "number" ? Number.isFinite(size) ? Math.max(24, Math.min(2048, size)) : 128 : size;
  const angle = Number.isFinite(rotate) ? Math.max(-180, Math.min(180, rotate)) : 0;
  const milliseconds = Number.isFinite(duration) ? Math.max(200, Math.min(2000, duration)) : 650;
  const strength = Number.isFinite(intensity) ? Math.max(.25, Math.min(2, intensity)) : 1;
  const pulse = activation + (animationKey || 0);
  return <span {...props} className={`orange-sticker ${className}`} data-hover={hoverPeel || interactive || undefined} data-finish={finish} data-shadow={shadow} data-appearance={appearance} role={interactive ? "button" : decorative ? undefined : "img"} tabIndex={interactive ? 0 : props.tabIndex} aria-label={interactive ? label || `Animate ${artwork.title}` : decorative ? undefined : label || artwork.title} aria-hidden={!interactive && decorative || undefined} onClick={event => { onClick?.(event); if (interactive && !event.defaultPrevented) setActivation(value => value + 1); }} onKeyDown={event => { onKeyDown?.(event); if (interactive && !event.defaultPrevented && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); event.currentTarget.click(); } }} style={{ width: dimension, "--sticker-rotation": `${angle}deg`, "--sticker-duration": `${milliseconds}ms`, "--sticker-intensity": strength, ...style } as CSSProperties}>
    <span key={pulse} className="orange-sticker-sheet" data-motion={pulse > 0 ? motion : undefined}>
      <svg className="orange-sticker-front" viewBox="0 0 128 128" aria-hidden="true" focusable="false" dangerouslySetInnerHTML={{ __html: stickerMarkup(name, finish) }} />
    </span>
  </span>;
}

export type NamedStickerProps = Omit<StickerProps, "name">;
function named(name: StickerName) {
  function NamedSticker(props: NamedStickerProps) { return <Sticker {...props} name={name} />; }
  NamedSticker.displayName = getSticker(name).title.replace(/ /g, "") + "Sticker";
  return NamedSticker;
}
export const OrbitSnailSticker = named("orbit-snail");
export const MisoMothSticker = named("miso-moth");
export const DeskGeckoSticker = named("desk-gecko");
export const PeachAxolotlSticker = named("peach-axolotl");
export const CloudYakSticker = named("cloud-yak");
export const JellyCometSticker = named("jelly-comet");
export const PaperKoiSticker = named("paper-koi");
export const MossSpriteSticker = named("moss-sprite");
export const SunBeetleSticker = named("sun-beetle");
export const RibbonSeahorseSticker = named("ribbon-seahorse");
export const MatchDaySticker = named("match-day");
export const SundaySkateSticker = named("sunday-skate");
export const SideBVinylSticker = named("side-b-vinyl");
export const MokaMorningSticker = named("moka-morning");
export const FizzCanSticker = named("fizz-can");
export const MixtapeSticker = named("mixtape");
export const NoodleBreakSticker = named("noodle-break");
export const PocketPlaySticker = named("pocket-play");
export const BubbleTeaSticker = named("bubble-tea");
export const PencilLaunchSticker = named("pencil-launch");
export const CheckeredDaisySticker = named("checkered-daisy");
export const PepperDanceSticker = named("pepper-dance");
export const PearPairSticker = named("pear-pair");
export const RadishRebelSticker = named("radish-rebel");
export const TinyTerrariumSticker = named("tiny-terrarium");
export const CactusClubSticker = named("cactus-club");
export const MoonShroomSticker = named("moon-shroom");
export const SplitLeafSticker = named("split-leaf");
export const WildflowerPostSticker = named("wildflower-post");
export const CitrusSliceSticker = named("citrus-slice");
export const PeachPlanetSticker = named("peach-planet");
export const PortalWindowSticker = named("portal-window");
export const CometTailSticker = named("comet-tail");
export const CrescentNapSticker = named("crescent-nap");
export const StarHelmetSticker = named("star-helmet");
export const SaucerSocialSticker = named("saucer-social");
export const PocketRocketSticker = named("pocket-rocket");
export const TinySatelliteSticker = named("tiny-satellite");
export const SolarHugSticker = named("solar-hug");
export const ConstellationNoteSticker = named("constellation-note");
export const ZiggyBoltSticker = named("ziggy-bolt");
export const WovenHeartSticker = named("woven-heart");
export const InfinityRibbonSticker = named("infinity-ribbon");
export const TidalBadgeSticker = named("tidal-badge");
export const PinwheelPopSticker = named("pinwheel-pop");
export const HappyTicketSticker = named("happy-ticket");
export const LoopArrowSticker = named("loop-arrow");
export const CubeCandySticker = named("cube-candy");
export const FinishFlutterSticker = named("finish-flutter");
export const SparkBouquetSticker = named("spark-bouquet");
export const EssentialHeartSticker = named("essential-heart");
export const FourPointSparkSticker = named("four-point-spark");
export const ApprovalSealSticker = named("approval-seal");
export const PointerPopSticker = named("pointer-pop");
export const ThumbsUpSticker = named("thumbs-up");
export const BrightSmileSticker = named("bright-smile");
export const CoffeeToGoSticker = named("coffee-to-go");
export const StudioHeadphonesSticker = named("studio-headphones");
export const InstantCameraSticker = named("instant-camera");
export const MusicNoteSticker = named("music-note");
export const WorldWideSticker = named("world-wide");
export const PaperPlaneSticker = named("paper-plane");
export const LocationPinSticker = named("location-pin");
export const ChatPopSticker = named("chat-pop");
export const LinkKnotSticker = named("link-knot");
export const CodeBracketsSticker = named("code-brackets");
export const BookmarkRibbonSticker = named("bookmark-ribbon");
export const PeaceHandSticker = named("peace-hand");
export const RainbowArcSticker = named("rainbow-arc");
export const SmallWinSticker = named("small-win");
