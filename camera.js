import * as THREE from 'three';
const _d = new THREE.Vector3(), _t = new THREE.Vector3();
export class FollowCamera {
  constructor(camera, bounds) { this.cam = camera; this.b = bounds; this.dist = 7; this.look = new THREE.Vector3(); this.pos = new THREE.Vector3(); this.ready = false; }
  update(dt, target, yaw, pitch) {
    _t.set(target.x, target.y + 1.4, target.z);
    const cp = Math.cos(pitch);
    _d.set(Math.sin(yaw) * cp, Math.sin(pitch), Math.cos(yaw) * cp).multiplyScalar(this.dist).add(_t);
    const m = 0.6; // keep camera inside the room (no wall clipping)
    _d.x = THREE.MathUtils.clamp(_d.x, -this.b.hx + m, this.b.hx - m);
    _d.z = THREE.MathUtils.clamp(_d.z, -this.b.hz + m, this.b.hz - m);
    _d.y = THREE.MathUtils.clamp(_d.y, 0.7, this.b.H - 0.7);
    if (!this.ready) { this.look.copy(_t); this.pos.copy(_d); this.ready = true; }
    const kp = 1 - Math.exp(-14 * dt), kl = 1 - Math.exp(-10 * dt);
    this.look.lerp(_t, kl); this.pos.lerp(_d, kp);
    this.cam.position.copy(this.pos); this.cam.lookAt(this.look);
  }
}
