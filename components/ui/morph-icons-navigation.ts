import { morphCircle as circle, morphLine as line, morphPath as path, morphPolyline as points, morphRect as rect, type MorphIconDefinition } from "./morph-icon-geometry";

/** Twenty original navigation/workspace pairs; every contour retains its command topology. */
export const MORPH_NAVIGATION_ICONS = [
  {
    name: "menu", title: "Menu", category: "Navigation", states: ["Menu", "Close"],
    paths: [
      path(line(4.5, 6.5, 19.5, 6.5), line(6, 6, 18, 18)),
      path(line(4.5, 12, 19.5, 12), line(12, 12, 12, 12), { opacity: [1, 0] }),
      path(line(4.5, 17.5, 19.5, 17.5), line(6, 18, 18, 6)),
    ],
  },
  {
    name: "chevron", title: "Chevron", category: "Navigation", states: ["Collapsed", "Expanded"],
    paths: [path(points([[5.5, 8.5], [12, 15.5], [18.5, 8.5]]), points([[5.5, 15.5], [12, 8.5], [18.5, 15.5]]))],
  },
  {
    name: "arrow", title: "Arrow", category: "Navigation", states: ["Forward", "Back"],
    paths: [
      path(line(4.5, 12, 19.5, 12), line(19.5, 12, 4.5, 12)),
      path(points([[13.5, 6.5], [19, 12], [13.5, 17.5]]), points([[10.5, 6.5], [5, 12], [10.5, 17.5]])),
    ],
  },
  {
    name: "fullscreen", title: "Fullscreen", category: "Navigation", states: ["Windowed", "Fullscreen"],
    paths: [
      path(points([[9, 6], [6, 6], [6, 9]]), points([[8, 3.5], [3.5, 3.5], [3.5, 8]])),
      path(points([[15, 6], [18, 6], [18, 9]]), points([[16, 3.5], [20.5, 3.5], [20.5, 8]])),
      path(points([[18, 15], [18, 18], [15, 18]]), points([[20.5, 16], [20.5, 20.5], [16, 20.5]])),
      path(points([[9, 18], [6, 18], [6, 15]]), points([[8, 20.5], [3.5, 20.5], [3.5, 16]])),
    ],
  },
  {
    name: "sidebar", title: "Sidebar", category: "Workspace", states: ["Compact sidebar", "Expanded sidebar"],
    paths: [
      path(rect(3.5, 4.5, 17, 15, 1.6)),
      path(line(8.5, 4.5, 8.5, 19.5), line(12, 4.5, 12, 19.5)),
      path(line(5.6, 9, 6.5, 9), line(5.6, 9, 9.2, 9)),
      path(line(5.6, 12.5, 6.5, 12.5), line(5.6, 12.5, 9.2, 12.5)),
    ],
  },
  {
    name: "layout", title: "Layout", category: "Workspace", states: ["Grid", "Rows"],
    paths: [
      path(rect(3.5, 3.5, 6.5, 6.5, 1.1), rect(3.5, 4.5, 17, 3.5, .8)),
      path(rect(14, 3.5, 6.5, 6.5, 1.1), rect(3.5, 10.25, 17, 3.5, .8)),
      path(rect(3.5, 14, 6.5, 6.5, 1.1), rect(3.5, 16, 17, 3.5, .8)),
      path(rect(14, 14, 6.5, 6.5, 1.1), rect(12, 12, 0, 0), { opacity: [1, 0] }),
    ],
  },
  {
    name: "sort", title: "Sort", category: "Navigation", states: ["Ascending", "Descending"],
    paths: [
      path(line(7, 19.5, 7, 4.5), line(7, 4.5, 7, 19.5)),
      path(points([[3.5, 8], [7, 4.5], [10.5, 8]]), points([[3.5, 16], [7, 19.5], [10.5, 16]])),
      path(line(13.5, 6, 20.5, 6), line(13.5, 6, 15.5, 6)),
      path(line(13.5, 12, 18, 12)),
      path(line(13.5, 18, 15.5, 18), line(13.5, 18, 20.5, 18)),
    ],
  },
  {
    name: "filter", title: "Filter", category: "Navigation", states: ["All results", "Filtered"],
    paths: [
      path(points([[4, 4.5], [20, 4.5], [14, 12], [14, 18.5], [10, 20], [10, 12]], true), points([[4, 4.5], [20, 4.5], [13, 11.5], [13, 19], [9.5, 20], [9.5, 11.5]], true)),
      path(points([[18, 17.5], [18, 17.5], [18, 17.5]]), points([[15.5, 17.5], [17.5, 19.5], [21, 15.5]]), { opacity: [0, 1] }),
    ],
  },
  {
    name: "folder", title: "Folder", category: "Workspace", states: ["Closed", "Open"],
    paths: [
      path("M3.5 7.5Q3.5 5 6 5L9.5 5L11.5 7L18.5 7Q20.5 7 20.5 9L20.5 18Q20.5 19.5 19 19.5L5 19.5Q3.5 19.5 3.5 18Z", "M3.5 7.5Q3.5 5 6 5L9.5 5L11.5 7L17.5 7Q19 7 19 8.5L17.5 18Q17 19.5 15.5 19.5L5 19.5Q3.5 19.5 3.5 18Z"),
      path(points([[3.5, 10], [20.5, 10], [20.5, 18], [19, 19.5], [5, 19.5], [3.5, 18]], true), points([[6, 10.5], [20.5, 10.5], [18, 18.5], [16.5, 19.5], [5, 19.5], [3.5, 18]], true)),
    ],
  },
  {
    name: "lock", title: "Lock", category: "Workspace", states: ["Locked", "Unlocked"],
    paths: [
      path(rect(5.5, 10.5, 13, 10, 2)),
      path("M8 10.5L8 7Q8 3.5 12 3.5Q16 3.5 16 7L16 10.5", "M8 10.5L8 7Q8 3.5 12 3.5Q16 3.5 16 7L16 7.5"),
      path(circle(12, 14.6, .65), circle(12, 14.6, .65), { filled: true }),
      path(line(12, 15.1, 12, 17.5)),
    ],
  },
  {
    name: "search", title: "Search", category: "Navigation", states: ["Search", "Close search"],
    paths: [
      path(circle(10, 10, 6.3), circle(12, 12, .1), { opacity: [1, 0] }),
      path(line(14.7, 14.7, 20.3, 20.3), line(5.5, 5.5, 18.5, 18.5)),
      path(line(12, 12, 12, 12), line(5.5, 18.5, 18.5, 5.5), { opacity: [0, 1] }),
    ],
  },
  {
    name: "settings", title: "Settings", category: "Workspace", states: ["Default settings", "Adjusted settings"],
    paths: [
      path(line(3.5, 6, 5.35, 6), line(3.5, 6, 15.35, 6)),
      path(line(8.65, 6, 20.5, 6), line(18.65, 6, 20.5, 6)),
      path(circle(7, 6, 1.65), circle(17, 6, 1.65)),
      path(line(3.5, 12, 14.35, 12), line(3.5, 12, 6.35, 12)),
      path(line(17.65, 12, 20.5, 12), line(9.65, 12, 20.5, 12)),
      path(circle(16, 12, 1.65), circle(8, 12, 1.65)),
      path(line(3.5, 18, 8.35, 18), line(3.5, 18, 13.35, 18)),
      path(line(11.65, 18, 20.5, 18), line(16.65, 18, 20.5, 18)),
      path(circle(10, 18, 1.65), circle(15, 18, 1.65)),
    ],
  },
  {
    name: "sun-moon", title: "Theme", category: "Workspace", states: ["Light", "Dark"],
    paths: [
      path(circle(12, 12, 4), "M19.5 15C17.2 19.5 11.5 21.5 6.8 18.4C2.7 15.2 2.9 8.3 7.1 5.1C8.5 4 10 3.5 11.5 3.5C7.9 8.9 11.1 15.4 19.5 15Z"),
      path(line(12, 3.5, 12, 6) + line(12, 18, 12, 20.5), line(12, 12, 12, 12) + line(12, 12, 12, 12), { opacity: [1, 0] }),
      path(line(3.5, 12, 6, 12) + line(18, 12, 20.5, 12), line(12, 12, 12, 12) + line(12, 12, 12, 12), { opacity: [1, 0] }),
      path(line(5, 5, 6.8, 6.8) + line(17.2, 17.2, 19, 19), line(12, 12, 12, 12) + line(12, 12, 12, 12), { opacity: [1, 0] }),
      path(line(5, 19, 6.8, 17.2) + line(17.2, 6.8, 19, 5), line(12, 12, 12, 12) + line(12, 12, 12, 12), { opacity: [1, 0] }),
    ],
  },
  {
    name: "eye", title: "Visibility", category: "Actions", states: ["Visible", "Hidden"],
    paths: [
      path("M3.5 12C7 6 17 6 20.5 12C17 18 7 18 3.5 12", "M3.5 10C7 16 17 16 20.5 10C17 16 7 16 3.5 10"),
      path(circle(12, 12, 2.5), circle(12, 14, .1), { opacity: [1, 0] }),
      path(line(8, 14.4, 8, 14.4), line(7, 14, 5.8, 17), { opacity: [0, 1] }),
      path(line(12, 15, 12, 15), line(12, 14.5, 12, 18), { opacity: [0, 1] }),
      path(line(16, 14.4, 16, 14.4), line(17, 14, 18.2, 17), { opacity: [0, 1] }),
    ],
  },
  {
    name: "link", title: "Link", category: "Actions", states: ["Disconnected", "Linked"],
    paths: [
      path(rect(3.5, 8.5, 6, 7, 2.7), rect(3.5, 8.5, 8, 7, 2.7)),
      path(rect(14.5, 8.5, 6, 7, 2.7), rect(12.5, 8.5, 8, 7, 2.7)),
      path(line(12, 12, 12, 12), line(8.5, 12, 15.5, 12), { opacity: [0, 1] }),
    ],
  },
  {
    name: "bookmark", title: "Bookmark", category: "Workspace", states: ["Unsaved", "Saved"],
    paths: [
      path(points([[6, 3.5], [18, 3.5], [18, 20.5], [12, 17], [6, 20.5]], true), points([[5.5, 3.5], [18.5, 3.5], [18.5, 20.5], [12, 15.5], [5.5, 20.5]], true)),
      path(points([[12, 10], [12, 10], [12, 10]]), points([[8.2, 10], [10.8, 12.5], [15.8, 7.5]]), { opacity: [0, 1] }),
    ],
  },
  {
    name: "pin", title: "Pin", category: "Workspace", states: ["Unpinned", "Pinned"],
    paths: [
      path(points([[10, 3.5], [18, 6.5], [16, 11.5], [17, 14.5], [7, 10.8], [10, 9.5]], true), points([[8, 3.5], [16, 3.5], [15, 9.5], [18, 13.5], [6, 13.5], [9, 9.5]], true)),
      path(line(10.4, 12, 6.5, 19.5), line(12, 13.5, 12, 20.5)),
    ],
  },
  {
    name: "calendar", title: "Calendar", category: "Workspace", states: ["Calendar", "Scheduled"],
    paths: [
      path(rect(4, 5.5, 16, 15, 2)),
      path(line(4, 10, 20, 10)),
      path(line(8, 3.5, 8, 7.5)),
      path(line(16, 3.5, 16, 7.5)),
      path(line(7.5, 13.5, 9, 13.5), line(7, 15.5, 10.5, 18)),
      path(line(13.5, 13.5, 15, 13.5), line(10.5, 18, 17.5, 11.5)),
      path(line(7.5, 17.5, 9, 17.5), line(12, 15, 12, 15), { opacity: [1, 0] }),
      path(line(13.5, 17.5, 15, 17.5), line(12, 15, 12, 15), { opacity: [1, 0] }),
    ],
  },
  {
    name: "edit", title: "Edit", category: "Actions", states: ["Edit", "Edited"],
    paths: [
      path(points([[5, 15], [14, 6], [18, 10], [9, 19], [4, 20], [5, 15]], true), points([[6, 12], [11, 17], [19, 7], [19, 7], [11, 17], [6, 12]], true)),
      path(line(8, 16, 5.5, 18.5), line(6, 12, 6, 12), { opacity: [1, 0] }),
      path(line(12.7, 7.3, 16.7, 11.3), line(19, 7, 19, 7), { opacity: [1, 0] }),
    ],
  },
  {
    name: "trash", title: "Trash", category: "Actions", states: ["Closed", "Open"],
    paths: [
      path("M6.5 8L7.5 19Q7.5 20.5 9 20.5L15 20.5Q16.5 20.5 16.5 19L17.5 8", "M6.5 9.5L7.5 19Q7.5 20.5 9 20.5L15 20.5Q16.5 20.5 16.5 19L17.5 9.5"),
      path(line(4.5, 6.5, 19.5, 6.5), line(5, 5, 19, 8)),
      path(points([[9, 6.5], [9, 3.5], [15, 3.5], [15, 6.5]]), points([[9.4, 5.95], [10, 3.5], [15.8, 4.75], [15.2, 7.2]])),
      path(line(10, 10.5, 10, 17.5), line(10, 11.5, 10, 17.5)),
      path(line(14, 10.5, 14, 17.5), line(14, 11.5, 14, 17.5)),
    ],
  },
] as const satisfies readonly MorphIconDefinition[];
