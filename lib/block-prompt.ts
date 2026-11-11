import type { BlockDefinition } from "./blocks";

export function blockAgentPrompt(block: BlockDefinition, origin: string, theme: "light" | "dark") {
  return `Add the ${block.name} block from oRangeUi to my project.

${block.description}

Install: npx shadcn@latest add "${origin}/r/block-${block.slug}.json"
Documentation and props: ${origin}/blocks/${block.slug}
Live preview: ${origin}/preview/blocks/${block.slug}
Complete source: ${origin}/api/blocks/${block.slug}?format=source

Use the ${theme} palette as a starting point and adapt it to my site's existing design. Replace the sample brand, copy, contact details and navigation with my project's content. Keep the block's composition and responsive behavior at phone, tablet and desktop sizes. Wire interactive callbacks to my application's services; ask for missing service details. In Next.js, keep callback props inside a client component. Preserve bundled asset and font license notices. Verify keyboard access, contrast, reduced motion and narrow layouts before finishing.`;
}
