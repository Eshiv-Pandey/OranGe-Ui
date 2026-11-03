"use client";

import { useRef, type CSSProperties, type SVGProps } from "react";
import type { Appearance } from "./appearance";
import { seedValue, bounded } from "./interaction-utils";
import { useMotionActivity } from "./use-motion-activity";
import "../../styles/human-avatar.css";

export const HUMAN_HAIR = ["wave", "crop", "curls", "bob", "bun"] as const;
export const HUMAN_EXPRESSIONS = ["happy", "calm", "determined", "wink"] as const;
export type HumanHair = typeof HUMAN_HAIR[number];
export type HumanExpression = typeof HUMAN_EXPRESSIONS[number];
export type HumanAvatarProps = Omit<SVGProps<SVGSVGElement>, "color"> & {
  seed?: string | number; size?: number; hair?: HumanHair; expression?: HumanExpression;
  skinTone?: string; hairColor?: string; accentColor?: string; glasses?: boolean; sticker?: boolean;
  interactive?: boolean; appearance?: Appearance;
};

const hairBack: Record<HumanHair, string> = {
  wave: "M43 121C25 105 30 81 39 65 24 46 48 29 65 31 75 7 105 20 118 25 141 8 173 31 163 51 192 63 179 85 162 98L159 139 133 148 53 144Z",
  crop: "M39 110C26 87 39 62 45 58 32 49 38 32 59 34 60 20 81 21 92 29 110 8 127 22 135 29 159 18 173 35 164 53 180 75 171 92 158 111Z",
  curls: "M38 121C19 112 21 94 32 87 17 71 29 53 45 54 37 35 56 22 71 28 77 8 99 12 106 25 120 8 143 20 144 36 168 23 181 44 167 60 190 71 182 94 165 98 183 119 165 138 145 133L53 140Z",
  bob: "M33 139C30 112 30 82 39 60 45 31 64 19 96 19 133 15 158 34 166 67 175 98 171 136 166 150L137 160 49 156Z",
  bun: "M37 123C30 98 29 73 43 54 23 32 41 12 61 18 73 1 97 9 100 27 133 18 163 32 168 64 176 84 167 111 158 127Z",
};
const hairFront: Record<HumanHair, string> = {
  wave: "M43 77C47 42 77 32 112 36 137 35 158 48 163 76L153 97 140 69C116 78 103 69 94 50 86 69 66 78 43 77Z",
  crop: "M44 78 47 50 62 42 70 56 82 39 97 52 112 35 125 53 143 43 158 65 157 88 146 74 138 61 122 68 110 55 96 67 81 59 67 73Z",
  curls: "M41 80C29 65 42 46 56 52 50 32 76 27 83 44 90 24 114 31 114 48 132 29 151 43 143 58 164 47 176 70 159 84 154 97 140 90 138 76 121 84 110 71 97 77 80 66 67 79 54 70 48 86Z",
  bob: "M39 89C38 48 59 30 96 28 133 23 162 48 162 87L146 103 145 64C123 71 112 59 109 47 103 67 80 82 52 82L50 132 35 137Z",
  bun: "M41 84C38 53 56 34 86 33 115 28 150 41 160 63L162 90 148 101 140 64C118 76 96 69 90 51 82 72 63 82 41 84Z",
};

/** Original sticker portraits. Seeds choose parts, never fetch an external avatar. */
export function HumanAvatar({ seed = "orange-friend", size = 160, hair, expression, skinTone = "#fff0dc", hairColor = "#1c1c20", accentColor = "#ff7552", glasses = false, sticker = true, interactive = true, appearance = "polished", className, style, ...props }: HumanAvatarProps) {
  const root = useRef<SVGSVGElement>(null), gaze = useRef<SVGGElement>(null);
  const hash = seedValue(seed), selectedHair = hair ?? HUMAN_HAIR[hash % HUMAN_HAIR.length], mood = expression ?? HUMAN_EXPRESSIONS[(hash >>> 5) % HUMAN_EXPRESSIONS.length];
  useMotionActivity(root);
  const look = (x: number, y: number) => { if (gaze.current) gaze.current.style.transform = `translate(${x}px, ${y}px)`; };
  return <svg {...props} ref={root} className={["human-avatar", className].filter(Boolean).join(" ")} data-appearance={appearance} data-expression={mood} viewBox="0 0 200 200" width={bounded(size, 24, 1024, 160)} height={bounded(size, 24, 1024, 160)} role="img" aria-label={props["aria-label"] ?? `Human avatar with ${selectedHair} hair, ${mood} expression`} style={{ "--human-accent": accentColor, ...style } as CSSProperties}
    onPointerMove={(event) => { props.onPointerMove?.(event); if (!interactive || root.current?.dataset.motion === "reduced") return; const box = event.currentTarget.getBoundingClientRect(); look(bounded((event.clientX - box.left) / box.width * 8 - 4, -4, 4), bounded((event.clientY - box.top) / box.height * 5 - 2.5, -2.5, 2.5)); }}
    onPointerLeave={(event) => { props.onPointerLeave?.(event); look(0, 0); }}>
    <title>{props["aria-label"] ?? `An original ${mood} human sticker portrait`}</title>
    <g className="human-silhouette" strokeLinejoin="round" strokeLinecap="round">
      {sticker && <path d={hairBack[selectedHair] + "M44 130Q40 176 97 184 151 185 164 133Z"} stroke="#fffdf6" strokeWidth="19" fill="#fffdf6" />}
      <path d={hairBack[selectedHair]} fill={hairColor} stroke="#17171b" strokeWidth="5" />
      <path d="M72 155v20q27 17 53-1v-23" fill={skinTone} stroke="#17171b" strokeWidth="5" />
      <path d="M54 182q17-15 27-9l19 10 20-10q12-7 31 9" fill={accentColor} stroke="#17171b" strokeWidth="5" />
      <path d="M51 99c-21-17-29 8-11 22l13 2m98-24c21-17 29 8 11 22l-13 2" fill={skinTone} stroke="#17171b" strokeWidth="5" />
      <path d="M51 77q-9 21-4 48c4 31 21 45 52 45 34 0 51-18 55-45l-4-50q-49-43-99 2Z" fill={skinTone} stroke="#17171b" strokeWidth="5" />
      <path d="M41 107q8-3 8 6m111-6q-8-3-8 6" fill="none" stroke="#17171b" strokeWidth="3" />
      <path d={hairFront[selectedHair]} fill={hairColor} stroke="#17171b" strokeWidth="4" />
      <path d={selectedHair === "crop" ? "m112 39 12 17 16-7" : selectedHair === "curls" ? "M121 39q16-11 19 7" : "M116 37q24 3 33 21"} stroke={accentColor} strokeWidth="9" fill="none" />
      <g ref={gaze} className="human-gaze" fill="#17171b">
        <g className="human-eyes">
          <ellipse cx="76" cy="108" rx="5" ry={mood === "calm" ? 6 : 10} />
          {mood === "wink" ? <path d="m117 105 12 5-12 4" fill="none" stroke="#17171b" strokeWidth="4" /> : <ellipse cx="124" cy="108" rx="5" ry={mood === "calm" ? 6 : 10} />}
          {mood !== "calm" && <><circle cx="77" cy="105" r="1.4" fill="#fffdf6" />{mood !== "wink" && <circle cx="125" cy="105" r="1.4" fill="#fffdf6" />}</>}
        </g>
        <path d={mood === "determined" ? "m64 89 20 7m32 0 19-9" : mood === "happy" ? "M65 90q9-5 18 0m32 0q9-5 18 0" : "m66 92 17-1m33 0 16 1"} stroke="#17171b" strokeWidth="4" fill="none" />
        <path d="m99 110-5 16 9 2" stroke="#17171b" strokeWidth="3" fill="none" />
      </g>
      <ellipse cx="63" cy="131" rx="9" ry="4" fill={accentColor} opacity=".45" /><ellipse cx="137" cy="131" rx="9" ry="4" fill={accentColor} opacity=".45" />
      {mood === "happy" ? <path d="M81 137q19 10 38 0c-5 24-31 25-38 0Z" fill="#17171b" stroke="#17171b" strokeWidth="3" /> : <path d={mood === "determined" ? "M85 145q15-9 30 0" : "M86 140q15 13 30-1"} fill="none" stroke="#17171b" strokeWidth="4" />}
      {mood === "happy" && <path d="M87 141q13 4 25 0l-4 7H91Z" fill="#fffdf6" />}
      {glasses && <g fill="none" stroke="#17171b" strokeWidth="4"><rect x="57" y="96" width="36" height="28" rx="9" /><rect x="107" y="96" width="36" height="28" rx="9" /><path d="M93 105q7-5 14 0m-64-3 14 3m86 0 13-3" /></g>}
    </g>
  </svg>;
}
