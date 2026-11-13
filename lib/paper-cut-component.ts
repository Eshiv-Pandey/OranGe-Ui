import type { ComponentDefinition } from "./components";
export const PAPER_CUT_COMPONENT: ComponentDefinition = {
  slug: "paper-cut", name: "PaperCut", category: "Backgrounds & shaders", collection: "polished", customizerPreview: true,
  description: "A layered paper surface with a clear space for banner, card or section content.",
  file: "components/ui/paper-cut.tsx", usage: '<PaperCut palette="ocean" aspectRatio={2} depth={0.8} strength={0.7}>\n  <div style={{ width: "50%", padding: "32px", color: "#18343f" }}>\n    <h2>Your next chapter.</h2>\n    <p>A layered backdrop for your collection.</p>\n  </div>\n</PaperCut>',
  keyboard: "Tab focuses the artwork. Arrow keys shift its perspective; Home or Escape centers it. Child links and controls retain their normal keyboard behavior. Touch preserves vertical page scrolling. Reduced motion shows a still composition.",
  props: [
    { name: "palette", type: '"ocean" | "citrus" | "graphite"', defaultValue: '"ocean"', description: "A complete paper palette. Ocean blue follows the supplied material reference; citrus and graphite are original alternatives." },
    { name: "seed / layers", type: "number / number", defaultValue: "7 / 8", description: "Deterministic original contours and five to ten colored sheets. Continuous upper-left negative space keeps content readable." },
    { name: "depth / strength", type: "number / number", defaultValue: "1 / 1", description: "Shadow relief and depth-weighted pointer response, independently bounded to 0..2." },
    { name: "response", type: "number", defaultValue: "0.16", description: "Exponential response time in seconds, bounded to 0.06..0.6. Smaller values follow the pointer faster." },
    { name: "interactive / paused", type: "boolean / boolean", defaultValue: "true / false", description: "Enable pointer, touch and keyboard perspective, or freeze the centered artwork. Motion settles without an idle frame loop and pauses offscreen or in hidden tabs." },
    { name: "aspectRatio", type: "number", defaultValue: "1.55", description: "Responsive width-to-height ratio, bounded to 0.65..2.5. Vector artwork uses a centered cover crop." },
    { name: "children", type: "ReactNode", defaultValue: "Not set", description: "Real content over the artwork. Place it in the clear upper-left space, give it a readable foreground color, and adapt its width and the surface ratio for smaller screens." },
    { name: "appearance / label / className", type: "Appearance / string / string", defaultValue: '"polished" / "Layered paper-cut artwork" / Not set', description: "Library corner treatment, accessible group name and an additional outer class. The artwork palette remains independent of the library theme." },
  ],
  notes: [
    "The supplied Pinterest paper-cut banners informed the blue material, white negative space and layered contour treatment. All paths and motion are original mathematical geometry. No reference photograph, stock vector, watermark, artwork or copy is included in the component.",
    "The component is a vector surface with complete server-rendered artwork. It needs React and local CSS, with no image assets, WebGL, external service or animation package.",
    "One demand-driven animation loop serves each instance. It stops when the perspective settles and cleans up on unmount. Reduced motion, hidden tabs, offscreen surfaces and the pause prop keep a centered still image.",
    "Use child content for a banner, card or section background. Keep buttons and links native; the artwork handles arrow keys only when its outer group itself is focused.",
  ],
};
