import { morphCircle as circle, morphLine as line, morphPath as path, morphPolyline as poly, morphRect as rect, type MorphIconDefinition } from "./morph-icon-geometry";

const heart = "M12 20C10 18 4 14 4 9C4 4 9 3 12 7C15 3 20 4 20 9C20 14 14 18 12 20Z";
const selectedHeart = "M12 20C9 18 3.5 14 3.5 8.5C3.5 3.5 9 2.5 12 6.5C15 2.5 20.5 3.5 20.5 8.5C20.5 14 15 18 12 20Z";
const star = (outer: number, inner: number) => poly(Array.from({ length: 10 }, (_, i) => {
  const angle = -Math.PI / 2 + i * Math.PI / 5, radius = i % 2 ? inner : outer;
  return [12 + Math.cos(angle) * radius, 12 + Math.sin(angle) * radius] as const;
}), true);
const check = poly([[8,12],[11,15],[16,9]]);
const collapsedCheck = poly([[12,12],[12,12],[12,12]]);

/** Twenty independently drawn media, action and communication state pairs. */
export const MORPH_MEDIA_ICONS = [
  {
    name: "play-pause", title: "Playback", category: "Media", states: ["Play", "Pause"],
    paths: [
      path(poly([[6.5,4],[18.5,12],[6.5,20],[6.5,4]], true), poly([[6.5,4],[9.5,4],[9.5,20],[6.5,20]], true)),
      path(poly([[15.5,12],[15.5,12],[15.5,12],[15.5,12]], true), poly([[14.5,4],[17.5,4],[17.5,20],[14.5,20]], true), { opacity: [0,1] }),
    ],
  },
  {
    name: "volume", title: "Volume", category: "Media", states: ["Sound on", "Muted"],
    paths: [
      path(poly([[3.5,9],[7,9],[11,5],[11,19],[7,15],[3.5,15]], true), poly([[4,9],[7.5,9],[11.5,5],[11.5,19],[7.5,15],[4,15]], true)),
      path("M15 8C17 10 17 14 15 16", "M15 9C16 11 17 13 18 15"),
      path("M18 5C21.5 8 21.5 16 18 19", "M18 9C17 11 16 13 15 15"),
    ],
  },
  {
    name: "microphone", title: "Microphone", category: "Media", states: ["Microphone", "Listening"],
    paths: [
      path(rect(9,3,6,11,3), rect(11,6,2,12,1)),
      path("M6 10C6 20 18 20 18 10", "M6 9C6 9 6 15 6 15"),
      path(line(12,18,12,21), line(9,5,9,19)),
      path(line(8,21,16,21), line(15,5,15,19)),
      path(line(18,12,18,12), line(18,9,18,15), { opacity: [0,1] }),
    ],
  },
  {
    name: "camera", title: "Camera", category: "Media", states: ["Camera", "Captured"],
    paths: [
      path(rect(3,7,18,13,2), rect(3,6,18,14,2)),
      path(poly([[7,7],[8.5,4],[15.5,4],[17,7]]), poly([[7,6],[9,3.5],[15,3.5],[17,6]])),
      path(circle(12,13,3.5), circle(12,13,0), { opacity: [1,0] }),
      path(circle(17.5,9.5,.55), circle(17.5,9,.7), { filled: true }),
      path(poly([[12,13],[12,13],[12,13]]), poly([[8,13],[11,16],[17,10]]), { opacity: [0,1] }),
    ],
  },
  {
    name: "record", title: "Record", category: "Media", states: ["Record", "Stop"],
    paths: [path(circle(12,12,8.5), circle(12,12,9)), path(rect(8,8,8,8,4), rect(8,8,8,8,1), { filled: true })],
  },
  {
    name: "repeat", title: "Repeat", category: "Media", states: ["Repeat", "Repeat one"],
    paths: [
      path("M5 8C5 5 7 4 10 4L19 4", "M5 8C5 5 7 4 10 4L19 4"),
      path(poly([[16,3],[19,4],[16,7]])),
      path("M19 16C19 19 17 20 14 20L5 20", "M19 16C19 19 17 20 14 20L5 20"),
      path(poly([[8,17],[5,20],[8,21]])),
      path(poly([[12,12],[12,12],[12,12]]), poly([[10.5,10],[12,9],[12,15]]), { opacity: [0,1] }),
      path(line(12,15,12,15), line(10.5,15,13.5,15), { opacity: [0,1] }),
    ],
  },
  {
    name: "shuffle", title: "Shuffle", category: "Media", states: ["Straight", "Shuffle"],
    paths: [
      path("M4 6C9 6 14 6 20 6", "M4 6C11 6 13 18 20 18"),
      path("M4 18C9 18 14 18 20 18", "M4 18C11 18 13 6 20 6"),
      path(poly([[17,3],[20,6],[17,9]]), poly([[17,15],[20,18],[17,21]])),
      path(poly([[17,15],[20,18],[17,21]]), poly([[17,3],[20,6],[17,9]])),
    ],
  },
  {
    name: "heart", title: "Heart", category: "Actions", states: ["Unselected", "Selected"],
    paths: [path(heart, selectedHeart), path(selectedHeart, selectedHeart, { opacity: [0,1], filled: true })],
  },
  {
    name: "star", title: "Star", category: "Actions", states: ["Unstarred", "Starred"],
    paths: [path(star(8.2,3.7), star(8.5,4.1)), path(star(8.5,4.1), star(8.5,4.1), { opacity: [0,1], filled: true })],
  },
  {
    name: "check", title: "Check", category: "Actions", states: ["Unchecked", "Checked"],
    paths: [path(circle(12,12,8.5), circle(12,12,9)), path(collapsedCheck, check, { opacity: [0,1] })],
  },
  {
    name: "plus", title: "Add", category: "Actions", states: ["Add", "Close"],
    paths: [path(line(5,12,19,12), line(6,6,18,18)), path(line(12,5,12,19), line(18,6,6,18))],
  },
  {
    name: "copy", title: "Copy", category: "Actions", states: ["Copy", "Copied"],
    paths: [
      path(rect(3,3,12,12,2), rect(9,9,0,0,0), { opacity: [1,0] }),
      path(rect(7,7,14,14,2), rect(5,5,14,14,7)),
      path(collapsedCheck, check, { opacity: [0,1] }),
    ],
  },
  {
    name: "send", title: "Send", category: "Actions", states: ["Send", "Sent"],
    paths: [
      path(poly([[3,11],[21,3],[15,21],[11,13],[3,11]], true), poly([[5,5],[19,5],[19,19],[5,19],[5,5]], true)),
      path(line(11,13,21,3), line(12,12,12,12), { opacity: [1,0] }),
      path(collapsedCheck, check, { opacity: [0,1] }),
    ],
  },
  {
    name: "download", title: "Download", category: "Actions", states: ["Download", "Downloaded"],
    paths: [
      path(poly([[7,10],[12,15],[17,10]]), poly([[8,12],[11,15],[17,8]])),
      path(line(12,3.5,12,14), line(12,10,12,10), { opacity: [1,0] }),
      path(poly([[4,15],[4,20],[20,20],[20,15]]), poly([[4,16],[4,20],[20,20],[20,16]])),
    ],
  },
  {
    name: "upload", title: "Upload", category: "Actions", states: ["Upload", "Uploaded"],
    paths: [
      path(poly([[7,9],[12,4],[17,9]]), poly([[8,12],[11,15],[17,8]])),
      path(line(12,5,12,16), line(12,12,12,12), { opacity: [1,0] }),
      path(poly([[4,15],[4,20],[20,20],[20,15]]), poly([[4,16],[4,20],[20,20],[20,16]])),
    ],
  },
  {
    name: "cloud", title: "Cloud sync", category: "Communication", states: ["Cloud", "Synced"],
    paths: [
      path("M6 18C2.5 18 2.5 10 7 10C7 3.5 16 3.5 17 9C21.5 8.5 21.5 18 18 18L6 18Z", "M5.5 18C2.5 18 2.5 10 6.5 10C7 3 16.5 3 17.5 8.5C21.5 8.5 21.5 18 18.5 18L5.5 18Z"),
      path(collapsedCheck, poly([[7.5,12.5],[10.5,15.5],[16,10]]), { opacity: [0,1] }),
    ],
  },
  {
    name: "notification", title: "Notifications", category: "Communication", states: ["Notifications on", "Muted"],
    paths: [
      path("M5 17L7 14L7 10C7 4 17 4 17 10L17 14L19 17Z", "M5 17L7 14L7 10C7 5 17 5 17 10L17 14L19 17Z"),
      path(line(12,3,12,4.5)),
      path("M10 20C10 21.5 14 21.5 14 20", "M10 19.5C10 21 14 21 14 19.5"),
      path(line(12,12,12,12), line(4,3,20,20), { opacity: [0,1] }),
    ],
  },
  {
    name: "mail", title: "Mail", category: "Communication", states: ["Closed", "Open"],
    paths: [
      path(rect(3,5,18,14,2), rect(3,8,18,13,2)),
      path(poly([[3,6],[12,13],[21,6]]), poly([[3,9],[12,3],[21,9]])),
      path(poly([[3,18],[9,13],[15,13],[21,18]]), poly([[3,20],[9,15],[15,15],[21,20]])),
    ],
  },
  {
    name: "message", title: "Message", category: "Communication", states: ["Message", "Typing"],
    paths: [
      path("M5 4L19 4Q21 4 21 6L21 15Q21 17 19 17L10 17L5 21L5 17Q3 17 3 15L3 6Q3 4 5 4Z", "M5 4L19 4Q21 4 21 6L21 15Q21 17 19 17L11 17L6 21L6 17Q3 17 3 15L3 6Q3 4 5 4Z"),
      path(line(7,10,17,10), line(7,11,7,11)),
      path(line(7,13,13,13), line(12,11,12,11)),
      path(line(17,11,17,11), line(17,11,17,11), { opacity: [0,1] }),
    ],
  },
  {
    name: "user", title: "Follow", category: "Communication", states: ["Follow", "Following"],
    paths: [
      path(circle(9,7,3.3), circle(9,6.5,3.3)),
      path("M2.5 20C2.5 12 14.5 12 14.5 20", "M2.5 20C2.5 12.5 14.5 12.5 14.5 20"),
      path(line(19,12.5,19,17.5), line(17,15,18.5,17)),
      path(line(17,15,21,15), line(18.5,17,21,12.5)),
    ],
  },
] as const satisfies readonly MorphIconDefinition[];
