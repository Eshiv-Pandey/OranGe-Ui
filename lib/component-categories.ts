export const componentCategories = [
  "Buttons & actions", "Inputs & forms", "Navigation", "Overlays & feedback",
  "Content & layout", "Typography", "Avatars & characters", "Audio & media",
  "Backgrounds & shaders", "Nature & particles", "Galleries & photography",
  "Motion & interactions", "Motorsport", "Retro devices", "AI & chat", "Portfolio", "Experimental",
] as const;

export type LibraryCategory = typeof componentCategories[number];
export type ComponentCategory = LibraryCategory | "Forms & actions" | "Navigation & disclosure" | "Play" | "Human avatars";

const groups: Partial<Record<LibraryCategory, readonly string[]>> = {
  "Buttons & actions": ["button", "toggle", "toggle-group", "split-button", "copy-button", "icon-button", "halo-button"],
  "Typography": ["flip-board", "cipher-text", "wiggle-text", "hindi-text", "hinglish-text"],
  "Navigation": ["tabs", "accordion", "breadcrumb", "navigation-menu", "menubar", "dropdown-menu", "context-menu", "pagination", "sidebar", "command", "floating-dock", "stepper", "carousel"],
  "Avatars & characters": ["avatar", "avatar-group", "avatar-editor", "character-avatar", "mascot-avatar", "human-avatar", "emberling", "gamer-boy", "mini-driver"],
  "Audio & media": ["audio-orb", "wave-player", "vinyl-player", "island-player", "glass-player", "neon-pill-player", "cassette-player", "music-player", "video-player"],
  "Backgrounds & shaders": ["grain-gradient", "shader-canvas", "liquid-metal", "anime-fire", "flowing-water", "frosted-glass", "mesh-gradient", "aurora", "noise-gradient", "retro-grid", "grid-background"],
  "Nature & particles": ["season-tree", "flowing-grass", "drifting-clouds", "bloom-trail", "fireflies", "particle-field", "snow-fall", "rain-drops", "star-field"],
  "Galleries & photography": ["photo-garland", "journal-stack", "focus-cards", "photo-stack", "polaroid-stack", "film-strip", "image-reveal"],
  "Motion & interactions": ["bubble-wrap", "draggable-cards", "swing-keychain", "magnetic-button", "spotlight-card", "tilt-card", "cursor-trail", "pixel-trail", "sticker-peel", "confetti", "animated-truck"],
  "Motorsport": ["helmet", "open-wheel-car", "superbike", "race-start-lights", "race-progress"],
  "Retro devices": ["retro-window", "retro-taskbar", "retro-desktop", "retro-notepad", "retro-terminal", "retro-dialog", "retro-menu", "handheld-console"],
  "Portfolio": ["portfolio-banner", "portfolio-footer", "sticker-social-icons", "github-graph"],
};

/** One public group per component, shared by navigation, search and the catalogue. */
export function categoryForComponent(component: { slug: string; name: string; category: ComponentCategory; collection?: string }): LibraryCategory {
  for (const [category, slugs] of Object.entries(groups)) {
    if (slugs.includes(component.slug)) return category as LibraryCategory;
  }
  if (component.collection === "retro-os") return "Retro devices";
  if (component.category === "Forms & actions") return /button|toggle/.test(component.slug) ? "Buttons & actions" : "Inputs & forms";
  if (/(^|-)text($|-)|typewriter|marquee|word|letter|heading|counter|scramble/.test(component.slug)) return "Typography";
  if (/player|audio|music|sound/.test(component.slug)) return "Audio & media";
  if (/avatar|character|mascot/.test(component.slug)) return "Avatars & characters";
  if (/gradient|shader|background|aurora|plasma/.test(component.slug)) return "Backgrounds & shaders";
  if (/photo|gallery|image|polaroid/.test(component.slug)) return "Galleries & photography";
  if (component.category === "Navigation & disclosure") return "Navigation";
  if (component.category === "Human avatars") return "Avatars & characters";
  if (component.category === "Play") return "Motion & interactions";
  return componentCategories.includes(component.category as LibraryCategory) ? component.category as LibraryCategory : "Content & layout";
}
