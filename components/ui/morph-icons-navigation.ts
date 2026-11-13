import { morphCheck as check, morphCircle as circle, morphLine as line, morphPath as path, morphPolyline as points, morphRect as rect, type MorphIconDefinition } from "./morph-icon-geometry";

/** Keep each menu bar rigid while its center moves vertically and its angle settles. */
function menuBar(y: number, angle: number) {
  const frame = (at: number) => {
    const radians = Math.max(0, Math.min(1, (at - .2) / .6)) * angle * Math.PI / 180;
    const distance = (y - 12) * (1 - Math.min(1, at / .25));
    const cx = 12 + distance * Math.sin(radians), cy = 12 + distance * Math.cos(radians);
    return line(cx - 7.5, cy, cx + 7.5, cy);
  };
  return path(frame(0), frame(1), {
    rotation: [0, angle], rotationPhase: [.2, .8],
    keyframes: [.125, .2, .25, .375, .5, .625, .75, .875].map(at => ({ at, d: frame(at) })),
  });
}

/** A rounded front panel shears as a single face while the visible back edges stay separate. */
function folderFront(width: number, shift: number) {
  return rect(3.5, 10.5, width, 9, 1.5).replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (_pair, x: string, y: string) => `${Math.round((Number(x) + shift * (19.5 - Number(y)) / 9) * 1000) / 1000} ${y}`);
}

const pencil = "M4 20L5.4 14.6L15.65 4.35C16.3 3.7 17.35 3.7 18 4.35L19.65 6C20.3 6.65 20.3 7.7 19.65 8.35L9.4 18.6Z";
const moon = "M19.75 13.8C18.8 18.25 13.7 20.6 9.25 18.4C4.95 16.2 3.4 10.8 6.15 6.65C7.3 4.9 9.25 3.7 11.4 3.4C8.15 8.9 12.5 15.75 19.75 13.8Z";

/** Twenty original paired states, with authored rigid turns and independent detail timing. */
export const MORPH_NAVIGATION_ICONS = [
  {
    name: "menu", title: "Menu", category: "Navigation", states: ["Menu", "Close"],
    paths: [menuBar(6.5, 45), path(line(4.5, 12, 19.5, 12), undefined, { opacity: [1, 0], opacityPhase: [0, .18] }), menuBar(17.5, -45)],
  },
  {
    name: "chevron", title: "Chevron", category: "Navigation", states: ["Collapsed", "Expanded"],
    paths: [path(points([[6.5, 9], [12, 14.5], [17.5, 9]]), undefined, { rotation: [0, 180] })],
  },
  {
    name: "arrow", title: "Arrow", category: "Navigation", states: ["Forward", "Back"],
    paths: [path(line(4.5, 12, 19.5, 12), undefined, { rotation: [0, 180] }), path(points([[13.5, 6], [19.5, 12], [13.5, 18]]), undefined, { rotation: [0, 180] })],
  },
  {
    name: "fullscreen", title: "Fullscreen", category: "Navigation", states: ["Windowed", "Fullscreen"],
    paths: [
      path(points([[9.5, 5.5], [5.5, 5.5], [5.5, 9.5]]), points([[7.5, 3.5], [3.5, 3.5], [3.5, 7.5]])),
      path(points([[14.5, 5.5], [18.5, 5.5], [18.5, 9.5]]), points([[16.5, 3.5], [20.5, 3.5], [20.5, 7.5]])),
      path(points([[18.5, 14.5], [18.5, 18.5], [14.5, 18.5]]), points([[20.5, 16.5], [20.5, 20.5], [16.5, 20.5]])),
      path(points([[9.5, 18.5], [5.5, 18.5], [5.5, 14.5]]), points([[7.5, 20.5], [3.5, 20.5], [3.5, 16.5]])),
    ],
  },
  {
    name: "sidebar", title: "Sidebar", category: "Workspace", states: ["Compact sidebar", "Expanded sidebar"],
    paths: [
      path(rect(3.5, 4.5, 17, 15, 2)), path(line(8.5, 4.5, 8.5, 19.5), line(11.5, 4.5, 11.5, 19.5)),
      path(line(5.8, 9, 7.6, 9), undefined, { opacity: [0, 1], opacityPhase: [.55, .9], draw: [0, 1], drawPhase: [.55, 1] }),
      path(line(5.8, 13, 7.6, 13), undefined, { opacity: [0, 1], opacityPhase: [.55, .9], draw: [0, 1], drawPhase: [.55, 1] }),
    ],
  },
  {
    name: "layout", title: "Layout", category: "Workspace", states: ["Grid", "Rows"],
    paths: [
      path(rect(3.5, 3.5, 6.5, 6.5, 1.5), rect(3.5, 3.5, 17, 3.5, 1.2), { keyframes: [.25, .55, .7].map(at => ({ at, d: rect(3.5, 3.5, 6.5, 3.5, 1.2) })) }),
      path(rect(14, 3.5, 6.5, 6.5, 1.5), rect(3.5, 10.25, 17, 3.5, 1.2), {
        keyframes: [{ at: .25, d: rect(14, 3.5, 6.5, 3.5, 1.2) }, { at: .55, d: rect(14, 10.25, 6.5, 3.5, 1.2) }, { at: .7, d: rect(3.5, 10.25, 6.5, 3.5, 1.2) }],
      }),
      path(rect(3.5, 14, 6.5, 6.5, 1.5), rect(3.5, 17, 17, 3.5, 1.2), { keyframes: [.25, .55, .7].map(at => ({ at, d: rect(3.5, 17, 6.5, 3.5, 1.2) })) }),
      path(rect(14, 14, 6.5, 6.5, 1.5), undefined, { opacity: [1, 0], opacityPhase: [0, .22] }),
    ],
  },
  {
    name: "sort", title: "Sort", category: "Navigation", states: ["Ascending", "Descending"],
    paths: [
      path(line(6.5, 16.5, 6.5, 7.5), undefined, { rotation: [0, 180], origin: [6.5, 12] }),
      path(points([[3.5, 10.5], [6.5, 7.5], [9.5, 10.5]]), undefined, { rotation: [0, 180], origin: [6.5, 12] }),
      path(line(14, 6, 20.5, 6), line(14, 6, 16.5, 6)), path(line(14, 12, 18.5, 12)), path(line(14, 18, 16.5, 18), line(14, 18, 20.5, 18)),
    ],
  },
  {
    name: "filter", title: "Filter", category: "Navigation", states: ["All results", "Filtered"],
    paths: [path(points([[3.5, 4.5], [20.5, 4.5], [12.5, 12], [12.5, 19], [9.5, 20], [9.5, 12]], true)), path(check(18.25, 17.3, .6), undefined, { opacity: [0, 1], opacityPhase: [.45, .7], draw: [0, 1], drawPhase: [.2, 1] })],
  },
  {
    name: "folder", title: "Folder", category: "Workspace", states: ["Closed", "Open"],
    paths: [
      // The back stops at the fold; its hidden bottom and right edges are never stroked.
      path("M5 10.5C4.172 10.5 3.5 9.828 3.5 9L3.5 6.5C3.5 5.395 4.395 4.5 5.5 4.5L9 4.5C9.4 4.5 9.8 4.7 10.1 5L11.6 6.5L18.5 6.5C19.605 6.5 20.5 7.395 20.5 8.5L20.5 9C20.5 9.828 19.828 10.5 19 10.5", "M4 18C3.724 18 3.5 17.776 3.5 17.5L3.5 6.5C3.5 5.395 4.395 4.5 5.5 4.5L9 4.5C9.4 4.5 9.8 4.7 10.1 5L11.6 6.5L16.5 6.5C17.605 6.5 18.5 7.395 18.5 8.5L18.5 9C18.5 9.828 17.828 10.5 17 10.5"),
      path(folderFront(17, 0), folderFront(14, 3)),
    ],
  },
  {
    name: "lock", title: "Lock", category: "Workspace", states: ["Locked", "Unlocked"],
    paths: [
      path(rect(5, 10.25, 14, 10.25, 2.25)),
      path("M7.75 10.25L7.75 7.5C7.75 5.153 9.653 3.25 12 3.25C14.347 3.25 16.25 5.153 16.25 7.5L16.25 10.25", "M7.75 10.25L7.75 7.5C7.75 5.153 9.653 3.25 12 3.25C14.347 3.25 16.25 5.153 16.25 7.5L16.25 7.5", { geometryPhase: [.15, .8] }),
      path(circle(12, 14.7, .7), undefined, { filled: true }), path(line(12, 15.1, 12, 17.5)),
    ],
  },
  {
    name: "search", title: "Search", category: "Navigation", states: ["Search", "Close search"],
    paths: [
      path(circle(10.1, 10.1, 6.2), undefined, { opacity: [1, 0], opacityPhase: [0, .3] }),
      path(line(14.5, 14.5, 20.25, 20.25), line(6, 6, 18, 18), { geometryPhase: [.3, .95] }),
      path(line(6, 18, 18, 6), undefined, { opacity: [0, 1], opacityPhase: [.45, .6], draw: [0, 1], drawPhase: [.45, 1] }),
    ],
  },
  {
    name: "settings", title: "Settings", category: "Workspace", states: ["Default settings", "Adjusted settings"],
    paths: [
      path(line(3.5, 6, 6.5, 6), line(3.5, 6, 14.5, 6)), path(line(9.5, 6, 20.5, 6), line(17.5, 6, 20.5, 6)), path(circle(8, 6, 1.5), circle(16, 6, 1.5)),
      path(line(3.5, 12, 14.5, 12), line(3.5, 12, 6.5, 12)), path(line(17.5, 12, 20.5, 12), line(9.5, 12, 20.5, 12)), path(circle(16, 12, 1.5), circle(8, 12, 1.5)),
      path(line(3.5, 18, 9.5, 18), line(3.5, 18, 12.5, 18)), path(line(12.5, 18, 20.5, 18), line(15.5, 18, 20.5, 18)), path(circle(11, 18, 1.5), circle(14, 18, 1.5)),
    ],
  },
  {
    name: "sun-moon", title: "Theme", category: "Workspace", states: ["Light", "Dark"],
    paths: [
      path(circle(12, 12, 4.25), moon, { geometryPhase: [.2, 1] }),
      ...Array.from({ length: 8 }, (_, index) => {
        const angle = index * Math.PI / 4;
        const ray = line(12 + 7 * Math.cos(angle), 12 + 7 * Math.sin(angle), 12 + 9 * Math.cos(angle), 12 + 9 * Math.sin(angle));
        return path(ray, undefined, { opacity: [1, 0], opacityPhase: [0, .2], draw: [1, 0], drawPhase: [0, .25] });
      }),
    ],
  },
  {
    name: "eye", title: "Visibility", category: "Actions", states: ["Visible", "Hidden"],
    paths: [
      path("M3.5 12C7 6.4 17 6.4 20.5 12", undefined, { opacity: [1, 0], opacityPhase: [.05, .4] }),
      path("M3.5 12C7 17.6 17 17.6 20.5 12", "M3.5 10.25C7 16.4 17 16.4 20.5 10.25", { geometryPhase: [.2, .75] }),
      path(circle(12, 12, 2.25), undefined, { opacity: [1, 0], opacityPhase: [0, .2] }),
      path(line(7, 13.7, 5.8, 16.3), undefined, { opacity: [0, 1], opacityPhase: [.7, .95], draw: [0, 1], drawPhase: [.65, 1] }),
      path(line(12, 14.8, 12, 17.75), undefined, { opacity: [0, 1], opacityPhase: [.7, .95], draw: [0, 1], drawPhase: [.65, 1] }),
      path(line(17, 13.7, 18.2, 16.3), undefined, { opacity: [0, 1], opacityPhase: [.7, .95], draw: [0, 1], drawPhase: [.65, 1] }),
    ],
  },
  {
    name: "link", title: "Link", category: "Actions", states: ["Disconnected", "Linked"],
    paths: [
      path("M9 8.5L7 8.5C5.067 8.5 3.5 10.067 3.5 12C3.5 13.933 5.067 15.5 7 15.5L9 15.5", "M10 8.5L8 8.5C6.067 8.5 4.5 10.067 4.5 12C4.5 13.933 6.067 15.5 8 15.5L10 15.5", { rotation: [-35, -35], geometryPhase: [0, .6] }),
      path("M15 8.5L17 8.5C18.933 8.5 20.5 10.067 20.5 12C20.5 13.933 18.933 15.5 17 15.5L15 15.5", "M14 8.5L16 8.5C17.933 8.5 19.5 10.067 19.5 12C19.5 13.933 17.933 15.5 16 15.5L14 15.5", { rotation: [-35, -35], geometryPhase: [0, .6] }),
      path(line(8.5, 12, 15.5, 12), undefined, { rotation: [-35, -35], opacity: [0, 1], opacityPhase: [.35, .6], draw: [0, 1], drawPhase: [.35, 1] }),
    ],
  },
  {
    name: "bookmark", title: "Bookmark", category: "Workspace", states: ["Unsaved", "Saved"],
    paths: [
      path("M7.5 3.5L16.5 3.5C17.605 3.5 18.5 4.395 18.5 5.5L18.5 20.5L12 16.5L5.5 20.5L5.5 5.5C5.5 4.395 6.395 3.5 7.5 3.5Z"),
      path(check(12, 10, .65), undefined, { opacity: [0, 1], opacityPhase: [.45, .7], draw: [0, 1], drawPhase: [.2, 1] }),
    ],
  },
  {
    name: "pin", title: "Pin", category: "Workspace", states: ["Unpinned", "Pinned"],
    paths: [
      path("M8.5 3.5L15.5 3.5C15.78 3.5 16.02 3.74 15.96 4.02L15 9.25L17.9 13C18.16 13.34 17.92 13.8 17.5 13.8L6.5 13.8C6.08 13.8 5.84 13.34 6.1 13L9 9.25L8.04 4.02C7.98 3.74 8.22 3.5 8.5 3.5Z", undefined, { rotation: [-25, 0] }),
      path(line(12, 13.8, 12, 20.5), undefined, { rotation: [-25, 0] }),
    ],
  },
  {
    name: "calendar", title: "Calendar", category: "Workspace", states: ["Calendar", "Scheduled"],
    paths: [
      path(rect(4, 5.5, 16, 15, 2)), path(line(4, 10, 20, 10)), path(line(8, 3.5, 8, 7.5)), path(line(16, 3.5, 16, 7.5)),
      ...[[8.5, 13.5], [15.5, 13.5], [8.5, 17], [15.5, 17]].map(([x, y]) => path(circle(x, y, .75), undefined, { filled: true, opacity: [1, 0], opacityPhase: [0, .3] })),
      path(check(12, 15.65, .6), undefined, { opacity: [0, 1], opacityPhase: [.45, .7], draw: [0, 1], drawPhase: [.2, 1] }),
    ],
  },
  {
    name: "edit", title: "Edit", category: "Actions", states: ["Edit", "Edited"],
    paths: [
      path(pencil, undefined, { opacity: [1, 0], opacityPhase: [.1, .5], draw: [1, 0], drawPhase: [.15, .55] }),
      path(line(14.3, 5.7, 18.3, 9.7), undefined, { opacity: [1, 0], opacityPhase: [0, .2] }),
      path(line(5.4, 14.6, 9.4, 18.6), undefined, { opacity: [1, 0], opacityPhase: [0, .2] }),
      path(check(12, 12, 1.3), undefined, { opacity: [0, 1], opacityPhase: [.3, .55], draw: [0, 1], drawPhase: [.3, 1] }),
    ],
  },
  {
    name: "trash", title: "Trash", category: "Actions", states: ["Closed", "Open"],
    paths: [
      path("M6.25 9.5L7.3 18.75C7.4 19.75 8.14 20.5 9.15 20.5L14.85 20.5C15.86 20.5 16.6 19.75 16.7 18.75L17.75 9.5"),
      path(line(4.5, 7, 19.5, 7), undefined, { rotation: [0, 12], origin: [19.5, 7] }),
      path("M9.5 7L9.5 4.75C9.5 4.3 9.85 4 10.3 4L13.7 4C14.15 4 14.5 4.3 14.5 4.75L14.5 7", undefined, { rotation: [0, 12], origin: [19.5, 7] }),
      path(line(10, 12, 10.5, 17.8)), path(line(14, 12, 13.5, 17.8)),
    ],
  },
] as const satisfies readonly MorphIconDefinition[];
