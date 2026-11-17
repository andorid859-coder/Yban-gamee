import * as THREE from 'three';
import { D } from './environment.js';
const FW = 4.8, FH = 3.4, BORDER = 0.25, IW = FW - 2 * BORDER, IH = FH - 2 * BORDER;
export class PhotoFrames {
  constructor(scene) {
    this.items = [];
    const outer = new THREE.MeshStandardMaterial({ color: 0xf5f2ea, roughness: 0.4, metalness: 0.1 });
    const gold = new THREE.MeshStandardMaterial({ color: 0xc9a96a, roughness: 0.3, metalness: 0.85 });
    const back = new THREE.BoxGeometry(1, 1, 1), imgGeo = new THREE.PlaneGeometry(IW, IH);
    const hs = new THREE.Shape(); // heart
    hs.moveTo(0, -0.5); hs.bezierCurveTo(-0.9, 0.1, -0.5, 0.75, 0, 0.3); hs.bezierCurveTo(0.5, 0.75, 0.9, 0.1, 0, -0.5);
    const heartGeo = new THREE.ExtrudeGeometry(hs, { depth: 0.08, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 2, curveSegments: 10 });
    const heartM = new THREE.MeshStandardMaterial({ color: 0xe8879f, roughness: 0.4 });
    this.emptyM = new THREE.MeshBasicMaterial({ color: 0xe8e9ec });
    for (let i = 0; i < 6; i++) {
      const g = new THREE.Group(); g.position.set(-16 + i * 6.4, 4.6, -D / 2 + 0.07); scene.add(g);
      const bar = (w, h, d, x, y, z, m) => { const b = new THREE.Mesh(back, m); b.scale.set(w, h, d); b.position.set(x, y, z); g.add(b); };
      bar(FW, BORDER, 0.12, 0, (FH - BORDER) / 2, 0, outer); bar(FW, BORDER, 0.12, 0, -(FH - BORDER) / 2, 0, outer);
      bar(BORDER, FH - 2 * BORDER, 0.12, -(FW - BORDER) / 2, 0, 0, outer); bar(BORDER, FH - 2 * BORDER, 0.12, (FW - BORDER) / 2, 0, 0, outer);
      const t = 0.04, z = 0.065; // thin gold inner line
      bar(IW + 2 * t, t, 0.02, 0, IH / 2 + t / 2, z, gold); bar(IW + 2 * t, t, 0.02, 0, -IH / 2 - t / 2, z, gold);
      bar(t, IH, 0.02, -IW / 2 - t / 2, 0, z, gold); bar(t, IH, 0.02, IW / 2 + t / 2, 0, z, gold);
      const img = new THREE.Mesh(imgGeo, this.emptyM.clone()); img.position.z = 0.04; g.add(img);
      const heart = new THREE.Mesh(heartGeo, heartM); heart.scale.setScalar(0.5); heart.position.set(0, FH / 2 + 0.55, 0); g.add(heart);
      this.items.push({ img, tex: null });
    }
  }
  setPhoto(i, file) {
    const url = URL.createObjectURL(file), im = new Image();
    return new Promise((res, rej) => {
      im.onload = () => {
        URL.revokeObjectURL(url);
        const s = Math.min(1, 1536 / Math.max(im.width, im.height)), c = document.createElement('canvas');
        c.width = Math.round(im.width * s); c.height = Math.round(im.height * s); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
        const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
        const ia = c.width / c.height, fa = IW / IH; // cover-fit
        if (ia > fa) { tex.repeat.x = fa / ia; tex.offset.x = (1 - tex.repeat.x) / 2; } else { tex.repeat.y = ia / fa; tex.offset.y = (1 - tex.repeat.y) / 2; }
        const it = this.items[i]; it.tex?.dispose(); it.tex = tex;
        it.img.material.map = tex; it.img.material.color.set(0xffffff); it.img.material.needsUpdate = true; res();
      };
      im.onerror = () => { URL.revokeObjectURL(url); rej(new Error('Could not load image')); };
      im.src = url;
    });
  }
  bindUI(rowsEl) {
    for (let i = 0; i < 6; i++) {
      const row = document.createElement('div'); row.className = 'row';
      row.innerHTML = `<span>Frame ${i + 1}</span><label>Choose<input type="file" accept="image/*"></label>`;
      const inp = row.querySelector('input'), lab = row.querySelector('label');
      inp.addEventListener('change', async () => {
        const f = inp.files[0]; if (!f) return;
        try { await this.setPhoto(i, f); lab.firstChild.nodeValue = 'Replace'; lab.classList.add('set'); } catch (e) { lab.firstChild.nodeValue = 'Failed'; }
        inp.value = '';
      });
      rowsEl.appendChild(row);
    }
  }
}
