import { notFound } from "next/navigation";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { components, findComponent } from "../../../lib/components";
import { ComponentDetail } from "../../../components/library/component-detail";
export const dynamicParams = false;
export function generateStaticParams() { return components.map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) { const component = findComponent((await params).slug); return { title: `${component?.name ?? "Component not found"} | oRangeUi`, description: component?.description }; }
export default async function ComponentPage({ params }: { params: Promise<{ slug: string }> }) {
  const component = findComponent((await params).slug); if (!component) notFound();
  const source = await readFile(path.join(process.cwd(), "components/ui", `${component.slug}.tsx`), "utf8");
  return <ComponentDetail component={component} source={source} />;
}
