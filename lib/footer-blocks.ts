import type { BlockDefinition } from "./blocks";
import type { PropDoc } from "./components";

const prop = (name: string, type: string, description: string, defaultValue = "Not set"): PropDoc => ({ name, type, description, defaultValue });
const common = [
  prop("brand", "string", "Replace the fictional demonstration wordmark."),
  prop("homeHref", "string", "Brand link destination.", "/"),
  prop("email", "string", "Contact address used by email links."),
  prop("groups", "{ title: string; links: { label: string; href: string }[] }[]", "Navigation groups with real application destinations."),
  prop("copyright", "string", "Custom legal line."),
  prop("theme", '"light" | "dark" | "auto"', "Palette within the footer's original material.", "auto"),
  prop("className / id", "string", "Outer footer class or anchor."),
  prop("appearance", '"polished"', "Collection for this authored composition.", "polished"),
];
const notes = [
  "This original footer belongs to the Polished collection. Its reference-specific colors, type and artwork are preserved in both palettes.",
  "Brands, addresses and content are fictional demonstrations. Replace destinations, legal copy and contact details with your own application data.",
  "Artwork was authored locally without copying third-party logos, characters or reference pixels. Keep the included artwork notice and SIL Open Font License notices when redistributing the assets.",
  "Complete source and original public assets are included. In Next.js, pass callback props from a client component. Registry installation embeds local artwork and fonts as data URLs.",
];

function footer(slug: string, name: string, title: string, file: string, description: string, props: PropDoc[] = [], usage = `<${name} />`): BlockDefinition {
  return { slug, name, title, file: `components/ui/blocks/${file}.tsx`, description, category: "Footer", family: "Marketing", collection: "polished", preview: "page", props: [...common, ...props], usage, notes,
    keyboard: "Tab follows native links and controls. Enter follows links and submits forms. Focus is visible; decorative motion respects reduced motion." };
}

export const FOOTER_BLOCKS: BlockDefinition[] = [
  footer("blue-hour-footer", "BlueHourFooter", "Blue hour", "landscape-footers", "A blue serif footer with an original engraved landscape and newsletter.", [
    prop("description", "string", "Short brand description."),
    prop("artworkSrc", "string", "Replace the decorative landscape with your own plate."),
    prop("onSubscribe", "(email: string) => void | Promise<void>", "Connect subscriptions. Submission is disabled without this callback."),
    prop("successMessage", "string", "Feedback after the callback resolves.", "You're on the list."),
  ], '<BlueHourFooter onSubscribe={async (email) => console.info(email)} />'),
  footer("studio-footer", "StudioFooter", "Sticker studio", "playful-footers", "A blue contact board with oversized script and original sticker accents.", [
    prop("office / officeHref", "string", "Office details and directions destination."),
    prop("careers / contactAction", "{ label: string; href: string }", "Work and contact destinations."),
  ]),
  footer("colony-footer", "ColonyFooter", "Common ground", "playful-footers", "A clean navigation panel on purple, visited by original playful characters.", [
    prop("action / support", "{ label: string; href: string }", "Contact and support destinations."),
    prop("description", "string", "A short line below the legal copy."),
  ]),
  footer("hillside-footer", "HillsideFooter", "Hillside", "landscape-footers", "A warm painted village with a quiet serif wordmark and concise navigation.", [
    prop("description", "string", "Short brand description."),
    prop("artworkSrc", "string", "Replace the original decorative landscape."),
  ]),
  { ...footer("skyline-footer", "SkylineFooter", "Skyline", "skyline-footer", "The portfolio's monument band, ambient sky and interactive truck."),
    props: [
      prop("brand", "ReactNode", "Your wordmark.", "Sample Studio"),
      prop("linkGroups", "PortfolioFooterLinkGroup[]", "Link headings with name, href and optional external flag."),
      prop("contact", "{ email?: string; phone?: string; phoneHref?: string; location?: string; title?: string }", "Contact details."),
      prop("profiles", "StickerProfile[]", "Configurable social links and optional hover cards."),
      prop("showTruck / showNebula / paused", "boolean", "Control decoration.", "true / true / false"),
      prop("onTruckClick", "MouseEventHandler<HTMLButtonElement>", "Observe restart of the truck animation."),
      prop("brandMark", "ReactNode", "Optional original brand artwork."),
      prop("truckImageSrc", "string", "Replace the decorative truck asset."),
      prop("theme", '"light" | "dark" | "auto"', "Live light or dark palette.", "auto"),
      prop("className / id", "string", "Outer footer class or anchor."),
      prop("appearance", '"polished"', "Collection for this composition.", "polished"),
    ], notes: [...notes, "This composition uses the user's supplied portfolio skyline and truck assets, already extracted as PortfolioFooter. Retain public/portfolio/NOTICE.md. Truck interaction restarts its drive; it remains decorative and pauses for reduced motion."] },
];
