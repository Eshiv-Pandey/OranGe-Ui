import type { Metadata } from "next";
import { BlockCatalogue } from "../../components/library/block-catalogue";
export const metadata: Metadata = { title: "Original page blocks | oRangeUi", description: "Original polished authentication, marketing and workspace sections. Live previews, typed props, complete source and registry installation.", alternates: { canonical: "/blocks" } };
export default function BlocksPage() { return <BlockCatalogue />; }
