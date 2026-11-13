import type { ComponentDefinition } from "./components";
export const GITHUB_GRAPH_COMPONENT: ComponentDefinition = {
  slug: "github-graph", name: "GitHubGraph", category: "Portfolio", customizerPreview: true,
  description: "A contribution calendar with responsive cells, nearby hover response, tooltips and keyboard exploration.",
  file: "components/ui/github-graph.tsx",
  usage: '<GitHubGraph account="sample-dev" data={GITHUB_GRAPH_SAMPLE} months={6} autoFit />',
  usageImports: ['import { GITHUB_GRAPH_SAMPLE } from "./components/ui/github-graph-data";'],
  keyboard: "Tab enters the graph once. Arrow keys move between days and weeks; Home and End move across a weekday row. Ctrl+Home and Ctrl+End jump to the first and last day. Enter or Space calls onDayClick. Escape closes the tooltip. Touch and pointer hover reveal contribution counts.",
  props: [
    { name: "account", type: "string", defaultValue: "octocat", description: "Public GitHub username, optionally prefixed with @. Invalid handles show an error without requesting data." },
    { name: "data / loadContributions", type: "readonly GitHubContribution[] / GitHubContributionLoader", defaultValue: "not set / public contribution service", description: "Preloaded date, count and optional level records bypass networking. A custom async loader receives a normalized account and AbortSignal." },
    { name: "months", type: "number", defaultValue: "6", description: "One to twelve recent months, ending on the latest date in the supplied data. Missing dates become zero; outside edge dates stay blank." },
    { name: "variant / colors", type: "github | graphite | ocean | violet / readonly [string, string, string, string, string]", defaultValue: "github / not set", description: "The four source palettes, or five custom intensity colors ordered from empty to busiest." },
    { name: "cellSize / cellGap / cellRadius", type: "number", defaultValue: "18 / 4 / 3", description: "Pixel dimensions. Size is bounded to 8..40, gap to 0..12 and radius to half the rendered cell size." },
    { name: "autoFit", type: "boolean", defaultValue: "false", description: "Shrink cells to fit the host width, preserving seven weekday rows. Cells stay at least 10px; narrower hosts scroll horizontally inside the graph." },
    { name: "animation / animationSpeed", type: "none | wave | scan | cascade / number", defaultValue: "wave / 1.75", description: "Entrance and ambient motion speed, bounded to 0.1..4." },
    { name: "ambientEffect / ambientIntensity / paused", type: "none | tide | drift | twinkle / number / boolean", defaultValue: "twinkle / 1.1 / false", description: "Optional persistent cell motion. Intensity is 0..2; motion pauses offscreen and while the tab is hidden. Reduced motion renders a settled grid." },
    { name: "showAccount / showLegend / showTotal", type: "boolean", defaultValue: "true / false / false", description: "Independent account, intensity legend and contribution-total visibility." },
    { name: "onDayClick", type: "(day: GitHubContributionCell) => void", defaultValue: "not set", description: "Receives the activated UTC day, count, level and range padding state by pointer, touch or keyboard." },
    { name: "locale / theme / appearance / className", type: "string / CreativeTheme / Appearance / string", defaultValue: "en / auto / polished / not set", description: "Date formatting, explicit or inherited theme, library appearance and additional root class." },
  ],
  notes: [
    "Adapted from Léo Wicki's MIT-licensed Unlumen UI GitHub graph. The original palettes and animation timing inform the implementation. Keep THIRD_PARTY_NOTICES.md when redistributing the source.",
    "The demo starts with clearly labeled deterministic sample data and works without a network or GitHub token. Select Public GitHub profile to load actual public activity. The public contribution service is github-contributions-api.jogruber.de; an unavailable service shows a retry state.",
    "For application-owned fetching, supply data or a loadContributions callback backed by your own route. Keep authenticated GitHub credentials in that server route. The component aborts stale requests and retains a successful result while moving offscreen.",
    "The calendar is bounded to twelve months. It retains seven weekday rows on every viewport, uses one roving tab stop, and keeps tooltips within the viewport. CSS handles decorative cell animation without a separate JavaScript animation loop per cell.",
  ],
};
