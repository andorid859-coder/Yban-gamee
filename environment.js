import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
export const W = 40, D = 30, H = 9;
export function buildEnvironment(scene, renderer) {
  const bounds = { hx: W / 2, hz: D / 2, H };
  // reflections / image-based light (cheap, one-time)
  const pm = new THREE.PMREMGenerator(renderer);
  const env = pm.fromScene(new RoomEnvironment(), 0.04); scene.environment = env.texture; scene.environmentIntensity = 0.45; pm.dispose();
  scene.background = new THREE.Color(0xf2f3f5); scene.fog = new THREE.Fog(0xf2f3f5, 30, 70);
  // lights
  scene.add(new THREE.AmbientLight(0xffffff, 0.35));
  scene.add(new THREE.HemisphereLight(0xffffff, 0xd9d4cc, 0.7));
  const sun = new THREE.DirectionalLight(0xfff4e6, 1.6);
  sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02; sun.shadow.radius = 4;
  const sc = sun.shadow.camera; sc.left = sc.bottom = -7; sc.right = sc.top = 7; sc.near = 1; sc.far = 40;
  scene.add(sun, sun.target);
  // materials
  const wallM = new THREE.MeshStandardMaterial({ color: 0xf7f7f5, roughness: 0.92 });
  const trimM = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.55 });
  const tc = document.createElement('canvas'); tc.width = tc.height = 512; const x = tc.getContext('2d');
  x.fillStyle = '#eceae6'; x.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 2500; i++) { x.fillStyle = `rgba(${150 + Math.random() * 90|0},${150 + Math.random() * 90|0},${150 + Math.random() * 90|0},.05)`; x.fillRect(Math.random() * 512, Math.random() * 512, 3 + Math.random() * 30, 3 + Math.random() * 30); }
  x.strokeStyle = 'rgba(120,115,105,.35)'; x.lineWidth = 3; x.strokeRect(0, 0, 512, 512);
  const ft = new THREE.CanvasTexture(tc); ft.wrapS = ft.wrapT = THREE.RepeatWrapping; ft.repeat.set(W / 4, D / 4); ft.colorSpace = THREE.SRGBColorSpace; ft.anisotropy = 4;
  const floorM = new THREE.MeshStandardMaterial({ map: ft, roughness: 0.22, metalness: 0.05 });
  const plane = (w, h, m, px, py, pz, rx, ry) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); p.position.set(px, py, pz); p.rotation.set(rx, ry, 0); if (m === floorM) p.receiveShadow = true; scene.add(p); return p; };
  plane(W, D, floorM, 0, 0, 0, -Math.PI / 2, 0);
  plane(W, D, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1 }), 0, H, 0, Math.PI / 2, 0);
  plane(W, H, wallM, 0, H / 2, -D / 2, 0, 0); plane(W, H, wallM, 0, H / 2, D / 2, 0, Math.PI);
  plane(D, H, wallM, -W / 2, H / 2, 0, 0, Math.PI / 2); plane(D, H, wallM, W / 2, H / 2, 0, 0, -Math.PI / 2);
  // baseboards + crown moulding (box strips around the perimeter)
  const bg = new THREE.BoxGeometry(1, 1, 1);
  const strip = (h, d, y) => {
    for (const [w, px, pz, ry] of [[W, 0, -D / 2 + d / 2, 0], [W, 0, D / 2 - d / 2, 0], [D, -W / 2 + d / 2, 0, Math.PI / 2], [D, W / 2 - d / 2, 0, Math.PI / 2]]) {
      const m = new THREE.Mesh(bg, trimM); m.scale.set(w, h, d); m.position.set(px, y, pz); m.rotation.y = ry; scene.add(m);
    }
  };
  strip(0.35, 0.1, 0.175); strip(0.08, 0.16, 0.39); strip(0.3, 0.14, H - 0.15); strip(0.08, 0.24, H - 0.36);
  // pilasters (instanced) on side/back walls; north wall stays clear for the photos
  const spots = [];
  for (let z = -12; z <= 12; z += 4) { spots.push([-W / 2 + 0.14, z, 0.28, 0.5]); spots.push([W / 2 - 0.14, z, 0.28, 0.5]); }
  for (let xx = -16; xx <= 16; xx += 4) spots.push([xx, D / 2 - 0.14, 0.5, 0.28]);
  const pil = new THREE.InstancedMesh(bg, trimM, spots.length), mt = new THREE.Matrix4();
  spots.forEach(([px, pz1, sx, sz], i) => { const side = Math.abs(px) > 19; mt.compose(new THREE.Vector3(side ? px : pz1 * 0 + px, (H - 0.8) / 2 + 0.4, side ? pz1 : pz1), new THREE.Quaternion(), new THREE.Vector3(side ? 0.28 : 0.5, H - 0.8, side ? 0.5 : 0.28)); pil.setMatrixAt(i, mt); });
  scene.add(pil);
  // ceiling light panels (instanced emissive)
  const lm = new THREE.MeshBasicMaterial({ color: 0xffffff }); const lights = [];
  for (let i = -2; i <= 2; i++) for (let j = -1; j <= 1; j++) lights.push([i * 7.5, j * 8]);
  const li = new THREE.InstancedMesh(bg, lm, lights.length);
  lights.forEach(([px, pz], i) => { mt.compose(new THREE.Vector3(px, H - 0.03, pz), new THREE.Quaternion(), new THREE.Vector3(5, 0.05, 0.9)); li.setMatrixAt(i, mt); });
  scene.add(li);
  return { bounds, sun };
}
