// @vitest-environment node
import { strFromU8 } from "fflate";
import { expect, it } from "vitest";
import { findComponent } from "../lib/components";
import { collectComponentSource } from "../lib/source-bundle";
import { componentRegistryItem } from "../lib/component-registry";

it("ships the graph with a working example, transitive styles, dependencies and MIT attribution", async () => {
  const component = findComponent("github-graph")!;
  const bundle = await collectComponentSource(component, "polished");
  for (const path of ["components/ui/github-graph.tsx", "components/ui/github-graph-data.ts", "components/ui/creative-surface.ts", "styles/github-graph.css", "styles/library-base.css", "Example.tsx", "README.md", "THIRD_PARTY_NOTICES.md"]) expect(bundle.files[path]).toBeDefined();
  expect(bundle.dependencies).toContain("framer-motion");
  expect(strFromU8(bundle.files["Example.tsx"])).toContain("GITHUB_GRAPH_SAMPLE");
  expect(strFromU8(bundle.files["README.md"])).toContain("loadContributions");
  const notice = strFromU8(bundle.files["THIRD_PARTY_NOTICES.md"]);
  expect(notice).toContain("Copyright (c) 2026 Léo Wicki"); expect(notice).toContain("Permission is hereby granted");
  const registry = await componentRegistryItem(component, "polished");
  expect(registry.dependencies).toContain("framer-motion");
  expect(registry.files.some(file => file.path.endsWith("github-graph.css"))).toBe(true);
  expect(registry.files.some(file => file.path.endsWith("THIRD_PARTY_NOTICES.md") && file.content.includes("2026 Léo Wicki"))).toBe(true);
  for (const file of registry.files) expect(file.content).not.toMatch(/from ["']@\//);
});
