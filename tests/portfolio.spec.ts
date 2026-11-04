import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { generateHelmetConfig, helmetToSvgString } from "../components/ui/helmet-art";

for (const width of [320,390,768,1440]) for (const theme of ["light","dark"]) {
  test(`portfolio composition at ${width}px in ${theme}`, async ({ page }) => {
    const errors: string[]=[]; page.on("pageerror",error=>errors.push(error.message));
    await page.setViewportSize({ width,height:1000 });
    await page.addInitScript(value=>localStorage.setItem("orangeui-palette",value),theme);
    await page.goto("/portfolio");
    await expect(page.locator(".portfolio-footer")).toBeVisible();
    await expect(page.locator(".portfolio-banner")).toHaveAttribute("data-theme",theme);
    await expect.poll(()=>page.locator(".portfolio-truck img").evaluateAll(images=>images.every(img=>(img as HTMLImageElement).naturalWidth===570))).toBe(true);
    await expect.poll(()=>page.locator(".portfolio-nebula").first().getAttribute("data-renderer")).toBe("webgl");
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    const composition = await page.locator(".portfolio-composition").boundingBox();
    expect(composition!.width, "Combined composition uses the available page width").toBeGreaterThan(width * .75);
    const social = page.locator(".portfolio-blueprint-content nav a").first();
    expect(await social.locator("span").first().evaluate(el=>parseFloat(getComputedStyle(el).width))).toBe(width<640?44:48);
    const contact=await page.locator(".portfolio-footer-connect").boundingBox(), grid=await page.locator(".portfolio-footer-columns").boundingBox();
    if(width<768) expect(Math.abs(contact!.width-grid!.width)).toBeLessThan(2);
    await page.getByRole("checkbox", {name:"Pause decoration"}).check();
    expect(await page.locator('.portfolio-footer-masthead [data-paused="true"] > span').first().evaluate(el=>getComputedStyle(el).opacity)).toBe("1");
    await social.focus(); await expect(page.locator(".portfolio-hover-card")).toBeVisible();
    expect(await page.locator(".portfolio-hover-card").getAttribute("data-theme")).toBe(theme);
    await page.keyboard.press("Escape"); await page.getByRole("link",{name:"Back to components"}).focus();
    await mkdir("out/portfolio/screenshots",{recursive:true});
    await page.screenshot({ path:`out/portfolio/screenshots/composition-${width}-${theme}.png`,fullPage:true });
    expect(errors).toEqual([]);
  });
}
test("component catalogue, focus, callback, optional cards and reduced motion", async({page})=>{
  await page.setViewportSize({width:390,height:900}); await page.emulateMedia({reducedMotion:"reduce"});
  for(const slug of ["portfolio-banner","portfolio-footer","animated-truck","sticker-social-icons"]){
    await page.goto(`/components/${slug}`); await expect(page.locator("[data-main-preview]")).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    if(slug==="animated-truck") {
      const button=page.getByRole("button",{name:"Interact with the truck"}); await button.focus(); await page.keyboard.press("Enter");
      await expect(page.getByRole("status").filter({hasText:"Truck clicked 1 time"})).toBeVisible();
      expect(await page.locator(".portfolio-truck-jounce").evaluate(el=>getComputedStyle(el).animationName)).toBe("none");
    }
    if(slug==="sticker-social-icons") {
      await page.getByRole("checkbox",{name:"Profile hover cards"}).uncheck();
      await page.locator("[data-main-preview] nav a").first().focus(); await expect(page.locator(".portfolio-hover-card")).toHaveCount(0);
    }
  }
});
test("player artwork, played-only progress, crystal audio and character interactions",async({page})=>{
  const errors:string[]=[];page.on("pageerror",e=>errors.push(e.message));
  const live = page.getByTestId("live-demo");
  await page.setViewportSize({width:1440,height:1000});
  await page.goto("/components/wave-player"); await expect(live.locator(".wave-player")).toBeVisible();
  expect(await live.locator(".wave-rest").getAttribute("d")).toBe("M0 15H280");
  await live.getByRole("button",{name:"Play",exact:true}).click();
  await expect.poll(()=>live.locator(".wave-progress input").inputValue()).not.toBe("0");
  await live.locator(".wave-progress input").fill("20");
  expect(await live.locator(".wave-rest").getAttribute("style")).not.toContain("0%);");
  await page.goto("/components/vinyl-player");const vinyl=live.locator(".vinyl-player"),record=live.locator(".vinyl-record");
  await record.hover();await expect.poll(async()=>Math.round((await record.boundingBox())!.height)).toBe(Math.round((await vinyl.boundingBox())!.height));
  await page.mouse.move(0,0);await record.click();await expect(vinyl).toHaveAttribute("data-cover-expanded","true");await record.click();await expect(vinyl).toHaveAttribute("data-cover-expanded","false");
  await page.goto("/components/audio-orb");await live.getByRole("button",{name:"Play music",exact:true}).click();
  await expect(live.locator(".audio-orb")).toHaveAttribute("data-audio-active","true");
  await live.getByRole("button",{name:"Listen",exact:true}).click();await expect(live.getByRole("button",{name:"Stop listening"})).toBeVisible();
  await live.getByRole("button",{name:"Stop listening"}).click();await expect(live.locator(".audio-orb")).toHaveAttribute("data-audio-active","false");
  await page.goto("/components/emberling");const friend=live.locator(".emberling").first(), hand=friend.locator(".elemental-arm-left");
  const restingHand=(await hand.boundingBox())!;await friend.hover();await expect(friend).toHaveAttribute("data-waving","true");
  await expect.poll(async()=>(await hand.boundingBox())!.y).toBeLessThan(restingHand.y-6);
  await page.mouse.move(0,0);await expect(friend).toHaveAttribute("data-waving","false");
  await page.goto("/components/helmet");await live.locator(".helmet-button").first().click();await expect(live.locator(".helmet").first()).toHaveAttribute("data-visor-open","true");
  await page.goto("/components/liquid-metal");await expect(live.locator(".liquid-metal")).toHaveAttribute("data-renderer","webgl2");
  await page.screenshot({path:"out/portfolio/screenshots/liquid-metal-desktop.png"});
  expect(errors).toEqual([]);
});

for(const width of [320,390,768,1440]) for(const theme of ["light","dark"]) test(`revised artwork at ${width}px in ${theme}`,async({page})=>{
  const errors:string[]=[];page.on("pageerror",e=>errors.push(e.message));
  await page.setViewportSize({width,height:1000});await page.emulateMedia({reducedMotion:"reduce"});
  await page.addInitScript(value=>localStorage.setItem("orangeui-palette",value),theme);
  for(const slug of ["wave-player","vinyl-player","audio-orb","emberling","helmet","liquid-metal"]){
    await page.goto(`/components/${slug}`);await expect(page.locator("[data-main-preview]")).toBeVisible();
    if(slug==="liquid-metal" || slug==="audio-orb") await expect(page.locator(".shader-canvas").first()).toHaveAttribute("data-renderer","webgl2");
    expect(await page.evaluate(()=>document.documentElement.scrollWidth),`${slug} overflow`).toBeLessThanOrEqual(width);
    await page.screenshot({path:`out/portfolio/screenshots/${slug}-${width}-${theme}.png`});
  }
  expect(errors).toEqual([]);
});
test("graphics fallbacks remain usable without WebGL",async({page})=>{
  await page.addInitScript(()=>{
    const original=HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext=function(this:HTMLCanvasElement,type:string,...args:unknown[]){ return type.startsWith("webgl") ? null : original.apply(this,[type,...args] as Parameters<typeof original>); } as typeof original;
  });
  const errors:string[]=[];page.on("pageerror",e=>errors.push(e.message));
  await page.goto("/portfolio");await expect(page.locator(".portfolio-footer")).toBeVisible();
  await expect(page.locator(".portfolio-nebula").first()).toHaveAttribute("data-renderer","fallback");
  for(const slug of ["audio-orb","liquid-metal"]){await page.goto(`/components/${slug}`);await expect(page.locator(".shader-canvas").first()).toHaveAttribute("data-renderer","fallback");}
  expect(errors).toEqual([]);
});

test("portable helmet keeps the complete raised visor inside its square export", async ({page}) => {
  const config = generateHelmetConfig("raised-visor");
  config.parts.visorOpen = true;
  await page.setContent(`<style>body{margin:0;background:white}svg{display:block}</style>${helmetToSvgString(config,512)}`);
  const frame = (await page.locator("svg").boundingBox())!;
  const artwork = (await page.locator(".helmet-shell-layer").boundingBox())!;
  await page.locator("svg").screenshot({path:"out/portfolio/screenshots/helmet-open-export.png"});
  expect(artwork.x).toBeGreaterThan(frame.x);
  expect(artwork.y).toBeGreaterThan(frame.y);
  expect(artwork.x + artwork.width).toBeLessThan(frame.x + frame.width);
  expect(artwork.y + artwork.height).toBeLessThan(frame.y + frame.height);
});
