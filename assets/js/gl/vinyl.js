// Vinyle 3D en WebGL (OGL) : disque incliné, sillons, reflet anisotrope, étiquette qui tourne,
// faisceaux laser dans la brume. Le défilement « scratche » le disque.
import { Renderer, Program, Mesh, Triangle, Texture } from '../vendor/ogl.esm.js';
import { state, on, hexToRgb } from '../core/state.js?v=20261028';

const vertex = /* glsl */ `#version 300 es
in vec2 uv; in vec2 position; out vec2 vUv;
void main(){ vUv = uv; gl_Position = vec4(position, 0., 1.); }`;

const fragment = /* glsl */ `#version 300 es
precision highp float;
in vec2 vUv; out vec4 fragColor;
uniform vec2 uRes; uniform float uTime; uniform float uRot; uniform vec2 uMouse; uniform vec2 uCenter; uniform float uRadius;
uniform float uLevel; uniform vec3 uTint; uniform float uFade; uniform sampler2D uLabel; uniform vec2 uTilt; uniform float uBeams;
uniform sampler2D uBg; uniform float uBgAsp; uniform float uHasBg; uniform sampler2D uHaze; uniform float uHasHaze;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
  return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y); }
float fbm(vec2 p){ float v = 0., a = .5; for (int i = 0; i < 3; i++){ v += a*noise(p); p *= 2.03; a *= .5; } return v + .06; }
mat3 rotX(float a){ float c = cos(a), s = sin(a); return mat3(1,0,0, 0,c,s, 0,-s,c); }
mat3 rotY(float a){ float c = cos(a), s = sin(a); return mat3(c,0,-s, 0,1,0, s,0,c); }

vec3 background(vec2 frag){
  vec2 uv = frag / uRes; float asp = uRes.x / uRes.y;
  vec3 col = vec3(.012, .014, .018);
  float hz;
  if (uHasHaze > .5) hz = texture(uHaze, vec2(uv.x*asp*.55 + uTime*.012, uv.y*.85 - uTime*.007)).g * 1.35;
  else hz = fbm(vec2(uv.x*asp*2.2, uv.y*2.2) + vec2(uTime*.03, -uTime*.02));
  if (uHasBg > .5) {
    vec2 b = uv - .5;
    if (asp > uBgAsp) b.y *= uBgAsp / asp; else b.x *= asp / uBgAsp;
    b = b * (.96 - .02 * sin(uTime * .05)) + .5 - uMouse * .008;
    vec3 bg = texture(uBg, b).rgb;
    col = mix(col, pow(bg, vec3(1.08)) * (.6 + uLevel * .12), uBeams);
  }
  vec2 o = vec2(.5*asp, 1.1); vec2 p = vec2(uv.x*asp, uv.y); vec2 d = p - o;
  float ang = atan(d.x, -d.y); float dist = length(d);
  float beams = 0.;
  for (int i = 0; i < 7; i++){
    float fi = float(i);
    float a = (fi - 3.) * .2 + sin(uTime*.35 + fi*1.7) * .07;
    float w = .011 + .006 * sin(fi*3.1);
    beams += exp(-pow((ang - a)/w, 2.)) * (.55 + .45*sin(fi*2.3 + uTime*.5));
  }
  beams *= smoothstep(1.7, 0., dist) * (.35 + .9*hz) * uBeams * (1. - uHasBg * .55);
  float wb = 0.;
  for (int i = 0; i < 2; i++){ float fi = float(i); float a = sin(uTime*.22 + fi*3.14) * .55; wb += exp(-pow((ang - a)/.006, 2.)); }
  wb *= smoothstep(1.5, 0., dist) * (.3 + .7*hz) * .5 * uBeams;
  col += uTint * beams * (.42 + uLevel*.3);
  col += vec3(.9, .95, 1.) * wb * .35;
  col += uTint * hz * .05 * (1. - uHasBg * .4) + vec3(hz*hz*.03);
  col += uTint * .25 * exp(-dist*6.) * uBeams;
  float sp = step(.9975, hash(floor(frag/3.) + floor(uTime*2.)));
  col += sp * .35 * beams;
  return col;
}

void main(){
  vec2 frag = vUv * uRes;
  vec3 col = background(frag);
  vec2 p = (frag - uCenter) / uRadius;
  float f = 3.2; vec3 ro = vec3(0., 0., -f); vec3 rd = normalize(vec3(p, f));
  mat3 R = rotX(uTilt.x + uMouse.y*.12) * rotY(uTilt.y + uMouse.x*.2);
  vec3 n = R * vec3(0., 0., -1.); vec3 ex = R * vec3(1., 0., 0.); vec3 ey = R * vec3(0., 1., 0.);
  float shadow = smoothstep(1.3, .55, length((p - vec2(.08, -.2)) * vec2(1., 1.7)));
  col *= 1. - shadow * .6;
  float denom = dot(rd, n);
  if (abs(denom) > 1e-4){
    float t = -dot(ro, n) / denom; vec3 hit = ro + rd*t;
    vec2 q = vec2(dot(hit, ex), dot(hit, ey)); float r = length(q);
    float aa = fwidth(r) * 1.5;
    float inside = 1. - smoothstep(1. - aa, 1., r);
    if (inside > 0.){
      float theta = atan(q.y, q.x); float rotA = theta - uRot;
      float K = 210.; float gr = sin(r*K); float gaa = clamp(1. - fwidth(r*K)*.35, 0., 1.);
      float tracks = smoothstep(0., .008, abs(r-.56)) * smoothstep(0., .008, abs(r-.68)) * smoothstep(0., .008, abs(r-.8)) * smoothstep(0., .008, abs(r-.9));
      float wob = noise(vec2(rotA*3., r*40.))*.5 + noise(vec2(rotA*12. + 3., r*8.))*.5;
      float L = .75 + uMouse.x*.3;
      float sheen = pow(abs(cos(theta - L)), 18.); float sheen2 = pow(abs(cos(theta - L - 1.2)), 40.) * .5;
      float gl = (.5 + .5*gr*gaa) * tracks;
      vec3 dcol = vec3(.022, .023, .026) + vec3(.3, .32, .34) * (sheen + sheen2) * gl * (.65 + .35*wob);
      dcol += uTint * sheen * .07 * (.5 + uLevel);
      dcol += vec3(.022) * wob * tracks;
      dcol += vec3(.08) * (1. - tracks) * (.4 + sheen);
      dcol += vec3(.35) * smoothstep(.975, .995, r) * (.3 + .7*sheen);
      if (r < .34){
        float c = cos(-uRot), s = sin(-uRot);
        vec2 lq = vec2(c*q.x - s*q.y, s*q.x + c*q.y);
        vec4 lab = texture(uLabel, lq / .335 * .5 + .5);
        float lin = 1. - smoothstep(.335 - aa, .335, r);
        dcol = mix(dcol, lab.rgb * (.82 + .3*sheen), lin);
        float hole = 1. - smoothstep(.02 - aa, .02, r);
        dcol = mix(dcol, vec3(.75, .76, .78) * (.4 + sheen), hole);
      }
      col = mix(col, dcol, inside);
    }
  }
  vec2 v = vUv - .5; col *= 1. - dot(v, v) * .9;
  col += (hash(frag + uTime) - .5) * .015;
  fragColor = vec4(col * uFade, 1.);
}`;

function drawLabel(cv, tint) {
  const S = cv.width; const c = cv.getContext('2d'); const R = S / 2;
  c.clearRect(0, 0, S, S);
  c.fillStyle = tint; c.fillRect(0, 0, S, S);
  c.save(); c.translate(R, R);
  c.strokeStyle = 'rgba(7,8,10,.55)'; c.lineWidth = S * 0.004;
  [0.93, 0.62].forEach((k) => { c.beginPath(); c.arc(0, 0, R * k, 0, Math.PI * 2); c.stroke(); });
  c.fillStyle = '#07080a'; c.textAlign = 'center'; c.textBaseline = 'middle';
  const arcText = (txt, radius, start, size, weight, dir = 1) => {
    c.font = `${weight} ${size}px Unbounded, "Arial Black", sans-serif`;
    const chars = [...txt]; const widths = chars.map((ch) => c.measureText(ch).width + size * 0.08);
    const total = widths.reduce((a, b) => a + b, 0); let a = start - (dir * total / radius) / 2;
    chars.forEach((ch, i) => { const half = widths[i] / 2 / radius; a += dir * half; c.save(); c.rotate(a); c.translate(0, -dir * radius); c.fillText(ch, 0, 0); c.restore(); a += dir * half; });
  };
  arcText('SONORISATION', R * 0.78, 0, S * 0.085, 750, 1);
  arcText('DJ · ANIMATION · BRUAY-LA-BUISSIÈRE', R * 0.74, Math.PI, S * 0.04, 500, -1);
  c.font = `700 ${S * 0.11}px Unbounded, "Arial Black", sans-serif`; c.fillText('A', -R * 0.36, 0);
  c.font = `600 ${S * 0.06}px Unbounded, "Arial Black", sans-serif`; c.fillText('33⅓', R * 0.36, -S * 0.012);
  c.font = `500 ${S * 0.03}px "JetBrains Mono", monospace`; c.fillText('TR / MIN', R * 0.36, S * 0.05); c.fillText('FACE', -R * 0.36, S * 0.075);
  c.restore();
}

export function initVinyl(canvas) {
  const { gsap } = window;
  let renderer;
  let ok = false;
  try { ok = !!document.createElement('canvas').getContext('webgl2'); } catch (e) { ok = false; }
  if (!ok) { document.documentElement.classList.add('no-webgl'); return null; }
  let dpr = Math.min(window.devicePixelRatio || 1, window.innerWidth < 900 ? 1.25 : 1.35);
  try { renderer = new Renderer({ canvas, dpr, alpha: false, antialias: false, depth: false, webgl: 2 }); }
  catch (e) { renderer = null; }
  if (!renderer || !renderer.gl || !renderer.isWebgl2) { document.documentElement.classList.add('no-webgl'); return null; }
  const gl = renderer.gl; gl.clearColor(0.03, 0.03, 0.04, 1);

  const labelCanvas = document.createElement('canvas'); labelCanvas.width = labelCanvas.height = 1024;
  drawLabel(labelCanvas, state.tint);
  const label = new Texture(gl, { image: labelCanvas, generateMipmaps: true, minFilter: gl.LINEAR_MIPMAP_LINEAR });
  const tint = hexToRgb(state.tint).map((v) => v / 255);

  const uniforms = {
    uRes: { value: [1, 1] }, uTime: { value: 0 }, uRot: { value: 0 }, uMouse: { value: [0, 0] }, uCenter: { value: [0, 0] }, uRadius: { value: 300 },
    uLevel: { value: 0 }, uTint: { value: tint.slice() }, uFade: { value: 0 }, uLabel: { value: label }, uTilt: { value: [0.82, -0.28] }, uBeams: { value: 0 },
    uBg: { value: new Texture(gl, { generateMipmaps: false, minFilter: gl.LINEAR }) }, uBgAsp: { value: 1.5 }, uHasBg: { value: 0 },
    uHaze: { value: new Texture(gl, { generateMipmaps: false, minFilter: gl.LINEAR, wrapS: gl.MIRRORED_REPEAT, wrapT: gl.MIRRORED_REPEAT }) }, uHasHaze: { value: 0 },
  };
  // Photos d'ambiance (Grok) : fond derrière le disque et texture de brume
  const loadTex = (src, tex, onDone) => { const img = new Image(); img.decoding = 'async'; img.onload = () => { tex.image = img; onDone(img); }; img.src = src; };
  let bgMobile = null;
  const loadBg = () => {
    const mob = (canvas.parentElement.clientWidth || window.innerWidth) < 900;
    if (bgMobile === mob) return; bgMobile = mob;
    loadTex(mob ? 'assets/img/grok/g02-accueil-ouverture-784.webp' : 'assets/img/grok/g01-accueil-ouverture-1168.webp', uniforms.uBg.value, (img) => { uniforms.uBgAsp.value = img.naturalWidth / img.naturalHeight; uniforms.uHasBg.value = 1; });
  };
  loadBg();
  window.addEventListener('resize', loadBg);
  loadTex('assets/img/grok/g29-texture-brume-640.webp', uniforms.uHaze.value, () => { uniforms.uHasHaze.value = 1; });
  const program = new Program(gl, { vertex, fragment, uniforms, depthTest: false, depthWrite: false });
  const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });

  const layout = { cx: 0.7, cy: 0.48, r: 1, scroll: 0, intro: 0 };
  const targetTint = tint.slice();
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  let W = 1, H = 1, running = false, visible = true, rotSpeed = 0;

  const host = canvas.parentElement;
  const resize = () => {
    W = host.clientWidth; H = host.clientHeight;
    renderer.setSize(W, H);
    uniforms.uRes.value = [gl.drawingBufferWidth, gl.drawingBufferHeight];
  };
  resize();
  window.addEventListener('resize', resize);

  window.addEventListener('pointermove', (e) => { mouse.tx = (e.clientX / window.innerWidth) * 2 - 1; mouse.ty = -((e.clientY / window.innerHeight) * 2 - 1); }, { passive: true });
  on('leave', () => { gaveUp = true; visible = false; });
  on('mood', () => {
    drawLabel(labelCanvas, state.tint); label.needsUpdate = true;
    const t = hexToRgb(state.tint).map((v) => v / 255); targetTint[0] = t[0]; targetTint[1] = t[1]; targetTint[2] = t[2];
  });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { drawLabel(labelCanvas, state.tint); label.needsUpdate = true; });

  const io = new IntersectionObserver(([e]) => { if (gaveUp) return; visible = e.isIntersecting; if (visible) start(); }, { threshold: 0 });
  io.observe(canvas);

  let last = performance.now();
  // Résolution adaptative : si l'ordinateur peine (< ~45 images/s), on réduit la définition du rendu
  let acc = 0, frames = 0, gaveUp = false;
  const adapt = (rawDt) => {
    acc += rawDt; frames += 1;
    if (acc >= 1 && frames >= 4) {
      const avg = acc / frames; acc = 0; frames = 0;
      if (avg > 1 / 45 && dpr > 0.5) { dpr = Math.max(0.5, dpr - 0.25); renderer.dpr = dpr; resize(); }
      else if (avg > 1 / 20 && dpr <= 0.5 && !gaveUp) {
        // Appareil trop lent même en basse définition : on passe au vinyle CSS
        gaveUp = true; visible = false; document.documentElement.classList.add('no-webgl');
        const el = document.querySelector('.hero__fallback [data-spin]'); if (el) window.gsap.to(el, { rotation: 360, duration: 1.8, ease: 'none', repeat: -1 });
      }
    }
  };
  const frame = (now) => {
    if (!visible || document.hidden) { running = false; return; }
    const rawDt = (now - last) / 1000;
    const dt = Math.min(0.05, rawDt); last = now;
    adapt(Math.min(0.2, rawDt));
    const pr = renderer.dpr;
    const mobile = W < 900;
    const vel = state.lenis ? state.lenis.velocity : 0;
    const target = 3.49 + Math.max(-28, Math.min(28, vel * 0.9)); // 33⅓ tr/min + scratch
    rotSpeed += (target - rotSpeed) * 0.12;
    uniforms.uRot.value += rotSpeed * dt;
    uniforms.uTime.value += dt;
    mouse.x += (mouse.tx - mouse.x) * 0.05; mouse.y += (mouse.ty - mouse.y) * 0.05;
    uniforms.uMouse.value = [mouse.x, mouse.y];
    for (let i = 0; i < 3; i++) uniforms.uTint.value[i] += (targetTint[i] - uniforms.uTint.value[i]) * 0.06;
    uniforms.uLevel.value = state.level;
    const s = layout.scroll; const k = layout.intro;
    const vh = window.innerHeight;
    const short = vh < 560 && W > vh; // téléphone à l'horizontale : le disque se range à droite
    const portrait = mobile && !short && vh >= W;
    // Téléphone en portrait : le disque occupe l'espace réservé en CSS sous l'en-tête (min(62vw, 30svh))
    const disc = Math.min(W * 0.62, vh * (vh < 700 ? 0.24 : 0.30));
    const baseR = short ? vh * 0.34 : portrait ? disc * 0.5 : mobile ? Math.min(W * 0.3, vh * 0.3) : Math.min(vh * 0.37, W * 0.27);
    const cx = (short ? 0.84 : portrait ? 0.5 : 0.69) * W + (mobile ? 0 : s * W * 0.06);
    const cyTop = short ? vh * 0.5 : portrait ? 72 + 10 + disc * 0.5 : Math.min(H, vh) * 0.47;
    const cy = H - cyTop + s * Math.min(H, vh) * 0.28; // GL : origine en bas
    uniforms.uCenter.value = [cx * pr, cy * pr];
    uniforms.uRadius.value = baseR * (0.55 + 0.45 * k) * (1 - s * 0.2) * pr;
    uniforms.uTilt.value = [0.82 + (1 - k) * 0.5 + s * 0.25, -0.28 - (1 - k) * 0.4];
    uniforms.uFade.value = Math.min(1, k * 1.6) * (1 - s * 0.55);
    uniforms.uBeams.value = k;
    renderer.render({ scene: mesh });
    requestAnimationFrame(frame);
  };
  function start() { if (running) return; running = true; last = performance.now(); requestAnimationFrame(frame); }
  document.addEventListener('visibilitychange', () => { if (!document.hidden && visible && !gaveUp) start(); });
  start();

  return {
    layout,
    intro(delay = 0) { gsap.to(layout, { intro: 1, duration: 2.2, delay, ease: 'expo.out' }); },
  };
}
