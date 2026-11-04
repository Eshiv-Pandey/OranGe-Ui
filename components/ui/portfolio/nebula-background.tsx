"use client";

import { useEffect, useRef } from "react";

import { useReducedMotion } from "./use-reduced-motion";

/**
 * A soft animated nebula that fills the footer behind its content, replacing
 * the flat board colour. It rides a single full-screen three.js shader plane
 * (three is already a dependency; no react-three-fiber) and is theme-aware: a
 * warm cream/marigold/teal/rose haze in light mode, a deeper glow on near-black
 * in dark mode, so the footer's own ink stays readable in both.
 *
 * Under `prefers-reduced-motion` it renders a single still frame instead of
 * animating, and if WebGL is unavailable the parent's own background shows
 * through unharmed.
 */

const FRAG = /* glsl */ `
  precision highp float;
  uniform vec2 uResolution;
  uniform float uTime;
  uniform float uDark;

  float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float noise(vec2 p){
    vec2 i = floor(p), f = fract(p);
    float a = hash(i), b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0)), d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }
  float fbm(vec2 p){
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++){ v += a * noise(p); p *= 2.0; a *= 0.5; }
    return v;
  }

  void main(){
    vec2 uv = gl_FragCoord.xy / uResolution.xy;
    vec2 p = uv * vec2(uResolution.x / uResolution.y, 1.0) * 3.0;
    float t = uTime * 0.09;

    float n1 = fbm(p + vec2(t, t * 0.5));
    float n2 = fbm(p * 1.7 - vec2(t * 0.7, t));
    float clouds = fbm(p + n1 * 1.4 + vec2(t));

    vec3 baseL = vec3(0.988, 0.953, 0.925);
    vec3 baseD = vec3(0.082, 0.059, 0.051);
    vec3 base = mix(baseL, baseD, uDark);

    vec3 marigold = mix(vec3(0.914, 0.635, 0.031), vec3(0.82, 0.45, 0.16), uDark);
    vec3 teal = mix(vec3(0.055, 0.486, 0.482), vec3(0.10, 0.44, 0.43), uDark);
    vec3 rose = mix(vec3(0.847, 0.42, 0.451), vec3(0.62, 0.26, 0.32), uDark);

    // Light mode washed out too far, so its weight is pushed up toward the
    // dark-mode strength; the marigold band also starts lower in light so more
    // of the field takes colour.
    float w = mix(0.58, 0.62, uDark);
    vec3 col = base;
    col = mix(col, marigold, smoothstep(mix(0.30, 0.40, uDark), 0.92, clouds) * w);
    col = mix(col, teal, smoothstep(0.50, 1.0, n2) * w * 0.7);
    col = mix(col, rose, smoothstep(0.55, 0.96, n1) * w * 0.65);

    float star = pow(hash(floor(gl_FragCoord.xy * 0.5)), 42.0);
    col += star * mix(0.18, 0.55, uDark);

    gl_FragColor = vec4(col, 1.0);
  }
`;

const VERT = /* glsl */ `
  void main(){ gl_Position = vec4(position, 1.0); }
`;

export function NebulaBackground({ paused = false, theme = "light" }: { paused?: boolean; theme?: "light" | "dark" }) {
  const reducedMotion = useReducedMotion(), hostRef = useRef<HTMLDivElement>(null);
  const updateRef = useRef<((theme: string, stop: boolean) => void) | null>(null);
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let disposed = false, raf = 0, visible = false, loading = false, stopped = false, dark = false, lost = false;
    let render: (() => void) | undefined, release: (() => void) | undefined;
    let last = 0, elapsed = 0;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    function loop(now: number) {
      raf = 0;
      if (disposed || !visible || document.hidden || stopped || motion.matches || lost) return;
      if (now - last >= 1000 / 24) { elapsed += Math.min(now - last, 80) / 1000; last = now; render?.(); }
      raf = requestAnimationFrame(loop);
    }
    function schedule() {
      cancelAnimationFrame(raf); raf = 0;
      if (disposed || !visible || document.hidden || lost) return;
      render?.();
      if (!stopped && !motion.matches && render) { last = performance.now(); raf = requestAnimationFrame(loop); }
    }
    async function prepare() {
      if (loading || disposed) return;
      loading = true;
      try {
        const THREE = await import("three");
        if (disposed) return;
        let renderer: import("three").WebGLRenderer;
        try { renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: "low-power" }); }
        catch { host!.dataset.renderer = "fallback"; return; }
        renderer.domElement.style.cssText = "width:100%;height:100%;display:block";
        host!.appendChild(renderer.domElement);
        const scene = new THREE.Scene(), camera = new THREE.Camera();
        const uniforms = { uResolution: { value: new THREE.Vector2(1, 1) }, uTime: { value: 0 }, uDark: { value: dark ? 1 : 0 } };
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms }));
        scene.add(mesh);
        render = () => { uniforms.uTime.value = elapsed; uniforms.uDark.value = dark ? 1 : 0; renderer.render(scene, camera); };
        function resize() {
          const w = Math.max(1, host!.clientWidth), h = Math.max(1, host!.clientHeight);
          const ratio = Math.min(window.devicePixelRatio || 1, 1.5, Math.sqrt(260000 / (w * h)));
          renderer.setPixelRatio(ratio); renderer.setSize(w, h, false);
          renderer.getDrawingBufferSize(uniforms.uResolution.value); render?.();
        }
        const ro = new ResizeObserver(resize); ro.observe(host!); resize();
        const lose = (event: Event) => { event.preventDefault(); lost = true; cancelAnimationFrame(raf); host!.dataset.renderer = "fallback"; };
        const restore = () => { lost = false; host!.dataset.renderer = "webgl"; resize(); schedule(); };
        renderer.domElement.addEventListener("webglcontextlost", lose);
        renderer.domElement.addEventListener("webglcontextrestored", restore);
        host!.dataset.renderer = "webgl"; schedule();
        release = () => { ro.disconnect(); renderer.domElement.removeEventListener("webglcontextlost", lose); renderer.domElement.removeEventListener("webglcontextrestored", restore); mesh.geometry.dispose(); mesh.material.dispose(); renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove(); };
      } catch { if (!disposed) host!.dataset.renderer = "fallback"; }
    }
    const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible && !loading) void prepare(); schedule(); }, { rootMargin: "80px" });
    io.observe(host);
    updateRef.current = (value, stop) => { dark = value === "dark"; stopped = stop; schedule(); };
    document.addEventListener("visibilitychange", schedule); motion.addEventListener("change", schedule);
    return () => { disposed = true; cancelAnimationFrame(raf); io.disconnect(); motion.removeEventListener("change", schedule); document.removeEventListener("visibilitychange", schedule); updateRef.current = null; release?.(); };
  }, []);
  useEffect(() => { updateRef.current?.(theme, paused || reducedMotion); }, [theme, paused, reducedMotion]);
  return <div ref={hostRef} aria-hidden="true" className="portfolio-nebula" />;
}
