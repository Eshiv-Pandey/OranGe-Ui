export type ChainParticle = { x: number; y: number; px: number; py: number; radius: number; fixed: boolean };
export type ChainLink = { a: number; b: number; length: number };
export type KeychainWorld = { particles: ChainParticle[]; links: ChainLink[]; charmStart: number; width: number; height: number; grabbed: number | null };

/** Compact, deterministic Verlet world. Rendering and audio have no dependency on it. */
export function createKeychainWorld(width = 360, height = 420, count = 5, chainLength = 6): KeychainWorld {
  const particles: ChainParticle[] = [], links: ChainLink[] = [];
  const steps = Math.max(2, Math.min(12, Math.round(chainLength))), linkLength = Math.min(15, height * 0.22 / steps);
  for (let index = 0; index <= steps; index++) {
    const x = width / 2 + Math.sin(index) * 2, y = height * 0.2 + index * linkLength;
    particles.push({ x, y, px: x, py: y, radius: 4, fixed: index === 0 });
    if (index) links.push({ a: index - 1, b: index, length: linkLength });
  }
  const charmStart = particles.length, anchor = particles.at(-1)!;
  for (let index = 0; index < Math.min(12, Math.max(1, count)); index++) {
    const x = anchor.x + (index - (count - 1) / 2) * 31, y = anchor.y + 54 + (index % 3) * 17;
    particles.push({ x, y, px: x, py: y, radius: 23 + (index % 3) * 4, fixed: false });
    links.push({ a: charmStart - 1, b: charmStart + index, length: Math.hypot(x - anchor.x, y - anchor.y) });
  }
  return { particles, links, charmStart, width, height, grabbed: null };
}

export function stepKeychain(world: KeychainWorld, seconds: number, gravity = 850, damping = 0.96) {
  const delta = Math.min(1 / 30, Math.max(0, seconds)), friction = Math.pow(Math.min(0.999, Math.max(0.5, damping)), delta * 60);
  let impact = 0;
  for (const [index, particle] of world.particles.entries()) {
    if (particle.fixed || index === world.grabbed) continue;
    const x = particle.x, y = particle.y;
    particle.x += (x - particle.px) * friction;
    particle.y += (y - particle.py) * friction + gravity * delta * delta;
    particle.px = x; particle.py = y;
  }
  const weight = (index: number) => world.particles[index].fixed || index === world.grabbed ? 0 : 1;
  for (let iteration = 0; iteration < 8; iteration++) {
    for (const link of world.links) {
      const a = world.particles[link.a], b = world.particles[link.b], dx = b.x - a.x, dy = b.y - a.y, distance = Math.hypot(dx, dy) || 0.001;
      const wa = weight(link.a), wb = weight(link.b), total = wa + wb;
      if (!total) continue;
      const correction = (distance - link.length) / distance;
      a.x += dx * correction * wa / total; a.y += dy * correction * wa / total;
      b.x -= dx * correction * wb / total; b.y -= dy * correction * wb / total;
    }
    for (let i = world.charmStart; i < world.particles.length; i++) for (let j = i + 1; j < world.particles.length; j++) {
      const a = world.particles[i], b = world.particles[j], dx = b.x - a.x, dy = b.y - a.y, distance = Math.hypot(dx, dy) || 0.001;
      const minimum = a.radius + b.radius + 3;
      if (distance >= minimum) continue;
      if (iteration === 0) impact = Math.max(impact, Math.hypot((a.x - a.px) - (b.x - b.px), (a.y - a.py) - (b.y - b.py)) / Math.max(delta, 1 / 60));
      const wa = weight(i), wb = weight(j), total = wa + wb;
      if (!total) continue;
      const push = (minimum - distance) / distance;
      a.x -= dx * push * wa / total; a.y -= dy * push * wa / total;
      b.x += dx * push * wb / total; b.y += dy * push * wb / total;
    }
    for (const [index, particle] of world.particles.entries()) {
      if (!weight(index)) continue;
      particle.x = Math.max(particle.radius + 8, Math.min(world.width - particle.radius - 8, particle.x));
      particle.y = Math.max(particle.radius, Math.min(world.height - particle.radius - 22, particle.y));
    }
  }
  return impact;
}

export function grabKeychain(world: KeychainWorld, x: number, y: number) {
  let nearest = world.charmStart - 1, distance = Infinity;
  for (let index = 1; index < world.particles.length; index++) {
    const candidate = world.particles[index], next = Math.hypot(x - candidate.x, y - candidate.y);
    if (next < distance) { distance = next; nearest = index; }
  }
  world.grabbed = nearest;
  moveKeychain(world, x, y);
}
export function moveKeychain(world: KeychainWorld, x: number, y: number) {
  if (world.grabbed === null) return;
  const particle = world.particles[world.grabbed], previousX = particle.x, previousY = particle.y;
  particle.x = Math.max(10, Math.min(world.width - 10, x)); particle.y = Math.max(30, Math.min(world.height - 30, y));
  particle.px = previousX; particle.py = previousY;
}
export function releaseKeychain(world: KeychainWorld) { world.grabbed = null; }
