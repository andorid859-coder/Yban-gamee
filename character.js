import * as THREE from 'three';
const sphere = new THREE.SphereGeometry(1, 24, 16);
const M = (c, r = 0.7) => new THREE.MeshStandardMaterial({ color: c, roughness: r });
const white = M(0xfbfbfb, 0.75), black = M(0x1b1b1f, 0.6), pink = M(0xffb3c1, 0.9), eyeW = new THREE.MeshBasicMaterial({ color: 0xffffff });
const mouthM = new THREE.MeshBasicMaterial({ color: 0x2a2a2a });
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));

function part(mat, x, y, z, sx, sy = sx, sz = sx, parent) {
  const m = new THREE.Mesh(sphere, mat); m.position.set(x, y, z); m.scale.set(sx, sy, sz);
  if (parent) parent.add(m); return m;
}
export class Panda {
  constructor(bounds) {
    this.b = bounds; this.root = new THREE.Group(); this.speed = 0; this.phase = 0; this.t = 0; this.face = 0; this.maxSpeed = 5;
    const r = this.root;
    this.body = part(white, 0, 0.95, 0, 0.62, 0.62, 0.55, r); this.body.castShadow = true;
    this.head = new THREE.Group(); this.head.position.set(0, 1.6, 0.05); r.add(this.head);
    const h = part(white, 0, 0, 0, 0.62, 0.58, 0.58, this.head); h.castShadow = true;
    for (const s of [-1, 1]) {
      part(black, s * 0.43, 0.46, -0.02, 0.19, 0.19, 0.12, this.head);
      const p = part(black, s * 0.24, 0.08, 0.47, 0.17, 0.22, 0.1, this.head); p.rotation.z = s * 0.45;
      part(eyeW, s * 0.235, 0.11, 0.545, 0.065, 0.07, 0.04, this.head);       // eye highlight base
      part(black, s * 0.235, 0.1, 0.56, 0.045, 0.05, 0.03, this.head);        // pupil
      part(pink, s * 0.40, -0.12, 0.43, 0.1, 0.07, 0.04, this.head);          // cheeks
    }
    part(black, 0, -0.03, 0.57, 0.09, 0.06, 0.05, this.head);                  // nose
    const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.011, 6, 14, Math.PI), mouthM);
    mouth.position.set(0, -0.1, 0.565); mouth.rotation.z = Math.PI; this.head.add(mouth);
    // limbs on pivots so they swing from the shoulder / hip
    const limb = (x, y, sx, sy, mat) => { const g = new THREE.Group(); g.position.set(x, y, 0); r.add(g); const m = part(mat, 0, -sy * 0.6, 0, sx, sy, sx, g); m.castShadow = true; return g; };
    this.legL = limb(-0.3, 0.55, 0.2, 0.32, black); this.legR = limb(0.3, 0.55, 0.2, 0.32, black);
    this.armL = limb(-0.6, 1.2, 0.17, 0.33, black); this.armR = limb(0.6, 1.2, 0.17, 0.33, black);
    this.armL.rotation.z = 0.2; this.armR.rotation.z = -0.2;
    part(white, 0, 0.78, -0.5, 0.17, 0.17, 0.17, r); // tail
    // soft contact shadow
    const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
    const g = x.createRadialGradient(32, 32, 2, 32, 32, 32); g.addColorStop(0, 'rgba(0,0,0,.5)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g; x.fillRect(0, 0, 64, 64);
    this.shadow = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.2), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }));
    this.shadow.rotation.x = -Math.PI / 2; this.shadow.position.y = 0.012; this.shadow.renderOrder = 1;
  }
  get position() { return this.root.position; }
  update(dt, joy, camYaw) {
    this.t += dt;
    const s = Math.sin(camYaw), c = Math.cos(camYaw);
    // camera forward = (-sin, -cos); camera right = (cos, -sin)
    let dx = -s * joy.y + c * joy.x, dz = -c * joy.y - s * joy.x;
    const mag = Math.min(1, Math.hypot(joy.x, joy.y)), len = Math.hypot(dx, dz);
    if (len > 1e-4) { dx /= len; dz /= len; }
    const target = mag * this.maxSpeed;
    this.speed += (target - this.speed) * (1 - Math.exp(-10 * dt));
    if (mag > 0.01 && len > 1e-4) {
      const want = Math.atan2(dx, dz);
      this.face += wrap(want - this.face) * (1 - Math.exp(-12 * dt));
      this.root.rotation.y = this.face;
      const p = this.root.position, m = 0.7;
      p.x = THREE.MathUtils.clamp(p.x + dx * this.speed * dt, -this.b.hx + m, this.b.hx - m);
      p.z = THREE.MathUtils.clamp(p.z + dz * this.speed * dt, -this.b.hz + m, this.b.hz - m);
    }
    const amt = Math.min(1, this.speed / 3);
    this.phase += this.speed * dt * 2.4;
    const sw = Math.sin(this.phase);
    this.legL.rotation.x = sw * 0.8 * amt; this.legR.rotation.x = -sw * 0.8 * amt;
    this.armL.rotation.x = -sw * 0.7 * amt; this.armR.rotation.x = sw * 0.7 * amt;
    const bob = Math.abs(Math.cos(this.phase)) * 0.07 * amt;
    const breathe = Math.sin(this.t * 2) * 0.015 * (1 - amt);
    this.body.position.y = 0.95 + bob; this.body.scale.y = 0.62 * (1 + breathe);
    this.head.position.y = 1.6 + bob + breathe * 0.5;
    this.head.rotation.z = Math.sin(this.t * 1.2) * 0.04 * (1 - amt) + sw * 0.03 * amt;
    this.shadow.position.x = this.root.position.x; this.shadow.position.z = this.root.position.z;
    const ss = 1 - bob * 1.5; this.shadow.scale.set(ss, ss, ss);
  }
}
