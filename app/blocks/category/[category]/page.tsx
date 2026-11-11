import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { blockCategories, blockCategoryHref, blockCategorySlug, blocks, findBlockCategory } from "../../../../lib/blocks";
import { BlockCollection } from "../../../../components/library/block-collection";

type CategoryPageProps = { params: Promise<{ category: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return blockCategories.filter(category => blocks.some(block => block.category === category)).map(category => ({ category: blockCategorySlug(category) }));
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const category = findBlockCategory((await params).category);
  if (!category) return { title: "Block category not found | oRangeUi" };
  const count = blocks.filter(block => block.category === category).length;
  return {
    title: `${category} blocks | oRangeUi`,
    description: `Explore ${count} ${category.toLowerCase()} ${count === 1 ? "block" : "blocks"} with live previews, responsive widths, light and dark palettes, and complete source.`,
    alternates: { canonical: blockCategoryHref(category) },
    openGraph: { title: `${category} blocks | oRangeUi`, description: `Explore ${count} original ${category.toLowerCase()} examples with live previews and complete source.`, url: blockCategoryHref(category) },
    twitter: { title: `${category} blocks | oRangeUi`, description: `${count} original examples with live previews and complete source.` },
  };
}

export default async function BlockCategoryPage({ params }: CategoryPageProps) {
  const category = findBlockCategory((await params).category);
  if (!category) notFound();
  const entries = blocks.filter(block => block.category === category);
  if (!entries.length) notFound();
  return <BlockCollection key={category} category={category} entries={entries} />;
}
