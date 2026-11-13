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
    const footer = page.locator(".portfolio-footer"), socials = footer.locator("nav a");
    await expect(footer.locator(".portfolio-footer-wordmark")).toHaveText("Sample Studio");
    await expect(footer.getByRole("link",{name:"hello@example.com"})).toBeVisible();
    expect(await footer.locator(".portfolio-footer-masthead img").count()).toBe(0);
    expect(await footer.locator('a[href*="eshiv"], img[src*="favicon-red"]').count()).toBe(0);
    if(width<1340) {
      expect(Math.abs(contact!.width-grid!.width)).toBeLessThan(2);
      const row = await socials.evaluateAll(links => {
        const boxes = links.map(link=>link.getBoundingClientRect());
        return {left:Math.min(...boxes.map(box=>box.left)),right:Math.max(...boxes.map(box=>box.right))};
      });
      expect(Math.abs((row.left+row.right)/2-(contact!.x+contact!.width/2))).toBeLessThan(2);
    }
    for(const image of await page.locator(".portfolio-truck img").all()) {
      const bounds=(await image.boundingBox())!, frame=(await image.locator("xpath=ancestor::div[contains(@class,'portfolio-truck')][last()]").boundingBox())!;
      expect(bounds.width).toBeGreaterThanOrEqual(76);
      expect(bounds.x).toBeGreaterThanOrEqual(frame.x-1);
      expect(bounds.x+bounds.width).toBeLessThanOrEqual(frame.x+frame.width+1);
      expect(bounds.y).toBeGreaterThanOrEqual(frame.y-1);
      expect(bounds.y+bounds.height).toBeLessThanOrEqual(frame.y+frame.height+1);
    }
    await page.getByRole("checkbox", {name:"Pause decoration"}).check();
    expect(await footer.locator('.portfolio-truck-jounce').evaluate(el=>getComputedStyle(el).animationPlayState)).toBe("paused");
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
      const button=page.getByRole("button",{name:"Restart truck"}); await button.focus(); await page.keyboard.press("Enter");
      await expect(page.getByRole("status").filter({hasText:"Truck clicked 1 time"})).toBeVisible();
      await expect(page.locator("[data-main-preview] .portfolio-truck")).toHaveAttribute("data-restarts","1");
      expect(await page.locator(".portfolio-truck-jounce").evaluate(el=>getComputedStyle(el).animationName)).toBe("none");
    }
    if(slug==="sticker-social-icons") {
      await page.getByRole("checkbox",{name:"Profile hover cards"}).uncheck();
      await page.locator("[data-main-preview] nav a").first().focus(); await expect(page.locator(".portfolio-hover-card")).toHaveCount(0);
    }
  }
});
test("touch restarts the visible truck and keeps its journey running", async({browser})=>{
  const context=await browser.newContext({viewport:{width:390,height:900},hasTouch:true,reducedMotion:"no-preference"});
  const page=await context.newPage();
  try {
    await page.goto("/components/animated-truck");
    const truck=page.getByTestId("live-demo").locator(".portfolio-truck"), drive=truck.locator(".portfolio-truck-drive"), button=truck.getByRole("button",{name:"Restart truck"});
    await expect(truck).toBeVisible();
    await truck.scrollIntoViewIfNeeded();
    await expect(truck).toHaveAttribute("data-motion","running");
    await drive.evaluate(el=>{el.getAnimations()[0].currentTime=13000;});
    const bounds=(await button.boundingBox())!;
    await page.touchscreen.tap(bounds.x+bounds.width/2,bounds.y+bounds.height/2);
    await expect(truck).toHaveAttribute("data-restarts","1");
    expect(await drive.evaluate(el=>Number(el.getAnimations()[0].currentTime))).toBeLessThan(1000);
    await expect.poll(()=>drive.evaluate(el=>Number(el.getAnimations()[0].currentTime))).toBeGreaterThan(600);
    expect(await drive.evaluate(el=>getComputedStyle(el).animationPlayState)).toBe("running");
    await page.screenshot({path:"out/portfolio/screenshots/truck-touch-restarted.png",fullPage:true});
    await page.getByRole("checkbox",{name:"Pause decoration"}).check();
    await truck.scrollIntoViewIfNeeded();
    const pausedBounds=(await button.boundingBox())!;
    await page.touchscreen.tap(pausedBounds.x+pausedBounds.width/2,pausedBounds.y+pausedBounds.height/2);
    await expect(truck).toHaveAttribute("data-restarts","2");
    await expect(truck).toHaveAttribute("data-paused","false");
    await expect(page.getByRole("status").filter({hasText:"Truck clicked 2 times"})).toBeVisible();
  } finally {await context.close();}
});
for(const width of [320,390,768,1440]) for(const theme of ["light","dark"]) test(`standalone footer and truck at ${width}px in ${theme}`,async({page})=>{
  await page.setViewportSize({width,height:1000});
  await page.addInitScript(value=>localStorage.setItem("orangeui-palette",value),theme);
  for(const slug of ["portfolio-footer","animated-truck"]) {
    await page.goto(`/components/${slug}`);
    const live=page.getByTestId("live-demo"), truck=live.locator(".portfolio-truck"), image=truck.locator("img");
    await expect(truck).toBeVisible();
    await expect.poll(()=>image.evaluate(el=>(el as HTMLImageElement).naturalWidth)).toBe(570);
    if(slug==="portfolio-footer" && theme==="light") {
      const contrast=await live.locator(".portfolio-footer").evaluate(el=>{
        const color=getComputedStyle(el.querySelector(".portfolio-footer-link")!).color;
        const rgb=color.match(/[\d.]+/g)!.slice(0,3).map(Number);
        const luminance=(values:number[])=>values.map(value=>{const channel=value/255;return channel<=.04045?channel/12.92:((channel+.055)/1.055)**2.4;}).reduce((sum,value,index)=>sum+value*[.2126,.7152,.0722][index],0);
        // Conservative per-channel lower bound for the light shader after its cream veil.
        const background=[192,185,159];
        return (luminance(background)+.05)/(luminance(rgb)+.05);
      });
      expect(contrast).toBeGreaterThanOrEqual(4.5);
    }
    const band=(await truck.boundingBox())!, art=(await image.boundingBox())!;
    expect(band.width).toBeGreaterThan(180);
    expect(art.width).toBeGreaterThanOrEqual(76);
    expect(art.x).toBeGreaterThanOrEqual(band.x-1);
    expect(art.x+art.width).toBeLessThanOrEqual(band.x+band.width+1);
    expect(art.y).toBeGreaterThanOrEqual(band.y-1);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await live.screenshot({path:`out/portfolio/screenshots/${slug}-${width}-${theme}.png`});
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
  await vinyl.getByRole("button",{name:"Play",exact:true}).click();
  await expect(vinyl).toHaveAttribute("data-playing","true");
  await expect.poll(()=>record.locator("img").evaluate(el=>parseFloat(getComputedStyle(el).rotate)||0)).toBeGreaterThan(1);
  await record.hover();await expect.poll(async()=>Math.round((await record.boundingBox())!.height)).toBe(Math.round((await vinyl.boundingBox())!.height));
  expect(await record.locator("img").evaluate(el=>({animation:getComputedStyle(el).animationName,rotate:parseFloat(getComputedStyle(el).rotate)||0,transform:getComputedStyle(el).transform}))).toEqual({animation:"none",rotate:0,transform:"none"});
  await vinyl.screenshot({path:"out/portfolio/screenshots/vinyl-upright.png"});
  await page.mouse.move(0,0);await record.click();await expect(vinyl).toHaveAttribute("data-cover-expanded","true");await record.click();await expect(vinyl).toHaveAttribute("data-cover-expanded","false");
  await page.goto("/components/audio-orb");await live.getByRole("button",{name:"Play music",exact:true}).click();
  await expect(live.locator(".audio-orb")).toHaveAttribute("data-audio-active","true");
  await expect.poll(()=>live.locator(".audio-orb").evaluate(el=>parseFloat((el as HTMLElement).style.getPropertyValue("--orb-energy")))).toBeGreaterThan(.15);
  expect(await live.locator(".audio-orb").evaluate(el=>(el as HTMLElement).style.getPropertyValue("--orb-one"))).toBe("#7e68ef");
  await live.locator(".audio-orb-widget").screenshot({path:"out/portfolio/screenshots/orb-playing.png"});
  await live.getByRole("button",{name:"Pause music",exact:true}).click();
  await expect.poll(()=>live.locator(".audio-orb").evaluate(el=>parseFloat((el as HTMLElement).style.getPropertyValue("--orb-energy")))).toBeLessThan(.02);
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
