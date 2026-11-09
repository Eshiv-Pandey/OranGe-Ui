import { createMotionActivity } from "./use-motion-activity";

/** A small solid model. Nothing is loaded until the switch is mounted. */
export async function createWallSwitchRenderer(canvas: HTMLCanvasElement, button: HTMLButtonElement) {
  const THREE = await import("three");
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-60, 60, 60, -60, .1, 500);
  camera.position.set(8, 12, 200); camera.lookAt(0, 0, 4);
  const plastic = new THREE.MeshStandardMaterial({ color: 0xe9e8e2, roughness: .48, metalness: 0 });
  const rockerPlastic = new THREE.MeshStandardMaterial({ color: 0xf1f0ea, roughness: .43, metalness: 0 });
  const recessMaterial = new THREE.MeshStandardMaterial({ color: 0x777770, roughness: .8 });
  const marker = new THREE.LineBasicMaterial({ color: 0x85857e, transparent: true, opacity: .75 });
  const indicatorMaterial = new THREE.MeshStandardMaterial({ color: 0xa9aaa1, roughness: .5, emissive: 0x000000 });
  function slab(width: number, height: number, depth: number, radius: number, bevel: number, material: InstanceType<typeof THREE.MeshStandardMaterial>) {
    const shape = new THREE.Shape(), x = -width / 2, y = -height / 2;
    shape.moveTo(x + radius, y); shape.lineTo(x + width - radius, y);
    shape.quadraticCurveTo(x + width, y, x + width, y + radius);
    shape.lineTo(x + width, y + height - radius); shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    shape.lineTo(x + radius, y + height); shape.quadraticCurveTo(x, y + height, x, y + height - radius);
    shape.lineTo(x, y + radius); shape.quadraticCurveTo(x, y, x + radius, y);
    const geometry = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 5, curveSegments: 12, steps: 1 });
    const mesh = new THREE.Mesh(geometry, material); mesh.castShadow = true; mesh.receiveShadow = true;
    return mesh;
  }
  const plate = slab(82, 82, 4, 3.4, 1.8, plastic); scene.add(plate);
  const recess = slab(43, 66, .4, 1.8, .4, recessMaterial); recess.position.z = 6; scene.add(recess);
  const hinge = new THREE.Group(); hinge.position.z = 8.9; scene.add(hinge);
  const rocker = slab(39.5, 62, 2.8, 1.5, .8, rockerPlastic); hinge.add(rocker);
  const upperMark = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 20, 3.7), new THREE.Vector3(0, 16, 3.7)]), marker); hinge.add(upperMark);
  const circle = new THREE.EllipseCurve(0, -19, 1.9, 1.9, 0, Math.PI * 2, false, 0);
  const lowerMark = new THREE.Line(new THREE.BufferGeometry().setFromPoints(circle.getPoints(40).map(point => new THREE.Vector3(point.x, point.y, 3.7))), marker); hinge.add(lowerMark);
  const indicator = new THREE.Mesh(new THREE.BoxGeometry(5.5, .8, .1), indicatorMaterial); indicator.position.set(0, 24, 3.7); hinge.add(indicator);
  const wallShadow = new THREE.Mesh(new THREE.PlaneGeometry(180, 180), new THREE.ShadowMaterial({ opacity: .22 })); wallShadow.position.z = -4.5; wallShadow.receiveShadow = true; scene.add(wallShadow);
  const light = new THREE.DirectionalLight(0xfffbf1, 3.6); light.position.set(-85, 95, 90); light.castShadow = true;
  light.shadow.mapSize.set(512, 512); light.shadow.camera.left = -70; light.shadow.camera.right = 70; light.shadow.camera.top = 70; light.shadow.camera.bottom = -70;
  light.shadow.normalBias = .3; light.shadow.bias = -.0001; light.shadow.radius = 4; scene.add(light);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x777974, 1.3));
  const fillLight = new THREE.DirectionalLight(0xe3e9ff, .7); fillLight.position.set(65, -15, 70); scene.add(fillLight);
  let destroyed = false, reduced = false, contextAvailable = true, target = 0, dirty = true;
  const checked = () => button.dataset.state === "checked";
  function synchronize() {
    target = checked() ? -.135 : .135;
    indicatorMaterial.color.set(checked() ? 0xc88b40 : 0xa9aaa1);
    indicatorMaterial.emissive.set(checked() ? 0x432403 : 0x000000);
    if (reduced) hinge.rotation.x = target;
    dirty = true;
  }
  synchronize(); hinge.rotation.x = target;
  function paint() { if (!destroyed && contextAvailable) { renderer.render(scene, camera); dirty = false; } }
  function resize() {
    const bounds = canvas.getBoundingClientRect(), width = Math.max(1, Math.round(bounds.width)), height = Math.max(1, Math.round(bounds.height));
    const extent = 43 * width / Math.max(1, button.getBoundingClientRect().width);
    camera.left = -extent; camera.right = extent; camera.top = extent * height / width; camera.bottom = -camera.top; camera.updateProjectionMatrix();
    renderer.setSize(width, height, false); paint();
  }
  const observer = new MutationObserver(() => { synchronize(); if (reduced) paint(); }); observer.observe(button, { attributes: true, attributeFilter: ["data-state"] });
  const sizing = new ResizeObserver(resize); sizing.observe(button); resize();
  function contextLost(event: Event) { event.preventDefault(); contextAvailable = false; button.dataset.renderer = "fallback"; }
  function contextRestored() { contextAvailable = true; synchronize(); resize(); button.dataset.renderer = "webgl"; }
  canvas.addEventListener("webglcontextlost", contextLost); canvas.addEventListener("webglcontextrestored", contextRestored);
  const activity = createMotionActivity(button, {
    onStatus(status) { reduced = status === "reduced"; if (reduced) { hinge.rotation.x = target; paint(); } },
    onFrame({ delta }) {
      const difference = target - hinge.rotation.x;
      if (Math.abs(difference) > .00005) { hinge.rotation.x += difference * (1 - Math.exp(-delta / 70)); dirty = true; }
      if (dirty) paint();
    },
  });
  button.dataset.renderer = "webgl";
  return {
    destroy() {
      if (destroyed) return; destroyed = true;
      activity.destroy(); observer.disconnect(); sizing.disconnect();
      canvas.removeEventListener("webglcontextlost", contextLost); canvas.removeEventListener("webglcontextrestored", contextRestored);
      const geometries = new Set<InstanceType<typeof THREE.BufferGeometry>>(), materials = new Set<InstanceType<typeof THREE.Material>>();
      scene.traverse(object => { if (object instanceof THREE.Mesh || object instanceof THREE.Line) { geometries.add(object.geometry); (Array.isArray(object.material) ? object.material : [object.material]).forEach(material => materials.add(material)); } });
      geometries.forEach(geometry => geometry.dispose()); materials.forEach(material => material.dispose()); renderer.dispose(); renderer.forceContextLoss();
      button.dataset.renderer = "fallback";
    },
  };
}
