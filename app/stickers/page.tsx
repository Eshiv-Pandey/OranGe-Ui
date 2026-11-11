import type { Metadata } from "next";
import { StickerGallery } from "../../components/library/sticker-gallery";
export const metadata: Metadata = { title: "50 original stickers | oRangeUi", description: "Fifty colorful original vinyl stickers. Browse collections, try the peel, copy React components, and download self-contained SVG or PNG artwork.", alternates: { canonical: "/stickers" } };
export default function StickersPage() { return <StickerGallery />; }
