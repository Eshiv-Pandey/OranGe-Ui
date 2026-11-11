import type { MetadataRoute } from "next";
import { components } from "../lib/components";
import { siteUrl } from "../lib/site-url";
import { blocks } from "../lib/blocks";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["/", "/components", "/blocks", "/stickers", "/docs", "/portfolio", ...components.map((component) => `/components/${component.slug}`), ...blocks.map(block => `/blocks/${block.slug}`)].map((path) => ({ url: new URL(path, siteUrl()).href }));
}
