import { isAppearance } from "../../../components/ui/appearance";
import { findComponent } from "../../../lib/components";
import { componentRegistryItem } from "../../../lib/component-registry";

export const runtime = "nodejs";

/** Public catalogue names select trusted entries; URL values never become file paths. */
export async function GET(request: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*(?:\.json)?$/.test(name)) return Response.json({ error: "Component not found" }, { status: 404 });
  const component = findComponent(name.replace(/\.json$/, ""));
  if (!component) return Response.json({ error: "Component not found" }, { status: 404 });
  const style = new URL(request.url).searchParams.get("style") ?? "polished";
  if (!isAppearance(style)) return Response.json({ error: "Unknown appearance" }, { status: 400 });
  try {
    const item = await componentRegistryItem(component, style);
    return Response.json(item, { headers: { "Cache-Control": "public, max-age=3600", "X-Content-Type-Options": "nosniff", "Access-Control-Allow-Origin": "*" } });
  } catch {
    return Response.json({ error: "Registry item unavailable" }, { status: 500, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
  }
}
