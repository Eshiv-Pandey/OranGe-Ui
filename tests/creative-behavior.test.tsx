import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AudioPlayerEngine, audioTime, type AudioTrack } from "../components/ui/use-audio-player";
import { acquireCreativeAudio } from "../components/ui/creative-audio";
import { createKeychainWorld, stepKeychain, grabKeychain, moveKeychain, releaseKeychain } from "../components/ui/keychain-physics";
import { transliterateToHindi } from "../components/ui/desi-transliteration";
import { useCreativeTheme, readCreativeTheme } from "../components/ui/creative-surface";
import { createSeasonFoliage, TREE_PALETTES } from "../components/ui/season-tree-art";
import { SeasonTree } from "../components/ui/season-tree";
import { RetroPlayer } from "../components/ui/retro-player";
import { RetroCamera } from "../components/ui/retro-camera";
import { SwingKeychain } from "../components/ui/swing-keychain";
import { CustomStamp } from "../components/ui/custom-stamp";
import { TiltStamp3D } from "../components/ui/tilt-stamp-3d";
import { IslandPlayer } from "../components/ui/island-player";
import { GlassPlayer } from "../components/ui/glass-player";
import { NeonPillPlayer } from "../components/ui/neon-pill-player";
import { AnimeFire } from "../components/ui/anime-fire";
import { GrainGradient } from "../components/ui/grain-gradient";
import { HindiText } from "../components/ui/hindi-text";
import { HinglishText } from "../components/ui/hinglish-text";
import { FrostedGlass } from "../components/ui/frosted-glass";

const playlist: AudioTrack[] = [{ title: "First", artist: "Original", src: "/first.wav" }, { title: "Second", artist: "Original", src: "/second.wav" }];
let play: ReturnType<typeof vi.spyOn>, pause: ReturnType<typeof vi.spyOn>, load: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  document.documentElement.className = ""; delete document.documentElement.dataset.theme;
  vi.stubGlobal("matchMedia", vi.fn((query: string) => {
    const events = new EventTarget();
    return { matches: query.includes("reduced-motion"), media: query, onchange: null, addListener() {}, removeListener() {}, addEventListener: events.addEventListener.bind(events), removeEventListener: events.removeEventListener.bind(events), dispatchEvent: events.dispatchEvent.bind(events) };
  }));
  vi.stubGlobal("IntersectionObserver", class {
    constructor(private callback: IntersectionObserverCallback) {}
    observe(target: Element) { this.callback([{ isIntersecting: true, target } as IntersectionObserverEntry], this as unknown as IntersectionObserver); }
    disconnect() {} unobserve() {} takeRecords() { return []; }
  });
  vi.spyOn(HTMLMediaElement.prototype, "duration", "get").mockReturnValue(24);
  play = vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(function (this: HTMLMediaElement) { this.dispatchEvent(new Event("playing")); return Promise.resolve(); });
  pause = vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(function (this: HTMLMediaElement) { this.dispatchEvent(new Event("pause")); });
  load = vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(function (this: HTMLMediaElement) {
    this.currentTime = 0;
    if (this.getAttribute("src")) this.dispatchEvent(new Event("loadedmetadata"));
  });
});
afterEach(() => { vi.unstubAllGlobals(); document.documentElement.className = ""; delete document.documentElement.dataset.theme; });

describe("shared real player lifecycle", () => {
  it("never autoplays during subscription, but accepts an explicit gesture", async () => {
    const engine = new AudioPlayerEngine({ tracks: playlist, autoPlay: true, analyse: false }), unsubscribe = engine.subscribe(() => {});
    expect(play).not.toHaveBeenCalled(); expect(engine.getSnapshot().playing).toBe(false);
    engine.allowAutoPlay(); await Promise.resolve();
    expect(play).toHaveBeenCalledTimes(1); expect(engine.getSnapshot().playing).toBe(true);
    unsubscribe(); expect(pause).toHaveBeenCalled(); expect(load).toHaveBeenCalled();
  });
  it("scrubs, clamps seek, restarts previous, and advances with continuous playback", async () => {
    const change = vi.fn(), engine = new AudioPlayerEngine({ tracks: playlist, onTrackChange: change, analyse: false }), unsubscribe = engine.subscribe(() => {});
    await engine.play(); engine.seek(7); expect(engine.getSnapshot().currentTime).toBe(7);
    engine.previous(); expect(engine.getSnapshot().currentTime).toBe(0);
    engine.seek(100); expect(engine.getSnapshot().currentTime).toBe(24);
    engine.next(); await Promise.resolve(); expect(engine.getSnapshot()).toMatchObject({ index: 1, currentTime: 0, playing: true });
    expect(change).toHaveBeenLastCalledWith(1);
    engine.setVolume(5); engine.setMuted(true); expect(engine.getSnapshot()).toMatchObject({ volume: 1, muted: true });
    unsubscribe();
  });
  it("respects controlled index changes and resumes only after the parent updates", async () => {
    const change = vi.fn(), engine = new AudioPlayerEngine({ tracks: playlist, index: 0, onTrackChange: change, analyse: false }), unsubscribe = engine.subscribe(() => {});
    await engine.play(); engine.next(); expect(engine.getSnapshot().index).toBe(0); expect(change).toHaveBeenCalledWith(1);
    engine.configure({ tracks: playlist, index: 1, onTrackChange: change, analyse: false }); await Promise.resolve();
    expect(engine.getSnapshot()).toMatchObject({ index: 1, playing: true });
    unsubscribe();
  });
  it("clears media and listeners after a Strict Mode mount and playback", async () => {
    const create = vi.spyOn(document, "createElement");
    const view = render(<StrictMode><IslandPlayer tracks={playlist} /></StrictMode>);
    expect(play).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: /^Play$/ }));
    await waitFor(() => expect(screen.getByRole("button", { name: /^Pause$/ })).toBeVisible());
    view.unmount();
    const media = create.mock.results.map((result) => result.value).filter((value): value is HTMLAudioElement => value instanceof HTMLAudioElement);
    expect(media.length).toBeGreaterThan(0); expect(media.every((value) => value.getAttribute("src") === null)).toBe(true);
    expect(audioTime(195)).toBe("3:15"); expect(audioTime(Number.NaN)).toBe("0:00");
  });
  it("uses one lazy context and closes it after the last owner releases", () => {
    const close = vi.fn(() => Promise.resolve()), resume = vi.fn(() => Promise.resolve());
    const Constructor = vi.fn(function () { return { state: "running", close, resume }; });
    vi.stubGlobal("AudioContext", Constructor);
    expect(Constructor).not.toHaveBeenCalled();
    const first = acquireCreativeAudio(), second = acquireCreativeAudio();
    expect(Constructor).toHaveBeenCalledTimes(1); expect(first?.context).toBe(second?.context);
    first?.release(); expect(close).not.toHaveBeenCalled(); second?.release(); expect(close).toHaveBeenCalledTimes(1);
    second?.release(); expect(close).toHaveBeenCalledTimes(1);
  });
});

it("keeps collision-aware keychain motion finite and bounded through dragging and release", () => {
  const world = createKeychainWorld(360, 420, 5, 6), anchor = { ...world.particles[0] };
  for (let frame = 0; frame < 240; frame++) stepKeychain(world, 1 / 60);
  grabKeychain(world, 235, 235); moveKeychain(world, 320, 130); releaseKeychain(world);
  for (let frame = 0; frame < 300; frame++) stepKeychain(world, 1 / 60);
  expect(world.particles[0]).toEqual(anchor);
  for (const particle of world.particles) { expect(Number.isFinite(particle.x + particle.y)).toBe(true); expect(particle.x).toBeGreaterThan(0); expect(particle.x).toBeLessThan(360); expect(particle.y).toBeLessThan(420); }
  for (let i = world.charmStart; i < world.particles.length; i++) for (let j = i + 1; j < world.particles.length; j++) {
    const a = world.particles[i], b = world.particles[j]; expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThanOrEqual(a.radius + b.radius - 1);
  }
});
it("changes whole seasonal foliage and retains independent falling-leaf palettes", () => {
  expect(createSeasonFoliage("green").length).toBeGreaterThan(createSeasonFoliage("pink").length);
  expect(createSeasonFoliage("winter").length).toBeLessThan(createSeasonFoliage("red").length / 4);
  expect(TREE_PALETTES.pink.leaves).not.toEqual(TREE_PALETTES.pink.fallen); expect(TREE_PALETTES.yellow.sky).not.toBe(TREE_PALETTES.green.sky);
});
it("transliterates locally without damaging pasted scripts, punctuation or line breaks", () => {
  expect(transliterateToHindi("namaste! भारत\nMera dost, 2026.")).toBe("नमस्ते! भारत\nमेरा दोस्त, 2026.");
  expect(transliterateToHindi("kaam")).toBe("काम");
  expect(transliterateToHindi("हिंदी / दुनिया ❤️")).toBe("हिंदी / दुनिया ❤️");
});
it("tracks live class priority, data-theme and explicit theme overrides", async () => {
  function Probe() { return <><span data-testid="auto">{useCreativeTheme()}</span><span data-testid="explicit">{useCreativeTheme("light")}</span></>; }
  render(<Probe />);
  document.documentElement.dataset.theme = "dark"; await waitFor(() => expect(screen.getByTestId("auto")).toHaveTextContent("dark"));
  document.documentElement.className = "light"; await waitFor(() => expect(screen.getByTestId("auto")).toHaveTextContent("light"));
  document.documentElement.className = "light dark"; expect(readCreativeTheme()).toBe("dark");
  expect(screen.getByTestId("explicit")).toHaveTextContent("light");
});
it("renders every new public component safely on the server with caller classes and no audio", () => {
  const props = { className: "consumer-custom", theme: "dark" as const };
  const elements = [
    <SeasonTree key="season-tree" {...props} />, <RetroPlayer key="retro-player" {...props} tracks={playlist} />,
    <RetroCamera key="retro-camera" {...props} />, <SwingKeychain key="swing-keychain" {...props} />,
    <CustomStamp key="custom-stamp" {...props} />, <TiltStamp3D key="tilt-stamp" {...props} />,
    <IslandPlayer key="island-player" {...props} tracks={playlist} />, <GlassPlayer key="glass-player" {...props} tracks={playlist} />,
    <NeonPillPlayer key="neon-pill-player" {...props} tracks={playlist} />, <AnimeFire key="anime-fire" {...props} />,
    <GrainGradient key="grain-gradient" {...props} />, <HindiText key="hindi-text" {...props} />,
    <HinglishText key="hinglish-text" {...props} />, <FrostedGlass key="frosted-glass" {...props} />,
  ];
  for (const element of elements) { const first = renderToString(element); expect(first).toContain("consumer-custom"); expect(first).toContain('data-theme="dark"'); expect(first).toBe(renderToString(element)); }
  expect(play).not.toHaveBeenCalled();
});
