import type { KeepsakePhoto } from './keepsake-photos';
import { createFilmPath, FILM_FRAME_SPACING } from './endless-film-path';

export type EndlessFilmRenderer = { update(phase: number): void; select(index: number): void; pick(x: number, y: number): number | null; destroy(): void };

/** Photos, frame borders and punched sprockets share one texture on a real ribbon. */
export async function createEndlessFilmRenderer(canvas: HTMLCanvasElement, photos: readonly KeepsakePhoto[], signal: AbortSignal): Promise<EndlessFilmRenderer | null> {
  const THREE = await import('three');
  if (signal.aborted || !photos.length) return null;
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setClearColor(0x000000, 1); renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.VSMShadowMap;
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(40, 1, 1, 3000);
  camera.position.set(0, 45, 1060); camera.lookAt(0, 0, 0);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x9a9a9a, 2.5));
  const key = new THREE.DirectionalLight(0xfff6e8, 1.35);
  key.position.set(-350, 480, 650); key.castShadow = true; key.shadow.mapSize.set(512, 512); key.shadow.radius = 4; key.shadow.blurSamples = 8;
  Object.assign(key.shadow.camera, { left: -800, right: 800, top: 650, bottom: -650, near: 1, far: 1800 });
  key.shadow.bias = -.0005; key.shadow.normalBias = 1.1; scene.add(key);
  const fill = new THREE.DirectionalLight(0xf3f7ff, .8); fill.position.set(500, -80, 700); scene.add(fill);
  const groundGeometry = new THREE.PlaneGeometry(2400, 1600), groundMaterial = new THREE.ShadowMaterial({ opacity: .16 });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial); ground.position.z = -185; ground.receiveShadow = true; scene.add(ground);
  // Keep the authored 256-unit layout, but rasterize photographs and sprockets at display density.
  const atlas = document.createElement('canvas'), cellWidth = Math.min(640, Math.floor(renderer.capabilities.maxTextureSize / photos.length)), cellHeight = Math.round(cellWidth * 200 / 256), atlasScale = cellWidth / 256;
  atlas.width = cellWidth * photos.length; atlas.height = cellHeight;
  const context = atlas.getContext('2d');
  if (!context) { renderer.dispose(); groundGeometry.dispose(); groundMaterial.dispose(); return null; }
  const images = photos.map(() => new Image()), texture = new THREE.CanvasTexture(atlas);
  texture.colorSpace = THREE.SRGBColorSpace; texture.wrapS = THREE.RepeatWrapping; texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  let selected = 0, phase = 0, destroyed = false, available = true, compact: boolean | undefined;
  let path = createFilmPath(), geometry = new THREE.BufferGeometry();
  function paintAtlas() {
    context!.setTransform(1, 0, 0, 1, 0, 0);
    context!.clearRect(0, 0, atlas.width, atlas.height);
    context!.setTransform(atlasScale, 0, 0, atlasScale, 0, 0);
    context!.imageSmoothingEnabled = true; context!.imageSmoothingQuality = 'high';
    photos.forEach((photo, index) => {
      const x = index * 256, edge = context!.createLinearGradient(0, 0, 0, 200);
      edge.addColorStop(0, '#776249'); edge.addColorStop(.06, '#24211c'); edge.addColorStop(.94, '#24211c'); edge.addColorStop(1, '#806649');
      context!.fillStyle = edge; context!.fillRect(x, 0, 256, 200);
      context!.fillStyle = photo.color ?? '#6a6655'; context!.fillRect(x + 24, 35, 208, 130);
      const image = images[index];
      if (image.complete && image.naturalWidth) {
        const crop = Math.min(image.naturalWidth / 208, image.naturalHeight / 130), width = 208 * crop, height = 130 * crop;
        context!.drawImage(image, (image.naturalWidth - width) / 2, (image.naturalHeight - height) / 2, width, height, x + 24, 35, 208, 130);
      }
      context!.strokeStyle = index === selected ? '#d7a34e' : '#a9997770'; context!.lineWidth = index === selected ? 2 : 1; context!.strokeRect(x + 24, 35, 208, 130);
      context!.font = '9px sans-serif'; context!.fillStyle = '#caa771'; context!.fillText(`FRAME ${String(index + 1).padStart(2, '0')}`, x + 27, 174);
      context!.globalCompositeOperation = 'destination-out';
      for (let hole = 0; hole < 8; hole++) for (const y of [9, 176]) { context!.beginPath(); context!.roundRect(x + hole * 32 + 11, y, 13, 15, 2.5); context!.fill(); }
      context!.globalCompositeOperation = 'source-over';
    });
    texture.needsUpdate = true;
    canvas.parentElement?.setAttribute('data-texture-size', `${atlas.width}x${atlas.height}`);
  }
  paintAtlas();
  const frontMaterial = new THREE.MeshStandardMaterial({ map: texture, color: 0xffffff, roughness: .94, metalness: 0, alphaTest: .45, side: THREE.FrontSide });
  const backMaterial = new THREE.MeshStandardMaterial({ map: texture, color: 0x32271e, roughness: .62, alphaTest: .45, side: THREE.BackSide });
  const depthMaterial = new THREE.MeshDepthMaterial({ map: texture, alphaTest: .45, depthPacking: THREE.RGBADepthPacking, side: THREE.DoubleSide });
  const front = new THREE.Mesh(geometry, frontMaterial), back = new THREE.Mesh(geometry, backMaterial);
  front.castShadow = true; front.receiveShadow = true; front.customDepthMaterial = depthMaterial; back.castShadow = true; back.receiveShadow = true; back.customDepthMaterial = depthMaterial; scene.add(front, back);
  function rebuild(isCompact: boolean) {
    path = createFilmPath(isCompact);
    const next = new THREE.BufferGeometry(), positions: number[] = [], uv: number[] = [], indices: number[] = [], rows = 420, columns = 6;
    for (let row = 0; row <= rows; row++) {
      const point = path.at(row / rows * path.length);
      for (let column = 0; column <= columns; column++) {
        const offset = (column / columns - .5) * 116;
        positions.push(point.x + point.nx * offset, point.y + point.ny * offset, point.z + point.nz * offset); uv.push(row / rows, column / columns);
        if (row < rows && column < columns) { const a = row * (columns + 1) + column, b = a + columns + 1; indices.push(a, b, a + 1, b, b + 1, a + 1); }
      }
    }
    next.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); next.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); next.setIndex(indices); next.computeVertexNormals();
    geometry.dispose(); geometry = next; front.geometry = geometry; back.geometry = geometry; texture.repeat.x = path.length / (FILM_FRAME_SPACING * photos.length);
  }
  function paint() {
    if (destroyed || !available || signal.aborted) return;
    texture.offset.x = phase / (FILM_FRAME_SPACING * photos.length); renderer.render(scene, camera); canvas.parentElement?.setAttribute('data-renderer', 'webgl');
  }
  function resize() {
    if (destroyed) return;
    const bounds = canvas.getBoundingClientRect(), width = Math.max(1, bounds.width), height = Math.max(1, bounds.height), nextCompact = width < 480;
    if (compact !== nextCompact) { compact = nextCompact; rebuild(compact); }
    const pixelRatio = Math.min(2, window.devicePixelRatio || 1, Math.sqrt(2500000 / (width * height)));
    renderer.setPixelRatio(pixelRatio); renderer.setSize(width, height, false); camera.aspect = width / height; camera.position.z = compact ? 1080 : 1060; camera.updateProjectionMatrix(); paint();
  }
  const sizing = new ResizeObserver(resize); sizing.observe(canvas); const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2();
  function lost(event: Event) { event.preventDefault(); available = false; canvas.parentElement?.setAttribute('data-renderer', 'fallback'); }
  function restored() { available = true; resize(); }
  canvas.addEventListener('webglcontextlost', lost); canvas.addEventListener('webglcontextrestored', restored);
  images.forEach((image, index) => { image.crossOrigin = 'anonymous'; image.onload = () => { if (!destroyed) { paintAtlas(); paint(); } }; image.onerror = () => { if (!destroyed) paint(); }; image.src = photos[index].src; });
  resize();
  return {
    update(next) { phase = next; paint(); },
    select(index) { if (selected !== index) { selected = index; paintAtlas(); paint(); } },
    pick(x, y) {
      const bounds = canvas.getBoundingClientRect(); pointer.set((x - bounds.left) / bounds.width * 2 - 1, -(y - bounds.top) / bounds.height * 2 + 1); raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects([front, back])[0]; if (!hit?.uv) return null;
      const index = Math.floor((hit.uv.x * path.length + phase) / FILM_FRAME_SPACING); return ((index % photos.length) + photos.length) % photos.length;
    },
    destroy() {
      if (destroyed) return; destroyed = true; sizing.disconnect(); canvas.removeEventListener('webglcontextlost', lost); canvas.removeEventListener('webglcontextrestored', restored);
      images.forEach(image => { image.onload = null; image.onerror = null; }); geometry.dispose(); groundGeometry.dispose(); groundMaterial.dispose(); frontMaterial.dispose(); backMaterial.dispose(); depthMaterial.dispose(); texture.dispose(); key.shadow.map?.dispose(); key.shadow.mapPass?.dispose(); renderer.dispose(); renderer.forceContextLoss();
    },
  };
}
