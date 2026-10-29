import type { Metadata } from "next";
import { components } from "../../lib/components";
import { Catalogue } from "../../components/library/catalogue";
const title = "Components | oRangeUi";
const description = `Explore ${components.length} React components in five appearances, with original generated avatars.`;
export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/components" },
  openGraph: { type: "website", siteName: "oRangeUi", title, description, images: ["/opengraph-image"] },
  twitter: { card: "summary_large_image", title, description, images: ["/opengraph-image"] },
};
export default function ComponentsPage() { return <Catalogue />; }
