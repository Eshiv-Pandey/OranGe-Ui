"use client";

import { useMemo, useState } from "react";
import type { Appearance } from "../ui/appearance";
import { AgentMap, type AgentMapRoute, type AgentMapStop } from "../ui/agent-map";
import { CreativeWorkbench } from "../ui/creative-editor-slot";
import { useCreativeTheme } from "../ui/creative-surface";
import { ShaderCheck, ShaderColor, ShaderSelect } from "./shader-demo-controls";

const STOPS: AgentMapStop[] = [
  { id: "museum", name: "British Museum", latitude: 51.5194, longitude: -.127, description: "Great Russell Street", duration: "Start here", href: "https://www.openstreetmap.org/?mlat=51.5194&mlon=-0.127#map=17/51.5194/-0.127" },
  { id: "garden", name: "Russell Square", latitude: 51.5215, longitude: -.1268, description: "A quiet garden stop", duration: "5 min walk", href: "https://www.openstreetmap.org/?mlat=51.5215&mlon=-0.1268#map=17/51.5215/-0.1268" },
  { id: "library", name: "British Library", latitude: 51.5299, longitude: -.1272, description: "96 Euston Road", duration: "18 min walk", href: "https://www.openstreetmap.org/?mlat=51.5299&mlon=-0.1272#map=17/51.5299/-0.1272" },
];
const ROUTES: AgentMapRoute[] = [
  { id: "walk", label: "Walk via the square", mode: "walk", duration: "23 min", coordinates: [STOPS[0], { latitude: 51.5199, longitude: -.1261 }, { latitude: 51.5208, longitude: -.1255 }, STOPS[1], { latitude: 51.5229, longitude: -.127 }, { latitude: 51.5276, longitude: -.128 }, { latitude: 51.5295, longitude: -.128 }, STOPS[2]] },
  { id: "cycle", label: "Direct cycle", mode: "cycle", duration: "8 min", coordinates: [STOPS[0], { latitude: 51.5186, longitude: -.1284 }, { latitude: 51.5191, longitude: -.131 }, { latitude: 51.5253, longitude: -.135 }, { latitude: 51.5275, longitude: -.1285 }, STOPS[2]] },
];

export default function AgentMapDemo({ appearance, thumbnail = false }: { appearance: Appearance; thumbnail?: boolean }) {
  const theme = useCreativeTheme(), [stops, setStops] = useState(STOPS), [selected, setSelected] = useState(STOPS[0].id), [route, setRoute] = useState("walk"), [accent, setAccent] = useState("#dc5c28"), [cards, setCards] = useState(true), [tiles, setTiles] = useState(true);
  const routes = useMemo(() => ROUTES, []);
  const preview = <AgentMap stops={stops} routes={routes} value={selected} onValueChange={setSelected} route={route} onRouteChange={setRoute} accent={accent} appearance={appearance} showCards={!thumbnail && cards} showExpand={!thumbnail} onReorder={thumbnail ? undefined : setStops} tileUrl={tiles ? undefined : false} height={thumbnail ? 280 : 430} />;
  return <div className={`creative-surface ${thumbnail ? "reference-thumbnail" : "creative-demo"}`} data-theme={theme}>
    {thumbnail ? preview : <CreativeWorkbench preview={preview}>
      <ShaderSelect label="Route" value={route} options={["walk", "cycle"]} onChange={setRoute} />
      <ShaderColor label="Route color" value={accent} onChange={setAccent} />
      <ShaderCheck label="Show place cards" value={cards} onChange={setCards} />
      <ShaderCheck label="Show street map" value={tiles} onChange={setTiles} />
      <button type="button" className="button button-secondary" onClick={() => { setStops(STOPS); setSelected(STOPS[0].id); setRoute("walk"); setAccent("#dc5c28"); setCards(true); setTiles(true); }}>Reset map</button>
      <p className="creative-help">Drag the map or use its arrow keys to explore. Select a place, switch routes, or expand the map. Stops and estimated travel times are a demonstration, not navigation directions.</p>
    </CreativeWorkbench>}
  </div>;
}
