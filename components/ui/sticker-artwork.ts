/** Original oRangeUi artwork. All coordinates and marks are authored for this pack. */
const ink = "#242038";
const p = (d: string, fill: string, stroke = ink, width = 2.5) => `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;
const c = (x: number, y: number, r: number, fill: string, stroke = ink, width = 2.5) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${width}"/>`;
const e = (x: number, y: number, rx: number, ry: number, fill: string, stroke = ink, width = 2.5) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${stroke}" stroke-width="${width}"/>`;
const r = (x: number, y: number, w: number, h: number, radius: number, fill: string, stroke = ink, width = 2.5) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${radius}" fill="${fill}" stroke="${stroke}" stroke-width="${width}"/>`;
const line = (d: string, color = ink, width = 3) => p(d, "none", color, width);
const eyes = (x: number, y: number, gap = 15) => e(x, y, 3, 4.5, ink, "none") + e(x + gap, y, 3, 4.5, ink, "none");
const smile = (x: number, y: number) => line(`M${x} ${y}q6 7 12 0`, ink, 2.5);
const spark = (x: number, y: number, size: number, fill: string) => p(`M${x} ${y-size}q2 ${size-2} ${size} ${size}q-${size-2} 2 -${size} ${size}q-2 -${size-2} -${size} -${size}q${size-2} -2 ${size} -${size}Z`, fill, "none");
const dots = (items: number[][], fill: string) => items.map(([x, y, radius]) => c(x, y, radius, fill, "none")).join("");

export const STICKER_CATEGORIES = ["Oddlings", "Pocket objects", "In bloom", "Out there", "Graphic joy"] as const;
export type StickerCategory = typeof STICKER_CATEGORIES[number];
type Artwork = { name: string; title: string; category: StickerCategory; tags: string; color: string; outline: string; body: string };
const art = <N extends string>(name: N, title: string, category: StickerCategory, tags: string, color: string, outline: string, body: string): Artwork & { name: N } => ({ name, title, category, tags, color, outline, body });

export const STICKER_ARTWORK = [
  art("orbit-snail", "Orbit snail", "Oddlings", "slow cosmic creature orange", "#ff8251",
    "M24 89q-8-8-5-20l7-24q2-8 7-4l5 24q10-7 22-5a31 31 0 1 1 35 39q-19 7-45 1l-20-3Z",
    p("M24 89q-8-8-5-20l7-24q2-8 7-4l5 24q10-7 22-5l38 23q-7 22-45 13l-20-3Z", "#ff8251") + c(79, 69, 30, "#8560eb") + line("M90 78c-24 19-38-16-19-24 16-7 25 16 11 19-7 2-10-7-4-8", "#ffcf58", 6) + eyes(27, 74, 11) + smile(28, 84) + spark(102, 34, 7, "#ffcf58")),
  art("miso-moth", "Miso moth", "Oddlings", "moth butterfly wings night purple", "#ba92ff",
    "M57 36q-10-28-36-17-12 11 2 35-18 14-6 32 16 16 41-5 24 21 42 5 14-16-5-33 18-30 0-35-27-7-34 18Z",
    p("M59 42Q42 4 21 19q-14 15 15 42-30-4-20 23 18 12 45-11 24 22 43 11 8-23-19-23 25-20 23-38-25-21-41 19Z", "#ba92ff") + p("M34 28q18 0 20 26-15-4-20-26Zm59 0Q75 28 72 54q17-4 21-26Z", "#ff714b") + c(31, 75, 8, "#ffd468") + c(93, 75, 8, "#ffd468") + r(56, 34, 14, 47, 7, "#4a386d") + line("M60 36l-7-13m14 13 7-13") + eyes(60, 44, 7)),
  art("desk-gecko", "Desk gecko", "Oddlings", "lizard green creature squiggle", "#8fdb6f",
    "M57 17q19-8 34 8 12 14 0 32l8 9 12-6 4 10-15 13-16-10-6 11q23 18 5 30-26 14-36-2l-7-6-17 9-7-9 14-14 15 4 5-21-18-4-13 8-7-9 17-17 19 7 1-3q-16-14 1-35Z",
    p("M57 17q19-8 34 8 12 14 0 32l8 9 12-6 4 10-15 13-16-10-6 11q23 18 5 30-24 12-35-1 20 5 18-8l-16-7-17 9-7-9 14-14 15 4 5-21-18-4-13 8-7-9 17-17 19 7 1-3q-16-14 1-35Z", "#8fdb6f") + e(71, 57, 10, 18, "#d9f29a", "none") + e(61, 34, 6, 8, "#fff8e7") + e(83, 34, 6, 8, "#fff8e7") + eyes(62, 34, 21) + smile(65, 47) + dots([[66,68,2],[74,76,2],[62,83,2]], "#54864b")),
  art("peach-axolotl", "Peach axolotl", "Oddlings", "aquatic pink amphibian smiling", "#ffa0a7",
    "M36 34 22 24 19 37 8 40 22 51 10 64 30 67q-6 35 20 39 17 3 23-9 21 13 29-5l-10-9q6-7 2-18l22-1-15-15 16-8-16-7 3-14-19 11q-25-16-46-2Z",
    p("M36 34 22 24 19 37 8 40 22 51 10 64 30 67l59-1 26-2-15-15 16-8-16-7 3-14-19 11Z", "#f176a0") + p("M36 36q24-19 49 0 13 16 4 40l12 16q-7 21-28 4-6 14-23 10-28-4-18-35-14-18 4-35Z", "#ffa0a7") + e(62, 83, 15, 16, "#ffe0b7", "none") + eyes(45, 51, 32) + smile(56, 63) + line("M37 90l9-3m32 3 8-3")),
  art("cloud-yak", "Cloud yak", "Oddlings", "fluffy blue animal horns", "#82d4ed",
    "M30 40q-19-5-12-22 9 12 23 8 12-13 24-6 12-7 24 6 14 4 21-8 7 16-11 22 11 10 9 25 12 13-1 23 2 15-16 15l-4 10-12-2-2-10-14 1-2 11-13 1-4-12q-23 0-23-16-11-10 1-25-2-14 12-20Z",
    p("M30 40q-19-5-12-22 9 12 23 8h48q14 4 21-8 7 16-11 22Z", "#ffcf58") + p("M41 26q12-13 24-6 12-7 24 6 16 14 14 31 12 13 2 31 2 15-16 15l-4 10-12-2-2-10-14 1-2 11-13 1-4-12q-23 0-23-16-11-10 1-25-2-20 25-35Z", "#82d4ed") + e(63, 72, 23, 16, "#d6f5f6") + eyes(47, 48, 32) + dots([[55,70,3],[71,70,3]], ink) + smile(57, 79) + line("M38 31l-2 17m52-15 2 13", "#fff8e7", 4)),
  art("jelly-comet", "Jelly comet", "Oddlings", "jellyfish coral sea orange", "#ff876c",
    "M20 66q-6-48 44-49 50 1 44 49-6 8-14 5 12 29-8 39-12 4-14-21-4 23-16 24-15 0-10-27-16 24-28 13-11-9 7-29-4 3-5-4Z",
    p("M35 65q-18 23-10 34 7 7 19-13-5 26 9 25 10 0 16-27 2 30 14 24 14-9 4-39Z", "#ba92ff") + p("M20 66q-6-48 44-49 50 1 44 49-10 10-22-1-10 11-22 0-12 12-24 1-13 7-20 0Z", "#ff876c") + line("M35 41q8-15 23-15", "#fff1cb", 5) + eyes(50, 51, 28) + smile(58, 60) + dots([[36,54,4],[90,54,4]], "#e95767")),
  art("paper-koi", "Paper koi", "Oddlings", "fish origami folded orange blue", "#ffae50",
    "M14 64 49 27 97 34 88 52 117 38 106 66 119 89 91 77 100 96 52 103Z",
    p("M14 64 49 27 97 34 81 65 100 96 52 103Z", "#ffae50") + p("M81 65 117 38 106 66 119 89Z", "#637ae8") + p("M14 64 60 52 49 27Z", "#ff7154") + p("M14 64 61 77 52 103Z", "#fff1cb") + line("M60 52 81 65 61 77 14 64") + c(44, 63, 4, ink, "none")),
  art("moss-sprite", "Moss sprite", "Oddlings", "forest creature green leaves", "#b9dc6c",
    "M47 27q-13-16-26-12 0 22 17 26-16 8-17 31-11 15 0 24l14-5-2 17 15 1 8-13 12 1 7 15 16-4-3-17 15 6q13-11-1-27-1-22-17-31 20-8 20-24-19-6-31 13l-7-8Z",
    p("M47 32Q24 8 21 15q0 22 22 29l34-2q20-8 20-24-19-6-31 13Z", "#4aa879") + p("M42 39q-21 8-21 33-11 15 0 24l14-5-2 17 15 1 8-13 12 1 7 15 16-4-3-17 15 6q13-11-1-27-1-32-30-35Z", "#b9dc6c") + eyes(46, 63, 28) + smile(54, 77) + p("M59 43q-6-12 5-20 12 11-5 20Z", "#e8f2a1") + dots([[35,79,4],[87,80,4]], "#69af6b")),
  art("sun-beetle", "Sun beetle", "Oddlings", "bug insect gold geometric", "#ffcf58",
    "M47 29 37 15 44 11 56 24q8-3 16 0l12-13 7 4-10 14 11 19 19-6 4 9-18 10 18 12-4 9-18-7-1 10 12 16-7 7-15-15q-18 11-35 0l-15 15-8-7 13-16-2-10-18 7-4-9 18-12-18-10 4-9 20 6Z",
    line("M46 36 39 16m41 20 9-20M38 55 17 49m72 7 23-7M33 70 14 78m81-8 19 8M42 89 28 105m57-16 15 16", ink, 7) + e(64, 65, 31, 37, "#ffcf58") + p("M64 33v67q-31-1-31-35 0-28 31-32Z", "#ff814a") + c(64, 35, 15, "#8971cf") + eyes(57, 35, 14) + line("M64 53v43") + spark(46, 63, 10, "#fff4d5") + spark(82, 74, 10, "#fff4d5")),
  art("ribbon-seahorse", "Ribbon seahorse", "Oddlings", "sea aqua seahorse curl", "#65d4ce",
    "M48 27 38 13 62 18q26-6 31 15l18 3-1 13-18 2q-10 9-7 24 28 14 14 32-17 20-36-1-11-13-2-29l-16-6 14-13q-23-11-10-40Z",
    p("M48 27 38 13 62 18q26-6 31 15l18 3-1 13-18 2q-10 9-7 24 28 14 14 32-17 20-36-1-11-13-2-29l-16-6 14-13q-23-11-10-40Z", "#65d4ce") + p("M60 57 46 68 62 76 74 63Z", "#ffbd62") + line("M71 73c-8 18-1 30 11 23 8-5 0-11-4-7", "#218f9d", 5) + c(77, 34, 5, ink, "none") + line("M51 30q-1 9 2 14", "#e4ffe1", 4)),
  art("match-day", "Match day", "Pocket objects", "matchbox fire spark orange", "#ff744a",
    "M20 37 88 25 100 39 109 92 42 105 26 94Z",
    p("M20 37 88 25 100 39 109 92 42 105 26 94Z", "#ff744a") + p("M20 37 84 41 100 39 88 25Z", "#ffd878") + p("M26 94 42 105 37 49 20 37Z", "#9c4e8c") + p("M42 52 95 43 102 82 48 93Z", "#ffe6bd") + line("M51 86 81 56", "#6f5092", 5) + p("M79 65q-13-3-6-17 8 3 11-9 13 16-5 26Z", "#ff744a") + dots([[32,59,2],[34,70,2],[36,82,2]], "#ffe6bd")),
  art("sunday-skate", "Sunday skate", "Pocket objects", "roller skate wheels pink play", "#f791bd",
    "M31 20 69 17 76 60 99 65q17 3 16 20l-5 9-8 1q6 17-9 18-14 0-13-15l-28 1q0 16-14 15-15-3-6-18l-10-1 1-16 8-18Z",
    p("M31 20 69 17 76 60 99 65q17 3 16 20l-6 8-84 2-2-16 8-18Z", "#f791bd") + p("M25 83 113 80l-4 13-84 2Z", "#ffd468") + c(39, 103, 10, "#7563cf") + c(91, 102, 10, "#7563cf") + line("M46 33 67 31m-19 10 21-2m-18 11 19-2", "#fff8e7", 4) + p("M37 65q12 14 32 10l-3-10-29-8Z", "#ed6e64", "none") + dots([[39,103,3],[91,102,3]], "#ffcf58")),
  art("side-b-vinyl", "Side B vinyl", "Pocket objects", "record music black orange", "#fc8d51",
    "M107 64A43 43 0 1 1 21 64a43 43 0 0 1 86 0Z",
    c(64,64,43,"#363145") + c(64,64,32,"none","#817995",1.5) + c(64,64,24,"none","#817995",1.5) + c(64,64,17,"#fc8d51") + c(64,64,4,"#fff8e7") + line("M33 45q7-12 20-15m20 66q14-3 22-17", "#fff8e7", 3) + p("M54 51 57 56 53 60 48 55Z","#fff8e7","none")),
  art("moka-morning", "Moka morning", "Pocket objects", "coffee espresso pot purple", "#9c91ee",
    "M49 15 79 15 82 25 91 28 91 42 109 43 108 71 94 77 101 103 36 108 40 73 24 39 40 37 43 26 48 25Z",
    p("M86 42 109 43 108 71 92 79 89 68 100 64 100 52 90 52Z", "#ff9b5f") + p("M44 27 86 27 94 72 40 75 25 40 40 39Z", "#9c91ee") + p("M42 73 93 72 101 103 36 108Z", "#7563cf") + r(49,15,30,12,4,"#ff9b5f") + line("M55 33 56 65m20-32 7 31", "#e4defb", 4) + p("M59 86q-7-8 1-12 3 8 9 10 7 7-1 12-11-1-9-10Z", "#ffc96b", "none") + line("M38 100 96 98")),
  art("fizz-can", "Fizz can", "Pocket objects", "soda drink can citrus teal", "#69d1cc",
    "M39 22q25-10 50-2l4 83q-26 16-52 4Z",
    p("M39 22q25-10 50-2l4 83q-26 16-52 4Z", "#69d1cc") + e(64,22,25,7,"#e1f3ec") + e(64,23,8,3,"#5c5882") + p("M41 44 90 33l1 28-49 11Z", "#fbe192", "none") + p("M42 83 91 72l1 28-49 11Z", "#fc9666", "none") + c(66,73,16,"#ffe5a4") + line("M65 59 68 87m-13-20 22 12m-23-2 22-10", "#e48544", 2) + spark(82,48,5,"#ff8251")),
  art("mixtape", "Mixtape", "Pocket objects", "cassette tape music lilac", "#b49deb",
    "M17 35q0-8 9-8h77q9 0 9 8v59q0 8-9 8H26q-9 0-9-8Z",
    r(17,27,95,75,8,"#b49deb") + r(26,37,76,35,6,"#ffdd83") + r(40,47,47,16,8,"#38314d") + c(47,55,8,"#fff8e7") + c(80,55,8,"#fff8e7") + dots([[47,55,3],[80,55,3]], ink) + p("M41 81h47l8 20H33Z","#7660b6") + line("M48 87h34", "#ffdd83", 3) + dots([[25,94,2],[105,94,2]],ink) + line("M31 42h15m-15 24h65", "#fa976d", 2)),
  art("noodle-break", "Noodle break", "Pocket objects", "ramen bowl food lunch orange", "#ff865e",
    "M24 57 36 46 47 24 55 27 44 50 68 46 89 16 96 20 81 48 104 57 104 70q-4 32-35 34H56Q26 100 24 70Z",
    line("M42 59 52 27m21 32 20-40", "#dd9360", 6) + e(64,58,40,14,"#ffcc75") + line("M35 55q10-15 21 1t18-2 20 3m-47 3q8-8 13 1t18 0", "#fff2c4", 4) + p("M24 62q39 21 80 0-1 37-35 42H56Q28 99 24 62Z","#ff865e") + p("M47 78h34l-8 12H55Z", "#fff4d5", "none") + line("M43 101h43")),
  art("pocket-play", "Pocket play", "Pocket objects", "handheld game console retro pink", "#f3a0bf",
    "M35 16h57q9 0 9 9v72q0 16-16 16H35q-8 0-8-8V24q0-8 8-8Z",
    r(27,16,74,97,9,"#f3a0bf") + r(37,27,54,38,4,"#494060") + r(43,33,42,25,2,"#bce19b") + p("M51 48v-8h8v8h8v8h-8v-8Z","#649d77","none") + p("M40 76h6v8h8v6h-8v8h-6v-8h-8v-6h8Z", "#494060") + c(77,88,5,"#fc8e53") + c(89,78,5,"#fc8e53") + line("M76 103 91 99m-16 9 16-4", "#494060", 2)),
  art("bubble-tea", "Bubble tea", "Pocket objects", "drink boba tea yellow purple", "#ffcc75",
    "M33 40 37 29 76 29 84 10 93 13 87 29 98 33 102 43 94 108 44 112Z",
    p("M36 41 101 40 94 108 44 112Z","#ffcc75") + p("M41 66 98 60 94 108 44 112Z","#d799b5", "none") + line("M70 76 90 13", "#7963bc", 8) + e(68,39,34,10,"#fff1c9") + line("M82 35 90 13", "#7963bc", 8) + dots([[53,95,5],[70,101,5],[86,94,5],[69,85,5],[84,78,4],[54,80,4]], "#494060") + line("M44 47 47 62", "#fff8e7", 3)),
  art("pencil-launch", "Pencil launch", "Pocket objects", "pencil rocket creative blue", "#88bcee",
    "M57 17 77 26 81 47 49 100 25 111 30 85Z",
    p("M57 17 77 26 81 47 49 100 25 111 30 85Z","#88bcee") + p("M57 17 77 26 71 38 51 29Z","#f6a2bc") + line("M52 29 72 39") + p("M30 85 49 100 25 111Z","#ffdc8d") + p("M25 111 35 105 28 98Z",ink) + line("M40 86 66 42", "#fff8e7", 4) + spark(97,75,10,"#ffbf57") + spark(87,97,6,"#f68faf")),
  art("checkered-daisy", "Checkered daisy", "In bloom", "flower daisy checker yellow", "#ffd55c",
    "M52 33q-19-22-30-6-9 14 9 27-30 0-23 19 3 15 26 6-17 25 3 31 15 7 24-18 12 30 28 17 12-10-1-27 30 7 29-12-1-14-27-14 26-18 12-33-13-14-29 9-1-31-20-21-12 7-1 22Z",
    p("M52 33q-19-22-30-6-9 14 9 27-30 0-23 19 3 15 26 6-17 25 3 31 15 7 24-18 12 30 28 17 12-10-1-27 30 7 29-12-1-14-27-14 26-18 12-33-13-14-29 9-1-31-20-21-12 7-1 22Z","#ffd55c") + c(62,63,22,"#fff3d6") + p("M42 57h14v-14h14v14h14v14H70v14H56V71H42Z", "#8c70d8", "none") + p("M56 57h14v14H56Z", "#fff3d6", "none")),
  art("pepper-dance", "Pepper dance", "In bloom", "chili red spicy food", "#ff685e",
    "M78 19q15-11 25 1l-12 10q10 56-54 72L19 97q30-4 32-54 1-21 27-24Z",
    p("M80 27q27 58-39 78l-22-8q30-4 32-54 1-21 29-16Z", "#ff685e") + p("M70 28q10-19 33-8L91 30 88 42 77 37 64 39Z", "#65b47b") + line("M62 43q4-9 12-9", "#ffe2b5", 4) + eyes(61,56,18) + smile(62,67) + line("M84 70 100 62m-51 20-13-9")),
  art("pear-pair", "Pear pair", "In bloom", "pear fruit yellow green", "#b5d968",
    "M54 29q-4-20 18-17l5 13q21-5 27 8-19 13-30 0 3 13 16 32 24 37-12 48-45 11-47-21 0-21 14-37 9-10 9-26Z",
    p("M56 30q-4-20 16-18l2 17", "#bc956a") + p("M72 28q24-10 32 5-19 13-32-5Z", "#5aaf79") + p("M54 31q10-7 18 0 3 14 16 34 26 39-12 48-45 11-47-21 0-21 14-37 9-10 11-24Z", "#b5d968") + p("M46 70q-13 20-6 27", "none", "#eef3ba", 5) + eyes(52,76,21) + smile(58,88) + dots([[82,95,2],[76,99,2],[84,86,2]],"#6ba361")),
  art("radish-rebel", "Radish rebel", "In bloom", "vegetable red pink leaves", "#f782a6",
    "M47 45Q16 22 26 15q18 2 30 22Q50 4 65 9q12 9 5 27 17-28 30-21 7 16-17 31 21 14 8 37-12 23-38 31-8-19-20-35-10-20 14-34Z",
    p("M47 47Q15 23 26 15q18 2 30 22Q50 4 65 9q12 9 5 27 17-28 30-21 7 16-22 33Z", "#69b781") + p("M47 45q31-16 44 4 12 19-8 41-17 15-30 24-8-19-20-35-10-20 14-34Z", "#f782a6") + p("M43 93q12 12 10 21 23-14 29-26-14 12-39 5Z", "#fff8e7", "none") + line("M65 46 63 23m-7 20L36 25m36 17 18-19", "#36866d", 2) + eyes(46,63,22) + smile(54,76)),
  art("tiny-terrarium", "Tiny terrarium", "In bloom", "bottle garden plants green glass", "#91d5ba",
    "M50 13h28v15l23 27 4 42q-39 22-80 0l4-42 21-27Z",
    p("M50 26h28l23 29 4 42q-39 22-80 0l4-42Z", "#d0eee0") + p("M27 84q40-14 76 0l2 13q-40 21-80 0Z", "#837591") + line("M66 87V51m0 23L47 59m19 9 16-15", "#498b6b", 4) + p("M63 58q-20-8-17-21 20 0 17 21Zm5 10q1-20 20-20 0 18-20 20ZM52 70Q29 66 38 53q16 3 14 17Z", "#7db777") + r(49,13,30,14,3,"#dba77a") + line("M36 60 33 76", "#fff8e7", 4) + dots([[43,90,2],[86,94,2],[67,96,2]], "#ffdc8d")),
  art("cactus-club", "Cactus club", "In bloom", "plant cactus pot desert green", "#7dc594",
    "M48 72V30q0-24 25-13 8 5 8 16v26q9 3 10-5V40q0-14 14-12 9 2 6 15v16q0 24-28 24l1 9h12l-4 24H38l-5-24h14V79q-32 2-32-23V43q0-16 14-12 9 3 7 15v11q-1 10 12 8Z",
    p("M48 79Q16 81 16 56V43q0-16 14-12 9 3 7 15v11q-1 10 11 8V30q0-24 25-13 8 5 8 16v26q9 3 10-5V40q0-14 14-12 9 2 6 15v16q0 24-28 24v12H48Z", "#7dc594") + p("M33 92h63l-5 23H39Z", "#f49872") + line("M62 29v54m-37-40 1 14m77-15-1 16", "#3c986e", 2) + p("M48 101h35l-2 6H50Z", "#ffd284", "none") + spark(83,19,7,"#f799b4")),
  art("moon-shroom", "Moon shroom", "In bloom", "mushroom fungi purple lavender", "#a389db",
    "M14 64q-5-42 45-45 44-5 54 41 2 9-36 12l10 29q-22 20-49 1l11-29q-34 3-35-9Z",
    p("M53 61h20l14 40q-22 20-49 1Z", "#ffdfae") + p("M14 64q-5-42 45-45 44-5 54 41 3 16-54 15-44 0-45-11Z", "#a389db") + c(42,43,9,"#ffb179","none") + c(75,34,8,"#ffdfae","none") + c(90,55,7,"#ffb179","none") + c(23,59,5,"#ffdfae","none") + line("M59 82v16m11-16 3 13", "#cbab82", 2) + smile(57,88)),
  art("split-leaf", "Split leaf", "In bloom", "monstera tropical green plant", "#55b88b",
    "M60 20q27-19 44 6 25 32-8 58L70 95l-12 20-9-5 10-17q-45-4-45-41 0-31 23-35 15-3 23 3Z",
    p("M60 20q27-19 44 6 25 32-8 58L70 95l-12 20-9-5 10-17q-45-4-45-41 0-31 23-35 15-3 23 3Z", "#55b88b") + line("M57 100 72 30", "#246c68", 4) + p("M23 32 49 51 15 47Zm-4 28 30 9-23 8Zm89-23L84 52l29-3Zm-3 26L79 77l19 5Z", "#fff8e7", "none") + e(49,34,3,9,"#d6f1b4","none") + e(83,32,3,7,"#d6f1b4","none")),
  art("wildflower-post", "Wildflower post", "In bloom", "stamp flower postcard peach", "#ffc59a",
    "M19 19h12l4 6 5-6h11l5 6 5-6h11l5 6 5-6h11l5 6 5-6h7v12l-6 5 6 5v12l-6 5 6 5v12l-6 5 6 5v12l-6 5 6 5v7H97l-5-6-5 6H75l-5-6-5 6H53l-5-6-5 6H31l-5-6-7 6v-13l6-5-6-5V77l6-5-6-5V55l6-5-6-5V33l6-5-6-3Z",
    p("M19 19h12l4 6 5-6h11l5 6 5-6h11l5 6 5-6h11l5 6 5-6h7v12l-6 5 6 5v12l-6 5 6 5v12l-6 5 6 5v12l-6 5 6 5v7H97l-5-6-5 6H75l-5-6-5 6H53l-5-6-5 6H31l-5-6-7 6v-13l6-5-6-5V77l6-5-6-5V55l6-5-6-5V33l6-5-6-3Z", "#ffc59a") + r(31,32,66,64,1,"#fff0d5") + line("M62 89V54m0 25-17-11m17 17 16-15", "#589879", 3) + e(63,51,8,17,"#b29ae8") + e(63,51,18,7,"#b29ae8") + c(63,51,7,"#ffce62") + p("M59 78q-16 3-19-11 14-3 19 11Zm6 6q13-17 21-10-5 12-21 10Z", "#89bb87", "none")),
  art("citrus-slice", "Citrus slice", "In bloom", "orange lemon fruit sun", "#ffa151",
    "M106 66a42 42 0 1 1-84 0 42 42 0 0 1 84 0Z",
    c(64,66,42,"#ffa151") + c(64,66,34,"#fff0c1") + c(64,66,29,"#ffb959", "none") + line("M64 38v56M36 66h56M44 46l40 40M44 86l40-40", "#fff0c1", 4) + c(64,66,5,"#fff0c1", "none") + dots([[53,54,2],[75,78,2],[76,56,2]], "#fff4d5")),
  art("peach-planet", "Peach planet", "Out there", "saturn ring planet orange purple", "#ff986e",
    "M26 55q0-32 35-33 27-2 41 24 18-2 17 9-1 19-23 29-7 25-37 24-22-1-31-26-19 2-18-11 1-8 16-16Z",
    c(66,64,41,"#ff986e") + p("M25 57C-30 100 91 110 115 57q6-18-17-10l-4 9q20-3 5 11-27 23-65 16-17-3-5-15Z", "#8c76d8") + line("M43 35q20-7 38 4m-51 20 30-1m14 29 14-4", "#ffd29a", 5) + spark(18,27,6,"#ffc857")),
  art("portal-window", "Portal window", "Out there", "door doorway portal cosmic blue", "#949ce9",
    "M28 105V54a37 37 0 0 1 74 0v51Z",
    p("M28 105V54a37 37 0 0 1 74 0v51Z", "#949ce9") + p("M39 105V55a26 26 0 0 1 52 0v50Z", "#4d416d") + c(73,46,10,"#ffc677", "none") + p("M39 84q24-16 52-3v24H39Z", "#f392a8", "none") + p("M39 100q29-21 52-8v13H39Z", "#ffb97b", "none") + spark(54,58,5,"#e7d4ff") + dots([[80,66,2],[53,37,2]],"#e7d4ff")),
  art("comet-tail", "Comet tail", "Out there", "shooting star meteor yellow orange", "#ffca60",
    "M14 74 77 18 69 48 108 21 93 59 115 47 104 81q-9 30-38 28-34-1-52-35Z",
    p("M14 74 77 18 69 48 108 21 93 59 115 47 104 81q-9 30-38 28-34-1-52-35Z", "#ffca60") + p("M28 76 69 39 61 69 92 48 82 83Z", "#ff876c", "none") + c(74,81,25,"#b091e6") + spark(74,81,13,"#fff0cc") + line("M26 65 40 54m8 37-10-3", "#fff0cc", 4)),
  art("crescent-nap", "Crescent nap", "Out there", "moon night sleepy lavender", "#bea0e6",
    "M87 18a45 45 0 1 0 26 65q-32 10-49-13-17-26 23-52Z",
    p("M87 18a45 45 0 1 0 26 65q-32 10-49-13-17-26 23-52Z", "#bea0e6") + line("M32 61q7 9 14 0m0 15q6 7 12 0", ink, 2.5) + dots([[43,35,5],[36,84,4],[64,97,3]], "#987bd0") + spark(101,37,10,"#ffce68") + spark(83,57,5,"#ff9f82")),
  art("star-helmet", "Star helmet", "Out there", "astronaut space helmet blue", "#85cee8",
    "M22 59a42 42 0 0 1 84 0l7 3v23l-16 4-4 16H37l-5-17-17-4V62Z",
    p("M22 59a42 42 0 0 1 84 0l7 3v23l-16 4-4 16H37l-5-17-17-4V62Z", "#85cee8") + e(65,58,32,28,"#494060") + p("M37 58q7-24 27-23-4 18-27 23Z", "#b9c6f4", "none") + spark(78,61,11,"#ffcd70") + r(38,93,54,12,3,"#ffb58b") + dots([[26,74,3],[103,74,3]],"#fff5d5") + line("M49 99h30", "#fff5d5", 2)),
  art("saucer-social", "Saucer social", "Out there", "ufo alien spacecraft green", "#a7d781",
    "M35 55q-3-34 29-34 34 0 30 34 23 6 23 18-11 21-51 20-40 2-55-20 0-13 24-18Z",
    p("M35 55q-3-34 29-34 34 0 30 34Z", "#a7d781") + p("M35 55q-2-23 14-27-10 16-3 27Z", "#def0ba", "none") + e(64,66,53,16,"#a99be6") + p("M12 68q52 21 104 0-8 28-50 25-42 3-54-25Z", "#7864b9") + e(63,82,30,7,"#ffb974") + dots([[31,66,4],[64,68,4],[96,66,4]],"#ffdf82") + eyes(56,45,15)),
  art("pocket-rocket", "Pocket rocket", "Out there", "rocket launch coral blue", "#ff957e",
    "M62 13q27 14 27 44l17 24-2 19-23-11-5 13-1 15-13-6-14 6-1-16-6-12-20 11-1-19 16-24q0-29 26-44Z",
    p("M42 59 23 81l-2 19 28-14 27 1 28 13 2-19-19-26Z", "#7f98dd") + p("M48 96 47 117l15-6 13 6 1-21Z", "#ffc85e") + p("M62 13q27 14 27 44 0 24-13 45H48Q34 80 36 57q0-29 26-44Z", "#ff957e") + c(62,54,15,"#fff0d2") + c(62,54,10,"#87c7df") + p("M41 35q9-16 21-22 16 8 21 22Z", "#ba9ae9") + line("M56 78h13", "#fff0d2", 4)),
  art("tiny-satellite", "Tiny satellite", "Out there", "satellite signal science purple", "#a6a1e7",
    "M12 47 28 28 49 43 65 24 88 37 104 22 118 47 99 67 104 87 84 104 66 88 41 102 19 85 39 62Z",
    p("M12 47 28 28 51 44 34 68Z", "#a6a1e7") + p("M80 44 104 22 118 47 99 69Z", "#a6a1e7") + line("M24 41 41 54m-7-18-13 21m80-16 10 17m-1-26-17 23", "#e3daf7", 2) + p("M49 47 65 30 87 43 87 78 67 95 46 80Z", "#ffc685") + p("M49 47 68 60 87 43v35L67 95 46 80Z", "#ef956f") + line("M68 60v35") + p("M42 79 23 84 40 102 57 85Z", "#a6a1e7") + p("M81 84 97 73 104 87 88 102Z", "#a6a1e7") + line("M65 30 67 18", ink, 4) + c(67,17,5,"#97d6b8")),
  art("solar-hug", "Solar hug", "Out there", "eclipse sun moon yellow", "#ffcc5e",
    "M60 12 69 22 81 16 84 30 100 30 98 44 113 51 105 63 115 76 100 83 101 99 85 98 77 113 64 105 50 113 43 99 27 100 27 85 13 76 23 64 14 50 29 43 27 28 43 29 48 14Z",
    p("M60 12 69 22 81 16 84 30 100 30 98 44 113 51 105 63 115 76 100 83 101 99 85 98 77 113 64 105 50 113 43 99 27 100 27 85 13 76 23 64 14 50 29 43 27 28 43 29 48 14Z", "#ffcc5e") + c(64,64,34,"#ff9b61") + p("M77 33a34 34 0 1 1-32 60q47-7 32-60Z", "#7762a6", "none") + line("M45 54q5 6 10 0",ink,2.5) + smile(45,67)),
  art("constellation-note", "Constellation note", "Out there", "stars constellation night stamp", "#8b85cb",
    "M25 22 99 15 109 99 31 110 18 30Z",
    p("M25 22 99 15 109 99 31 110 18 30Z", "#8b85cb") + p("M32 34 90 27 97 88 38 97Z", "#4a416c") + line("M42 76 55 48 76 59 85 39", "#e0c6f3", 1.5) + spark(42,76,5,"#ffcf70") + spark(55,48,6,"#ffcf70") + spark(76,59,6,"#ffcf70") + spark(85,39,4,"#ffcf70") + dots([[42,42,2],[79,80,2],[89,70,2],[61,85,2]],"#f6d9bd") + line("M43 103 94 96", "#e0c6f3", 2)),
  art("ziggy-bolt", "Ziggy bolt", "Graphic joy", "lightning energy zigzag orange", "#ff9a53",
    "M66 12 104 24 74 54 103 66 46 116 54 77 24 67Z",
    p("M66 12 104 24 74 54 103 66 46 116 54 77 24 67Z", "#ff9a53") + p("M76 24 86 27 60 58 79 65 54 95 66 69 46 62Z", "#fff0c2", "none") + line("M92 88 108 95m-11-20 16 1M21 40l-9-10", "#8e75bd", 5)),
  art("woven-heart", "Woven heart", "Graphic joy", "heart love pink checker", "#f48eaa",
    "M64 37C37-2-3 40 24 72l40 39 40-39C131 41 91-3 64 37Z",
    p("M64 37C37-2-3 40 24 72l40 39 40-39C131 41 91-3 64 37Z", "#f48eaa") + p("M27 33q10-10 21 0l49 46-14 14Z", "#ffa76e", "none") + p("M44 20q11-1 20 17L99 70 85 84 35 36Z", "#ffcc87", "none") + p("M25 73 73 27q12-9 22 0L39 85Z", "#bd8ccf", "none") + p("M51 97 102 46q4 15-7 28L64 111Z", "#b487ca", "none") + line("M38 47 52 60m14-28 19 19", "#ffe8d5", 3)),
  art("infinity-ribbon", "Infinity ribbon", "Graphic joy", "loop knot infinity blue", "#83b9ec",
    "M63 49q-31-40-49-13-20 35 9 51 22 14 42-10 29 40 51 11 22-29-8-53-22-13-45 14Z",
    p("M63 49q-31-40-49-13-20 35 9 51 22 14 42-10 29 40 51 11 22-29-8-53-22-13-45 14Z", "#83b9ec") + p("M50 63q-19-26-24-12-7 18 6 20 7 2 18-8Zm28 0q18 26 25 14 8-16-5-21-8-3-20 7Z", "#fff8e7") + line("M56 40 79 75m-31-2 24 20", "#456caf", 3) + line("M26 34q10-4 22 8m38 44q12 8 20-3", "#d1eaf9", 3)),
  art("tidal-badge", "Tidal badge", "Graphic joy", "wave ocean blue badge", "#83cfe5",
    "M108 64a44 44 0 1 1-88 0 44 44 0 0 1 88 0Z",
    c(64,64,44,"#ffe0a3") + p("M24 66q11-27 30-26 29-3 33 24-12-15-21-1-11 17-42 3Z", "#75c8dc", "none") + p("M21 71q12 4 25-6 18-19 39 0 9 7 22 0-2 31-40 43-37-7-46-37Z", "#6083bd", "none") + p("M33 78q15 14 30 0t33 0", "none", "#fff0d0", 4) + c(76,39,8,"#f8976d", "none") + line("M52 30 55 34m-21 7 5 2", "#d89e60", 2)),
  art("pinwheel-pop", "Pinwheel pop", "Graphic joy", "pinwheel wind geometric color", "#b294df",
    "M62 63 25 17 75 16 74 50 112 23 112 73 79 75 107 112 58 112 58 79 18 105 16 55 49 55Z",
    p("M63 63 25 17 75 16 74 50Z", "#f5947d") + p("M63 63 112 23 112 73 79 75Z", "#ffcd71") + p("M63 63 107 112 58 112 58 79Z", "#b294df") + p("M63 63 18 105 16 55 49 55Z", "#80cbaa") + c(63,63,7,"#fff0d5") + line("M25 17 63 63l49-40M16 55l47 8 44 49",ink,2)),
  art("happy-ticket", "Happy ticket", "Graphic joy", "ticket smile admission green", "#c3dc87",
    "M16 41 107 29l4 24q-16 8 3 16l4 25-90 12-3-25q13-9-3-15Z",
    p("M16 41 107 29l4 24q-16 8 3 16l4 25-90 12-3-25q13-9-3-15Z", "#c3dc87") + line("M39 39l7 62", "#56846b", 2) + eyes(60,59,23) + line("M57 76q17 23 32-5", ink, 4) + dots([[36,49,1],[38,61,1],[39,74,1],[41,87,1]], "#56846b") + spark(100,81,5,"#fff0d5")),
  art("loop-arrow", "Loop arrow", "Graphic joy", "arrow refresh curved orange", "#ffbd68",
    "M89 45q-40-41-61-5-25 43 30 63 43 6 48-24L90 68Q80 95 59 84 24 65 43 45q14-13 32 13L58 71l50 1-7-47Z",
    p("M89 45q-40-41-61-5-25 43 30 63 43 6 48-24L90 68Q80 95 59 84 24 65 43 45q14-13 32 13L58 71l50 1-7-47Z", "#ffbd68") + line("M32 62q2 30 27 31", "#fff0c7", 4) + p("M75 64 99 64 97 47Z", "#e28b57", "none")),
  art("cube-candy", "Cube candy", "Graphic joy", "cube block geometric pink blue", "#b09ee3",
    "M62 14 110 40 108 91 64 115 18 89 18 39Z",
    p("M62 14 110 40 64 67 18 39Z", "#f4a0b8") + p("M18 39 64 67v48L18 89Z", "#b09ee3") + p("M64 67 110 40 108 91 64 115Z", "#88c8d7") + line("M41 27 86 54m-48-4 1 49m47-43v46M18 64 64 89l45-26", "#fff1d9", 2.5) + c(41,69,6,"#ffd27c","none") + c(86,78,6,"#f7b793","none")),
  art("finish-flutter", "Finish flutter", "Graphic joy", "checkered flag race sport", "#b3a1df",
    "M29 14 101 25 98 38 113 46 103 99 35 84 26 116 15 112Z",
    p("M29 24 103 39 100 94 31 79Z", "#fff0d6") + p("M31 27 49 31 45 48 27 44ZM49 49 67 53 63 70 45 66ZM67 35 85 39 81 57 63 53ZM85 58 102 61 98 79 81 75ZM27 61 45 65 41 82 23 78ZM63 71 81 75 77 92 59 88Z", "#8270ba", "none") + line("M31 20 20 112", "#f09e71", 7) + line("M32 17 23 12m75 18 10-6", "#f09e71", 3)),
  art("spark-bouquet", "Spark bouquet", "Graphic joy", "star sparkle abstract peach purple", "#e9a1be",
    "M56 18 65 38 86 15 83 44 110 43 91 65 115 83 85 87 88 111 63 92 43 114 42 86 15 90 33 67 13 48 42 47Z",
    p("M56 18 65 38 86 15 83 44 110 43 91 65 115 83 85 87 88 111 63 92 43 114 42 86 15 90 33 67 13 48 42 47Z", "#e9a1be") + p("M56 34 66 57 88 38 77 62 100 69 75 75 77 97 62 80 49 98 49 76 27 77 46 63 31 53 52 55Z", "#ffcf7b", "none") + c(63,67,10,"#8a75bb") + spark(63,67,5,"#fff3d6")),
] as const;

export type StickerName = typeof STICKER_ARTWORK[number]["name"];
export type StickerDefinition = typeof STICKER_ARTWORK[number];
export const STICKERS: readonly StickerDefinition[] = STICKER_ARTWORK;
export function getSticker(name: StickerName): StickerDefinition {
  const result = STICKERS.find((sticker) => sticker.name === name);
  if (!result) throw new RangeError(`Unknown oRangeUi sticker: ${name}`);
  return result;
}
export function stickerMarkup(name: StickerName): string {
  const sticker = getSticker(name);
  return `<g stroke-linecap="round" stroke-linejoin="round"><path d="${sticker.outline}" fill="#fff8f0" stroke="#fff8f0" stroke-width="10"/>${sticker.body}</g>`;
}
/** Self-contained vector: no fonts, external images, IDs, scripts or network dependencies. */
export function stickerSvg(name: StickerName, size = 512): string {
  const pixels = Number.isFinite(size) ? Math.round(Math.max(24, Math.min(4096, size))) : 512;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${pixels}" height="${pixels}" viewBox="0 0 128 128" role="img" aria-label="${getSticker(name).title}">${stickerMarkup(name)}</svg>`;
}
