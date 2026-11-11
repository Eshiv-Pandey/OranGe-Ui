const clamp = (value: number) => Math.max(0, Math.min(1, value));
const EXTERIOR_TRAVEL = 420, INTERIOR_TRAVEL = 140;
const ARRIVAL = EXTERIOR_TRAVEL + INTERIOR_TRAVEL;
type Release = { start: number; stop: number | null };
export type ChaiFlow = { releases: Release[]; time: number; fill: number; releasing: boolean };
export type FlowSpan = { from: number; to: number };

export function createChaiFlow(): ChaiFlow { return { releases: [], time: 0, fill: 0, releasing: false }; }

/** Volume comes from liquid reaching the surface, including liquid still falling after cutoff. */
export function advanceChaiFlow(flow: ChaiFlow, time: number, release: boolean) {
  release = release && flow.fill < .85;
  if (release && !flow.releasing) flow.releases.push({ start: time, stop: null });
  if (!release && flow.releasing) flow.releases[flow.releases.length - 1].stop = time;
  flow.releasing = release;
  for (const pulse of flow.releases) {
    const arrived = Math.max(0, Math.min(time, (pulse.stop ?? time) + ARRIVAL) - Math.max(flow.time, pulse.start + ARRIVAL));
    flow.fill = Math.min(.85, flow.fill + arrived * .85 / 4400);
  }
  flow.time = time;
  flow.releases = flow.releases.filter(pulse => pulse.stop === null || time < pulse.stop + ARRIVAL + 50);
}

/** Leading and trailing edges propagate from the spout instead of appearing at the destination. */
export function chaiFlowSpans(flow: ChaiFlow, interior = false): FlowSpan[] {
  const travel = interior ? INTERIOR_TRAVEL : EXTERIOR_TRAVEL, delay = interior ? EXTERIOR_TRAVEL : 0;
  return flow.releases.map(pulse => ({
    from: pulse.stop === null ? 0 : clamp((flow.time - pulse.stop - delay) / travel),
    to: clamp((flow.time - pulse.start - delay) / travel),
  })).filter(span => span.to - span.from > .001).sort((a, b) => a.from - b.from);
}

export function chaiFlowDashes(spans: FlowSpan[]) {
  const dashes: number[] = [0]; let cursor = 0;
  for (const span of spans) { dashes.push(Math.max(0, span.from - cursor), span.to - span.from); cursor = span.to; }
  return [...dashes, 2].join(' ');
}

/** A quadratic jet has constant horizontal velocity and downward gravitational acceleration. */
export function chaiJet(start: { x: number; y: number }, end: { x: number; y: number }, angle: number) {
  const dx = end.x - start.x, dy = Math.max(1, end.y - start.y);
  const slope = Math.min(Math.tan(Math.max(0, angle - 24) * Math.PI / 180), dy / Math.max(1, dx));
  const control = { x: start.x + dx / 2, y: start.y + slope * dx / 2 };
  return { path: `M${start.x} ${start.y}Q${control.x} ${control.y} ${end.x} ${end.y}`, entrySlope: dx / Math.max(1, 2 * (end.y - control.y)) };
}
