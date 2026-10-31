import { describe, expect, it } from "vitest";
import { createKeychainWorld, stepKeychain, grabKeychain, moveKeychain, releaseKeychain } from "../components/ui/keychain-physics";

describe("keychain release dynamics", () => {
  it("integrates the same released swing at 30, 60 and 120 Hz", () => {
    const samples = [30, 60, 120].map((hz) => {
      const world = createKeychainWorld();
      for (let frame = 0; frame < 240; frame++) stepKeychain(world, 1 / 60);
      const charm = world.particles[world.charmStart];
      grabKeychain(world, charm.x, charm.y); moveKeychain(world, charm.x + 45, charm.y - 30); releaseKeychain(world);
      for (let frame = 0; frame < hz * 2; frame++) stepKeychain(world, 1 / hz);
      return world.particles.map(({ x, y }) => [x, y]);
    });
    expect(samples[0]).toEqual(samples[1]); expect(samples[1]).toEqual(samples[2]);
  });
  it("does not report audible collisions after the charms settle", () => {
    const world = createKeychainWorld();
    for (let frame = 0; frame < 900; frame++) stepKeychain(world, 1 / 60);
    expect(stepKeychain(world, 1 / 60)).toBeLessThan(55);
    expect(world.particles[0].x).toBe(180);
    expect(world.particles[0].y).toBe(105);
  });
  it("starts all five charms hanging below the chain junction", () => {
    const world = createKeychainWorld();
    for (let frame = 0; frame < 360; frame++) stepKeychain(world, 1 / 60, 850, .65);
    const junction = world.particles[world.charmStart - 1];
    for (const charm of world.particles.slice(world.charmStart)) expect(charm.y).toBeGreaterThan(junction.y + 15);
  });
});
