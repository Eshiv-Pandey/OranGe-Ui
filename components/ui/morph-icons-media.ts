import { morphCheck as check, morphCircle as circle, morphLine as line, morphPath as path, morphPolyline as poly, morphRect as rect, type MorphIconDefinition } from "./morph-icon-geometry";

type Point = readonly [number, number];
const point = ([x, y]: Point) => `${Math.round(x * 10000) / 10000} ${Math.round(y * 10000) / 10000}`;

/** Circular corner fillets keep the split playback contours finite and softly joined. */
function roundedPolygon(points: readonly Point[], radius: number | readonly number[]) {
  const corners = points.map((vertex, index) => {
    const previous = points[(index + points.length - 1) % points.length], next = points[(index + 1) % points.length];
    const incomingLength = Math.hypot(vertex[0] - previous[0], vertex[1] - previous[1]);
    const outgoingLength = Math.hypot(next[0] - vertex[0], next[1] - vertex[1]);
    const incoming: Point = [(vertex[0] - previous[0]) / incomingLength, (vertex[1] - previous[1]) / incomingLength];
    const outgoing: Point = [(next[0] - vertex[0]) / outgoingLength, (next[1] - vertex[1]) / outgoingLength];
    const turn = Math.acos(Math.max(-1, Math.min(1, incoming[0] * outgoing[0] + incoming[1] * outgoing[1])));
    const requested = typeof radius === "number" ? radius : radius[index];
    const distance = Math.min(requested * Math.tan(turn / 2), incomingLength * .4, outgoingLength * .4);
    const actualRadius = distance / Math.tan(turn / 2);
    const handle = 4 / 3 * Math.tan(turn / 4) * actualRadius;
    const start: Point = [vertex[0] - incoming[0] * distance, vertex[1] - incoming[1] * distance];
    const end: Point = [vertex[0] + outgoing[0] * distance, vertex[1] + outgoing[1] * distance];
    const first: Point = [start[0] + incoming[0] * handle, start[1] + incoming[1] * handle];
    const second: Point = [end[0] - outgoing[0] * handle, end[1] - outgoing[1] * handle];
    return { start, end, first, second };
  });
  return `M${point(corners[0].end)}` + [...corners.slice(1), corners[0]].map(corner => `L${point(corner.start)}C${point(corner.first)} ${point(corner.second)} ${point(corner.end)}`).join("") + "Z";
}

const playTriangle = roundedPolygon([[6.6, 4.8], [18.1, 11.4], [18.1, 12.6], [6.6, 19.2]], [1, .45, .45, 1]);
const playFold = roundedPolygon([[6.3, 4.9], [15.8, 8.8], [15.8, 15.2], [6.3, 19.1]], [1.2, 1.1, 1.1, 1.2]);
const playLeftLane = roundedPolygon([[5.75, 4.75], [10.25, 5.7], [10.25, 18.3], [5.75, 19.25]], 1.5);
const playRightFold = roundedPolygon([[14, 8.8], [18.1, 11.1], [18.1, 12.9], [14, 15.2]], .65);
const pauseLeft = rect(5.75, 4.75, 4.5, 14.5, 1.8), pauseRight = rect(13.75, 4.75, 4.5, 14.5, 1.8);

const heart = "M12 19C9.6 17.1 3.2 13.5 3.2 8.8C3.2 4.7 8.6 3.5 12 7.3C15.4 3.5 20.8 4.7 20.8 8.8C20.8 13.5 14.4 17.1 12 19Z";
const selectedHeart = "M12 19.2C9.5 17.2 3 13.6 3 8.7C3 4.4 8.6 3.2 12 7.1C15.4 3.2 21 4.4 21 8.7C21 13.6 14.5 17.2 12 19.2Z";
const star = (outer: number, inner: number) => roundedPolygon(Array.from({ length: 10 }, (_, index) => {
  const angle = -Math.PI / 2 + index * Math.PI / 5, radius = index % 2 ? inner : outer;
  return [12 + Math.cos(angle) * radius, 12 + Math.sin(angle) * radius] as const;
}), .24);
const unstarred = star(8.4, 3.9), starred = star(8.6, 4.2);

/** The reverse-ordered shared check is expressed before its rigid half-turn. */
function turnedCheck(cx: number, cy: number, scale: number, ox: number, oy: number) {
  const coordinates = check(cx, cy, scale).match(/[-+]?(?:\d*\.\d+|\d+\.?\d*)/g)!.map(Number);
  const points = Array.from({ length: coordinates.length / 2 }, (_, index) => [coordinates[index * 2], coordinates[index * 2 + 1]] as const).reverse();
  return poly(points.map(([x, y]) => [2 * ox - x, 2 * oy - y] as const));
}

const tray = "M4 16L4 18C4 19.1046 4.8954 20 6 20L18 20C19.1046 20 20 19.1046 20 18L20 16";
const bubble = "M7.3 5L16.7 5C18.909 5 20.7 6.791 20.7 9L20.7 13C20.7 15.209 18.909 17 16.7 17L9.5 17L6.4 20.1L6.4 16.9C4.621 16.508 3.3 14.918 3.3 13L3.3 9C3.3 6.791 5.091 5 7.3 5Z";
const closedEnvelope = "M5.5 7.5L12 7.5L18.5 7.5C19.6046 7.5 20.5 8.3954 20.5 9.5L20.5 18C20.5 19.1046 19.6046 20 18.5 20L5.5 20C4.3954 20 3.5 19.1046 3.5 18L3.5 9.5C3.5 8.3954 4.3954 7.5 5.5 7.5Z";
const openEnvelope = "M4.7 8.5L12 4.3L19.3 8.5C20 8.9 20.5 9.45 20.5 10.25L20.5 18C20.5 19.1046 19.6046 20 18.5 20L5.5 20C4.3954 20 3.5 19.1046 3.5 18L3.5 10.25C3.5 9.45 4 8.9 4.7 8.5Z";

/** Twenty original paired states with restrained detail exits and joined feedback marks. */
export const MORPH_MEDIA_ICONS = [
  {
    name: "play-pause", title: "Playback", category: "Media", states: ["Play", "Pause"],
    paths: [
      path(playTriangle, pauseLeft, { keyframes: [{ at: .16, d: playFold }, { at: .32, d: playLeftLane }, { at: .62, d: pauseLeft }] }),
      path(playRightFold, pauseRight, { opacity: [0, 1], opacityPhase: [.32, .58], keyframes: [{ at: .28, d: playRightFold }, { at: .7, d: pauseRight }] }),
    ],
  },
  {
    name: "volume", title: "Volume", category: "Media", states: ["Sound on", "Muted"],
    paths: [
      path("M4.5 8.5L7.5 8.5L11.5 5L11.5 19L7.5 15.5L4.5 15.5C3.9477 15.5 3.5 15.0523 3.5 14.5L3.5 9.5C3.5 8.9477 3.9477 8.5 4.5 8.5Z"),
      path("M15 8.5C17.6 10.3 17.6 13.7 15 15.5", undefined, { opacity: [1, 0], draw: [1, 0], opacityPhase: [.05, .35], drawPhase: [0, .4] }),
      path("M18 5.8C22 9.2 22 14.8 18 18.2", undefined, { opacity: [1, 0], draw: [1, 0], opacityPhase: [0, .3], drawPhase: [0, .35] }),
      path("M17 9L21 15M21 9L17 15", undefined, { opacity: [0, 1], draw: [0, 1], opacityPhase: [.4, .58], drawPhase: [.38, .76] }),
    ],
  },
  {
    name: "microphone", title: "Microphone", category: "Media", states: ["Microphone", "Listening"],
    paths: [
      path(rect(8.5, 3.8, 7, 10, 3.5), undefined, { opacity: [1, 0], opacityPhase: [.12, .4] }),
      path("M5 10.5C5 14.366 8.134 17.5 12 17.5C15.866 17.5 19 14.366 19 10.5", undefined, { opacity: [1, 0], opacityPhase: [.04, .28], draw: [1, 0], drawPhase: [0, .28] }),
      path(line(12, 17.5, 12, 20.2), undefined, { opacity: [1, 0], opacityPhase: [0, .18], draw: [1, 0], drawPhase: [0, .18] }),
      path(line(8.5, 20.2, 15.5, 20.2), undefined, { opacity: [1, 0], opacityPhase: [0, .16], draw: [1, 0], drawPhase: [0, .16] }),
      path(line(4, 10.25, 4, 13.75), line(4, 8.75, 4, 15.25), { opacity: [0, 1], opacityPhase: [.43, .6], geometryPhase: [.43, .82], activity: { kind: "wave", lane: 0 } }),
      path(line(8, 10.25, 8, 13.75), line(8, 5, 8, 19), { opacity: [0, 1], opacityPhase: [.45, .63], geometryPhase: [.45, .9], activity: { kind: "wave", lane: 1 } }),
      path(line(12, 10.25, 12, 13.75), line(12, 2.5, 12, 21.5), { opacity: [0, 1], opacityPhase: [.4, .58], geometryPhase: [.4, .82], activity: { kind: "wave", lane: 2 } }),
      path(line(16, 10.25, 16, 13.75), line(16, 5, 16, 19), { opacity: [0, 1], opacityPhase: [.45, .63], geometryPhase: [.45, .9], activity: { kind: "wave", lane: 3 } }),
      path(line(20, 10.25, 20, 13.75), line(20, 8.75, 20, 15.25), { opacity: [0, 1], opacityPhase: [.43, .6], geometryPhase: [.43, .82], activity: { kind: "wave", lane: 4 } }),
    ],
  },
  {
    name: "camera", title: "Camera", category: "Media", states: ["Camera", "Captured"],
    paths: [
      path(rect(3.5, 7, 17, 13, 2.2)),
      path(poly([[7, 7], [8.7, 4.5], [15.3, 4.5], [17, 7]])),
      path(circle(12, 13.5, 3.2), undefined, { opacity: [1, 0], opacityPhase: [.1, .34], draw: [1, 0], drawPhase: [0, .32] }),
      path(circle(17.5, 10, .55), undefined, { filled: true, opacity: [1, 0], opacityPhase: [0, .22] }),
      path(check(12, 13.5, .76), undefined, { opacity: [0, 1], opacityPhase: [.38, .5], draw: [0, 1], drawPhase: [.4, .8] }),
    ],
  },
  {
    name: "record", title: "Record", category: "Media", states: ["Record", "Stop"],
    paths: [path(circle(12, 12, 8.5)), path(rect(8.5, 8.5, 7, 7, 3.5), rect(8.5, 8.5, 7, 7, 1.25), { filled: true })],
  },
  {
    name: "repeat", title: "Repeat", category: "Media", states: ["Repeat", "Repeat one"],
    paths: [
      path("M4.5 9C4.5 7.067 6.067 5.5 8 5.5L19.5 5.5"),
      path(poly([[16.5, 3], [19.5, 5.5], [16.5, 8]])),
      path("M19.5 15C19.5 16.933 17.933 18.5 16 18.5L4.5 18.5"),
      path(poly([[7.5, 16], [4.5, 18.5], [7.5, 21]])),
      path("M10.5 10L12 9L12 15", undefined, { opacity: [0, 1], opacityPhase: [.1, .32], draw: [0, 1], drawPhase: [.1, .68] }),
    ],
  },
  {
    name: "shuffle", title: "Shuffle", category: "Media", states: ["Straight", "Shuffle"],
    paths: [
      path("M4 6C10 6 14 6 20 6", "M4 18C10 18 15 11 20 6"),
      path("M4 18C10 18 14 18 20 18", "M4 6C10 6 15 13 20 18"),
      path(poly([[17.3, 3.3], [20, 6], [17.3, 8.7]]), undefined, { rotation: [0, -45], origin: [20, 6] }),
      path(poly([[17.3, 15.3], [20, 18], [17.3, 20.7]]), undefined, { rotation: [0, 45], origin: [20, 18] }),
    ],
  },
  {
    name: "heart", title: "Heart", category: "Actions", states: ["Unselected", "Selected"],
    paths: [path(heart, selectedHeart), path(heart, selectedHeart, { opacity: [0, 1], opacityPhase: [.18, .72], filled: true })],
  },
  {
    name: "star", title: "Star", category: "Actions", states: ["Unstarred", "Starred"],
    paths: [path(unstarred, starred), path(unstarred, starred, { opacity: [0, 1], opacityPhase: [.18, .72], filled: true })],
  },
  {
    name: "check", title: "Check", category: "Actions", states: ["Unchecked", "Checked"],
    paths: [path(circle(12, 12, 8.5)), path(check(), undefined, { opacity: [0, 1], opacityPhase: [.1, .25], draw: [0, 1], drawPhase: [.1, .8] })],
  },
  {
    name: "plus", title: "Add", category: "Actions", states: ["Add", "Close"],
    paths: [path(line(5.5, 12, 18.5, 12), undefined, { rotation: [0, 45] }), path(line(12, 5.5, 12, 18.5), undefined, { rotation: [0, 45] })],
  },
  {
    name: "copy", title: "Copy", category: "Actions", states: ["Copy", "Copied"],
    paths: [
      path("M6.6 17L6.25 17C4.7312 17 3.5 15.7688 3.5 14.25L3.5 6.25C3.5 4.7312 4.7312 3.5 6.25 3.5L14.25 3.5C15.7688 3.5 17 4.7312 17 6.25L17 6.6", "M7.5 14.5L7.25 14.5C5.8693 14.5 4.75 13.3807 4.75 12L4.75 7.25C4.75 5.8693 5.8693 4.75 7.25 4.75L12 4.75C13.3807 4.75 14.5 5.8693 14.5 7.25L14.5 7.5", { geometryPhase: [0, .3], opacity: [1, 0], opacityPhase: [0, .3], draw: [1, 0], drawPhase: [0, .3] }),
      path(rect(7, 7, 13.5, 13.5, 2.75), rect(4, 4, 16, 16, 8), { geometryPhase: [.05, .55] }),
      path(check(), undefined, { opacity: [0, 1], opacityPhase: [.35, .48], draw: [0, 1], drawPhase: [.4, .85] }),
    ],
  },
  {
    name: "send", title: "Send", category: "Actions", states: ["Send", "Sent"],
    paths: [
      path(poly([[3.7, 10.9], [20.3, 3.7], [13.5, 20.3], [10.2, 13.8], [3.7, 10.9]], true), poly([[10, 11], [14.5, 8.5], [12.8, 14], [11.5, 12.5], [10, 11]], true), { geometryPhase: [0, .34], opacity: [1, 0], opacityPhase: [.18, .4] }),
      path(line(10.2, 13.8, 20.3, 3.7), line(12.2, 12.4, 16.5, 7.5), { geometryPhase: [0, .4], opacity: [1, 0], opacityPhase: [.08, .28], draw: [1, 0], drawPhase: [.08, .28] }),
      path(check(12, 12, 1.2), undefined, { opacity: [0, 1], opacityPhase: [.3, .42], draw: [0, 1], drawPhase: [.3, .82] }),
    ],
  },
  {
    name: "download", title: "Download", category: "Actions", states: ["Download", "Downloaded"],
    paths: [
      path(poly([[7.5, 10.3], [12, 14.8], [16.5, 10.3]]), check(12, 12.5), { geometryPhase: [.22, .68] }),
      path(line(12, 3.5, 12, 14.3), undefined, { opacity: [1, 0], opacityPhase: [.1, .3], draw: [1, 0], drawPhase: [0, .3] }),
      path(tray),
    ],
  },
  {
    name: "upload", title: "Upload", category: "Actions", states: ["Upload", "Uploaded"],
    paths: [
      path(poly([[7.5, 8.8], [12, 4.3], [16.5, 8.8]]), turnedCheck(12, 12.5, 1, 12, 9.8), { geometryPhase: [.2, .64], rotation: [0, 180], origin: [12, 9.8], rotationPhase: [.22, .64] }),
      path(line(12, 4.8, 12, 15), undefined, { opacity: [1, 0], opacityPhase: [.1, .3], draw: [1, 0], drawPhase: [0, .3] }),
      path(tray),
    ],
  },
  {
    name: "cloud", title: "Cloud sync", category: "Communication", states: ["Cloud", "Synced"],
    paths: [
      path("M6.5 18.5C4.3 18.5 3 16.8 3 14.7C3 12.3 4.7 10.5 7 10.5C7.4 7.1 9.6 5 12.4 5C15.4 5 17.6 7.1 18 9.8C20.1 10.2 21.2 11.9 21.2 14.1C21.2 16.6 19.6 18.5 17 18.5L6.5 18.5Z"),
      path(check(12, 13, .78), undefined, { opacity: [0, 1], opacityPhase: [.15, .3], draw: [0, 1], drawPhase: [.15, .75] }),
    ],
  },
  {
    name: "notification", title: "Notifications", category: "Communication", states: ["Notifications on", "Muted"],
    paths: [
      path("M5.5 17.5L7 14.7L7 10.5C7 7.7386 9.2386 5.5 12 5.5C14.7614 5.5 17 7.7386 17 10.5L17 14.7L18.5 17.5Z"),
      path(line(12, 3.5, 12, 5.5), undefined, { opacity: [1, 0], opacityPhase: [0, .28], draw: [1, 0], drawPhase: [0, .28] }),
      path("M10 20C10.7 21.4 13.3 21.4 14 20", undefined, { opacity: [1, 0], opacityPhase: [.1, .3] }),
      path(line(4, 4, 20, 20), undefined, { opacity: [0, 1], opacityPhase: [.3, .5], draw: [0, 1], drawPhase: [.3, .8] }),
    ],
  },
  {
    name: "mail", title: "Mail", category: "Communication", states: ["Closed", "Open"],
    paths: [
      path(closedEnvelope, openEnvelope),
      path(poly([[4.7, 8.5], [12, 13.7], [19.3, 8.5]]), poly([[4.7, 10.3], [12, 15.4], [19.3, 10.3]])),
    ],
  },
  {
    name: "message", title: "Message", category: "Communication", states: ["Message", "Typing"],
    paths: [
      path(bubble, undefined, { opacity: [1, 0], opacityPhase: [.1, .4] }),
      path(circle(6.5, 12, 1.75), undefined, { filled: true, opacity: [0, 1], opacityPhase: [.32, .5], activity: { kind: "dot", lane: 0 } }),
      path(circle(12, 12, 1.75), undefined, { filled: true, opacity: [0, 1], opacityPhase: [.36, .54], activity: { kind: "dot", lane: 1 } }),
      path(circle(17.5, 12, 1.75), undefined, { filled: true, opacity: [0, 1], opacityPhase: [.4, .58], activity: { kind: "dot", lane: 2 } }),
    ],
  },
  {
    name: "user", title: "Follow", category: "Communication", states: ["Follow", "Following"],
    paths: [
      path(circle(8.6, 8, 2.9)),
      path("M2.8 18.5C2.8 15.65 5.25 13.8 8.6 13.8C11.95 13.8 14.4 15.65 14.4 18.5"),
      path(line(16.6, 14.8, 21.4, 14.8), undefined, { opacity: [1, 0], opacityPhase: [.05, .32], draw: [1, 0], drawPhase: [0, .32] }),
      path(line(19, 12.4, 19, 17.2), undefined, { opacity: [1, 0], opacityPhase: [.05, .32], draw: [1, 0], drawPhase: [0, .32] }),
      path(check(18.75, 14.8, .55), undefined, { opacity: [0, 1], opacityPhase: [.36, .5], draw: [0, 1], drawPhase: [.36, .82] }),
    ],
  },
] as const satisfies readonly MorphIconDefinition[];
