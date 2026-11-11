"use client";

import type { CSSProperties, HTMLAttributes } from "react";
import type { Appearance } from "./appearance";
import { getSticker, stickerMarkup, type StickerName } from "./sticker-artwork";
import "../../styles/library-base.css";
import "../../styles/sticker-pack.css";

export { STICKERS, STICKER_CATEGORIES, getSticker, stickerSvg } from "./sticker-artwork";
export type { StickerName, StickerDefinition, StickerCategory } from "./sticker-artwork";
export type StickerProps = Omit<HTMLAttributes<HTMLSpanElement>, "children"> & {
  name: StickerName;
  size?: number | string;
  hoverPeel?: boolean;
  rotate?: number;
  label?: string;
  decorative?: boolean;
  appearance?: Appearance;
};

/** A named, scalable vinyl sticker. Wrap in a button or link to give it an action. */
export function Sticker({ name, size = 128, hoverPeel = false, rotate = 0, label, decorative = false, appearance, className = "", style, ...props }: StickerProps) {
  const artwork = getSticker(name);
  const dimension = typeof size === "number" ? Number.isFinite(size) ? Math.max(24, Math.min(2048, size)) : 128 : size;
  const angle = Number.isFinite(rotate) ? Math.max(-180, Math.min(180, rotate)) : 0;
  return <span {...props} className={`orange-sticker ${className}`} data-peel={hoverPeel || undefined} data-appearance={appearance} role={decorative ? undefined : "img"} aria-label={decorative ? undefined : label || artwork.title} aria-hidden={decorative || undefined} style={{ width: dimension, "--sticker-rotation": `${angle}deg`, ...style } as CSSProperties}>
    <span className="orange-sticker-sheet">
      <svg className="orange-sticker-front" viewBox="0 0 128 128" aria-hidden="true" focusable="false" dangerouslySetInnerHTML={{ __html: stickerMarkup(name) }} />
      {hoverPeel && <svg className="orange-sticker-back" viewBox="0 0 128 128" aria-hidden="true" focusable="false"><g transform={artwork.transform}><path d={artwork.outline} fill="#f1ebe2" stroke="#fff8f0" strokeWidth="10" strokeLinejoin="round" /></g></svg>}
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
