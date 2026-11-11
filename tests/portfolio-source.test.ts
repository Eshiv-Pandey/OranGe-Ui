// @vitest-environment node
import { expect, it } from "vitest";
import { componentRegistryItem } from "../lib/component-registry";
import { collectComponentSource } from "../lib/source-bundle";
import { PORTFOLIO_COMPONENTS } from "../lib/portfolio-components";
import { strFromU8 } from "fflate";
for(const component of PORTFOLIO_COMPONENTS) it(`${component.name} installs with complete support files and portable assets`,async()=>{
  const bundle=await collectComponentSource(component,"polished");
  expect(Object.keys(bundle.files).some(path=>/favicon-red|footer-favicon|portfolio-favicon/.test(path))).toBe(false);
  expect(strFromU8(bundle.files["public/portfolio/truck-art.webp"])).toContain("WEBP");
  expect(bundle.dependencies).not.toContain("next");
  const item=await componentRegistryItem(component,"polished");
  expect(item.files.some(file=>file.target.endsWith("licenses/PORTFOLIO_ARTWORK.md"))).toBe(true);
  const sources=item.files.filter(file=>file.path.endsWith(".tsx")).map(file=>file.content).join("\n");
  expect(sources).not.toContain('"/portfolio/truck-art.webp"');
  if(component.slug!=="sticker-social-icons") expect(sources).toContain("data:image/webp;base64,");
  const css=item.files.filter(file=>file.path.endsWith(".css")).map(file=>file.content).join("\n");
  expect(css).not.toMatch(/url\(["']?\/fonts\//);
  expect(css).toContain("data:font/woff2;base64,");
}, 60000);
