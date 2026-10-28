import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdir, writeFile } from "node:fs/promises";

const baseURL = process.env.BASE_URL || "http://127.0.0.1:3107";
const output = "out/library";
const widths = [1440, 768, 390, 360];
const appearances = ["polished", "pixel", "neobrutalism", "retro-os", "terminal"];
const themes = ["light", "dark"];
const expectedComponents = 34;
const expectedScenarios = widths.length * appearances.length * themes.length;
const observations = [];
await mkdir(output, { recursive: true });
const browser = await chromium.launch();

try {
  for (const width of widths) {
    for (const appearance of appearances) {
      for (const theme of themes) {
        const context = await browser.newContext({ viewport: { width, height: 1100 }, colorScheme: theme, reducedMotion: "reduce" });
        await context.addInitScript((palette) => localStorage.setItem("orangeui-palette", palette), theme);
        const page = await context.newPage();
        const errors = [];
        const failedRequests = [];
        const cancelledPrefetches = [];
        page.on("pageerror", (error) => errors.push(error.message));
        page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
        page.on("requestfailed", (request) => {
          const failure = { url: request.url(), error: request.failure()?.errorText };
          // Next may cancel speculative route prefetches as links leave the viewport.
          // Real navigations, assets, and other failures remain release blockers.
          if (failure.error === "net::ERR_ABORTED" && request.headers()["next-router-prefetch"] === "1") cancelledPrefetches.push(failure);
          else failedRequests.push(failure);
        });
        page.on("response", (response) => { if (response.status() >= 400) failedRequests.push({ url: response.url(), status: response.status() }); });
        const observation = { width, appearance, theme, errors, failedRequests, cancelledPrefetches };
        observations.push(observation);
        try {
          const response = await page.goto(new URL(`/components?style=${appearance}`, baseURL).href);
          observation.status = response?.status();
          await page.locator(".component-tile").last().waitFor();
          await page.evaluate(() => document.fonts.ready);
          observation.fonts = await page.evaluate(async () => Promise.all([
            "body", "h1", ".component-tile h2", ".tile-button .pixel-button__content", ".tile-gamer-boy .console-title",
          ].map(async (selector) => {
            const element = document.querySelector(selector);
            if (!element) return { selector, loaded: false };
            const style = getComputedStyle(element);
            const family = style.fontFamily.split(",")[0].trim().replace(/^["']|["']$/g, "");
            const font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
            const text = element.textContent || "Orange";
            const faces = await document.fonts.load(font, text);
            const systemStack = ["Cascadia Code", "SFMono-Regular", "Consolas", "Liberation Mono", "monospace", "ui-monospace", "Arial", "Helvetica", "sans-serif", "system-ui"].includes(family);
            const requiresMonospace = systemStack && /(?:^|,)\s*(?:ui-)?monospace(?:\s*,|\s*$)/.test(style.fontFamily);
            const context = document.createElement("canvas").getContext("2d");
            if (context) context.font = font;
            const widths = ["iiii", "WWWW", "0000", "mmmm"].map((sample) => context?.measureText(sample).width || 0);
            const fixedWidth = widths.every((width) => width > 0 && Math.abs(width - widths[0]) < 0.01);
            return { selector, family, stack: style.fontFamily, fontSize: style.fontSize, faces: faces.length, systemStack, requiresMonospace, fixedWidth, available: document.fonts.check(font, text), loaded: faces.length > 0 && faces.every((face) => face.status === "loaded") };
          })));
          // FontFaceSet lists downloaded faces, not installed fonts. Confirm
          // native fallbacks with the fonts Chromium actually used to draw text.
          const session = await context.newCDPSession(page);
          await session.send("DOM.enable");
          await session.send("CSS.enable");
          const { root } = await session.send("DOM.getDocument");
          for (const font of observation.fonts.filter((font) => !font.loaded && font.systemStack)) {
            const { nodeId } = await session.send("DOM.querySelector", { nodeId: root.nodeId, selector: font.selector });
            const { fonts } = await session.send("CSS.getPlatformFontsForNode", { nodeId });
            font.platformFonts = fonts;
            font.loaded = font.available && fonts.some((face) => !face.isCustomFont && face.glyphCount > 0) && (!font.requiresMonospace || font.fixedWidth);
          }
          await session.detach();
          observation.layout = await page.evaluate(() => {
            const themeIcon = document.querySelector(".theme-toggle svg")?.getBoundingClientRect();
            const themeButton = document.querySelector(".theme-toggle")?.getBoundingClientRect();
            const thumbnailBounds = ["accordion", "gamer-boy", "empty-state", "avatar", "avatar-group", "avatar-editor"].map((slug) => {
              const inner = document.querySelector(`.tile-${slug} .thumbnail-inner`);
              const content = inner.getBoundingClientRect();
              const container = inner.parentElement.getBoundingClientRect();
              const clearance = { top: content.top - container.top, right: container.right - content.right, bottom: container.bottom - content.bottom, left: content.left - container.left };
              return { slug, width: content.width, height: content.height, clearance, complete: Object.values(clearance).every((space) => space >= 8) };
            });
            return {
              viewport: innerWidth,
              documentWidth: document.documentElement.scrollWidth,
              overflow: document.documentElement.scrollWidth > innerWidth,
              palette: getComputedStyle(document.documentElement).colorScheme,
              appearance: document.querySelector(".component-grid")?.getAttribute("data-appearance"),
              components: document.querySelectorAll(".component-tile").length,
              clippedText: Array.from(document.querySelectorAll("h1, .component-tile h2, .component-tile-copy p")).filter((element) => element.clientWidth > 0 && element.scrollWidth > element.clientWidth + 1).map((element) => element.textContent),
              thumbnailBounds,
              themeControl: { width: themeButton?.width || 0, height: themeButton?.height || 0, iconWidth: themeIcon?.width || 0, iconHeight: themeIcon?.height || 0 },
            };
          });
          const axe = await new AxeBuilder({ page }).analyze();
          observation.violations = axe.violations.map((violation) => ({ id: violation.id, impact: violation.impact, nodes: violation.nodes.map((node) => ({ target: node.target, summary: node.failureSummary })) }));
          const name = `catalogue-${width}-${appearance}-${theme}`;
          observation.screenshot = `${output}/${name}.png`;
          await page.screenshot({ path: observation.screenshot, fullPage: true, animations: "disabled" });
          await page.screenshot({ path: `${output}/${name}-top.png`, animations: "disabled" });
          observation.passed = observation.status === 200 && !errors.length && !failedRequests.length && !observation.violations.length && !observation.layout.overflow && !observation.layout.clippedText.length && observation.layout.thumbnailBounds.every((thumbnail) => thumbnail.complete) && observation.layout.components === expectedComponents && observation.layout.palette === theme && observation.layout.appearance === appearance && observation.fonts.every((font) => font.loaded) && observation.layout.themeControl.iconWidth > 0 && observation.layout.themeControl.iconHeight > 0 && observation.layout.themeControl.width >= 44 && observation.layout.themeControl.height >= 44;
        } catch (error) {
          observation.failure = error.message;
          observation.passed = false;
        } finally {
          await context.close();
        }
        console.log(`${width}px ${appearance} ${theme}: ${observation.passed ? "passed" : "failed"}`);
      }
    }
  }
} finally {
  await browser.close();
  const report = { baseURL, reviewedAt: new Date().toISOString(), expectedComponents, expectedScenarios, scenarios: observations.length, passed: observations.filter((observation) => observation.passed).length, failed: observations.filter((observation) => !observation.passed).length, observations };
  await writeFile(`${output}/catalogue-review.json`, JSON.stringify(report, null, 2) + "\n");
  if (report.failed || report.scenarios !== expectedScenarios) process.exitCode = 1;
}
