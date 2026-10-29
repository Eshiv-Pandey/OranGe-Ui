import type { MetadataRoute } from "next";
import { components } from "../lib/components";
import { siteUrl } from "../lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["/", "/components", "/docs", ...components.map((component) => `/components/${component.slug}`)].map((path) => ({ url: new URL(path, siteUrl()).href }));
}
