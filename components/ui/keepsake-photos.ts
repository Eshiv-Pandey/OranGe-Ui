/** Small local demonstration photos. Sources and license: public/photos/keepsakes/NOTICE.md. */
export type KeepsakePhoto = { id: string; src: string; alt: string; title: string; note?: string; color?: string };
export const KEEPSAKE_PHOTOS: readonly KeepsakePhoto[] = [
  { id: "summit", src: "/photos/keepsakes/summit.jpg", alt: "A sunlit mountain peak above a valley", title: "A little further", note: "The air felt different up here.", color: "#6a8591" },
  { id: "road", src: "/photos/keepsakes/road.jpg", alt: "An open landscape in warm evening light", title: "Take the long way", note: "No itinerary. Just a direction.", color: "#be9573" },
  { id: "lake", src: "/photos/keepsakes/lake.jpg", alt: "A still alpine lake reflecting the mountains", title: "Stay a while", note: "We almost missed this turn.", color: "#6e8275" },
  { id: "water", src: "/photos/keepsakes/water.jpg", alt: "Mountains surrounding blue lake water", title: "Blue, everywhere", note: "An afternoon worth keeping.", color: "#587f92" },
  { id: "forest", src: "/photos/keepsakes/forest.jpg", alt: "Sunlight passing through a green forest", title: "Off the clock", note: "Somewhere the signal disappears.", color: "#426656" },
  { id: "mist", src: "/photos/keepsakes/mist.jpg", alt: "Layers of hills softened by morning mist", title: "Before the world woke", note: "One more minute, then we go.", color: "#83896c" },
  { id: "coast", src: "/photos/keepsakes/coast.jpg", alt: "Ocean waves beneath a soft blue sky", title: "Salt in the air", note: "The sound we brought home.", color: "#739ba8" },
  { id: "city", src: "/photos/keepsakes/city.jpg", alt: "A wooden boat on a clear alpine lake", title: "Postcards home", note: "A place to get lost in.", color: "#99826d" },
  { id: "desert", src: "/photos/keepsakes/desert.jpg", alt: "Warm sunlit sand dunes", title: "Chasing the light", note: "Nothing but sky for miles.", color: "#b68f60" },
  { id: "flowers", src: "/photos/keepsakes/flowers.jpg", alt: "Yellow spring blossoms against a blue sky", title: "First signs of spring", note: "A slower kind of morning.", color: "#bc8e9b" },
  { id: "ocean", src: "/photos/keepsakes/ocean.jpg", alt: "A quiet tropical coast with clear blue water", title: "One more swim", note: "We stayed until the sun went down.", color: "#6ba2a0" },
  { id: "night", src: "/photos/keepsakes/night.jpg", alt: "A star-filled night sky over the landscape", title: "Look up", note: "We forgot to count the hours.", color: "#656b91" },
];
