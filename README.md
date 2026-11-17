# Little Panda House
Single enclosed 40x30x9 room, 3D panda, Roblox-style touch controls, six empty photo frames.

## Run
ES modules need a web server (not file://). Three.js r165 loads from the jsDelivr CDN, so an internet connection is required.
    cd little-panda-house
    python3 -m http.server 8000
Open http://localhost:8000 (on Android: http://<your-PC-LAN-IP>:8000, same Wi-Fi). Or upload the folder to any static host.

## Controls
- Left joystick: move (camera-relative, dead zone, smoothed). Drag on the right side: orbit camera / tilt.
- Top-right photo icon: choose a photo for each of the six frames (replace any time) and set camera sensitivity.
- Mouse works too (pointer events), but there is no keyboard control.

## Files
index.html, style.css, main.js (loop, adaptive quality), character.js, controls.js, camera.js, environment.js, photoFrames.js

## Notes
- Floor "reflection" = low roughness + environment map (no planar mirror, for speed). Ambient occlusion is approximated by baseboards/trim and the soft contact shadow; no SSAO pass.
- Adaptive: pixel ratio, then shadow map size, then shadows off if FPS stays below ~40.
- Photos are downscaled to max 1536px; replaced textures are disposed.
