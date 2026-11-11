import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { blocks, findBlock } from "../../../../lib/blocks";
import { BlockPreview } from "../../../../components/library/block-preview";
export const dynamicParams = false;
export function generateStaticParams() { return blocks.map(({ slug }) => ({ slug })); }
export const metadata: Metadata = { title: "Block preview | oRangeUi", robots: { index: false, follow: true } };
export default async function PreviewPage({ params }: { params: Promise<{ slug: string }> }) {
  const block = findBlock((await params).slug); if (!block) notFound();
  return <BlockPreview slug={block.slug} title={block.title} />;
}
