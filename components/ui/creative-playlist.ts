import type { AudioTrack } from "./use-audio-player";
import { SAMPLE_COVERS } from "./creative-art";

/** Original synthesized recordings, dedicated to CC0. See public/audio/orangeui/LICENSE.txt. */
export const CREATIVE_PLAYLIST: readonly AudioTrack[] = [
  { title: "Sunroom", artist: "Orange sessions", src: "/audio/orangeui/sunroom.wav", cover: SAMPLE_COVERS[0] },
  { title: "Blue hour", artist: "Orange sessions", src: "/audio/orangeui/blue-hour.wav", cover: SAMPLE_COVERS[1] },
  { title: "Pocket garden", artist: "Orange sessions", src: "/audio/orangeui/pocket-garden.wav", cover: SAMPLE_COVERS[2] },
];
