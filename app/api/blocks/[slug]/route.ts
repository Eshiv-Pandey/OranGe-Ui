import { findBlock } from "../../../../lib/blocks";
import { blockSource, blockZip } from "../../../../lib/block-source";
export const runtime = "nodejs";
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const block = findBlock((await params).slug);
  if (!block) return new Response("Block not found", { status: 404 });
  const headers = { "Cache-Control": "public, max-age=3600", "X-Content-Type-Options": "nosniff" };
  try {
    const format = new URL(request.url).searchParams.get("format");
    if (format && format !== "source") return Response.json({ error: "Unknown source format" }, { status: 400 });
    if (format === "source") {
      const bundle = await blockSource(block);
      const files = Object.fromEntries(Object.entries(bundle.files).filter(([name]) => /\.(?:tsx?|css|md|txt)$/.test(name) || name === "LICENSE").map(([name, bytes]) => [name, Buffer.from(bytes).toString("utf8")]));
      return Response.json({ files }, { headers });
    }
    return new Response(new Uint8Array(await blockZip(block)), { headers: { ...headers, "Content-Type": "application/zip", "Content-Disposition": `attachment; filename="orangeui-block-${block.slug}.zip"` } });
  } catch { return Response.json({ error: "Source unavailable" }, { status: 500, headers: { "Cache-Control": "no-store" } }); }
}
