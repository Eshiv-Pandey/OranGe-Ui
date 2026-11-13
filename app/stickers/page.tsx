import type { Metadata } from "next";
import { StickerGallery } from "../../components/library/sticker-gallery";
export const metadata: Metadata = { title: "70 original stickers | oRangeUi", description: "Seventy original stickers in Sharp and Playful finishes. Edit click animations, arrange a playground, download code and artwork, or install the React npm package.", alternates: { canonical: "/stickers" } };
export default function StickersPage() { return <StickerGallery />; }
