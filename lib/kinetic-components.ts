import type { ComponentDefinition } from "./components";

const selectionProps = [
  { name: "value / defaultValue / onValueChange", type: "string / string / (id: string) => void", defaultValue: "First available item", description: "Controlled or local selection by stable item id. Removed or invalid ids display the first available item without mutating a controlled value." },
  { name: "accent / theme / appearance / className", type: "string / CreativeTheme / Appearance / string", defaultValue: 'Component accent / "auto" / "polished" / not set', description: "Accent, host light/dark palette, library corner treatment and additional root class." },
];

export const KINETIC_COMPONENTS: ComponentDefinition[] = [
  {
    slug: "spring-deck", name: "SpringDeck", category: "Galleries & photography", collection: "polished", customizerPreview: true,
    description: "An elastic photo hand with a persistent featured card, keyboard browsing and sideways swipes.",
    file: "components/ui/spring-deck.tsx",
    usage: '<SpringDeck items={photos} />',
    usageImports: ['import { KEEPSAKE_PHOTOS } from "./components/ui/keepsake-photos";'],
    usageSetup: 'const photos = KEEPSAKE_PHOTOS.slice(0, 5).map(photo => ({ id: photo.id, image: photo.src, alt: photo.alt, title: photo.title, description: photo.note }));',
    keyboard: "Tab focuses the featured card. Left/Right, Home and End browse and focus photos. Previous/Next controls also work; a horizontal swipe changes the selected photo while vertical touch scrolling remains available.",
    props: [
      { name: "items", type: "readonly SpringDeckItem[]", defaultValue: "Required", description: "Photos with unique id, image, alt and title, plus optional description, destination link and individual card color." },
      ...selectionProps,
      { name: "spread / tilt / cardWidth", type: "number / number / number", defaultValue: "1 / 6 / 180", description: "Fan spread from 0.4 to 1.8, resting card angle from 0 to 12 degrees and card width from 120 to 260px. Cards adapt to their container; nearby photos remain visible." },
      { name: "label", type: "string", defaultValue: '"Photo collection"', description: "Accessible collection name." },
    ],
    notes: ["An original photo-hand composition informed by the public Bounce Cards interaction. The geometry, persistent selection, caption shelf, elastic transitions and source are authored for oRangeUi; no reference code or imagery is included.", "There is no timer or continuous animation loop. CSS transitions settle after interaction, reduced motion removes movement, and an unavailable image has a visible fallback. Supply and license your own photos; documentation demo photos retain their existing source notices."],
  },
  {
    slug: "cascade-menu", name: "CascadeMenu", category: "Navigation", collection: "polished", customizerPreview: true,
    description: "Layered navigation sheets with staggered ruled links and an optional full screen dialog.",
    file: "components/ui/cascade-menu.tsx",
    usage: '<CascadeMenu brand="Your studio" items={[{ id: "work", label: "Work", href: "/work", description: "Selected projects" }, { id: "about", label: "About", href: "/about" }]} footer="Your contact details">\n  <h2>A place for your next idea.</h2>\n</CascadeMenu>',
    keyboard: "Enter or Space opens the navigation. Tab follows native links and the close control. Escape closes and returns focus to the opener. Full screen mode locks page scrolling and traps focus until closed.",
    props: [
      { name: "items", type: "readonly CascadeMenuItem[]", defaultValue: "Required", description: "Navigation links with id, label and href; optional description, current-page state and target. Links keep native browser behavior." },
      { name: "open / defaultOpen / onOpenChange", type: "boolean / boolean / (open: boolean) => void", defaultValue: "Local / false / not set", description: "Controlled or uncontrolled disclosure state. Escape, close, backdrop and link activation request closure." },
      { name: "fullScreen / height", type: "boolean / number | string", defaultValue: "false / 460", description: "Inline panel or body-mounted modal navigation; inline surface height in pixels or CSS units. Long menus scroll inside the panel." },
      { name: "brand / children / footer", type: "ReactNode", defaultValue: '"Studio" / not set / not set', description: "Brand mark, page content behind the inline menu and footer content inside the navigation sheet." },
      { name: "onNavigate", type: "(item: CascadeMenuItem) => void", defaultValue: "Not set", description: "Called when a native link is activated, alongside its normal navigation." },
      { name: "accent / label / theme / appearance", type: "string / string / CreativeTheme / Appearance", defaultValue: '"#c15f3c" / "Site navigation" / "auto" / "polished"', description: "Sheet color, accessible navigation name, host palette and corner treatment." },
    ],
    notes: ["An original ruled navigation system informed by the staged reveal of the public Staggered Menu preview. The sheet proportions, warm material, link rows, motion and source are original.", "Use the inline version for an embedded demonstration or region. Full screen mode uses a portal, restores focus and the prior body overflow value, cleans up key listeners and honors reduced motion. Provide real destinations and keep the navigation label meaningful."],
  },
  {
    slug: "choice-dial", name: "ChoiceDial", category: "Inputs & forms", collection: "polished", customizerPreview: true,
    description: "A readable curved option dial with physical ticks, disabled choices, typeahead and touch scrubbing.",
    file: "components/ui/choice-dial.tsx",
    usage: '<ChoiceDial label="Choose a focus" options={[{ id: "design", label: "Design", description: "Shape a clear idea." }, { id: "code", label: "Development", description: "Bring it to life." }, { id: "photo", label: "Photography" }]} />',
    keyboard: "Focus the listbox. Up/Down changes choice; Home/End selects the first/last available choice and Page Up/Down moves by three. Typing a choice prefix selects it. Disabled choices are skipped. Previous/Next buttons and vertical touch dragging are also supported.",
    props: [
      { name: "options", type: "readonly ChoiceDialOption[]", defaultValue: "Required", description: "Stable id and label, optional description, icon and disabled state. All unavailable options show an explicit empty state." },
      ...selectionProps,
      { name: "loop / curve / visibleOptions", type: "boolean / number / number", defaultValue: "false / 1 / 5", description: "Wrap at the ends, curve strength from 0 to 1.6 and three to nine visible choices. Without looping, wheel events at an edge return to page scrolling." },
      { name: "label", type: "string", defaultValue: '"Choose an option"', description: "Visible and accessible listbox label." },
    ],
    notes: ["An original compact dial informed by the public Option Wheel's curved selection behavior. It adds a physical tick rail, readable secondary choices, a description footer and explicit directional controls, with original geometry and CSS motion.", "The component uses listbox semantics with a stable active-descendant id and no timer. Its wheel listener is local and removed on unmount. Touch scrubs vertically within the dial; surrounding page content remains scrollable. Reduced motion retains direct selection without animated transitions."],
  },
  {
    slug: "aperture-gallery", name: "ApertureGallery", category: "Galleries & photography", collection: "polished", customizerPreview: true,
    description: "Adjoining photo apertures with an expanding frame, gentle image drift and a separate caption dock.",
    file: "components/ui/aperture-gallery.tsx",
    usage: '<ApertureGallery items={photos} />',
    usageImports: ['import { KEEPSAKE_PHOTOS } from "./components/ui/keepsake-photos";'],
    usageSetup: 'const photos = KEEPSAKE_PHOTOS.slice(0, 5).map(photo => ({ id: photo.id, image: photo.src, alt: photo.alt, title: photo.title, description: photo.note }));',
    keyboard: "Tab focuses the open photo. Arrow keys, Home and End move between panels and update the caption. Clicking or tapping opens a photo; optional mouse hover also opens it. A destination link is separate from the photo controls.",
    props: [
      { name: "items", type: "readonly ApertureGalleryItem[]", defaultValue: "Required", description: "Unique id, image, alt and title, plus optional description, href and CSS objectPosition for the image's focal point." },
      ...selectionProps,
      { name: "trigger / orientation", type: '"click" | "hover" / "horizontal" | "vertical"', defaultValue: '"click" / "horizontal"', description: "Mouse selection trigger and panel direction. Touch and keyboard remain direct. Containers under 440px switch to vertical panels." },
      { name: "height / expand / parallax", type: "number / number / number", defaultValue: "360 / 4 / 0.5", description: "Frame height from 220 to 640px, selected panel flex ratio from 2 to 7 and pointer image drift from 0 to 1. Vertical frames reserve additional height for collapsed rows." },
      { name: "label", type: "string", defaultValue: '"Image gallery"', description: "Accessible gallery name." },
    ],
    notes: ["An original adjoining-frame gallery informed by the public Accordion Gallery interaction. The shared outer frame, permanent collapsed labels, caption dock and movement are authored for oRangeUi, without reference source or photos.", "The selected photo always remains open. Native buttons provide focus and selection; captions announce changes politely. CSS transitions settle without a frame loop, image loading errors have a fallback and reduced motion removes animated expansion and drift."],
  },
];
