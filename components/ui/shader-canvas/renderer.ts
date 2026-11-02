import { HEADER, VERTEX } from "./common";
import { registerCanvasFrame } from "../canvas-frame";
import { SHADER_MODULES } from "./modules";
import { clamp, type ShaderCanvasProps, type ShaderModule, type ShaderSettings, type ShaderUniform, type UniformValue } from "./types";

type Pass = { module: ShaderModule; program: WebGLProgram; locations: Map<string, WebGLUniformLocation | null>; textures: { name: string; handle: WebGLTexture }[] };
type Target = { texture: WebGLTexture; framebuffer: WebGLFramebuffer };
/** One RAF and two reusable targets for the entire ordered pipeline. */
export function createShaderRenderer(canvas: HTMLCanvasElement, read: () => ShaderCanvasProps, state: (ready: boolean) => void) {
  const gl = canvas.getContext("webgl2", { alpha: false, antialias: false, depth: false, stencil: false, powerPreference: "low-power" });
  if (!gl) { state(false); return { redraw() {}, destroy() {} }; }
  let passes: Pass[] = [], targets: Target[] = [], signature = "", raf = 0, time = 0, previous = 0, disposed = false, lost = false, visible = !window.IntersectionObserver;
  let lastFrame = 0;
  let cssWidth = 1, cssHeight = 1, scroll = 0, rippleIndex = 0, active = 0, tx = .5, ty = .5, px = .5, py = .5, vx = 0, vy = 0, velocityX = 0, velocityY = 0;
  const ripples = new Float32Array(32), motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let vao = gl.createVertexArray();
  const canAnimate = () => !disposed && !lost && visible && !document.hidden && !motion.matches && !read().paused;
  const stop = () => { cancelAnimationFrame(raf); raf = 0; previous = 0; lastFrame = 0; };
  function shader(type: number, source: string) {
    const result = gl!.createShader(type); if (!result) throw new Error("Shader allocation failed");
    gl!.shaderSource(result, source); gl!.compileShader(result);
    if (!gl!.getShaderParameter(result, gl!.COMPILE_STATUS)) { const message = gl!.getShaderInfoLog(result); gl!.deleteShader(result); throw new Error(message || "Shader compilation failed"); }
    return result;
  }
  function compile(module: ShaderModule): Pass {
    const vertex = shader(gl!.VERTEX_SHADER, VERTEX);
    const textures: Pass["textures"] = [];
    let fragment: WebGLShader | null = null, program: WebGLProgram | null = null;
    try {
      fragment = shader(gl!.FRAGMENT_SHADER, HEADER + module.fragment); program = gl!.createProgram();
      if (!program) throw new Error("Program allocation failed");
      gl!.attachShader(program, vertex); gl!.attachShader(program, fragment); gl!.linkProgram(program);
      if (!gl!.getProgramParameter(program, gl!.LINK_STATUS)) throw new Error(gl!.getProgramInfoLog(program) || "Program link failed");
      for (const [name, source] of Object.entries(module.textures || {})) {
        const handle = gl!.createTexture();
        if (!handle) throw new Error("Lookup texture allocation failed");
        textures.push({ name, handle });
        gl!.activeTexture(gl!.TEXTURE0 + textures.length);
        gl!.bindTexture(gl!.TEXTURE_2D, handle);
        gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.RGBA8, source.width, source.height, 0, gl!.RGBA, gl!.UNSIGNED_BYTE, source.data());
        gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MIN_FILTER, gl!.LINEAR);
        gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MAG_FILTER, gl!.LINEAR);
        gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_S, source.repeat ? gl!.REPEAT : gl!.CLAMP_TO_EDGE);
        gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_T, source.repeat ? gl!.REPEAT : gl!.CLAMP_TO_EDGE);
      }
      return { module, program, locations: new Map(), textures };
    } catch (error) { textures.forEach(({ handle }) => gl!.deleteTexture(handle)); if (program) gl!.deleteProgram(program); throw error; }
    finally { gl!.deleteShader(vertex); if (fragment) gl!.deleteShader(fragment); }
  }
  function releasePass(pass: Pass) { pass.textures.forEach(({ handle }) => gl!.deleteTexture(handle)); gl!.deleteProgram(pass.program); }
  function pipeline(config: ShaderCanvasProps) {
    const modules = new Map([...SHADER_MODULES, ...(config.modules || [])].map((module) => [module.id, module]));
    const requested = [config.source || { type: "gradient" }, ...(config.effects || [])];
    const selected = requested.map((settings, i) => {
      const definition = modules.get(settings.type);
      if (!definition || definition.kind !== (i ? "effect" : "source")) throw new Error("Unknown shader module: " + settings.type);
      return definition;
    });
    const nextSignature = selected.map((module) => module.id + module.fragment).join("\n");
    if (nextSignature !== signature) {
      const next: Pass[] = [];
      try { selected.forEach((module) => next.push(compile(module))); }
      catch (error) { next.forEach(releasePass); throw error; }
      passes.forEach(releasePass); passes = next; signature = nextSignature;
    }
    passes.forEach((pass, i) => { pass.module = selected[i]; });
    return requested;
  }
  function clearTargets() { targets.forEach(({ texture, framebuffer }) => { gl!.deleteTexture(texture); gl!.deleteFramebuffer(framebuffer); }); targets = []; }
  function resize(config: ShaderCanvasProps) {
    const box = canvas.getBoundingClientRect(); cssWidth = Math.max(1, box.width); cssHeight = Math.max(1, box.height);
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5), scale = clamp(config.renderScale, .25, 1, 1);
    const max = Math.min(gl!.getParameter(gl!.MAX_TEXTURE_SIZE), 4096);
    const maxPixels = Math.min(max * max, ...passes.map((pass) => pass.module.renderBudget?.maxPixels ?? Infinity));
    const ratio = Math.min(dpr * scale, Math.sqrt(maxPixels / (cssWidth * cssHeight)), max / cssWidth, max / cssHeight);
    const width = Math.max(1, Math.floor(cssWidth * ratio)), height = Math.max(1, Math.floor(cssHeight * ratio));
    if (canvas.width === width && canvas.height === height && targets.length === 2) return;
    canvas.width = width; canvas.height = height; clearTargets();
    gl!.activeTexture(gl!.TEXTURE0);
    for (let i = 0; i < 2; i++) {
      const texture = gl!.createTexture(), framebuffer = gl!.createFramebuffer();
      if (!texture || !framebuffer) { if (texture) gl!.deleteTexture(texture); if (framebuffer) gl!.deleteFramebuffer(framebuffer); throw new Error("Framebuffer allocation failed"); }
      targets.push({ texture, framebuffer }); gl!.bindTexture(gl!.TEXTURE_2D, texture);
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MIN_FILTER, gl!.LINEAR); gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MAG_FILTER, gl!.LINEAR);
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_S, gl!.CLAMP_TO_EDGE); gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_T, gl!.CLAMP_TO_EDGE);
      gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.RGBA8, width, height, 0, gl!.RGBA, gl!.UNSIGNED_BYTE, null);
      gl!.bindFramebuffer(gl!.FRAMEBUFFER, framebuffer); gl!.framebufferTexture2D(gl!.FRAMEBUFFER, gl!.COLOR_ATTACHMENT0, gl!.TEXTURE_2D, texture, 0);
      if (gl!.checkFramebufferStatus(gl!.FRAMEBUFFER) !== gl!.FRAMEBUFFER_COMPLETE) throw new Error("Incomplete framebuffer");
    }
  }
  function uniform(pass: Pass, name: string, type: ShaderUniform["type"], value: UniformValue) {
    if (!pass.locations.has(name)) pass.locations.set(name, gl!.getUniformLocation(pass.program, name));
    const location = pass.locations.get(name); if (location == null) return;
    if (type === "int") gl!.uniform1i(location, value as number);
    else if (type === "float") gl!.uniform1f(location, value as number);
    else { const data = value as number[]; if (type === "vec2") gl!.uniform2fv(location, data); else if (type === "vec3" || type === "vec3[]") gl!.uniform3fv(location, data); else if (type === "vec4" || type === "vec4[]") gl!.uniform4fv(location, data); else gl!.uniform1fv(location, data); }
  }
  function draw(now: number, advance: boolean) {
    if (disposed || lost) return;
    try {
      const config = read(), settings = pipeline(config); resize(config);
      const delta = advance && previous ? Math.min((now - previous) / 1000, .05) : 0; previous = now;
      if (!motion.matches && !config.paused) time += delta;
      const interaction = motion.matches ? {} : config.interaction || {}, smooth = 1 - Math.exp(-Math.max(delta, .016) * 12);
      px += (tx - px) * smooth; py += (ty - py) * smooth; vx += (velocityX - vx) * smooth; vy += (velocityY - vy) * smooth;
      velocityX *= Math.exp(-Math.max(delta, .016) * 5); velocityY *= Math.exp(-Math.max(delta, .016) * 5);
      const clock = motion.matches ? 0 : time + (interaction.scroll ? scroll * 6 : 0);
      gl!.bindVertexArray(vao); gl!.viewport(0, 0, canvas.width, canvas.height); gl!.disable(gl!.DEPTH_TEST); gl!.disable(gl!.BLEND);
      passes.forEach((pass, i) => {
        gl!.useProgram(pass.program); gl!.bindFramebuffer(gl!.FRAMEBUFFER, i === passes.length - 1 ? null : targets[i % 2].framebuffer);
        gl!.activeTexture(gl!.TEXTURE0); gl!.bindTexture(gl!.TEXTURE_2D, i ? targets[(i - 1) % 2].texture : null);
        pass.textures.forEach(({ name, handle }, index) => { gl!.activeTexture(gl!.TEXTURE0 + index + 1); gl!.bindTexture(gl!.TEXTURE_2D, handle); uniform(pass, name, "int", index + 1); });
        uniform(pass, "uInput", "int", 0); uniform(pass, "uResolution", "vec2", [canvas.width, canvas.height]); uniform(pass, "uCssSize", "vec2", [cssWidth, cssHeight]);
        uniform(pass, "uTime", "float", clock); uniform(pass, "uPointer", "vec2", [px, py]); uniform(pass, "uVelocity", "vec2", [vx, vy]);
        uniform(pass, "uPointerActive", "float", motion.matches ? 0 : active); uniform(pass, "uRadius", "float", clamp(interaction.radius, .05, 1, .22));
        uniform(pass, "uInteractionStrength", "float", clamp(interaction.strength, 0, 3, 1));
        uniform(pass, "uWarpEnabled", "float", interaction.warp ? 1 : 0); uniform(pass, "uPixelProximity", "float", interaction.pixelProximity ? 1 : 0); uniform(pass, "uDitherProximity", "float", interaction.ditherProximity ? 1 : 0);
        uniform(pass, "uRipples", "vec4[]", interaction.ripple ? Array.from(ripples) : Array(32).fill(0));
        const values: ShaderSettings = { ...pass.module.defaults, ...settings[i] };
        Object.entries(pass.module.uniforms).forEach(([name, descriptor]) => uniform(pass, name, descriptor.type, descriptor.value(values)));
        gl!.drawArrays(gl!.TRIANGLES, 0, 3);
      });
      state(true);
    } catch { stop(); clearTargets(); state(false); return; }
    if (canAnimate() && !raf) raf = requestAnimationFrame(frame);
  }
  function frame(now: number) {
    raf = 0;
    if (!canAnimate()) return;
    const maxFps = Math.min(...passes.map((pass) => pass.module.renderBudget?.maxFps ?? Infinity));
    if (lastFrame && now - lastFrame < 1000 / maxFps - 1) { raf = requestAnimationFrame(frame); return; }
    lastFrame = now;
    draw(now, true);
  }
  function redraw() { if (!document.hidden) draw(performance.now(), false); if (!canAnimate()) stop(); }
  function visibility() { if (canAnimate()) redraw(); else stop(); }
  function position(event: PointerEvent) {
    if (motion.matches || read().paused) return;
    const opts = read().interaction; if (!opts || !(opts.warp || opts.ripple || opts.pixelProximity || opts.ditherProximity)) return;
    const box = canvas.getBoundingClientRect(), x = clamp((event.clientX - box.left) / box.width, 0, 1), y = 1 - clamp((event.clientY - box.top) / box.height, 0, 1);
    velocityX = clamp(velocityX + (x - tx) * 8, -2, 2); velocityY = clamp(velocityY + (y - ty) * 8, -2, 2); tx = x; ty = y; active = 1;
  }
  function down(event: PointerEvent) {
    position(event); if (motion.matches || read().paused || !read().interaction?.ripple) return;
    const offset = (rippleIndex++ % 8) * 4; ripples.set([tx, ty, time + (read().interaction?.scroll ? scroll * 6 : 0), 1], offset);
  }
  function leave() { active = 0; }
  function up(event: PointerEvent) { if (event.pointerType !== "mouse") leave(); }
  function onScroll() { if (!read().interaction?.scroll || motion.matches) return; scroll = clamp(window.scrollY / Math.max(1, document.documentElement.scrollHeight - window.innerHeight), 0, 1); }
  function onMotion() { ripples.fill(0); active = 0; vx = vy = velocityX = velocityY = 0; stop(); redraw(); }
  function onLost(event: Event) { event.preventDefault(); lost = true; stop(); state(false); }
  function onRestored() { lost = false; passes = []; signature = ""; targets = []; vao = gl!.createVertexArray(); redraw(); }
  const resizeObserver = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(redraw); resizeObserver?.observe(canvas);
  const intersection = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; visibility(); }); intersection?.observe(canvas);
  canvas.addEventListener("pointermove", position); canvas.addEventListener("pointerdown", down); canvas.addEventListener("pointerleave", leave); canvas.addEventListener("pointerup", up); canvas.addEventListener("pointercancel", leave);
  canvas.addEventListener("webglcontextlost", onLost); canvas.addEventListener("webglcontextrestored", onRestored);
  document.addEventListener("visibilitychange", visibility); window.addEventListener("resize", redraw); window.addEventListener("scroll", onScroll, { passive: true }); motion.addEventListener("change", onMotion);
  const releaseCapture = registerCanvasFrame(canvas, () => draw(performance.now(), false));
  onScroll(); redraw();
  return { redraw, destroy() {
    disposed = true; releaseCapture(); stop(); resizeObserver?.disconnect(); intersection?.disconnect(); clearTargets(); passes.forEach(releasePass); gl.deleteVertexArray(vao);
    canvas.removeEventListener("pointermove", position); canvas.removeEventListener("pointerdown", down); canvas.removeEventListener("pointerleave", leave); canvas.removeEventListener("pointerup", up); canvas.removeEventListener("pointercancel", leave);
    canvas.removeEventListener("webglcontextlost", onLost); canvas.removeEventListener("webglcontextrestored", onRestored);
    document.removeEventListener("visibilitychange", visibility); window.removeEventListener("resize", redraw); window.removeEventListener("scroll", onScroll); motion.removeEventListener("change", onMotion);
  } };
}
