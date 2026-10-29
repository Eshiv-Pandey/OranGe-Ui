/** Explicit canonical origin, with the hosting provider's production URL as fallback. */
export function siteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  const hosted = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const candidate = configured || (hosted ? `https://${hosted}` : "http://localhost:3000");
  const url = new URL(candidate);
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("NEXT_PUBLIC_SITE_URL must use http or https.");
  return new URL(url.origin);
}
