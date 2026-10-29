import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { components, findComponent } from "../../../lib/components";
import { ComponentDetail } from "../../../components/library/component-detail";
export const dynamicParams = false;
export function generateStaticParams() { return components.map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const component = findComponent((await params).slug);
  const socialTitle = `${component?.name ?? "Components"} | oRangeUi`;
  return {
    title: `${component?.name ?? "Component not found"} | oRangeUi`,
    description: component?.description,
    alternates: component ? { canonical: `/components/${component.slug}` } : undefined,
    openGraph: { type: "website", siteName: "oRangeUi", title: socialTitle, description: component?.description, images: ["/opengraph-image"] },
    twitter: { card: "summary_large_image", title: socialTitle, description: component?.description, images: ["/opengraph-image"] },
  };
}
export default async function ComponentPage({ params }: { params: Promise<{ slug: string }> }) {
  const component = findComponent((await params).slug); if (!component) notFound();
  const source = await readFile(path.join(process.cwd(), "components/ui", `${component.slug}.tsx`), "utf8");
  return <ComponentDetail component={component} source={source} />;
}
