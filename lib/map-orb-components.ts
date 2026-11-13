import type { ComponentDefinition } from "./components";

export const MAP_ORB_COMPONENTS: ComponentDefinition[] = [
  {
    slug: "agent-map", name: "AgentMap", category: "Content & layout", collection: "polished", customizerPreview: true,
    description: "Geographic routes and places with selectable stops, transport choices and a full screen map.",
    file: "components/ui/agent-map.tsx",
    usage: '<AgentMap stops={[{ id: "museum", name: "British Museum", latitude: 51.5194, longitude: -0.127 }, { id: "square", name: "Russell Square", latitude: 51.5215, longitude: -0.1268 }]} />',
    keyboard: "Focus the map and use arrow keys to pan, plus/minus to zoom and Home to fit all stops. Markers, routes, place cards and fullscreen controls are native controls. Escape closes fullscreen and restores focus.",
    props: [
      { name: "stops", type: "readonly AgentMapStop[]", defaultValue: "Required", description: "Places with unique id, name, latitude and longitude; optional description, image, link and travel-time label." },
      { name: "routes", type: "readonly AgentMapRoute[]", defaultValue: "[]", description: "Application-provided geographic paths with id, label, coordinates, walk/cycle/transit mode and optional duration. Without paths the map shows a straight connection between stops." },
      { name: "value / onValueChange", type: "string / (id: string) => void", defaultValue: "First stop / not set", description: "Controlled selected place; defaultValue supports an uncontrolled initial selection." },
      { name: "route / onRouteChange", type: "string / (id: string) => void", defaultValue: "First route / not set", description: "Controlled or local route selection. The map automatically fits a newly selected route." },
      { name: "tileUrl / tileAttribution", type: "string | false / ReactNode", defaultValue: "OpenStreetMap XYZ tiles / OSM credit", description: "XYZ URL template using {z}, {x}, {y}. Supply provider attribution for custom tiles. False displays a labeled offline route preview." },
      { name: "onReorder", type: "(stops: AgentMapStop[]) => void", defaultValue: "Not set", description: "Adds keyboard-accessible earlier/later controls to place cards. Application owns the reordered stops and any updated route geometry." },
      { name: "showCards / showExpand", type: "boolean / boolean", defaultValue: "true / true", description: "Place-card strip and fullscreen action. Fullscreen keeps map controls and returns focus on exit." },
      { name: "accent / height", type: "string / number | string", defaultValue: '"#dc5c28" / 460', description: "Route/marker color and map viewport height. The map fits its actual responsive dimensions." },
      { name: "children / theme / appearance", type: "ReactNode / CreativeTheme / Appearance", defaultValue: 'Not set / "auto" / "polished"', description: "Optional composer below the map, library palette and corner treatment." },
    ],
    notes: [
      "An original implementation informed by the public Agent Map preview on kobra.systems. No paid source, map artwork, reference photos or reference copy is included.",
      "Default geographic tiles come from OpenStreetMap. Keep the on-map attribution, comply with the provider's tile usage policy, and use your own production tile provider for substantial traffic. No geocoding or routing API is called. Stops, paths and travel estimates come from your application.",
      "Map tiles need network access. The stop list, geographic path and selection remain usable when tiles cannot load or tileUrl is false. No map SDK, API key or animation dependency is needed.",
      "The demo's London stops, approximate paths and travel times are illustrative; they are not navigation instructions. Dragging preserves vertical page scrolling on touch; keyboard and explicit zoom controls cover other inputs.",
    ],
  },
  {
    slug: "glyph-orb", name: "GlyphOrb", category: "Backgrounds & shaders", collection: "polished", customizerPreview: true,
    description: "A banded ASCII planet with directional light, inertial spin and cloud storms on click.",
    file: "components/ui/glyph-orb.tsx", usage: '<GlyphOrb color="#ffd4a4" shadowColor="#70539c" glyphSize={8} speed={0.6} />',
    keyboard: "Focus the canvas. Arrow keys rotate the planet; Enter or Space adds a storm. Home or Escape centers the view. Reduced motion retains a still frame; direct keyboard adjustments remain available.",
    props: [
      { name: "color / shadowColor / background", type: "string / string / string", defaultValue: '"#ffd4a4" / "#70539c" / "#080a12"', description: "Sunlit, shadow and space colors. Six-digit or three-digit hex colors support interpolated glyph lighting." },
      { name: "glyphSize / spacing / charset", type: "number / number / string", defaultValue: '8 / 1.12 / " .,:;=+*xX#%@"', description: "Character height, horizontal spacing and light-to-dense ASCII ramp. Glyph size is bounded to 6..24 and spacing to 0.7..1.8." },
      { name: "size / height / tilt", type: "number / number | string / number", defaultValue: "1 / 460 / -22", description: "Planet scale, surface height and axis tilt in degrees. Size is bounded to 0.45..1.5." },
      { name: "bands / turbulence / speed", type: "number / number / number", defaultValue: "8 / 1.1 / 0.6", description: "Latitude bands, swirling cloud distortion and rotation speed. Negative speed reverses rotation." },
      { name: "lightAngle / lightHeight / contrast / glow", type: "number / number / number / number", defaultValue: "-45 / 0.65 / 0.45 / 0.4", description: "Sun direction in degrees, depth toward the viewer, character contrast and faint lit atmosphere." },
      { name: "interactive / draggable / hoverLight / clickStorm", type: "boolean", defaultValue: "true", description: "Enable direct input, inertial drag, pointer-following sunlight and short click-seeded vortices independently." },
      { name: "momentum / paused", type: "number / boolean", defaultValue: "0.6 / false", description: "Drag inertia from 0 to 1 and explicit motion pause. Reduced motion and hidden/offscreen surfaces suspend animation." },
      { name: "children / label / appearance / style", type: "ReactNode / string / Appearance / CSSProperties", defaultValue: 'Not set / "Rotating planet made of ASCII characters" / "polished" / Not set', description: "Optional overlay content, canvas accessible name, corner treatment and root styling." },
    ],
    notes: [
      "An original Canvas 2D sphere and cloud-field renderer informed by the publicly accessible Glyph Orb preview at React Bits Pro. No paid code, shader, bitmap or reference text is included.",
      "The surface uses geometric sphere normals, trigonometric latitude bands and diffuse lighting to choose characters and colors. It needs no WebGL, external asset, font download or animation dependency.",
      "One visibility-aware loop draws at most 30 frames per second. Dragging, sunlight and up to four temporary storms use local refs, without per-frame React renders. Resize, reduced motion, hidden tabs and unmount are handled by the shared canvas lifecycle.",
      "The initial server render includes a simple ASCII still until Canvas 2D paints. Put readable text and normal controls in children when using the planet as a section background.",
    ],
  },
];
