"use client";

import { createMotionActivity } from "./use-motion-activity";

export type CreativeShaderFrame = { time: number; delta: number; reduced: boolean; width: number; height: number };
export type CreativeUniforms = Record<string, number | readonly number[] | Float32Array>;
const vertexSource = "attribute vec2 aPosition; varying vec2 vUv; void main(){vUv=aPosition*.5+.5;gl_Position=vec4(aPosition,0.,1.);}";

export function creativeColor(value: string): [number, number, number] {
  let hex = value.trim().replace(/^#/, "");
  if (hex.length === 3) hex = hex.split("").map((channel) => channel + channel).join("");
  if (!/^[0-9a-f]{6}$/i.test(hex)) return [0.5, 0.3, 0.7];
  return [parseInt(hex.slice(0, 2), 16) / 255, parseInt(hex.slice(2, 4), 16) / 255, parseInt(hex.slice(4, 6), 16) / 255];
}

/** An original shared WebGL lifecycle, including actual context restoration. */
export function createCreativeWebGL(canvas: HTMLCanvasElement, fragmentSource: string, uniforms: (frame: CreativeShaderFrame) => CreativeUniforms, options: { onState?: (ready: boolean) => void; onActive?: (active: boolean) => void } = {}) {
  let gl: WebGLRenderingContext | null = null;
  try { gl = canvas.getContext("webgl", { alpha: false, antialias: false, preserveDrawingBuffer: true }); } catch {}
  if (!gl) { options.onState?.(false); return { available: false, redraw() {}, destroy() {} }; }
  const context = gl;
  let program: WebGLProgram | null = null, buffer: WebGLBuffer | null = null, lost = false, destroyed = false;
  let width = 1, height = 1, reduced = true, time = 0;
  const locations = new Map<string, WebGLUniformLocation | null>();
  const compile = (type: number, source: string) => {
    const shader = context.createShader(type); if (!shader) throw new Error("Shader unavailable");
    context.shaderSource(shader, source); context.compileShader(shader);
    if (!context.getShaderParameter(shader, context.COMPILE_STATUS)) { context.deleteShader(shader); throw new Error("Shader unavailable"); }
    return shader;
  };
  const dispose = () => {
    if (program) context.deleteProgram(program); if (buffer) context.deleteBuffer(buffer);
    program = null; buffer = null; locations.clear();
  };
  const initialize = () => {
    let vertex: WebGLShader | null = null, fragment: WebGLShader | null = null;
    try {
      vertex = compile(context.VERTEX_SHADER, vertexSource); fragment = compile(context.FRAGMENT_SHADER, fragmentSource);
      program = context.createProgram(); if (!program) throw new Error("Program unavailable");
      context.attachShader(program, vertex); context.attachShader(program, fragment); context.linkProgram(program);
      if (!context.getProgramParameter(program, context.LINK_STATUS)) throw new Error("Program unavailable");
      buffer = context.createBuffer(); context.bindBuffer(context.ARRAY_BUFFER, buffer); context.bufferData(context.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), context.STATIC_DRAW);
      context.useProgram(program);
      const position = context.getAttribLocation(program, "aPosition"); context.enableVertexAttribArray(position); context.vertexAttribPointer(position, 2, context.FLOAT, false, 0, 0);
      options.onState?.(true);
    } catch { dispose(); options.onState?.(false); }
    finally { if (vertex) context.deleteShader(vertex); if (fragment) context.deleteShader(fragment); }
  };
  const paint = (delta = 0) => {
    if (destroyed || lost || !program) return;
    context.useProgram(program); context.viewport(0, 0, canvas.width, canvas.height);
    const values = { ...uniforms({ time: reduced ? 0 : time / 1000, delta, reduced, width, height }), uResolution: [canvas.width, canvas.height] };
    for (const [name, value] of Object.entries(values)) {
      if (!locations.has(name)) locations.set(name, context.getUniformLocation(program, name));
      const location = locations.get(name); if (location == null) continue;
      if (typeof value === "number") context.uniform1f(location, value);
      else if (name === "uColors") context.uniform3fv(location, new Float32Array(value));
      else if (name === "uPositions") context.uniform2fv(location, new Float32Array(value));
      else if (value.length === 2) context.uniform2fv(location, new Float32Array(value));
      else if (value.length === 3) context.uniform3fv(location, new Float32Array(value));
      else if (value.length === 4) context.uniform4fv(location, new Float32Array(value));
    }
    context.drawArrays(context.TRIANGLES, 0, 6);
  };
  const resize = () => {
    const box = canvas.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
    width = Math.max(1, box.width); height = Math.max(1, box.height);
    canvas.width = Math.max(1, Math.round(width * dpr)); canvas.height = Math.max(1, Math.round(height * dpr)); paint();
  };
  const onLost = (event: Event) => { event.preventDefault(); lost = true; options.onState?.(false); };
  const onRestored = () => { if (destroyed) return; lost = false; program = null; buffer = null; locations.clear(); initialize(); resize(); };
  canvas.addEventListener("webglcontextlost", onLost); canvas.addEventListener("webglcontextrestored", onRestored);
  initialize();
  const observer = typeof ResizeObserver === "function" ? new ResizeObserver(resize) : null; observer?.observe(canvas);
  if (!observer) window.addEventListener("resize", resize);
  const activity = createMotionActivity(canvas, {
    onFrame: (frame) => { time = frame.time; paint(frame.delta / 1000); },
    onStatus: (status) => { reduced = status === "reduced"; options.onActive?.(status === "running"); paint(); },
  });
  resize();
  return {
    available: Boolean(program), redraw: () => paint(),
    destroy() {
      destroyed = true; activity.destroy(); observer?.disconnect(); if (!observer) window.removeEventListener("resize", resize);
      canvas.removeEventListener("webglcontextlost", onLost); canvas.removeEventListener("webglcontextrestored", onRestored);
      dispose(); context.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}

export const CREATIVE_SHADER_COMMON = "precision highp float; varying vec2 vUv; uniform vec2 uResolution; uniform float uTime; uniform vec2 uPointer; uniform float uTheme; float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);} float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);} float bayer(vec2 p){vec2 q=mod(floor(p),4.);return mod(q.x*2.+q.y*3.+mod(q.x+q.y,2.)*8.,16.)/16.;}";
