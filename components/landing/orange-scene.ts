import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

export type SceneController = { setPaused: (paused: boolean) => void; dispose: () => void };

export function createOrangeScene(host: HTMLDivElement, initiallyPaused: boolean): SceneController {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("webgl2", { alpha: true, antialias: true, powerPreference: "low-power" });
  if (!context) throw new Error("Graphics unavailable");
  const renderer = new THREE.WebGLRenderer({ canvas, context, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.45;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, .1, 100);
  camera.position.set(0, .2, 9);
  const mobile = matchMedia("(pointer: coarse)").matches || innerWidth < 700;
  host.dataset.interaction = mobile ? "touch" : "pointer";
  scene.add(new THREE.HemisphereLight(0xfff7de, 0x5b422c, 3));
  const key = new THREE.DirectionalLight(0xfff4d7, 5);
  key.position.set(-3, 5, 6); scene.add(key);
  const rim = new THREE.DirectionalLight(0xffd69e, 2);
  rim.position.set(4, 1, -2); scene.add(rim);
  const group = new THREE.Group(); scene.add(group);
  const material = (color: number, roughness = .42) => new THREE.MeshStandardMaterial({ color, roughness, metalness: .02 });
  const orange = material(0xff7819); const green = material(0x6b8b3a); const ink = material(0x2a211d);
  const sphereGeometry = new THREE.SphereGeometry(1, mobile ? 40 : 64, mobile ? 28 : 48);
  function sphere(parent: THREE.Object3D, mat: THREE.Material, scale: [number, number, number], position: [number, number, number]) {
    const mesh = new THREE.Mesh(sphereGeometry, mat); mesh.scale.set(...scale); mesh.position.set(...position); parent.add(mesh); return mesh;
  }
  const fruit = new THREE.Group(); fruit.position.set(-.05, .05, .15); fruit.rotation.z = -.12; group.add(fruit);
  sphere(fruit, orange, [1.3, 1.22, 1.17], [0, 0, 0]);
  sphere(fruit, ink, [.064, .125, .035], [-.32, .04, 1.13]);
  sphere(fruit, ink, [.064, .125, .035], [.24, .04, 1.15]);
  const smile = new THREE.Mesh(new THREE.TorusGeometry(.13, .023, 8, 24, Math.PI), ink); smile.rotation.z = Math.PI; smile.position.set(-.04, -.22, 1.17); fruit.add(smile);
  const stem = new THREE.Mesh(new THREE.CapsuleGeometry(.045, .28, 4, 10), material(0x58442c)); stem.position.set(.01, 1.32, 0); stem.rotation.z = -.22; fruit.add(stem);
  function leaf(parent: THREE.Object3D, position: [number, number, number], scale: [number, number, number], rotation: number) {
    const shape = new THREE.Shape(); shape.moveTo(0, 0); shape.bezierCurveTo(.7, .12, 1.25, .65, 1.2, 1.3); shape.bezierCurveTo(.45, 1.35, -.18, .75, 0, 0);
    const mesh = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: .035, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: .055, bevelThickness: .035, curveSegments: 18 }), green);
    mesh.position.set(...position); mesh.scale.set(...scale); mesh.rotation.z = rotation; parent.add(mesh); return mesh;
  }
  leaf(fruit, [0, 1.22, .02], [.62, .45, .6], -.75);
  leaf(group, [1.02, -1.55, -.8], [1.3, 1.45, 1], -.24);
  leaf(group, [1.1, -1.75, -.65], [1, .92, 1], -1.06);
  const tile = new THREE.Group(); tile.position.set(1.38, 1.65, -.5); tile.rotation.set(.15, -.3, -.23); group.add(tile);
  const box = new THREE.Mesh(new RoundedBoxGeometry(.87, .72, .2, 4, .16), material(0x9a7ec1)); tile.add(box);
  const check = new THREE.CatmullRomCurve3([new THREE.Vector3(-.22, -.01, .12), new THREE.Vector3(-.07, -.15, .12), new THREE.Vector3(.22, .17, .12)]);
  tile.add(new THREE.Mesh(new THREE.TubeGeometry(check, 12, .031, 8, false), material(0xfff7e4)));
  const toggle = new THREE.Group(); toggle.position.set(-1.2, -1.5, .6); toggle.rotation.set(.25, .2, .28); group.add(toggle);
  toggle.add(new THREE.Mesh(new RoundedBoxGeometry(1, .49, .18, 4, .22), material(0xc7d98c)));
  sphere(toggle, material(0xfff8e8), [.19, .19, .1], [.23, 0, .15]);
  if (!mobile) { sphere(group, material(0xb6c77b), [.12, .12, .12], [-1.85, 1.16, -.2]); sphere(group, orange, [.2, .2, .2], [1.6, -2.05, .6]); }
  // Transparent radial contact shadow works with either page palette.
  const shadowCanvas = document.createElement("canvas"); shadowCanvas.width = shadowCanvas.height = 64;
  const ctx = shadowCanvas.getContext("2d")!;
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32); gradient.addColorStop(0, "rgba(53,35,20,.23)"); gradient.addColorStop(1, "rgba(53,35,20,0)"); ctx.fillStyle = gradient; ctx.fillRect(0, 0, 64, 64);
  const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(3.7, .6), new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false })); shadow.position.set(0, -1.9, -1); group.add(shadow);
  let paused = initiallyPaused, onscreen = true, disposed = false, lost = false, frame = 0, elapsed = 0, last = 0, frames = 0;
  const pointer = new THREE.Vector2();
  function draw() { if (lost || disposed) return; renderer.render(scene, camera); canvas.dataset.frames = String(++frames); }
  function tick(now: number) {
    if (disposed || lost) return;
    elapsed += last ? Math.min(now - last, 40) / 1000 : 0; last = now;
    fruit.position.y = .05 + Math.sin(elapsed * .65) * .09;
    fruit.rotation.y = Math.sin(elapsed * .3) * .08 + pointer.x * .08;
    tile.position.y = 1.65 + Math.sin(elapsed * .6 + 1) * .09;
    toggle.position.y = -1.5 + Math.sin(elapsed * .55 + 2) * .08;
    group.rotation.y += (pointer.x * .075 - group.rotation.y) * .035;
    group.rotation.x += (-pointer.y * .04 - group.rotation.x) * .035;
    draw(); frame = requestAnimationFrame(tick);
  }
  function sync() {
    cancelAnimationFrame(frame); last = 0;
    const running = !paused && onscreen && document.visibilityState !== "hidden" && !lost && !disposed;
    canvas.dataset.running = String(running);
    if (running) frame = requestAnimationFrame(tick);
  }
  function resize() {
    const { width, height } = host.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height); camera.aspect = width / height;
    camera.position.z = camera.aspect < .85 ? 9.7 : 9;
    camera.updateProjectionMatrix(); draw();
  }
  function move(event: PointerEvent) { if (mobile || paused) return; const r = host.getBoundingClientRect(); pointer.set(THREE.MathUtils.clamp((event.clientX - r.left) / r.width * 2 - 1, -1, 1), THREE.MathUtils.clamp((event.clientY - r.top) / r.height * 2 - 1, -1, 1)); }
  function resetPointer() { pointer.set(0, 0); }
  function contextLost(event: Event) { event.preventDefault(); lost = true; host.dataset.renderer = "static"; sync(); }
  const observer = new IntersectionObserver(([entry]) => { onscreen = entry.isIntersecting; sync(); }, { threshold: .01 }); observer.observe(host);
  const resizeObserver = new ResizeObserver(resize); resizeObserver.observe(host);
  document.addEventListener("visibilitychange", sync);
  const hero = host.closest("section")!;
  if (!mobile) { hero.addEventListener("pointermove", move); hero.addEventListener("pointerleave", resetPointer); }
  canvas.addEventListener("webglcontextlost", contextLost);
  host.appendChild(canvas); resize(); host.dataset.renderer = "webgl"; sync();
  return {
    setPaused(value) { paused = value; sync(); },
    dispose() {
      disposed = true; cancelAnimationFrame(frame); observer.disconnect(); resizeObserver.disconnect(); document.removeEventListener("visibilitychange", sync); hero.removeEventListener("pointermove", move); hero.removeEventListener("pointerleave", resetPointer); canvas.removeEventListener("webglcontextlost", contextLost);
      const geometries = new Set<THREE.BufferGeometry>(); const materials = new Set<THREE.Material>();
      scene.traverse((object) => { if (object instanceof THREE.Mesh) { geometries.add(object.geometry); for (const mat of Array.isArray(object.material) ? object.material : [object.material]) materials.add(mat); } });
      geometries.forEach((geometry) => geometry.dispose()); materials.forEach((mat) => mat.dispose()); shadowTexture.dispose(); renderer.dispose(); renderer.forceContextLoss(); canvas.remove();
    },
  };
}
