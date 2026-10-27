import { parseAppearance } from "../../../../components/ui/appearance";
import { findComponent } from "../../../../lib/components";
import { componentZip } from "../../../../lib/source-bundle";
export const runtime = "nodejs";
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const component = findComponent((await params).slug);
  if (!component) return new Response("Component not found", { status: 404 });
  const appearance = parseAppearance(new URL(request.url).searchParams.get("style"));
  const zip = await componentZip(component, appearance);
  return new Response(new Uint8Array(zip), { headers: { "Content-Type": "application/zip", "Content-Disposition": `attachment; filename="orangeui-${component.slug}.zip"`, "Cache-Control": "public, max-age=3600", "X-Content-Type-Options": "nosniff" } });
}
