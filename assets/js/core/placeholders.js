// Visuels provisoires dessinés en code (en attendant les images Grok). Jamais de cadre vide.
import { $$, hexToRgb } from './state.js?v=20261027';

const TAU = Math.PI * 2;
function rng(seed) { let s = (seed * 2654435761) >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
const rgba = (rgb, a) => `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a})`;
const GREEN = [114, 225, 91]; const WHITE = [242, 241, 236]; const WARM = [255, 190, 110]; const RED = [255, 70, 60];

function bg(c, w, h, tint, r, warm = false) {
  c.fillStyle = warm ? '#0b0806' : '#060708'; c.fillRect(0, 0, w, h);
  const g = c.createRadialGradient(w * (0.3 + r() * 0.4), h * (0.25 + r() * 0.3), 0, w * 0.5, h * 0.5, Math.max(w, h) * 0.85);
  g.addColorStop(0, rgba(tint, 0.2)); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, 0, w, h);
}
function haze(c, w, h, cols, r, n = 9, a = 0.06) {
  c.save(); c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const x = r() * w, y = r() * h, rad = (0.18 + r() * 0.4) * Math.max(w, h); const col = cols[i % cols.length];
    const g = c.createRadialGradient(x, y, 0, x, y, rad); g.addColorStop(0, rgba(col, a * (0.5 + r()))); g.addColorStop(1, rgba(col, 0));
    c.fillStyle = g; c.fillRect(0, 0, w, h);
  }
  c.restore();
}
function beams(c, w, h, r, { ox, oy, n = 7, spread = 1, base = Math.PI / 2, len = 1.6, cols = [GREEN], alpha = 0.32, width = 0.035 }) {
  c.save(); c.globalCompositeOperation = 'lighter';
  const L = Math.max(w, h) * len;
  for (let i = 0; i < n; i++) {
    const a = base + (i / Math.max(1, n - 1) - 0.5) * spread + (r() - 0.5) * 0.12; const wd = width * (0.5 + r());
    const col = cols[i % cols.length];
    const x1 = ox + Math.cos(a - wd) * L, y1 = oy + Math.sin(a - wd) * L, x2 = ox + Math.cos(a + wd) * L, y2 = oy + Math.sin(a + wd) * L;
    const g = c.createLinearGradient(ox, oy, ox + Math.cos(a) * L, oy + Math.sin(a) * L);
    g.addColorStop(0, rgba(col, alpha * (0.7 + r() * 0.5))); g.addColorStop(0.55, rgba(col, alpha * 0.25)); g.addColorStop(1, rgba(col, 0));
    c.fillStyle = g; c.beginPath(); c.moveTo(ox, oy); c.lineTo(x1, y1); c.lineTo(x2, y2); c.closePath(); c.fill();
    c.strokeStyle = rgba(col, alpha * 0.9); c.lineWidth = Math.max(1, w / 900);
    c.beginPath(); c.moveTo(ox, oy); c.lineTo(ox + Math.cos(a) * L * 0.75, oy + Math.sin(a) * L * 0.75); c.stroke();
  }
  const g = c.createRadialGradient(ox, oy, 0, ox, oy, Math.max(w, h) * 0.08); g.addColorStop(0, rgba(WHITE, 0.6)); g.addColorStop(1, rgba(WHITE, 0));
  c.fillStyle = g; c.fillRect(0, 0, w, h);
  c.restore();
}
function bokeh(c, w, h, r, { n = 30, cols = [WARM], min = 0.01, max = 0.06, a = 0.35, y0 = 0, y1 = 1 }) {
  c.save(); c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const x = r() * w, y = (y0 + r() * (y1 - y0)) * h, rad = (min + r() * (max - min)) * Math.max(w, h); const col = cols[i % cols.length]; const al = a * (0.3 + r() * 0.7);
    const g = c.createRadialGradient(x, y, 0, x, y, rad); g.addColorStop(0, rgba(col, al * 0.55)); g.addColorStop(0.82, rgba(col, al * 0.7)); g.addColorStop(1, rgba(col, 0));
    c.fillStyle = g; c.beginPath(); c.arc(x, y, rad, 0, TAU); c.fill();
  }
  c.restore();
}
function crowd(c, w, h, r, { y = 0.78, arms = 0.4, scale = 1, color = '#020203' }) {
  c.save(); c.fillStyle = color; c.strokeStyle = color; c.lineCap = 'round';
  const base = h * y; let x = -20 * scale;
  while (x < w + 40) {
    const s = (0.75 + r() * 0.5) * scale * Math.max(w, h) / 900; const head = 14 * s; const hy = base - (r() * 18 * s) - 40 * s;
    c.beginPath(); c.ellipse(x, hy, head * 0.85, head, 0, 0, TAU); c.fill();
    c.beginPath(); c.moveTo(x - 34 * s, h); c.lineTo(x - 30 * s, hy + 30 * s); c.quadraticCurveTo(x, hy + 14 * s, x + 30 * s, hy + 30 * s); c.lineTo(x + 34 * s, h); c.fill();
    if (r() < arms) {
      c.lineWidth = 9 * s; const side = r() < 0.5 ? -1 : 1; const ang = -Math.PI / 2 + side * (0.25 + r() * 0.4);
      const sx = x + side * 24 * s, sy = hy + 32 * s; const ex = sx + Math.cos(ang) * 70 * s, ey = sy + Math.sin(ang) * 70 * s;
      c.beginPath(); c.moveTo(sx, sy); c.quadraticCurveTo(sx + side * 10 * s, sy - 30 * s, ex, ey); c.stroke();
      c.beginPath(); c.arc(ex, ey, 6 * s, 0, TAU); c.fill();
    }
    x += (38 + r() * 30) * s;
  }
  c.fillRect(0, base + 10 * scale, w, h);
  c.restore();
}
function vignette(c, w, h, s = 0.8) {
  const g = c.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.25, w / 2, h / 2, Math.max(w, h) * 0.75);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${s})`); c.fillStyle = g; c.fillRect(0, 0, w, h);
}
function sparkle(c, w, h, r, n = 60, col = WHITE) {
  c.save(); c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) { c.fillStyle = rgba(col, 0.2 + r() * 0.6); const s = 0.6 + r() * 1.6; c.fillRect(r() * w, r() * h, s, s); }
  c.restore();
}
function disc(c, x, y, R, r, label = GREEN, { grooves = true, sheen = 0.2 } = {}) {
  c.save(); c.translate(x, y);
  c.fillStyle = '#0a0b0d'; c.beginPath(); c.arc(0, 0, R, 0, TAU); c.fill();
  if (grooves) { for (let k = 0.36; k < 0.98; k += 0.012) { c.strokeStyle = `rgba(255,255,255,${0.025 + r() * 0.03})`; c.lineWidth = 1; c.beginPath(); c.arc(0, 0, R * k, 0, TAU); c.stroke(); } }
  const g = c.createConicGradient ? c.createConicGradient(r() * TAU, 0, 0) : null;
  if (g) { g.addColorStop(0, `rgba(255,255,255,0)`); g.addColorStop(0.08, `rgba(255,255,255,${sheen})`); g.addColorStop(0.16, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,0)'); g.addColorStop(0.58, `rgba(255,255,255,${sheen * 0.8})`); g.addColorStop(0.66, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g; c.beginPath(); c.arc(0, 0, R, 0, TAU); c.fill(); }
  c.fillStyle = rgba(label, 1); c.beginPath(); c.arc(0, 0, R * 0.33, 0, TAU); c.fill();
  c.fillStyle = '#050506'; c.beginPath(); c.arc(0, 0, R * 0.025, 0, TAU); c.fill();
  c.restore();
}

const DRAW = {
  beams(c, w, h, t, r) { bg(c, w, h, t, r); haze(c, w, h, [t, WHITE], r, 10, 0.05); beams(c, w, h, r, { ox: w * 0.5, oy: -h * 0.05, n: 9, spread: 1.5, cols: [t, t, WHITE], alpha: 0.3 }); sparkle(c, w, h * 0.7, r, 70); crowd(c, w, h, r, { y: 0.8, arms: 0.45 }); vignette(c, w, h, 0.7); },
  deck(c, w, h, t, r) {
    bg(c, w, h, t, r); haze(c, w, h, [t], r, 6, 0.05);
    const R = Math.min(w, h) * 0.55; const cx = w * 0.32, cy = h * 0.62;
    c.save(); c.translate(cx, cy); c.scale(1, 0.42);
    c.fillStyle = '#0d0f12'; c.beginPath(); c.arc(0, 0, R * 1.08, 0, TAU); c.fill();
    for (let k = 0.3; k < 1; k += 0.02) { c.strokeStyle = `rgba(255,255,255,${0.03 + r() * 0.05})`; c.lineWidth = 1.2; c.beginPath(); c.arc(0, 0, R * k, 0, TAU); c.stroke(); }
    c.strokeStyle = rgba(t, 0.8); c.lineWidth = 3; c.beginPath(); c.arc(0, 0, R * 1.02, -2.2, 0.4); c.stroke();
    c.restore();
    for (let i = 0; i < 8; i++) { const px = w * 0.62 + (i % 4) * w * 0.07, py = h * (0.55 + Math.floor(i / 4) * 0.12); c.fillStyle = rgba(i === 2 || i === 5 ? t : [40, 44, 50], i === 2 || i === 5 ? 0.9 : 1); c.beginPath(); c.roundRect ? c.roundRect(px, py, w * 0.055, h * 0.08, 6) : c.rect(px, py, w * 0.055, h * 0.08); c.fill(); }
    haze(c, w, h, [t], r, 3, 0.08); vignette(c, w, h, 0.85);
  },
  lounge(c, w, h, t, r) { bg(c, w, h, t, r, true); bokeh(c, w, h, r, { n: 40, cols: [t, WARM, [255, 230, 190]], min: 0.015, max: 0.07, a: 0.32, y0: 0, y1: 0.62 });
    c.fillStyle = '#070504'; c.fillRect(0, h * 0.66, w, h); const g = c.createLinearGradient(0, h * 0.655, 0, h * 0.7); g.addColorStop(0, rgba(t, 0.6)); g.addColorStop(1, rgba(t, 0)); c.fillStyle = g; c.fillRect(0, h * 0.655, w, h * 0.05);
    for (let i = 0; i < 4; i++) { const x = w * (0.2 + i * 0.18 + r() * 0.04), y = h * 0.66; c.strokeStyle = rgba(WHITE, 0.35); c.lineWidth = 2; c.beginPath(); c.moveTo(x - 14, y); c.lineTo(x - 18, y - h * 0.12); c.moveTo(x + 14, y); c.lineTo(x + 18, y - h * 0.12); c.stroke(); c.fillStyle = rgba(t, 0.25); c.fillRect(x - 15, y - h * 0.07, 30, h * 0.07); }
    haze(c, w, h, [t, WARM], r, 6, 0.06); vignette(c, w, h, 0.7); },
  ball(c, w, h, t, r) {
    bg(c, w, h, t, r); const cx = w * 0.62, cy = h * 0.38, R = Math.min(w, h) * 0.22;
    c.save(); c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 90; i++) { const a = r() * TAU, d = R * (1.4 + r() * 3); const x = cx + Math.cos(a) * d * 1.4, y = cy + Math.sin(a) * d * 0.9; c.fillStyle = rgba(r() < 0.5 ? t : (r() < 0.5 ? [255, 160, 80] : GREEN), 0.25 + r() * 0.4); c.beginPath(); c.ellipse(x, y, 3 + r() * 6, 2 + r() * 3, a, 0, TAU); c.fill(); }
    c.restore();
    c.save(); c.beginPath(); c.arc(cx, cy, R, 0, TAU); c.clip(); c.fillStyle = '#1a1b1f'; c.fillRect(cx - R, cy - R, R * 2, R * 2);
    const s = R / 7; for (let y = -R; y < R; y += s) for (let x = -R; x < R; x += s) { const v = r(); c.fillStyle = v > 0.92 ? '#fff' : v > 0.8 ? rgba(t, 0.9) : `rgba(${120 + v * 100 | 0},${120 + v * 100 | 0},${130 + v * 100 | 0},1)`; c.fillRect(cx + x + 1, cy + y + 1, s - 2, s - 2); }
    const g = c.createRadialGradient(cx - R * 0.4, cy - R * 0.4, 0, cx, cy, R); g.addColorStop(0, 'rgba(255,255,255,.25)'); g.addColorStop(1, 'rgba(0,0,0,.65)'); c.fillStyle = g; c.fillRect(cx - R, cy - R, R * 2, R * 2); c.restore();
    c.strokeStyle = 'rgba(255,255,255,.3)'; c.lineWidth = 2; c.beginPath(); c.moveTo(cx, 0); c.lineTo(cx, cy - R); c.stroke();
    beams(c, w, h, r, { ox: cx, oy: cy, n: 6, spread: 2.6, base: Math.PI * 0.75, cols: [t, WHITE], alpha: 0.12, len: 1.2 });
    for (let i = 0; i < 6; i++) disc(c, w * (0.08 + i * 0.07), h * 0.98, Math.min(w, h) * 0.18, r, i % 2 ? t : [40, 40, 44], { grooves: false, sheen: 0.12 });
    vignette(c, w, h, 0.7);
  },
  grid(c, w, h, t, r) {
    bg(c, w, h, t, r); const cols = 9; const bw = w / (cols * 2.2);
    for (let i = 0; i < cols; i++) { const x = w * 0.1 + i * (w * 0.8 / (cols - 1)); for (let j = 0; j < 14; j++) { const y = h * 0.1 + j * h * 0.045; const on = r() < 0.55; c.fillStyle = on ? rgba(j % 5 === 0 ? WHITE : t, 0.85) : 'rgba(255,255,255,.05)'; c.fillRect(x - bw / 2, y, bw, h * 0.03); } }
    c.save(); c.globalCompositeOperation = 'lighter'; c.filter = 'blur(12px)'; c.globalAlpha = 0.5; c.drawImage(c.canvas, 0, 0); c.restore();
    const g = c.createLinearGradient(0, h * 0.75, 0, h); g.addColorStop(0, '#060708'); g.addColorStop(1, rgba(t, 0.15)); c.fillStyle = g; c.fillRect(0, h * 0.75, w, h);
    c.strokeStyle = rgba(t, 0.25); for (let i = -10; i <= 10; i++) { c.beginPath(); c.moveTo(w / 2 + i * w * 0.02, h * 0.75); c.lineTo(w / 2 + i * w * 0.2, h); c.stroke(); }
    haze(c, w, h, [t, WHITE], r, 5, 0.05); vignette(c, w, h, 0.65);
  },
  table(c, w, h, t, r) {
    bg(c, w, h, WARM, r, true); bokeh(c, w, h, r, { n: 26, cols: [WARM, t], min: 0.01, max: 0.05, a: 0.3, y0: 0, y1: 0.5 });
    c.strokeStyle = 'rgba(255,255,255,.12)'; c.lineWidth = 1; c.beginPath(); c.moveTo(0, h * 0.12); c.quadraticCurveTo(w / 2, h * 0.32, w, h * 0.1); c.stroke();
    for (let i = 0; i <= 18; i++) { const u = i / 18; const x = u * w; const y = (1 - u) * (1 - u) * h * 0.12 + 2 * (1 - u) * u * h * 0.32 + u * u * h * 0.1; const g = c.createRadialGradient(x, y, 0, x, y, 12); g.addColorStop(0, 'rgba(255,230,180,.95)'); g.addColorStop(1, 'rgba(255,200,120,0)'); c.fillStyle = g; c.fillRect(x - 12, y - 12, 24, 24); }
    c.fillStyle = 'rgba(236,228,214,.9)'; c.beginPath(); c.moveTo(w * 0.08, h); c.lineTo(w * 0.3, h * 0.58); c.lineTo(w * 0.7, h * 0.58); c.lineTo(w * 0.92, h); c.fill();
    const tg = c.createLinearGradient(0, h * 0.58, 0, h); tg.addColorStop(0, 'rgba(0,0,0,.25)'); tg.addColorStop(1, 'rgba(0,0,0,.6)'); c.fillStyle = tg; c.fill();
    for (let i = 0; i < 5; i++) { const x = w * (0.32 + i * 0.09), y = h * (0.62 + (i % 2) * 0.05); c.fillStyle = '#f4efe6'; c.fillRect(x - 4, y - h * 0.09, 8, h * 0.09); const g = c.createRadialGradient(x, y - h * 0.1, 0, x, y - h * 0.1, h * 0.08); g.addColorStop(0, 'rgba(255,220,150,.95)'); g.addColorStop(0.15, 'rgba(255,180,90,.5)'); g.addColorStop(1, 'rgba(255,160,60,0)'); c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = g; c.fillRect(x - h * 0.08, y - h * 0.18, h * 0.16, h * 0.16); c.restore(); }
    for (let i = 0; i < 4; i++) { const x = w * (0.18 + r() * 0.64), y = h * (0.1 + r() * 0.25), R = Math.min(w, h) * (0.05 + r() * 0.03); const g = c.createRadialGradient(x - R * 0.3, y - R * 0.3, 0, x, y, R); g.addColorStop(0, 'rgba(255,255,255,.5)'); g.addColorStop(1, rgba(i % 2 ? t : [230, 220, 240], 0.25)); c.fillStyle = g; c.beginPath(); c.ellipse(x, y, R * 0.85, R, 0, 0, TAU); c.fill(); }
    vignette(c, w, h, 0.7);
  },
  toast(c, w, h, t, r) {
    bg(c, w, h, WARM, r, true); bokeh(c, w, h, r, { n: 34, cols: [WARM, t, [255, 230, 190]], min: 0.015, max: 0.06, a: 0.3 });
    const cx = w * 0.5, cy = h * 0.32;
    for (let i = 0; i < 3; i++) {
      const ang = (-0.42 + i * 0.42) + (r() - 0.5) * 0.06; c.save(); c.translate(cx + Math.sin(ang) * h * 0.05, cy - h * 0.04); c.rotate(ang);
      const fw = Math.min(w, h) * 0.055, fh = h * 0.42;
      const gl = c.createLinearGradient(-fw, 0, fw, 0); gl.addColorStop(0, 'rgba(255,255,255,.08)'); gl.addColorStop(0.5, 'rgba(255,255,255,.22)'); gl.addColorStop(1, 'rgba(255,255,255,.06)');
      c.fillStyle = gl; c.beginPath(); c.moveTo(-fw, 0); c.quadraticCurveTo(-fw * 0.9, fh * 0.75, 0, fh); c.quadraticCurveTo(fw * 0.9, fh * 0.75, fw, 0); c.closePath(); c.fill();
      const lq = c.createLinearGradient(0, fh * 0.2, 0, fh); lq.addColorStop(0, 'rgba(255,215,120,.75)'); lq.addColorStop(1, 'rgba(230,160,60,.85)'); c.fillStyle = lq;
      c.beginPath(); c.moveTo(-fw * 0.95, fh * 0.2); c.quadraticCurveTo(-fw * 0.85, fh * 0.75, 0, fh * 0.98); c.quadraticCurveTo(fw * 0.85, fh * 0.75, fw * 0.95, fh * 0.2); c.closePath(); c.fill();
      c.fillStyle = 'rgba(255,255,255,.7)'; for (let b = 0; b < 12; b++) { c.beginPath(); c.arc((r() - 0.5) * fw, fh * (0.3 + r() * 0.6), 1 + r() * 1.5, 0, TAU); c.fill(); }
      c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 2; c.beginPath(); c.moveTo(fw * 0.6, fh * 0.05); c.quadraticCurveTo(fw * 0.62, fh * 0.5, fw * 0.2, fh * 0.85); c.stroke();
      c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 2; c.beginPath(); c.moveTo(-fw, 0); c.quadraticCurveTo(-fw * 0.9, fh * 0.75, 0, fh); c.quadraticCurveTo(fw * 0.9, fh * 0.75, fw, 0); c.stroke(); c.beginPath(); c.moveTo(0, fh); c.lineTo(0, fh * 1.6); c.stroke(); c.beginPath(); c.ellipse(0, fh * 1.6, fw * 0.7, fw * 0.15, 0, 0, TAU); c.stroke();
      c.restore();
    }
    c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createRadialGradient(cx, cy + h * 0.05, 0, cx, cy + h * 0.05, h * 0.18); g.addColorStop(0, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, w, h); c.restore();
    haze(c, w, h, [t], r, 3, 0.08); vignette(c, w, h, 0.75);
  },
  mic(c, w, h, t, r) {
    bg(c, w, h, t, r); bokeh(c, w, h, r, { n: 22, cols: [t, WHITE], min: 0.01, max: 0.05, a: 0.22 });
    c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(255,255,255,.28)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g;
    c.beginPath(); c.moveTo(w * 0.47, 0); c.lineTo(w * 0.53, 0); c.lineTo(w * 0.8, h); c.lineTo(w * 0.2, h); c.closePath(); c.fill(); c.restore();
    const mx = w * 0.52, my = h * 0.4, R = Math.min(w, h) * 0.085;
    c.save(); c.translate(mx, my); c.rotate(-0.35);
    const hg = c.createLinearGradient(-R * 0.5, 0, R * 0.5, 0); hg.addColorStop(0, '#111'); hg.addColorStop(0.5, '#3a3d42'); hg.addColorStop(1, '#0c0c0e');
    c.fillStyle = hg; c.beginPath(); c.moveTo(-R * 0.55, R * 0.7); c.lineTo(-R * 0.3, R * 4.2); c.lineTo(R * 0.3, R * 4.2); c.lineTo(R * 0.55, R * 0.7); c.fill();
    const gg = c.createRadialGradient(-R * 0.3, -R * 0.3, 0, 0, 0, R); gg.addColorStop(0, '#9ca0a6'); gg.addColorStop(1, '#2a2c30'); c.fillStyle = gg; c.beginPath(); c.arc(0, 0, R, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(0,0,0,.45)'; c.lineWidth = 1; for (let k = -R; k < R; k += R / 6) { c.beginPath(); c.moveTo(k, -R); c.lineTo(k, R); c.stroke(); c.beginPath(); c.moveTo(-R, k); c.lineTo(R, k); c.stroke(); }
    c.fillStyle = rgba(t, 0.9); c.fillRect(-R * 0.5, R * 0.75, R, R * 0.12);
    c.restore();
    c.save(); c.filter = 'blur(18px)'; c.fillStyle = rgba(t, 0.18); c.fillRect(w * 0.06, h * 0.12, w * 0.3, h * 0.2); c.restore();
    vignette(c, w, h, 0.75);
  },
  chairs(c, w, h, t, r) {
    bg(c, w, h, t, r); haze(c, w, h, [t, [120, 140, 255]], r, 6, 0.06);
    c.fillStyle = '#0d0e11'; c.fillRect(0, h * 0.55, w, h);
    c.save(); c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 9; i++) { const x = r() * w, y = h * (0.6 + r() * 0.38), R = Math.min(w, h) * (0.04 + r() * 0.05); c.save(); c.translate(x, y); c.scale(1, 0.4); c.strokeStyle = rgba(i % 3 ? [140, 160, 255] : t, 0.75); c.lineWidth = 4; for (let k = 0; k < 8; k++) { c.rotate(TAU / 8); c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(R * 0.4, R * 0.5, 0, R); c.stroke(); } c.restore(); }
    c.restore();
    for (let i = 0; i < 6; i++) { const x = w * (0.12 + i * 0.15), y = h * 0.78, s = Math.min(w, h) * 0.11; c.fillStyle = i === 2 ? rgba(t, 0.85) : '#4a4f57'; c.strokeStyle = '#2a2d33'; c.lineWidth = 2;
      c.fillRect(x - s * 0.35, y - s * 0.05, s * 0.7, s * 0.1); c.fillRect(x - s * 0.35, y - s * 0.75, s * 0.08, s * 0.72); c.fillRect(x - s * 0.33, y + s * 0.05, s * 0.06, s * 0.45); c.fillRect(x + s * 0.27, y + s * 0.05, s * 0.06, s * 0.45); }
    c.save(); c.filter = 'blur(6px)'; c.fillStyle = '#030304'; for (let i = 0; i < 5; i++) { const x = w * (0.18 + i * 0.16 + r() * 0.04); c.fillRect(x, h * 0.62, w * 0.03, h * 0.28); c.fillRect(x + w * 0.04, h * 0.64, w * 0.03, h * 0.26); } c.restore();
    vignette(c, w, h, 0.7);
  },
  buzzers(c, w, h, t, r) {
    bg(c, w, h, t, r); bokeh(c, w, h, r, { n: 24, cols: [t, WARM, WHITE], min: 0.01, max: 0.05, a: 0.25, y0: 0, y1: 0.45 });
    c.fillStyle = '#0c0d10'; c.fillRect(0, h * 0.5, w, h);
    const pos = [[0.22, 0.72, 0.13], [0.5, 0.66, 0.11], [0.76, 0.74, 0.14], [0.36, 0.9, 0.16]];
    pos.forEach(([px, py, s], i) => {
      const x = px * w, y = py * h, R = s * Math.min(w, h); const lit = i === 1; const col = lit ? t : [200, 50, 40];
      c.fillStyle = '#16181c'; c.beginPath(); c.ellipse(x, y + R * 0.2, R * 1.15, R * 0.42, 0, 0, TAU); c.fill();
      const g = c.createRadialGradient(x - R * 0.3, y - R * 0.3, 0, x, y, R); g.addColorStop(0, rgba(lit ? [220, 255, 210] : [255, 140, 120], 1)); g.addColorStop(1, rgba(col, 1));
      c.fillStyle = g; c.beginPath(); c.ellipse(x, y, R, R * 0.55, 0, Math.PI, TAU); c.ellipse(x, y, R, R * 0.36, 0, 0, Math.PI); c.fill();
      if (lit) { c.save(); c.globalCompositeOperation = 'lighter'; const gg = c.createRadialGradient(x, y, 0, x, y, R * 3); gg.addColorStop(0, rgba(t, 0.5)); gg.addColorStop(1, rgba(t, 0)); c.fillStyle = gg; c.fillRect(x - R * 3, y - R * 3, R * 6, R * 6); c.restore(); }
    });
    vignette(c, w, h, 0.7);
  },
  road(c, w, h, t, r) {
    c.fillStyle = '#05070a'; c.fillRect(0, 0, w, h); const sky = c.createLinearGradient(0, 0, 0, h * 0.55); sky.addColorStop(0, '#05070a'); sky.addColorStop(1, '#111a22'); c.fillStyle = sky; c.fillRect(0, 0, w, h * 0.55);
    sparkle(c, w, h * 0.45, r, 50); bokeh(c, w, h, r, { n: 40, cols: [WARM, [255, 220, 170]], min: 0.002, max: 0.006, a: 0.9, y0: 0.5, y1: 0.54 });
    c.fillStyle = '#050608'; c.fillRect(0, h * 0.54, w, h);
    c.save(); c.globalCompositeOperation = 'lighter';
    const trail = (col, x0, spread, n) => { for (let i = 0; i < n; i++) { c.strokeStyle = rgba(col, 0.25 + r() * 0.4); c.lineWidth = 1 + r() * 2.5; c.beginPath(); c.moveTo(w * 0.5 + x0, h * 0.54); c.bezierCurveTo(w * 0.5 + x0 * 2, h * 0.7, w * (0.5 + spread) + (r() - 0.5) * 30, h * 0.85, w * (0.5 + spread * 1.6) + (r() - 0.5) * 40, h * 1.02); c.stroke(); } };
    trail(WHITE, -6, -0.28, 12); trail(RED, 6, 0.3, 12); trail(t, 0, 0.02, 3);
    c.restore(); haze(c, w, h, [t], r, 3, 0.05); vignette(c, w, h, 0.6);
  },
  crate(c, w, h, t, r) {
    bg(c, w, h, WARM, r, true); bokeh(c, w, h, r, { n: 20, cols: [WARM, t], min: 0.02, max: 0.07, a: 0.22, y0: 0, y1: 0.4 });
    for (let i = 0; i < 46; i++) { const x = w * 0.12 + i * (w * 0.76 / 46); const top = h * (0.35 + r() * 0.06); c.fillStyle = i % 5 === 0 ? rgba(t, 0.8) : `rgba(${20 + r() * 40 | 0},${20 + r() * 40 | 0},${24 + r() * 40 | 0},1)`; c.fillRect(x, top, w * 0.76 / 46 - 2, h * 0.4); c.fillStyle = 'rgba(255,255,255,.08)'; c.fillRect(x, top, 1, h * 0.4); }
    const g = c.createLinearGradient(0, h * 0.6, 0, h); g.addColorStop(0, '#5a3b22'); g.addColorStop(1, '#2b1a0d'); c.fillStyle = g; c.fillRect(w * 0.08, h * 0.62, w * 0.84, h * 0.38);
    c.save(); c.globalCompositeOperation = 'lighter'; const sl = c.createLinearGradient(0, 0, w, 0); sl.addColorStop(0, rgba(WARM, 0.3)); sl.addColorStop(0.5, 'rgba(0,0,0,0)'); sl.addColorStop(1, rgba(t, 0.25)); c.fillStyle = sl; c.fillRect(0, 0, w, h); c.restore();
    vignette(c, w, h, 0.75);
  },
  grooves(c, w, h, t, r) {
    c.fillStyle = '#050506'; c.fillRect(0, 0, w, h); const cx = w * 1.1, cy = h * 1.3, R = Math.max(w, h) * 1.6;
    for (let k = 0.2; k < 1; k += 0.0035) { const a = 0.04 + Math.abs(Math.sin(k * 90)) * 0.05; c.strokeStyle = `rgba(255,255,255,${a})`; c.lineWidth = 1; c.beginPath(); c.arc(cx, cy, R * k, Math.PI, Math.PI * 1.5); c.stroke(); }
    c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createLinearGradient(w * 0.2, 0, w * 0.6, h); g.addColorStop(0, rgba(t, 0)); g.addColorStop(0.5, rgba(t, 0.35)); g.addColorStop(1, rgba(t, 0)); c.fillStyle = g; c.fillRect(0, 0, w, h); c.restore();
    c.strokeStyle = '#c9cbc8'; c.lineWidth = Math.max(3, w / 160); c.lineCap = 'round'; c.beginPath(); c.moveTo(w * 0.95, h * 0.05); c.lineTo(w * 0.52, h * 0.44); c.stroke();
    c.fillStyle = '#23272c'; c.save(); c.translate(w * 0.5, h * 0.46); c.rotate(-0.75); c.fillRect(-w * 0.05, -h * 0.03, w * 0.1, h * 0.06); c.restore();
    vignette(c, w, h, 0.7);
  },
  haze(c, w, h, t, r) { c.fillStyle = '#040405'; c.fillRect(0, 0, w, h); haze(c, w, h, [t, WHITE], r, 16, 0.06); beams(c, w, h, r, { ox: -w * 0.1, oy: h * 0.4, n: 1, spread: 0, base: 0, alpha: 0.18, width: 0.12, cols: [WHITE] }); vignette(c, w, h, 0.6); },
  spot(c, w, h, t, r) {
    bg(c, w, h, t, r); haze(c, w, h, [WHITE, t], r, 8, 0.05);
    c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(255,255,255,.4)'); g.addColorStop(1, 'rgba(255,255,255,.04)'); c.fillStyle = g;
    c.beginPath(); c.moveTo(w * 0.46, 0); c.lineTo(w * 0.54, 0); c.lineTo(w * 0.78, h * 0.86); c.lineTo(w * 0.22, h * 0.86); c.closePath(); c.fill();
    const fl = c.createRadialGradient(w / 2, h * 0.86, 0, w / 2, h * 0.86, w * 0.3); fl.addColorStop(0, 'rgba(255,255,255,.35)'); fl.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = fl; c.save(); c.translate(0, h * 0.86 * 0.7); c.scale(1, 0.3); c.fillRect(0, 0, w, h * 2); c.restore(); c.restore();
    c.fillStyle = '#030304'; const s = Math.min(w, h) / 500; const x = w / 2, y = h * 0.86;
    c.beginPath(); c.ellipse(x - 26 * s, y - 250 * s, 20 * s, 24 * s, 0, 0, TAU); c.ellipse(x + 22 * s, y - 262 * s, 21 * s, 25 * s, 0, 0, TAU); c.fill();
    c.beginPath(); c.moveTo(x - 70 * s, y); c.quadraticCurveTo(x - 75 * s, y - 120 * s, x - 55 * s, y - 215 * s); c.quadraticCurveTo(x, y - 240 * s, x + 55 * s, y - 225 * s); c.quadraticCurveTo(x + 80 * s, y - 120 * s, x + 50 * s, y); c.fill();
    crowd(c, w, h, r, { y: 0.9, arms: 0, scale: 0.8 }); vignette(c, w, h, 0.7);
  },
  banquet(c, w, h, t, r) {
    bg(c, w, h, WARM, r, true); bokeh(c, w, h, r, { n: 18, cols: [WARM], min: 0.01, max: 0.04, a: 0.25, y0: 0.1, y1: 0.4 });
    for (let row = 0; row < 2; row++) { const x0 = row ? w * 0.62 : w * 0.38; c.fillStyle = 'rgba(240,232,220,.85)'; c.beginPath(); c.moveTo(x0, h * 0.45); c.lineTo(x0 + (row ? 1 : -1) * w * 0.02, h * 0.45); c.lineTo(x0 + (row ? 1 : -1) * w * 0.5, h); c.lineTo(x0 + (row ? 1 : -1) * w * 0.25, h); c.fill();
      for (let i = 0; i < 7; i++) { const u = i / 6; const x = x0 + (row ? 1 : -1) * (0.01 + u * u * 0.32) * w, y = h * (0.46 + u * 0.5); const R = 4 + u * 26; c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createRadialGradient(x, y - R, 0, x, y - R, R * 3); g.addColorStop(0, 'rgba(255,220,150,.9)'); g.addColorStop(1, 'rgba(255,160,60,0)'); c.fillStyle = g; c.fillRect(x - R * 3, y - R * 4, R * 6, R * 6); c.restore(); } }
    c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createRadialGradient(w / 2, h * 0.42, 0, w / 2, h * 0.42, w * 0.1); g.addColorStop(0, rgba(t, 0.7)); g.addColorStop(1, rgba(t, 0)); c.fillStyle = g; c.fillRect(0, 0, w, h); c.restore();
    c.fillStyle = '#0a0a0c'; c.fillRect(w * 0.47, h * 0.4, w * 0.06, h * 0.04); vignette(c, w, h, 0.7);
  },
  vinyls(c, w, h, t, r) {
    c.fillStyle = '#08090b'; c.fillRect(0, 0, w, h); const R = Math.min(w, h) * 0.32; const labels = [t, [255, 179, 92], [255, 95, 162], [127, 224, 255], WHITE];
    for (let i = 0; i < 5; i++) { const a = -0.9 + i * 0.45; disc(c, w * 0.5 + Math.cos(a) * R * 0.9, h * 0.62 + Math.sin(a) * R * 0.5, R, r, labels[i], { sheen: 0.14 }); }
    c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createRadialGradient(w * 0.7, h * 0.2, 0, w * 0.7, h * 0.2, w * 0.6); g.addColorStop(0, rgba(t, 0.18)); g.addColorStop(1, rgba(t, 0)); c.fillStyle = g; c.fillRect(0, 0, w, h); c.restore();
    vignette(c, w, h, 0.6);
  },
  truss(c, w, h, t, r) {
    bg(c, w, h, t, r); haze(c, w, h, [t, WHITE], r, 10, 0.06);
    const ty = h * 0.12; c.strokeStyle = '#8a8e94'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, ty); c.lineTo(w, ty); c.moveTo(0, ty + 26); c.lineTo(w, ty + 26); c.stroke();
    c.lineWidth = 1; for (let x = 0; x < w; x += 26) { c.beginPath(); c.moveTo(x, ty); c.lineTo(x + 26, ty + 26); c.stroke(); }
    for (let i = 0; i < 5; i++) { const x = w * (0.12 + i * 0.19); c.fillStyle = '#16181c'; c.fillRect(x - 14, ty + 26, 28, 30); beams(c, w, h, r, { ox: x, oy: ty + 56, n: 1, spread: 0, base: Math.PI / 2 + (i - 2) * 0.22 + (r() - 0.5) * 0.2, alpha: 0.32, width: 0.05, cols: [i % 2 ? WHITE : t], len: 1.2 }); }
    c.fillStyle = '#030304'; [[0.06, 0.55], [0.86, 0.55]].forEach(([px, py]) => { c.fillRect(px * w, py * h, w * 0.08, h * 0.32); c.fillRect(px * w + w * 0.035, py * h + h * 0.32, 4, h); });
    vignette(c, w, h, 0.65);
  },
  book(c, w, h, t, r) {
    bg(c, w, h, WARM, r, true); bokeh(c, w, h, r, { n: 26, cols: [WARM, t], min: 0.015, max: 0.06, a: 0.25, y0: 0, y1: 0.45 });
    c.fillStyle = '#100c09'; c.fillRect(0, h * 0.5, w, h);
    c.save(); c.translate(w / 2, h * 0.7); c.rotate(-0.06);
    const bw = w * 0.36, bh = h * 0.26;
    [[-1], [1]].forEach(([s]) => { const g = c.createLinearGradient(0, 0, s * bw, 0); g.addColorStop(0, '#cfc8bb'); g.addColorStop(1, '#f3eee4'); c.fillStyle = g; c.beginPath(); c.moveTo(0, -bh * 0.45); c.quadraticCurveTo(s * bw * 0.5, -bh * 0.6, s * bw, -bh * 0.5); c.lineTo(s * bw, bh * 0.5); c.quadraticCurveTo(s * bw * 0.5, bh * 0.4, 0, bh * 0.55); c.closePath(); c.fill(); });
    c.strokeStyle = '#1a1a1a'; c.lineWidth = Math.max(4, w / 120); c.lineCap = 'round'; c.beginPath(); c.moveTo(bw * 0.2, bh * 0.3); c.lineTo(bw * 0.75, -bh * 0.2); c.stroke();
    c.strokeStyle = rgba(t, 1); c.lineWidth = Math.max(2, w / 300); c.beginPath(); c.moveTo(bw * 0.62, -bh * 0.09); c.lineTo(bw * 0.75, -bh * 0.2); c.stroke();
    c.restore(); vignette(c, w, h, 0.7);
  },
  faders(c, w, h, t, r) {
    bg(c, w, h, t, r);
    for (let i = 0; i < 6; i++) { const x = w * (0.15 + i * 0.14); c.fillStyle = '#050506'; c.fillRect(x - 5, h * 0.15, 10, h * 0.7); const fy = h * (0.25 + r() * 0.45); c.fillStyle = '#2c3036'; c.fillRect(x - 22, fy, 44, 26); c.fillStyle = rgba(t, 0.9); c.fillRect(x - 18, fy + 12, 36, 2);
      for (let j = 0; j < 14; j++) { const on = j > 14 - (4 + r() * 10); c.fillStyle = on ? rgba(j < 3 ? [255, 200, 87] : t, 0.9) : 'rgba(255,255,255,.05)'; c.fillRect(x + 16, h * 0.15 + j * h * 0.05, 5, h * 0.035); } }
    c.save(); c.filter = 'blur(10px)'; c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.45; c.drawImage(c.canvas, 0, 0); c.restore();
    vignette(c, w, h, 0.65);
  },
};
DRAW.dust = DRAW.haze;
DRAW.glasses = DRAW.toast;

function render(el) {
  const kind = el.dataset.ph; const fn = DRAW[kind] || DRAW.beams;
  const rect = el.getBoundingClientRect();
  if (rect.width < 2 || rect.height < 2) return false;
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  const scale = Math.min(dpr, 1400 / rect.width);
  const w = Math.round(rect.width * scale), h = Math.round(rect.height * scale);
  let cv = el.querySelector('canvas');
  if (!cv) { cv = document.createElement('canvas'); cv.className = 'ph-canvas'; el.prepend(cv); }
  if (cv.width === w && cv.height === h) return true;
  cv.width = w; cv.height = h;
  const ctx = cv.getContext('2d');
  const tint = el.dataset.tint ? hexToRgb(el.dataset.tint) : GREEN;
  try { fn(ctx, w, h, tint, rng(+el.dataset.seed || 1)); } catch (e) { ctx.fillStyle = '#0d0f12'; ctx.fillRect(0, 0, w, h); }
  if (!el.querySelector('.ph__tag') && el.dataset.grok) {
    const tag = document.createElement('span'); tag.className = 'ph__tag'; tag.textContent = `Provisoire · ${el.dataset.grok}`; tag.setAttribute('aria-hidden', 'true'); el.appendChild(tag);
  }
  return true;
}

export function initPlaceholders(root = document) {
  const els = $$('[data-ph]', root);
  if (!('IntersectionObserver' in window)) { els.forEach(render); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting && render(e.target)) io.unobserve(e.target); });
  }, { rootMargin: '600px 0px' });
  els.forEach((el) => io.observe(el));
  let lastW = window.innerWidth;
  window.addEventListener('resize', () => {
    if (Math.abs(window.innerWidth - lastW) < 120) return; lastW = window.innerWidth;
    clearTimeout(initPlaceholders.t); initPlaceholders.t = setTimeout(() => els.forEach((el) => { if (el.querySelector('canvas')) render(el); }), 250);
  });
}

export { render as renderPlaceholder };
