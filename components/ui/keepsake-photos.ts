/** Small local demonstration photos. Sources and license: public/photos/keepsakes/NOTICE.md. */
export type KeepsakePhoto = { id: string; src: string; alt: string; title: string; note?: string; color?: string };
export const KEEPSAKE_PHOTOS: readonly KeepsakePhoto[] = [
  { id: "summit", src: "/photos/keepsakes/summit.jpg", alt: "A sunlit mountain peak above a valley", title: "A little further", note: "The air felt different up here.", color: "#6a8591" },
  { id: "road", src: "/photos/keepsakes/road.jpg", alt: "An open landscape in warm evening light", title: "Take the long way", note: "No itinerary. Just a direction.", color: "#be9573" },
  { id: "lake", src: "/photos/keepsakes/lake.jpg", alt: "A still alpine lake reflecting the mountains", title: "Stay a while", note: "We almost missed this turn.", color: "#6e8275" },
  { id: "water", src: "/photos/keepsakes/water.jpg", alt: "Mountains surrounding blue lake water", title: "Blue, everywhere", note: "An afternoon worth keeping.", color: "#587f92" },
  { id: "forest", src: "/photos/keepsakes/forest.jpg", alt: "Sunlight passing through a green forest", title: "Off the clock", note: "Somewhere the signal disappears.", color: "#426656" },
  { id: "mist", src: "/photos/keepsakes/mist.jpg", alt: "Layers of hills softened by morning mist", title: "Before the world woke", note: "One more minute, then we go.", color: "#83896c" },
];
