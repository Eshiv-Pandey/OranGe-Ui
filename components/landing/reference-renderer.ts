import { registerCanvasFrame } from "../ui/canvas-frame";
import { REFERENCE_NOISE_SIZE, referenceNoiseTexels } from "./reference-noise";
import { REFERENCE_SCENE_ASSETS, referenceCover, referenceSparkles, type ReferenceSceneConfig } from "./reference-scene-config";
import { REFERENCE_FRAGMENT_SHADER, REFERENCE_SPARKLE_FRAGMENT_SHADER, REFERENCE_SPARKLE_VERTEX_SHADER, REFERENCE_VERTEX_SHADER } from "./reference-shaders";

type State = "loading" | "webgl2" | "fallback";

/** One canvas and one frame loop; masks, base and particles share cover coordinates. */
export function createReferenceRenderer(canvas: HTMLCanvasElement, config: ReferenceSceneConfig, onState: (state: State) => void) {
  const document = canvas.ownerDocument, win = document.defaultView;
  let context: WebGL2RenderingContext | null = null;
  try { context = canvas.getContext("webgl2", { alpha: false, antialias: false, depth: false, powerPreference: "low-power" }); } catch {}
  if (!context || !win) { onState("fallback"); return { destroy() {}, setPaused(_paused: boolean) { void _paused; } }; }
  const gl = context;
  let program: WebGLProgram | null = null, sparkProgram: WebGLProgram | null = null;
  let vao: WebGLVertexArrayObject | null = null, sparkVao: WebGLVertexArrayObject | null = null, sparkBuffer: WebGLBuffer | null = null;
  let textures: WebGLTexture[] = [], sparkCount = 0, frame = 0, time = 0, dpr = 1;
  let previous: number | null = null;
  let destroyed = false, ready = false, lost = false, paused = false, visible = true;
  const pointer = [0, 0], target = [0, 0], media = win.matchMedia("(prefers-reduced-motion: reduce)");
  let images: HTMLImageElement[] = [];
  const uniforms = new Map<string, WebGLUniformLocation | null>();
  const sparkleUniforms = new Map<string, WebGLUniformLocation | null>();
  const location = (name: string, sparkle = false) => {
    const cache = sparkle ? sparkleUniforms : uniforms, target = sparkle ? sparkProgram : program;
    if (!cache.has(name)) cache.set(name, target ? gl.getUniformLocation(target, name) : null);
    return cache.get(name) ?? null;
  };
  const compile = (kind: number, source: string) => {
    const shader = gl.createShader(kind); if (!shader) throw new Error("Shader allocation failed");
    gl.shaderSource(shader, source); gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) { const message = gl.getShaderInfoLog(shader); gl.deleteShader(shader); throw new Error(message || "Shader compilation failed"); }
    return shader;
  };
  const link = (vertex: string, fragment: string) => {
    const shaders: WebGLShader[] = [];
    const result = gl.createProgram(); if (!result) throw new Error("Program allocation failed");
    try {
      shaders.push(compile(gl.VERTEX_SHADER, vertex)); shaders.push(compile(gl.FRAGMENT_SHADER, fragment));
      shaders.forEach((shader) => gl.attachShader(result, shader)); gl.linkProgram(result);
      if (!gl.getProgramParameter(result, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(result) || "Shader linking failed");
      return result;
    } catch (error) { gl.deleteProgram(result); throw error; }
    finally { shaders.forEach((shader) => gl.deleteShader(shader)); }
  };
  const dispose = () => {
    if (program) gl.deleteProgram(program); if (sparkProgram) gl.deleteProgram(sparkProgram);
    if (vao) gl.deleteVertexArray(vao); if (sparkVao) gl.deleteVertexArray(sparkVao);
    if (sparkBuffer) gl.deleteBuffer(sparkBuffer);
    textures.forEach((texture) => gl.deleteTexture(texture)); textures = [];
    program = sparkProgram = null; vao = sparkVao = null; sparkBuffer = null;
    uniforms.clear(); sparkleUniforms.clear(); ready = false;
  };
  const paint = () => {
    if (!ready || lost || destroyed || !program) return;
    const cover = referenceCover(canvas.width, canvas.height, images[0].naturalWidth, images[0].naturalHeight);
    const motion = media.matches ? 0 : 1;
    gl.viewport(0, 0, canvas.width, canvas.height); gl.disable(gl.BLEND);
    gl.useProgram(program); gl.bindVertexArray(vao);
    textures.forEach((texture, index) => { gl.activeTexture(gl.TEXTURE0 + index); gl.bindTexture(gl.TEXTURE_2D, texture); });
    ["uPlate", "uFlowers", "uClouds", "uPerson", "uGrass", "uNoise"].forEach((name, index) => gl.uniform1i(location(name), index));
    gl.uniform2fv(location("uCover"), cover.scale); gl.uniform2fv(location("uCenter"), cover.center);
    gl.uniform2f(location("uPointer"), pointer[0], pointer[1]);
    const values = { uTime: media.matches ? 0 : time, uMotion: motion, uWindStrength: config.windStrength, uWindSpeed: config.windSpeed, uGustSpeed: config.gustSpeed, uCloudSpeed: config.cloudSpeed, uCloudDisplacement: config.cloudDisplacement, uGrain: config.grain, uParallax: config.parallax };
    for (const [name, value] of Object.entries(values)) gl.uniform1f(location(name), value);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (sparkProgram && sparkCount && motion) {
      gl.useProgram(sparkProgram); gl.bindVertexArray(sparkVao);
      gl.uniform2fv(location("uCover", true), cover.scale); gl.uniform2fv(location("uCenter", true), cover.center);
      gl.uniform2f(location("uResolution", true), canvas.width, canvas.height);
      gl.uniform1i(location("uNoise", true), 5); gl.uniform1i(location("uPerson", true), 3); gl.uniform1i(location("uClouds", true), 2);
      for (const [name, value] of Object.entries({ uTime: time, uMotion: motion, uCloudSpeed: config.cloudSpeed, uCloudDisplacement: config.cloudDisplacement, uDpr: dpr, uSparkleIntensity: config.sparkleIntensity, uSparkleSpeed: config.sparkleSpeed })) gl.uniform1f(location(name, true), value);
      gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE); gl.drawArrays(gl.POINTS, 0, sparkCount); gl.disable(gl.BLEND);
    }
    gl.bindVertexArray(null);
  };
  const cancel = () => { if (frame) win.cancelAnimationFrame(frame); frame = 0; previous = null; };
  const running = () => ready && !destroyed && !lost && !paused && !media.matches && visible && document.visibilityState !== "hidden";
  const tick = (now: number) => {
    frame = 0; if (!running()) { synchronize(); return; }
    // Follow elapsed visible time, including on slower GPUs. Clamping each
    // frame to 50 ms made a 10 fps device run the scene at half speed.
    const delta = previous === null ? 0 : Math.max(0, now - previous) / 1000;
    time += delta; previous = now;
    const follow = 1 - Math.exp(-delta * 3);
    pointer[0] += (target[0] - pointer[0]) * follow; pointer[1] += (target[1] - pointer[1]) * follow;
    paint(); frame = win.requestAnimationFrame(tick);
  };
  const synchronize = () => {
    canvas.dataset.motion = media.matches ? "reduced" : running() ? "running" : "paused";
    if (running()) { if (!frame) frame = win.requestAnimationFrame(tick); }
    else { cancel(); paint(); }
  };
  const resize = () => {
    const bounds = canvas.getBoundingClientRect();
    // The source plate is only 1199 x 805. Extra millions of fragment samples
    // on large/high-DPR displays add cost without recovering image detail.
    dpr = Math.min(2, Math.max(.5, config.maxDpr), win.devicePixelRatio || 1,
      Math.sqrt(Math.max(1, config.maxPixels) / Math.max(1, bounds.width * bounds.height)));
    const width = Math.max(1, Math.floor(bounds.width * dpr)), height = Math.max(1, Math.floor(bounds.height * dpr));
    if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
    paint();
  };
  const initialize = () => {
    if (destroyed || lost || images.length !== Object.keys(REFERENCE_SCENE_ASSETS).length) return;
    try {
      dispose(); program = link(REFERENCE_VERTEX_SHADER, REFERENCE_FRAGMENT_SHADER); vao = gl.createVertexArray();
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      images.forEach((image, index) => {
        const texture = gl.createTexture(); if (!texture) throw new Error("Texture allocation failed");
        textures.push(texture);
        gl.activeTexture(gl.TEXTURE0 + index); gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        if (index === 1 || index === 4) {
          gl.generateMipmap(gl.TEXTURE_2D);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        }
      });
      const noise = gl.createTexture(); if (!noise) throw new Error("Noise texture allocation failed");
      textures.push(noise); gl.activeTexture(gl.TEXTURE0 + 5); gl.bindTexture(gl.TEXTURE_2D, noise);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, REFERENCE_NOISE_SIZE, REFERENCE_NOISE_SIZE, 0, gl.RGBA, gl.UNSIGNED_BYTE, referenceNoiseTexels());
      // This detached canvas only reads assets once. The page renders one WebGL canvas.
      const reader = document.createElement("canvas"); reader.width = images[0].naturalWidth; reader.height = images[0].naturalHeight;
      const read = reader.getContext("2d", { willReadFrequently: true });
      if (read && config.sparkleCount > 0) {
        const pixels = (image: HTMLImageElement) => { read.clearRect(0, 0, reader.width, reader.height); read.drawImage(image, 0, 0); return read.getImageData(0, 0, reader.width, reader.height).data; };
        const data = referenceSparkles(reader.width, reader.height, pixels(images[0]), pixels(images[2]), pixels(images[3]), config.sparkleCount);
        sparkCount = data.length / 7; sparkProgram = link(REFERENCE_SPARKLE_VERTEX_SHADER, REFERENCE_SPARKLE_FRAGMENT_SHADER);
        sparkVao = gl.createVertexArray(); gl.bindVertexArray(sparkVao); sparkBuffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, sparkBuffer); gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 28, 0);
        gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 28, 16); gl.bindVertexArray(null);
      }
      reader.width = reader.height = 1;
      ready = true; resize(); onState("webgl2"); synchronize();
    } catch (error) {
      dispose(); onState("fallback"); synchronize();
      if (process.env.NODE_ENV !== "production") console.warn("Landscape renderer unavailable:", error);
    }
  };
  const onLost = (event: Event) => { event.preventDefault(); lost = true; cancel(); onState("fallback"); synchronize(); };
  const onRestored = () => { lost = false; initialize(); };
  const onPointer = (event: PointerEvent) => {
    if (media.matches || event.pointerType === "touch") return;
    const bounds = canvas.getBoundingClientRect(); target[0] = ((event.clientX - bounds.left) / Math.max(1, bounds.width) - .5) * 2; target[1] = -((event.clientY - bounds.top) / Math.max(1, bounds.height) - .5) * 2;
  };
  const resetPointer = () => { target[0] = target[1] = 0; };
  canvas.addEventListener("webglcontextlost", onLost); canvas.addEventListener("webglcontextrestored", onRestored);
  document.addEventListener("visibilitychange", synchronize); media.addEventListener("change", synchronize);
  win.addEventListener("pointermove", onPointer, { passive: true }); win.addEventListener("pointerleave", resetPointer);
  const resizeObserver = typeof win.ResizeObserver === "function" ? new win.ResizeObserver(resize) : null; resizeObserver?.observe(canvas);
  if (!resizeObserver) win.addEventListener("resize", resize);
  const observer = typeof win.IntersectionObserver === "function" ? new win.IntersectionObserver(([entry]) => { visible = Boolean(entry?.isIntersecting); synchronize(); }) : null; observer?.observe(canvas);
  const releaseCapture = registerCanvasFrame(canvas, paint);
  onState("loading");
  Promise.all(Object.values(REFERENCE_SCENE_ASSETS).map((src) => new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new win.Image(); image.onload = () => resolve(image); image.onerror = () => reject(new Error("Scene asset unavailable")); image.src = src;
  }))).then((loaded) => { if (!destroyed) { images = loaded; initialize(); } }).catch(() => { if (!destroyed) onState("fallback"); });
  return {
    setPaused(value: boolean) { paused = value; synchronize(); },
    destroy() {
      destroyed = true; cancel(); releaseCapture(); observer?.disconnect(); resizeObserver?.disconnect();
      if (!resizeObserver) win.removeEventListener("resize", resize);
      canvas.removeEventListener("webglcontextlost", onLost); canvas.removeEventListener("webglcontextrestored", onRestored);
      document.removeEventListener("visibilitychange", synchronize); media.removeEventListener("change", synchronize);
      win.removeEventListener("pointermove", onPointer); win.removeEventListener("pointerleave", resetPointer);
      dispose(); images = [];
      // Resources are deleted above. Do not force context loss: React's
      // development effect replay can reuse this canvas immediately.
    },
  };
}
