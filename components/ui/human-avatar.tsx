"use client";

import { useRef, type CSSProperties, type SVGProps } from "react";
import type { Appearance } from "./appearance";
import { seedValue, bounded } from "./interaction-utils";
import { useMotionActivity } from "./use-motion-activity";
import "../../styles/human-avatar.css";

export const HUMAN_HAIR = ["wave", "crop", "curls", "bob", "bun", "spike", "sweep", "cap"] as const;
export const HUMAN_EXPRESSIONS = ["happy", "calm", "determined", "wink", "surprised", "sleepy"] as const;
export type HumanHair = typeof HUMAN_HAIR[number];
export type HumanExpression = typeof HUMAN_EXPRESSIONS[number];
export type HumanAvatarProps = Omit<SVGProps<SVGSVGElement>, "color"> & {
  seed?: string | number; size?: number; hair?: HumanHair; expression?: HumanExpression;
  skinTone?: string; hairColor?: string; accentColor?: string; glasses?: boolean; sticker?: boolean;
  interactive?: boolean; appearance?: Appearance;
};

const hairBack: Record<HumanHair, string> = {
  wave: "M40 129C23 121 15 105 24 91 6 77 18 55 35 49 21 34 33 23 49 28 47 11 64 17 74 21 91 9 107 6 124 10 121 25 139 20 151 28 176 28 190 54 175 73 190 90 179 122 159 141L139 153 44 147Z",
  crop: "M35 123 30 97 38 66 29 53 48 53 45 30 63 37 76 17 89 33 107 15 118 31 142 20 145 40 164 38 169 67 167 123 144 155 48 153Z",
  curls: "M33 132C13 125 13 103 28 98 8 89 14 66 33 64 19 45 35 27 52 34 52 12 73 9 84 26 94 7 117 10 121 28 138 9 160 24 155 43 179 35 191 59 176 73 197 87 184 109 169 110 183 134 164 151 145 142L58 156Z",
  bob: "M30 145C18 124 26 99 24 78 21 43 47 20 76 16 123 0 162 22 171 62 186 82 177 133 164 154L139 168 43 164 30 160Z",
  bun: "M38 125C21 111 24 86 36 68 20 56 19 35 36 26 26 8 49 1 60 16 78-1 98 16 89 33 124 10 160 34 165 64 182 81 174 123 155 143L52 153Z",
  spike: "M39 129 18 117 30 99 9 84 36 67 20 49 53 47 46 22 75 34 90 8 109 29 136 9 138 35 172 24 160 53 185 67 169 86 185 110 160 139 139 155 50 148Z",
  sweep: "M34 132C22 119 21 101 29 84 16 68 33 53 44 47 35 37 32 22 40 15 61 34 90 5 111 9 110 26 123 27 143 22 172 22 184 51 175 74 195 87 182 117 162 131 161 152 142 159 131 159L41 150Z",
  cap: "M35 136C18 122 25 100 30 83 20 61 42 40 61 36 87 14 116 23 133 36 166 30 180 53 170 73 187 91 175 124 158 139L147 155 44 151Z",
};
const hairFront: Record<HumanHair, string> = {
  wave: "M36 91C32 74 43 55 59 50 73 57 93 48 106 31 105 55 129 63 149 55 162 64 161 94 155 112L144 120 141 81C126 86 105 77 96 63 79 82 61 90 48 85L46 109Z",
  crop: "M39 83 42 60 62 63 65 44 84 58 99 41 111 57 130 45 140 63 155 63 159 98 147 115 140 83 125 78 107 81 94 72 77 80 61 73Z",
  curls: "M35 89C21 75 32 56 49 61 39 42 61 30 74 47 74 24 99 24 108 44 120 27 145 39 139 57 162 41 177 63 158 81 166 102 151 117 140 105L137 84C125 92 112 83 111 73 95 84 80 80 75 70 62 81 50 77 44 97Z",
  bob: "M28 98C22 49 58 24 93 25 133 18 166 47 164 87L158 132 140 144 144 76C124 84 103 67 102 48 86 78 64 91 43 93L45 143 26 142Z",
  bun: "M34 92C27 62 52 39 82 36 115 24 150 45 159 70L161 99 147 122 139 80C115 82 93 70 88 52 78 77 57 91 39 91Z",
  spike: "M34 87 42 64 63 66 70 47 91 64 106 39 120 62 142 50 149 70 161 77 157 111 144 124 140 88 125 78 106 83 92 70 72 86 57 78 43 99Z",
  sweep: "M31 93C22 71 44 49 71 44 92 40 106 23 105 16 130 20 138 39 132 54 149 48 167 60 162 84L159 118 144 128 139 82C126 88 116 82 110 67 92 92 63 101 40 92L44 117Z",
  cap: "M35 91 42 62 66 59 73 46 87 59 106 46 115 65 139 61 157 82 158 114 145 124 139 87 123 87 105 75 89 87 68 82 49 101Z",
};
const hairAccent: Record<HumanHair, string> = {
  wave: "M116 27C130 33 144 30 150 41L154 57C141 45 131 53 121 47Z",
  crop: "M48 47 62 49 65 34 82 48 94 35 97 51 82 63 68 58 57 65Z",
  curls: "M40 57C35 42 54 36 61 47 63 28 81 30 86 46 94 30 111 40 107 51 118 39 132 51 126 62 112 68 96 62 86 59 71 67 61 60 48 67Z",
  bob: "M116 35C135 36 150 50 154 68L150 122 145 129 147 75C131 65 122 55 116 35Z",
  bun: "M41 30C42 21 52 19 57 27 63 16 79 18 79 30 71 38 55 42 46 37Z",
  spike: "M109 30 130 16 132 40 157 33 148 49 170 65 154 65 141 56 125 67Z",
  sweep: "M48 49C72 47 103 29 106 17 119 23 124 34 122 43 108 60 81 69 56 66Z",
  cap: "M58 45C67 11 128 8 151 41L157 67 138 74 112 55 87 55Z",
};
const FACE = "M52 80C73 58 115 55 143 74L151 102C170 83 188 93 185 112 183 130 172 140 155 137 145 165 122 178 90 175 58 172 37 154 39 128L42 100Z";

/** Original head-only portraits with bold silhouettes and cutout ink eyes. */
export function HumanAvatar({ seed = "orange-friend", size = 160, hair, expression, skinTone = "#fffdf7", hairColor = "#101114", accentColor = "#ff754f", glasses = false, sticker = true, interactive = true, appearance = "polished", className, style, ...props }: HumanAvatarProps) {
  const root = useRef<SVGSVGElement>(null), gaze = useRef<SVGGElement>(null);
  const hash = seedValue(seed), selectedHair = hair ?? HUMAN_HAIR[hash % HUMAN_HAIR.length], mood = expression ?? HUMAN_EXPRESSIONS[(hash >>> 5) % HUMAN_EXPRESSIONS.length];
  useMotionActivity(root, { onStatus: (status) => { if (status === "reduced" && gaze.current) gaze.current.style.transform = "none"; } });
  const look = (x: number, y: number) => { if (gaze.current) gaze.current.style.transform = `translate(${x}px, ${y}px)`; };
  const sleepy = mood === "sleepy", happy = mood === "happy";
  return <svg {...props} ref={root} className={["human-avatar", className].filter(Boolean).join(" ")} data-appearance={appearance} data-expression={mood} data-hair={selectedHair} viewBox="0 0 200 200" width={bounded(size, 24, 1024, 160)} height={bounded(size, 24, 1024, 160)} role="img" aria-label={props["aria-label"] ?? `Human avatar with ${selectedHair} hair, ${mood} expression`} style={{ "--human-accent": accentColor, ...style } as CSSProperties}
    onPointerMove={(event) => { props.onPointerMove?.(event); if (!interactive || root.current?.dataset.motion !== "running") return; const box = event.currentTarget.getBoundingClientRect(); look(bounded((event.clientX - box.left) / box.width * 6 - 3, -3, 3), bounded((event.clientY - box.top) / box.height * 4 - 2, -2, 2)); }}
    onPointerLeave={(event) => { props.onPointerLeave?.(event); look(0, 0); }}>
    <title>{props["aria-label"] ?? `An original ${mood} human sticker portrait`}</title>
    <g className="human-silhouette" strokeLinejoin="round" strokeLinecap="round">
      {sticker && <path d={hairBack[selectedHair] + FACE} stroke="#fffefb" strokeWidth="15" fill="#fffefb" />}
      <path d={hairBack[selectedHair]} fill={hairColor} stroke="#101114" strokeWidth="6" />
      <path d="M44 102C25 94 22 119 40 130L48 123Z" fill={skinTone} stroke="#101114" strokeWidth="6" />
      <path d={FACE} fill={skinTone} stroke="#101114" strokeWidth="6.5" />
      <path d="M169 103c-11-2-13 8-8 13m8-11-4 8M33 110l6 8" fill="none" stroke="#101114" strokeWidth="4.5" />
      <path d={hairFront[selectedHair]} fill={hairColor} stroke="#101114" strokeWidth="4" />
      <path d={hairAccent[selectedHair]} fill={accentColor} />
      {selectedHair === "cap" && <><path d="M57 44C66 11 127 8 151 41L157 65" fill="none" stroke="#101114" strokeWidth="6" /><path d="M76 23q24-8 40 8l9 20-45-2Z" fill={skinTone} /><path d="m56 48 43 1 29 14-38 10-43-8Z" fill={accentColor} stroke="#101114" strokeWidth="5" /></>}
      <g ref={gaze} className="human-gaze" fill="#101114">
        <g className="human-eyes">
          {sleepy && <><ellipse cx="74" cy="116" rx="14" ry="18" fill="none" stroke="#101114" strokeWidth="2.5" /><ellipse cx="119" cy="113" rx="14" ry="18" fill="none" stroke="#101114" strokeWidth="2.5" /></>}
          <ellipse cx="74" cy="116" rx={mood === "surprised" ? 10 : 8.5} ry={sleepy ? 10 : 13.5} />
          {mood === "wink" ? <path d="m109 114 17-3-10 8" fill="none" stroke="#101114" strokeWidth="5" /> : <ellipse cx="119" cy="113" rx={mood === "surprised" ? 10 : 8.5} ry={sleepy ? 10 : 13.5} />}
          {!sleepy && <><path d="m76 109 8 8-10-1Z" fill={skinTone} />{mood !== "wink" && <path d="m121 106 8 8-10-1Z" fill={skinTone} />}</>}
          {sleepy && <path d="M58 101h32m12-3h32" stroke={skinTone} strokeWidth="13" />}
        </g>
        <path d={mood === "determined" ? "m61 94 24 9m20-3 24-14" : happy || mood === "surprised" ? "M61 96q9-10 21-6m25-1q12-9 24 0" : "m63 96 18 1m25-3 20-4"} stroke="#101114" strokeWidth={mood === "determined" ? 6 : 4.5} fill="none" />
        <path d="M94 120q-7 2-5 8l6 1" stroke="#101114" strokeWidth="3.5" fill="none" />
      </g>
      {happy ? <><path d="M62 139q30-7 62-5l-2 18q-29 16-56 2Z" fill="#101114" stroke="#101114" strokeWidth="4" /><path d="m68 141 49-2-1 8-46 3Z" fill={skinTone} /></> : mood === "surprised" ? <ellipse cx="96" cy="149" rx="8" ry="10" fill="#101114" /> : <path d={mood === "determined" ? "M81 151q15-10 29-4" : sleepy ? "m87 147 12-2" : "M82 147q14 4 25-3"} fill="none" stroke="#101114" strokeWidth="4.5" />}
      <path d="m134 135 5 2m-7 4 5 1" stroke="#101114" strokeWidth="2.5" />
      {glasses && <g fill="none" stroke="#101114" strokeWidth="4.5"><rect x="54" y="102" width="37" height="29" rx="9" transform="rotate(3 72 115)" /><rect x="101" y="98" width="36" height="29" rx="9" transform="rotate(-4 119 113)" /><path d="M91 111q5-4 10-1m-65-2 18 2m83-4 20-5" /></g>}
    </g>
  </svg>;
}
