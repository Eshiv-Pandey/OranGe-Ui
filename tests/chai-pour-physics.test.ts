import { describe, expect, it } from 'vitest';
import { advanceChaiFlow, chaiFlowSpans, chaiJet, createChaiFlow } from '../components/ui/chai-pour-physics';

describe('chai liquid travel and retained volume', () => {
  it('delays the interior stream and volume until the leading edge reaches each destination', () => {
    const flow = createChaiFlow();
    advanceChaiFlow(flow, 0, true);
    advanceChaiFlow(flow, 200, true);
    expect(chaiFlowSpans(flow)[0].to).toBeCloseTo(200 / 420);
    expect(chaiFlowSpans(flow, true)).toEqual([]); expect(flow.fill).toBe(0);
    advanceChaiFlow(flow, 450, true);
    expect(chaiFlowSpans(flow, true)[0].to).toBeCloseTo(30 / 140); expect(flow.fill).toBe(0);
    advanceChaiFlow(flow, 600, true); expect(flow.fill).toBeGreaterThan(0);
  });

  it('lets released liquid finish falling after cutoff, then holds the full glass', () => {
    const flow = createChaiFlow(); advanceChaiFlow(flow, 0, true);
    advanceChaiFlow(flow, 1000, false); const cutoffVolume = flow.fill;
    advanceChaiFlow(flow, 1100, false);
    expect(chaiFlowSpans(flow)[0].from).toBeGreaterThan(0);
    expect(chaiFlowSpans(flow, true)[0].from).toBe(0);
    advanceChaiFlow(flow, 1560, false);
    expect(chaiFlowSpans(flow)).toEqual([]); expect(chaiFlowSpans(flow, true)).toEqual([]);
    expect(flow.fill).toBeCloseTo(1000 * .85 / 4400); expect(flow.fill).toBeGreaterThan(cutoffVolume);
    const volume = flow.fill; advanceChaiFlow(flow, 15000, false); expect(flow.fill).toBe(volume);
  });

  it('integrates equal arriving volume at different frame rates without overfilling', () => {
    const volumes = [30, 60, 120].map(hz => {
      const flow = createChaiFlow(); advanceChaiFlow(flow, 0, true);
      for (let frame = 1; frame <= hz * 10; frame++) advanceChaiFlow(flow, frame * 1000 / hz, frame < hz * 6);
      return flow.fill;
    });
    expect(volumes).toEqual([.85, .85, .85]);
  });

  it('uses a descending parabola that meets the rim with increasing downward velocity', () => {
    const jet = chaiJet({ x: 380, y: 215 }, { x: 478, y: 330 }, 35);
    const numbers = jet.path.match(/-?\d+(?:\.\d+)?/g)!.map(Number);
    expect(numbers.slice(-2)).toEqual([478, 330]);
    expect(numbers[3]).toBeGreaterThanOrEqual(215);
    expect(330 - numbers[3]).toBeGreaterThan(numbers[3] - 215);
    expect(jet.entrySlope).toBeLessThan(.5);
  });
});
