import { components, type ComponentDefinition } from "./components";

export type DocsNavigationEntry = {
  id: string;
  label: string;
  href: string;
  description: string;
  slug?: string;
  keywords?: readonly string[];
};
export type DocsNavigationGroup = { id: string; label: string; entries: DocsNavigationEntry[] };

export const DOC_SECTIONS = [
  { id: "installation", label: "Installation" },
  { id: "source-structure", label: "Source structure" },
  { id: "appearances", label: "Appearances" },
  { id: "theming", label: "Theming" },
  { id: "accessibility", label: "Accessibility" },
  { id: "license", label: "License" },
] as const;

export const SIGNATURE_LINKS: readonly DocsNavigationEntry[] = [
  { id: "stickers", slug: "sticker-pack", label: "Stickers", href: "/stickers", description: "Explore the original sticker collection.", keywords: ["sticker pack", "illustrations"] },
  { id: "morphing-icons", slug: "morphing-icons", label: "Morphing icons", href: "/components/morphing-icons", description: "Forty icons that connect their two states through precise linework.", keywords: ["morphicon", "animation", "icons"] },
  { id: "liquid-metal", slug: "liquid-metal", label: "Liquid Metal", href: "/components/liquid-metal", description: "Flowing chrome ribbons with a beveled, reflective finish.", keywords: ["liquidmetal", "shader", "chrome"] },
  { id: "wiggle-text", slug: "wiggle-text", label: "Wiggle Text", href: "/components/wiggle-text", description: "Interactive lettering with a playful, elastic response.", keywords: ["wiggletext", "typography", "lettering"] },
];

const creativeGroups = [
  { id: "effects", label: "Effects & nature", categories: /effect|nature|background|shader|motion|interaction|graph/i, slugs: ["season-tree", "anime-fire", "grain-gradient", "flowing-water", "flowing-grass", "drifting-clouds", "bloom-trail", "frosted-glass", "bubble-wrap", "swing-keychain", "wall-switch", "halo-button", "floating-dock", "morph-input", "fluid-color-picker", "paper-cut", "neon-sign-404", "chai-break-404", "graph-canvas"] },
  { id: "galleries", label: "Galleries & keepsakes", categories: /galler|photograph|keepsake/i, slugs: ["endless-film", "journal-stack", "photo-garland", "film-strip", "focus-cards", "draggable-cards", "custom-stamp", "tilt-stamp-3d"] },
  { id: "characters", label: "Avatars & characters", categories: /avatar|character/i, slugs: ["avatar", "avatar-group", "avatar-editor", "mascot-avatar", "character-avatar", "human-avatar", "emberling"] },
  { id: "audio", label: "Audio & retro", categories: /audio|retro|player/i, slugs: ["audio-orb", "vinyl-player", "wave-player", "island-player", "glass-player", "neon-pill-player", "retro-player", "retro-camera", "gamer-boy"] },
  { id: "typography", label: "Typography", categories: /typograph|letter|text/i, slugs: ["hindi-text", "hinglish-text", "cipher-text", "flip-board"] },
  { id: "motorsport", label: "Motorsport", categories: /motorsport|racing/i, slugs: ["open-wheel-car", "superbike", "helmet", "mini-driver", "race-start-lights", "race-progress"] },
  { id: "portfolio", label: "Portfolio", categories: /portfolio/i, slugs: ["portfolio-banner", "portfolio-footer", "pavilion-footer", "animated-truck", "sticker-social-icons"] },
  { id: "ai", label: "AI & chat", categories: /ai|chat/i, slugs: ["chat-message", "prompt-input", "tool-call-card", "agent-status", "thinking-indicator", "model-picker", "markdown"] },
  { id: "experimental", label: "Experimental", categories: /experimental/i, slugs: ["adaptive-input"] },
] as const;

const essentialSections = [
  { id: "controls", label: "Buttons & inputs", slugs: ["button", "input", "textarea", "select", "checkbox", "radio-group", "switch", "slider", "toggle", "toggle-group", "label", "form", "combobox", "calendar", "date-picker", "input-otp", "file-upload", "rating", "stepper"] },
  { id: "navigation", label: "Navigation", slugs: ["accordion", "tabs", "breadcrumb", "pagination", "dropdown-menu", "command", "navigation-menu", "navbar", "sidebar", "context-menu"] },
  { id: "feedback", label: "Overlays & feedback", slugs: ["dialog", "sheet", "popover", "tooltip", "toast", "alert", "progress", "skeleton", "hover-card"] },
  { id: "layout", label: "Layout & display", slugs: ["card", "stat-card", "separator", "table", "empty-state", "scroll-area", "carousel", "code-block", "badge", "kbd"] },
] as const;
const essentialSlugs = new Set<string>(essentialSections.flatMap(section => [...section.slugs]));
const signatureSlugs = new Set(SIGNATURE_LINKS.flatMap(entry => entry.slug ? [entry.slug] : []));

export function matchesDocsEntry(entry: DocsNavigationEntry, query: string) {
  const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const text = [entry.label, entry.description, entry.slug, ...(entry.keywords || [])].join(" ").toLowerCase();
  return terms.every(term => text.includes(term));
}

export function createDocsNavigation(definitions: readonly ComponentDefinition[] = components): DocsNavigationGroup[] {
  const groups: DocsNavigationGroup[] = creativeGroups.map(group => ({ id: group.id, label: group.label, entries: [] }));
  const essentials: DocsNavigationGroup = { id: "essentials", label: "Essentials", entries: [] };
  const seen = new Set<string>();
  for (const component of definitions) {
    if (seen.has(component.slug) || signatureSlugs.has(component.slug)) continue;
    seen.add(component.slug);
    const explicit = creativeGroups.findIndex(group => (group.slugs as readonly string[]).includes(component.slug));
    const inferred = creativeGroups.findIndex(group => group.categories.test(component.category));
    const target = essentialSlugs.has(component.slug) ? essentials : groups[explicit >= 0 ? explicit : inferred] || essentials;
    target.entries.push({ id: component.slug, slug: component.slug, label: component.name, href: `/components/${component.slug}`, description: component.description, keywords: [component.category, target.label] });
  }
  return [...groups.filter(group => group.id !== "experimental"), essentials, ...groups.filter(group => group.id === "experimental")].filter(group => group.entries.length);
}

export const docsNavigationGroups = createDocsNavigation();

export function docsEssentialSections(entries: readonly DocsNavigationEntry[]): DocsNavigationGroup[] {
  const sections: DocsNavigationGroup[] = essentialSections.map(section => ({ id: section.id, label: section.label, entries: [] }));
  for (const entry of entries) {
    const index = essentialSections.findIndex(section => (section.slugs as readonly string[]).includes(entry.slug || ""));
    sections[index >= 0 ? index : sections.length - 1].entries.push(entry);
  }
  return sections.filter(section => section.entries.length);
}
