import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { blocks, findBlock } from "../../../lib/blocks";
import { BlockDetail } from "../../../components/library/block-detail";
export const dynamicParams = false;
export function generateStaticParams() { return blocks.map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const block = findBlock((await params).slug);
  return { title: `${block?.title ?? "Block not found"} | oRangeUi`, description: block?.description, alternates: block ? { canonical: `/blocks/${block.slug}` } : undefined };
}
export default async function BlockPage({ params }: { params: Promise<{ slug: string }> }) {
  const block = findBlock((await params).slug); if (!block) notFound();
  return <BlockDetail key={block.slug} block={block} />;
}
