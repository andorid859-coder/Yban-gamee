// Roblox-style input: fixed left joystick + right-side drag camera. Pointer capture per pointerId.
export class Controls {
  constructor(joyEl, knobEl, camEl) {
    this.vec = { x: 0, y: 0 };      // smoothed, y>0 = forward
    this.raw = { x: 0, y: 0 };
    this.yaw = 0; this.pitch = 0.4; this.sens = 0.005;
    this.R = 45; this.dead = 0.12;
    this.joyId = null; this.camId = null; this.lx = 0; this.ly = 0;
    const j = joyEl;
    j.addEventListener('pointerdown', e => { if (this.joyId !== null) return; this.joyId = e.pointerId; j.setPointerCapture(e.pointerId); this._joy(e); e.preventDefault(); });
    j.addEventListener('pointermove', e => { if (e.pointerId === this.joyId) this._joy(e); });
    const end = e => { if (e.pointerId !== this.joyId) return; this.joyId = null; this.raw.x = this.raw.y = 0; knobEl.style.transform = ''; };
    j.addEventListener('pointerup', end); j.addEventListener('pointercancel', end); j.addEventListener('lostpointercapture', end);
    this.joyEl = j; this.knob = knobEl;
    camEl.addEventListener('pointerdown', e => { if (this.camId !== null) return; this.camId = e.pointerId; camEl.setPointerCapture(e.pointerId); this.lx = e.clientX; this.ly = e.clientY; });
    camEl.addEventListener('pointermove', e => {
      if (e.pointerId !== this.camId) return;
      this.yaw -= (e.clientX - this.lx) * this.sens;
      this.pitch = Math.min(1.2, Math.max(0.05, this.pitch - (e.clientY - this.ly) * this.sens));
      this.lx = e.clientX; this.ly = e.clientY;
    });
    const cend = e => { if (e.pointerId === this.camId) this.camId = null; };
    camEl.addEventListener('pointerup', cend); camEl.addEventListener('pointercancel', cend);
  }
  _joy(e) {
    const r = this.joyEl.getBoundingClientRect();
    let dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
    const len = Math.hypot(dx, dy);
    if (len > this.R) { dx *= this.R / len; dy *= this.R / len; }
    this.knob.style.transform = `translate(${dx}px,${dy}px)`;
    const m = Math.min(1, len / this.R);
    if (m < this.dead) { this.raw.x = this.raw.y = 0; return; }
    const s = (m - this.dead) / (1 - this.dead), l = Math.hypot(dx, dy) || 1;
    this.raw.x = (dx / l) * s; this.raw.y = (-dy / l) * s;
  }
  setSensitivity(v) { this.sens = v * 0.001; }
  update(dt) { // smooth acceleration / deceleration
    const k = 1 - Math.exp(-(this.raw.x || this.raw.y ? 14 : 10) * dt);
    this.vec.x += (this.raw.x - this.vec.x) * k; this.vec.y += (this.raw.y - this.vec.y) * k;
    if (Math.abs(this.vec.x) < 1e-3) this.vec.x = 0; if (Math.abs(this.vec.y) < 1e-3) this.vec.y = 0;
  }
}
