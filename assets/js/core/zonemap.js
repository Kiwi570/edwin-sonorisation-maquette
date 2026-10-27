// Carte « radar » des 50 km + recherche de commune (distance à vol d'oiseau depuis Bruay-La-Buissière)
import { SITE, state, on, $, $$, hexToRgb } from './state.js';

let dataPromise = null;
export function loadZoneData() {
  if (!dataPromise) {
    dataPromise = Promise.all([
      fetch('assets/data/zone.json').then((r) => r.json()),
      fetch('assets/data/communes.json').then((r) => r.json()),
    ]).then(([z, c]) => ({ z, c }));
  }
  return dataPromise;
}

export const norm = (s) => s.replace(/œ/gi, 'oe').replace(/æ/gi, 'ae').normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toLowerCase().replace(/[-'’]/g, ' ').replace(/\bst\b/g, 'saint').replace(/\bste\b/g, 'sainte').replace(/\s+/g, ' ').trim();

const project = (z, lat, lon) => [(lon - z.lon0) * z.kx * z.u + z.vw / 2, (z.lat0 - lat) * z.ky * z.u + z.vh / 2];
const fmtKm = (d) => `${d.toFixed(1).replace('.', ',')} km`;
const DEPT = { 59: 'Nord', 62: 'Pas-de-Calais', 80: 'Somme', 2: 'Aisne', '02': 'Aisne' };

/* Combobox accessible de recherche de commune */
export function communeCombobox(input, list, onSelect) {
  let items = []; let active = -1; let communes = [];
  loadZoneData().then(({ c }) => { communes = c.communes.map((x) => ({ name: x[0], dep: x[1], d: x[4], key: norm(x[0]) })); });
  const close = () => { list.classList.remove('is-open'); input.setAttribute('aria-expanded', 'false'); active = -1; input.removeAttribute('aria-activedescendant'); };
  const choose = (it) => { input.value = it.name; close(); onSelect(it); };
  const renderList = () => {
    list.innerHTML = '';
    items.forEach((it, i) => {
      const li = document.createElement('li'); li.id = `${list.id}-${i}`; li.setAttribute('role', 'option'); li.setAttribute('aria-selected', String(i === active));
      li.innerHTML = `<span>${it.name}</span><small>${fmtKm(it.d)} · ${DEPT[it.dep] || it.dep}</small>`;
      li.addEventListener('pointerdown', (e) => { e.preventDefault(); choose(it); });
      list.appendChild(li);
    });
    const open = items.length > 0; list.classList.toggle('is-open', open); input.setAttribute('aria-expanded', String(open));
    if (active >= 0) input.setAttribute('aria-activedescendant', `${list.id}-${active}`);
  };
  input.addEventListener('input', () => {
    const q = norm(input.value);
    if (q.length < 2) { items = []; renderList(); return; }
    const starts = communes.filter((x) => x.key.startsWith(q)); const inc = communes.filter((x) => !x.key.startsWith(q) && x.key.includes(q));
    items = starts.concat(inc).slice(0, 8); active = items.length ? 0 : -1; renderList();
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' && items.length) { e.preventDefault(); active = (active + 1) % items.length; renderList(); }
    else if (e.key === 'ArrowUp' && items.length) { e.preventDefault(); active = (active - 1 + items.length) % items.length; renderList(); }
    else if (e.key === 'Enter') { if (items[active]) { e.preventDefault(); choose(items[active]); } }
    else if (e.key === 'Escape') close();
  });
  input.addEventListener('blur', () => setTimeout(close, 120));
  return {
    findByName(name) { const k = norm(name); return communes.find((x) => x.key === k); },
    ready: loadZoneData(),
  };
}

export function describe(it) {
  if (!it) return { cls: '', html: 'Commune introuvable dans la base : précisez-la au téléphone.' };
  if (it.d <= SITE.radiusKm) return { cls: 'is-in', html: `<span aria-hidden="true">✓</span><span><b>${it.name}</b> · ${fmtKm(it.d)} : dans la zone d’intervention.</span>` };
  return { cls: 'is-out', html: `<span aria-hidden="true">↗</span><span><b>${it.name}</b> · ${fmtKm(it.d)}, au-delà des 50&nbsp;km&nbsp;: appelez-moi pour en parler.</span>` };
}

export async function initZoneMap(root) {
  const canvas = $('[data-zone-canvas]', root); const labelsEl = $('[data-zone-labels]', root);
  if (!canvas) return null;
  const { z, c } = await loadZoneData();
  const ctx = canvas.getContext('2d');
  const paths = z.depts.map((d) => new Path2D(d.d));
  const CX = z.vw / 2, CY = z.vh / 2, R50 = SITE.radiusKm * z.u;
  const pts = c.communes.filter((x) => x[4] <= 75).map((x) => {
    const [px, py] = project(z, x[2], x[3]);
    let a = Math.atan2(py - CY, px - CX); if (a < 0) a += Math.PI * 2;
    return { name: x[0], key: norm(x[0]), d: x[4], x: px, y: py, a, glow: 0 };
  });
  const byKey = new Map(pts.map((p) => [p.key, p]));

  // Étiquettes HTML (lisibles et nettes)
  const labelEls = new Map();
  const addLabel = (name, cls) => {
    const p = byKey.get(norm(name)); if (!p) return;
    const s = document.createElement('span'); s.className = `radar__label ${cls}`; s.textContent = name === 'Bruay-la-Buissière' ? 'Bruay-La-Buissière' : name;
    s.style.left = `${(p.x / z.vw) * 100}%`; s.style.top = `${(p.y / z.vh) * 100}%`;
    labelsEl.appendChild(s); labelEls.set(p.key, s);
  };
  addLabel('Bruay-la-Buissière', 'is-home');
  // Au centre, les communes proches se chevaucheraient : elles s'affichent à la sélection
  SITE.cited.forEach((n) => { const p = byKey.get(norm(n)); if (p && p.d >= 17 && n !== 'Avion') addLabel(n, 'is-cited'); });
  // Sur téléphone, seuls trois repères restent affichés (Lille, Arras, Saint-Omer)
  SITE.landmarks.forEach((n) => addLabel(n, ['Lille', 'Arras', 'Saint-Omer'].includes(n) ? '' : 'is-minor'));

  let W = 0, H = 0, dpr = 1, scale = 1, sweep = 0, selected = null, ping = 0, visible = false, running = false;
  const resize = () => {
    W = canvas.clientWidth; H = canvas.clientHeight; dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr); scale = W / z.vw;
    if (state.calm || !visible) draw(0);
  };

  function draw(dt) {
    const tint = hexToRgb(state.tint);
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);
    ctx.clearRect(0, 0, z.vw, z.vh);
    ctx.lineWidth = 1 / scale; ctx.fillStyle = 'rgba(18,21,25,.62)'; ctx.strokeStyle = 'rgba(242,241,236,.22)';
    paths.forEach((p) => { ctx.fill(p); ctx.stroke(p); });
    // Cercles de distance
    [10, 20, 30, 40].forEach((km) => { ctx.strokeStyle = 'rgba(242,241,236,.07)'; ctx.beginPath(); ctx.arc(CX, CY, km * z.u, 0, Math.PI * 2); ctx.stroke(); });
    ctx.setLineDash([6, 6]); ctx.strokeStyle = `rgba(${tint},.85)`; ctx.lineWidth = 1.6 / scale * 1.2; ctx.beginPath(); ctx.arc(CX, CY, R50, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
    ctx.font = `${11 / scale * 0.9}px "JetBrains Mono", monospace`; ctx.fillStyle = `rgba(${tint},.9)`; ctx.fillText('50 KM', CX + R50 * 0.71 + 6, CY - R50 * 0.71 - 4);
    // Balayage
    if (!state.calm) {
      if (ctx.createConicGradient) {
        const g = ctx.createConicGradient(sweep - 0.9, CX, CY);
        g.addColorStop(0, `rgba(${tint},0)`); g.addColorStop(0.143, `rgba(${tint},.22)`); g.addColorStop(0.1432, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(CX, CY); ctx.arc(CX, CY, R50 * 1.08, sweep - 0.9, sweep); ctx.closePath(); ctx.fill();
      }
      ctx.strokeStyle = `rgba(${tint},.9)`; ctx.lineWidth = 1.4 / scale; ctx.beginPath(); ctx.moveTo(CX, CY); ctx.lineTo(CX + Math.cos(sweep) * R50 * 1.08, CY + Math.sin(sweep) * R50 * 1.08); ctx.stroke();
    }
    // Communes
    for (const p of pts) {
      const inZone = p.d <= SITE.radiusKm;
      if (!state.calm) {
        let diff = sweep - p.a; diff = ((diff % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        if (diff < 0.05) p.glow = 1; else p.glow = Math.max(0, p.glow - dt * 0.45);
      } else p.glow = inZone ? 0.55 : 0;
      const a = inZone ? 0.22 + 0.78 * p.glow : 0.12;
      ctx.fillStyle = inZone ? `rgba(${tint},${a})` : `rgba(242,241,236,${a})`;
      const rr = (inZone ? 1.6 + p.glow * 1.6 : 1.2) / Math.max(0.6, scale) * 0.75;
      ctx.beginPath(); ctx.arc(p.x, p.y, rr, 0, Math.PI * 2); ctx.fill();
    }
    // Bruay
    const pulse = state.calm ? 0.5 : (Math.sin(performance.now() / 380) + 1) / 2;
    ctx.fillStyle = '#f2f1ec'; ctx.beginPath(); ctx.arc(CX, CY, 4.5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = `rgba(${tint},${0.6 - pulse * 0.4})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(CX, CY, 8 + pulse * 10, 0, Math.PI * 2); ctx.stroke();
    // Sélection
    if (selected) {
      ping = (ping + dt * 0.8) % 1;
      ctx.strokeStyle = '#f2f1ec'; ctx.lineWidth = 1.5; ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.moveTo(CX, CY); ctx.lineTo(selected.x, selected.y); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = '#f2f1ec'; ctx.beginPath(); ctx.arc(selected.x, selected.y, 4.5, 0, Math.PI * 2); ctx.fill();
      if (!state.calm) { ctx.strokeStyle = `rgba(242,241,236,${1 - ping})`; ctx.beginPath(); ctx.arc(selected.x, selected.y, 6 + ping * 22, 0, Math.PI * 2); ctx.stroke(); }
    }
  }

  let last = performance.now();
  const loop = (now) => {
    if (!visible || document.hidden || state.calm) { running = false; return; }
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    sweep = (sweep + dt * 1.05) % (Math.PI * 2);
    draw(dt); requestAnimationFrame(loop);
  };
  const start = () => { if (running || state.calm) return; running = true; last = performance.now(); requestAnimationFrame(loop); };
  new IntersectionObserver(([e]) => { visible = e.isIntersecting && !state.leaving; if (visible) start(); }).observe(canvas);
  on('leave', () => { visible = false; });
  document.addEventListener('visibilitychange', () => { if (!document.hidden && visible) start(); });
  window.addEventListener('resize', resize);
  resize(); draw(0);

  const select = (name) => {
    const p = byKey.get(norm(name));
    labelEls.forEach((el) => el.classList.remove('is-hit'));
    let extra = labelsEl.querySelector('.is-extra'); if (extra) extra.remove();
    if (!p) { selected = null; draw(0); return; }
    selected = p; ping = 0;
    const el = labelEls.get(p.key);
    if (el) el.classList.add('is-hit');
    else { const s = document.createElement('span'); s.className = 'radar__label is-hit is-extra'; s.textContent = p.name; s.style.left = `${(p.x / z.vw) * 100}%`; s.style.top = `${(p.y / z.vh) * 100}%`; labelsEl.appendChild(s); }
    draw(0);
  };
  return { select };
}

// Bloc complet « Votre commune ? » : carte + recherche + puces
export async function initZoneBlock(section) {
  const map = await initZoneMap(section);
  const input = $('[data-commune-input]', section); const list = $('[data-commune-list]', section); const result = $('[data-zone-result]', section);
  const chips = $('[data-zone-chips]', section);
  const show = (it) => { const d = describe(it); result.className = `zone-result ${d.cls}`; result.innerHTML = d.html; map?.select(it ? it.name : ''); };
  let cb = null;
  if (input && list) cb = communeCombobox(input, list, show);
  if (chips) {
    SITE.cited.forEach((n) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'chip'; b.textContent = n;
      b.addEventListener('click', async () => { await loadZoneData(); $$('.chip', chips).forEach((x) => x.classList.remove('is-on')); b.classList.add('is-on'); const it = cb?.findByName(n); if (input) input.value = n; show(it); });
      chips.appendChild(b);
    });
  }
}
