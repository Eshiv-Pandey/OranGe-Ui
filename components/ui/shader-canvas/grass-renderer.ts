import { registerCanvasFrame } from "../canvas-frame";
import { clamp, type ShaderCanvasProps } from "./types";
import {
  createGrassField, grassRgb, normalizeGrassSettings, GRASS_FRAGMENT, GRASS_GROUND_FRAGMENT,
  GRASS_GROUND_VERTEX, GRASS_SEGMENTS, GRASS_STRIDE, GRASS_VERTEX, type GrassSettings,
} from "./grass";

export type GrassRenderOptions = Partial<GrassSettings> & Pick<ShaderCanvasProps, "interaction" | "paused" | "renderScale">;
type Program = { handle: WebGLProgram; locations: Map<string, WebGLUniformLocation | null> };

/** Two draw calls, one immutable instance buffer, and one animation frame callback. */
export function createGrassRenderer(canvas: HTMLCanvasElement, read: () => GrassRenderOptions, state: (ready: boolean) => void) {
  const gl = canvas.getContext("webgl2", { alpha: false, antialias: false, depth: false, stencil: false, powerPreference: "low-power" });
  if (!gl) { state(false); return { redraw() {}, destroy() {} }; }
  let leaves: Program | null = null, ground: Program | null = null, vao: WebGLVertexArrayObject | null = null, buffer: WebGLBuffer | null = null;
  let fieldKey = "", count = 0, raf = 0, previous = 0, time = 0, disposed = false, lost = false, visible = !window.IntersectionObserver;
  let cssWidth = 1, cssHeight = 1, tx = .5, ty = .5, px = .5, py = .5, vx = 0, vy = 0, velocityX = 0, velocityY = 0, active = 0, targetActive = 0, scroll = 0;
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const canAnimate = () => !disposed && !lost && visible && !document.hidden && !motion.matches && !read().paused;
  const stop = () => { cancelAnimationFrame(raf); raf = 0; previous = 0; };

  function program(vertexSource: string, fragmentSource: string): Program {
    const handle = gl!.createProgram();
    if (!handle) throw new Error("Grass program allocation failed");
    const shaders: WebGLShader[] = [];
    try {
      for (const [kind, source] of [[gl!.VERTEX_SHADER, vertexSource], [gl!.FRAGMENT_SHADER, fragmentSource]] as const) {
        const shader = gl!.createShader(kind);
        if (!shader) throw new Error("Grass shader allocation failed");
        shaders.push(shader); gl!.shaderSource(shader, source); gl!.compileShader(shader);
        if (!gl!.getShaderParameter(shader, gl!.COMPILE_STATUS)) throw new Error(gl!.getShaderInfoLog(shader) || "Grass shader compilation failed");
        gl!.attachShader(handle, shader);
      }
      gl!.linkProgram(handle);
      if (!gl!.getProgramParameter(handle, gl!.LINK_STATUS)) throw new Error(gl!.getProgramInfoLog(handle) || "Grass program link failed");
      return { handle, locations: new Map() };
    } catch (error) { gl!.deleteProgram(handle); throw error; }
    finally { shaders.forEach((shader) => gl!.deleteShader(shader)); }
  }
  function releaseGpu() {
    if (leaves) gl!.deleteProgram(leaves.handle);
    if (ground) gl!.deleteProgram(ground.handle);
    if (vao) gl!.deleteVertexArray(vao);
    if (buffer) gl!.deleteBuffer(buffer);
    leaves = ground = null; vao = buffer = null; fieldKey = ""; count = 0;
  }
  function allocate() {
    leaves = program(GRASS_VERTEX, GRASS_FRAGMENT);
    ground = program(GRASS_GROUND_VERTEX, GRASS_GROUND_FRAGMENT);
    vao = gl!.createVertexArray(); buffer = gl!.createBuffer();
    if (!vao || !buffer) throw new Error("Grass geometry allocation failed");
    gl!.bindVertexArray(vao); gl!.bindBuffer(gl!.ARRAY_BUFFER, buffer);
    for (let attribute = 0; attribute < 2; attribute++) {
      gl!.enableVertexAttribArray(attribute);
      gl!.vertexAttribPointer(attribute, 4, gl!.FLOAT, false, GRASS_STRIDE * 4, attribute * 16);
      gl!.vertexAttribDivisor(attribute, 1);
    }
  }
  function uniform(pass: Program, name: string, value: number | number[]) {
    if (!pass.locations.has(name)) pass.locations.set(name, gl!.getUniformLocation(pass.handle, name));
    const location = pass.locations.get(name);
    if (location == null) return;
    if (typeof value === "number") gl!.uniform1f(location, value);
    else if (value.length === 2) gl!.uniform2fv(location, value);
    else gl!.uniform3fv(location, value);
  }
  function resize(config: GrassRenderOptions, settings: GrassSettings) {
    const box = canvas.getBoundingClientRect(); cssWidth = Math.max(1, box.width); cssHeight = Math.max(1, box.height);
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5), scale = clamp(config.renderScale, .25, 1, 1);
    const max = Math.min(gl!.getParameter(gl!.MAX_TEXTURE_SIZE), 4096);
    // Bound fill cost even when a large canvas is used on a high-density screen.
    const budget = Math.min(1, Math.sqrt(2400000 / (cssWidth * cssHeight * dpr * dpr * scale * scale)));
    const width = Math.max(1, Math.min(max, Math.round(cssWidth * dpr * scale * budget)));
    const height = Math.max(1, Math.min(max, Math.round(cssHeight * dpr * scale * budget)));
    if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
    const aspect = cssWidth / cssHeight;
    const key = [aspect.toFixed(4), settings.density, settings.seed].join(":");
    if (fieldKey !== key) {
      const field = createGrassField(aspect, settings.density, settings.seed);
      gl!.bindBuffer(gl!.ARRAY_BUFFER, buffer); gl!.bufferData(gl!.ARRAY_BUFFER, field.data, gl!.STATIC_DRAW);
      count = field.count; fieldKey = key;
    }
  }
  function draw(now: number, advance: boolean) {
    if (disposed || lost) return;
    try {
      if (!leaves || !ground) allocate();
      const config = read(), settings = normalizeGrassSettings(config);
      resize(config, settings);
      const delta = advance && previous ? Math.min((now - previous) / 1000, .05) : 0;
      if (advance) previous = now;
      // A paused redraw is exactly the held frame, including pointer relaxation.
      if (!motion.matches && !config.paused && advance) {
        time += delta;
        const smooth = 1 - Math.exp(-delta * 12);
        px += (tx - px) * smooth; py += (ty - py) * smooth;
        vx += (velocityX - vx) * smooth; vy += (velocityY - vy) * smooth;
        active += (targetActive - active) * smooth;
        velocityX *= Math.exp(-delta * 5); velocityY *= Math.exp(-delta * 5);
      }
      const interaction = motion.matches ? {} : config.interaction || {};
      const clock = motion.matches ? 0 : time + (interaction.scroll ? scroll * 6 : 0);
      gl!.viewport(0, 0, canvas.width, canvas.height); gl!.disable(gl!.DEPTH_TEST); gl!.disable(gl!.CULL_FACE);
      gl!.bindVertexArray(vao);
      for (const pass of [ground!, leaves!]) {
        gl!.useProgram(pass.handle);
        uniform(pass, "uResolution", [canvas.width, canvas.height]); uniform(pass, "uCssSize", [cssWidth, cssHeight]);
        uniform(pass, "uDirection", settings.direction * Math.PI / 180); uniform(pass, "uSeed", settings.seed);
        uniform(pass, "uGrassColor", grassRgb(settings.color)); uniform(pass, "uTipColor", grassRgb(settings.tipColor)); uniform(pass, "uShadowColor", grassRgb(settings.shadowColor));
        if (pass === ground) { gl!.disable(gl!.BLEND); gl!.drawArrays(gl!.TRIANGLES, 0, 3); }
        else {
          uniform(pass, "uTime", clock); uniform(pass, "uSpeed", settings.speed); uniform(pass, "uWind", settings.windStrength);
          uniform(pass, "uGust", settings.gustSpeed); uniform(pass, "uLength", settings.bladeLength);
          uniform(pass, "uPointer", [px, py]); uniform(pass, "uVelocity", [vx, vy]);
          uniform(pass, "uPointerActive", interaction.warp && !motion.matches ? active : 0);
          uniform(pass, "uRadius", clamp(interaction.radius, .05, 1, .22)); uniform(pass, "uInteractionStrength", clamp(interaction.strength, 0, 3, 1));
          gl!.enable(gl!.BLEND); gl!.blendFunc(gl!.ONE, gl!.ONE_MINUS_SRC_ALPHA);
          gl!.drawArraysInstanced(gl!.TRIANGLE_STRIP, 0, (GRASS_SEGMENTS + 1) * 2, count);
        }
      }
      state(true);
    } catch { stop(); releaseGpu(); state(false); return; }
    if (canAnimate() && !raf) raf = requestAnimationFrame(frame);
  }
  function frame(now: number) { raf = 0; if (canAnimate()) draw(now, true); }
  function redraw() { if (!document.hidden) draw(performance.now(), false); if (!canAnimate()) stop(); }
  // Foregrounding refreshes static frames too, without restarting their animation.
  function visibility() { if (visible && !document.hidden) redraw(); else stop(); }
  function position(event: PointerEvent) {
    if (motion.matches || read().paused || !read().interaction?.warp) return;
    const box = canvas.getBoundingClientRect();
    const x = clamp((event.clientX - box.left) / Math.max(1, box.width), 0, 1), y = 1 - clamp((event.clientY - box.top) / Math.max(1, box.height), 0, 1);
    velocityX = clamp(velocityX + (x - tx) * 8, -2, 2); velocityY = clamp(velocityY + (y - ty) * 8, -2, 2);
    tx = x; ty = y; targetActive = 1;
  }
  function leave() { targetActive = 0; }
  function up(event: PointerEvent) { if (event.pointerType !== "mouse") leave(); }
  function onScroll() {
    if (!read().interaction?.scroll || motion.matches || read().paused) return;
    scroll = clamp(window.scrollY / Math.max(1, document.documentElement.scrollHeight - window.innerHeight), 0, 1);
  }
  function onMotion() { active = targetActive = vx = vy = velocityX = velocityY = 0; stop(); redraw(); }
  function onLost(event: Event) { event.preventDefault(); lost = true; stop(); state(false); }
  function onRestored() { lost = false; leaves = ground = null; vao = buffer = null; fieldKey = ""; redraw(); }
  const resizeObserver = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(redraw); resizeObserver?.observe(canvas);
  const intersection = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; visibility(); }); intersection?.observe(canvas);
  canvas.addEventListener("pointermove", position); canvas.addEventListener("pointerdown", position); canvas.addEventListener("pointerleave", leave);
  canvas.addEventListener("pointerup", up); canvas.addEventListener("pointercancel", leave);
  canvas.addEventListener("webglcontextlost", onLost); canvas.addEventListener("webglcontextrestored", onRestored);
  document.addEventListener("visibilitychange", visibility); window.addEventListener("resize", redraw); window.addEventListener("scroll", onScroll, { passive: true }); motion.addEventListener("change", onMotion);
  const releaseCapture = registerCanvasFrame(canvas, redraw);
  onScroll(); redraw();
  return { redraw, destroy() {
    disposed = true; releaseCapture(); stop(); resizeObserver?.disconnect(); intersection?.disconnect(); releaseGpu();
    canvas.removeEventListener("pointermove", position); canvas.removeEventListener("pointerdown", position); canvas.removeEventListener("pointerleave", leave);
    canvas.removeEventListener("pointerup", up); canvas.removeEventListener("pointercancel", leave);
    canvas.removeEventListener("webglcontextlost", onLost); canvas.removeEventListener("webglcontextrestored", onRestored);
    document.removeEventListener("visibilitychange", visibility); window.removeEventListener("resize", redraw); window.removeEventListener("scroll", onScroll); motion.removeEventListener("change", onMotion);
  } };
}
