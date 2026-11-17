import * as THREE from 'three';
import { Controls } from './controls.js';
import { FollowCamera } from './camera.js';
import { Panda } from './character.js';
import { buildEnvironment } from './environment.js';
import { PhotoFrames } from './photoFrames.js';

const $ = id => document.getElementById(id);
const renderer = new THREE.WebGLRenderer({ canvas: $('c'), antialias: true, powerPreference: 'high-performance' });
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
const { bounds, sun } = buildEnvironment(scene, renderer);
const panda = new Panda(bounds); panda.root.position.set(0, 0, 6); scene.add(panda.root, panda.shadow);
const frames = new PhotoFrames(scene); frames.bindUI($('rows'));
const controls = new Controls($('joy'), $('knob'), $('camZone')); controls.yaw = 0;
const cam = new FollowCamera(camera, bounds);

// UI
$('menuBtn').onclick = () => { $('panel').hidden = !$('panel').hidden; };
$('close').onclick = () => { $('panel').hidden = true; };
$('sens').oninput = e => controls.setSensitivity(+e.target.value); controls.setSensitivity(5);

// adaptive quality
let maxRatio = Math.min(window.devicePixelRatio || 1, 2), ratio = maxRatio * (navigator.hardwareConcurrency <= 4 ? 0.8 : 1), shadowLvl = 2, acc = 0, nf = 0;
function resize() { renderer.setPixelRatio(ratio); renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); }
function setShadow(l) {
  sun.castShadow = l > 0;
  if (l > 0) { sun.shadow.map?.dispose(); sun.shadow.map = null; sun.shadow.mapSize.set(l === 2 ? 1024 : 512, l === 2 ? 1024 : 512); }
}
function adapt(dt) {
  acc += dt; nf++; if (acc < 2) return;
  const fps = nf / acc; acc = 0; nf = 0;
  if (fps < 40) { if (ratio > 0.7) { ratio = Math.max(0.7, ratio * 0.85); resize(); } else if (shadowLvl > 0) setShadow(--shadowLvl); }
  else if (fps > 57 && ratio < maxRatio) { ratio = Math.min(maxRatio, ratio * 1.1); resize(); }
}
addEventListener('resize', resize); addEventListener('orientationchange', () => setTimeout(resize, 200));
resize();

// loop (paused when tab hidden)
const clock = new THREE.Clock(); let raf = 0, first = true;
function frame() {
  raf = requestAnimationFrame(frame);
  const dt = Math.min(clock.getDelta(), 0.05);
  controls.update(dt); panda.update(dt, controls.vec, controls.yaw);
  cam.update(dt, panda.position, controls.yaw, controls.pitch);
  sun.position.set(panda.position.x + 7, 18, panda.position.z + 5); sun.target.position.copy(panda.position);
  renderer.render(scene, camera); adapt(dt);
  if (first) { first = false; $('loading').classList.add('done'); }
}
document.addEventListener('visibilitychange', () => { if (document.hidden) cancelAnimationFrame(raf); else { clock.getDelta(); raf = requestAnimationFrame(frame); } });
frame();
