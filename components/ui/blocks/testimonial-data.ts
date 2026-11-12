export type CustomerStory = { quote: string; name: string; role: string; imageSrc?: string; rating?: number; shortQuote?: string };

export const customerStories: CustomerStory[] = [
  { quote: "A thoughtful place to put our ideas. We spend less time finding the work and more time making something we care about.", shortQuote: "A little clarity goes a long way.", name: "Avery Lane", role: "Designer, Common Ground", imageSrc: "/photos/keepsakes/review-avery.jpg", rating: 4.8 },
  { quote: "Every little detail feels considered. From our first idea to the final handoff, it gives the whole team room to do good work.", shortQuote: "Good work, with room to breathe.", name: "Jamie Reed", role: "Founder, Northbank", imageSrc: "/photos/keepsakes/review-jamie.jpg", rating: 5 },
  { quote: "It feels like someone finally cleared the desk. The things we need are close, and the things we do not are out of the way.", shortQuote: "It feels like a freshly cleared desk.", name: "Riley Morgan", role: "Creative lead, Fieldwork", imageSrc: "/photos/keepsakes/review-riley.jpg", rating: 5 },
  { quote: "A shared home for the small decisions and the big ideas. It fits the way we think, without getting in the way.", shortQuote: "A home for the next good idea.", name: "Morgan Ellis", role: "Producer, Sunday Studio", imageSrc: "/photos/keepsakes/review-morgan.jpg", rating: 4.9 },
  { quote: "A lovely way to bring the whole picture together.", name: "Rowan Park", role: "Designer", imageSrc: "/photos/keepsakes/review-jamie.jpg" },
  { quote: "Less noise. More of the work we love.", name: "Alex Quinn", role: "Studio founder", imageSrc: "/photos/keepsakes/review-avery.jpg" },
  { quote: "Made for the way our team actually thinks.", name: "Casey Blake", role: "Project lead", imageSrc: "/photos/keepsakes/review-riley.jpg" },
  { quote: "Small details that make every day easier.", name: "Jordan Vale", role: "Creative director", imageSrc: "/photos/keepsakes/review-morgan.jpg" },
  { quote: "We found a little more room to make things.", name: "Taylor West", role: "Independent designer", imageSrc: "/photos/keepsakes/review-avery.jpg" },
  { quote: "A thoughtful space for curious people.", name: "Sam Rivers", role: "Researcher", imageSrc: "/photos/keepsakes/review-jamie.jpg" },
  { quote: "The whole team feels a little more together.", name: "Drew Arden", role: "Product lead", imageSrc: "/photos/keepsakes/review-riley.jpg" },
  { quote: "One good idea leads to another.", name: "Charlie Fern", role: "Writer", imageSrc: "/photos/keepsakes/review-morgan.jpg" },
];
