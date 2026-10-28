// Prestations (Face B)
import { state, on, $, $$ } from '../core/state.js?v=20261028-2';

export default function prestations() {
  const { gsap, ScrollTrigger } = window;
  const mm = gsap.matchMedia();

  /* ---------- B0 : la photo est l'étiquette d'un disque géant qui s'ouvre ---------- */
  const hero = $('[data-phero]');
  const disc = $('[data-phero-disc]', hero); const ring = $('[data-phero-ring]', hero);
  const st = { r: 0, open: 0 };
  const geo = () => {
    const W = hero.clientWidth, H = hero.clientHeight, vh = window.innerHeight;
    const portrait = W < 900 && vh >= W;
    // Téléphone en portrait : disque centré sous l'en-tête, dans l'espace réservé en CSS (anneau = min(31vw, 19svh))
    const ringR = Math.min(W * 0.31, vh * 0.19);
    const cx = portrait ? W * 0.5 : W * 0.7;
    const cy = portrait ? 72 + 14 + ringR : Math.min(H, vh) * 0.42;
    const R = portrait ? ringR * 0.64 : Math.min(W * 0.17, Math.min(H, vh) * 0.27);
    const full = Math.hypot(Math.max(cx, W - cx), Math.max(cy, H - cy));
    return { cx, cy, R, full };
  };
  const paint = () => {
    const { cx, cy, R, full } = geo();
    const r = (R * st.r) + (full - R) * st.open;
    disc.style.clipPath = `circle(${r.toFixed(1)}px at ${cx.toFixed(1)}px ${cy.toFixed(1)}px)`;
    const rr = r / 0.64;
    ring.style.width = ring.style.height = `${(rr * 2).toFixed(1)}px`;
    ring.style.transform = `translate(${(cx - rr).toFixed(1)}px, ${(cy - rr).toFixed(1)}px)`;
    ring.style.opacity = String(Math.min(1, st.r) * (1 - Math.min(1, st.open * 2.2)));
  };
  window.addEventListener('resize', paint);
  const lines = $$('[data-phero-line]', hero); const fades = $$('[data-phero-fade]', hero);
  if (state.calm) { st.r = 1; paint(); }
  else {
    gsap.set(lines, { yPercent: 110 }); gsap.set(fades, { opacity: 0, y: 24 }); paint();
    on('intro', () => {
      gsap.to(st, { r: 1, duration: 1.6, ease: 'expo.out', onUpdate: paint });
      gsap.to(lines, { yPercent: 0, duration: 1, stagger: 60 / state.bpm / 2, ease: 'expo.out', delay: 0.1 });
      gsap.to(fades, { opacity: 1, y: 0, duration: 0.9, stagger: 0.1, ease: 'power3.out', delay: 0.5 });
    });
    gsap.to(st, { open: 1, ease: 'none', onUpdate: paint, scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to($('.phero__content .shell', hero), { yPercent: -25, opacity: 0.2, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
  }

  /* ---------- B1 : l'image suit le curseur sur la liste ---------- */
  const list = $('[data-evlist]'); const float = $('[data-float-img]');
  if (list && float && state.finePointer) {
    const kids = Array.from(float.children);
    const yTo = gsap.quickTo(float, 'y', { duration: state.calm ? 0.01 : 0.55, ease: 'power3' });
    const rTo = gsap.quickTo(float, 'rotation', { duration: 0.8, ease: 'power3' });
    let lastX = 0;
    list.addEventListener('pointermove', (e) => {
      const fw = float.offsetWidth, fh = float.offsetHeight;
      // L'image reste dans la colonne de droite : seule la hauteur suit le curseur
      gsap.set(float, { x: window.innerWidth * 0.64 - fw / 2 });
      yTo(Math.max(16, Math.min(window.innerHeight - fh - 16, e.clientY - fh / 2)));
      if (!state.calm) rTo(Math.max(-8, Math.min(8, (e.clientX - lastX) * 0.6))); lastX = e.clientX;
    });
    $$('li', list).forEach((li) => li.addEventListener('pointerenter', () => {
      const k = +li.dataset.evKey;
      kids.forEach((c, i) => c.classList.toggle('is-active', i === k));
      gsap.to(float, { opacity: 1, scale: 1, duration: 0.4, ease: 'power3.out' });
    }));
    list.addEventListener('pointerleave', () => gsap.to(float, { opacity: 0, scale: 0.85, duration: 0.35 }));
  }

  /* ---------- B2 : soirée type, l'égaliseur suit l'intensité ---------- */
  const night = $('[data-night]');
  const cols = $$('[data-eq-col]', night); const stages = $$('[data-stage]', night);
  const LEVELS = [0.32, 0.5, 0.78, 1];
  const ROWS = 14;
  cols.forEach((col) => { const bars = $('.eq__bars', col); bars.innerHTML = '<i></i>'.repeat(ROWS); });
  let current = -1;
  const fillCols = (upto, pulse = 0) => {
    cols.forEach((col, i) => {
      const lvl = i <= upto ? LEVELS[i] : 0.06;
      const n = Math.round(lvl * ROWS + (i === upto ? pulse * 2 : 0));
      $$('i', col).forEach((b, j) => { const idx = ROWS - 1 - j; b.classList.toggle('on', idx < n); b.classList.toggle('hi', idx >= ROWS - 2 && idx < n); });
      col.classList.toggle('is-active', i === upto);
    });
  };
  const setStage = (i) => {
    if (i === current) return; current = i;
    stages.forEach((s, k) => s.classList.toggle('is-active', k === i));
    if (!state.calm) gsap.fromTo(stages[i], { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' });
    fillCols(i);
  };
  mm.add('(min-width: 960px)', () => {
    setStage(0);
    const trig = ScrollTrigger.create({ trigger: night, start: 'top top', end: '+=260%', pin: '[data-night-pin]', scrub: true,
      onUpdate: (s) => setStage(Math.min(stages.length - 1, Math.floor(s.progress * stages.length * 0.999))) });
    let pulseOn = false;
    const tick = () => { if (pulseOn && current >= 0 && !state.calm) fillCols(current, state.level); };
    const vis = ScrollTrigger.create({ trigger: night, start: 'top bottom', end: 'bottom top', onToggle: (s) => { pulseOn = s.isActive; } });
    gsap.ticker.add(tick);
    return () => { trig.kill(); vis.kill(); gsap.ticker.remove(tick); stages.forEach((s) => s.classList.remove('is-active')); current = -1; };
  });
  mm.add('(max-width: 959px)', () => { fillCols(3); cols.forEach((c) => c.classList.remove('is-active')); });

  /* ---------- B3 : bac de vinyles qu'on feuillette ---------- */
  const flip = $('[data-flip]'); const cards = $$('[data-flip-card]', flip); const count = $('[data-flip-count]');
  let cur = 0;
  const layout = (instant = false) => {
    cards.forEach((c, i) => {
      const d = i - cur;
      const props = d < 0
        ? { rotationX: -82, yPercent: 6, xPercent: 0, z: 40, opacity: 0, zIndex: 30 + d }
        : { rotationX: 4 + d * 4, yPercent: -d * 19, xPercent: d * 7, z: -d * 64, scale: 1 - d * 0.045, opacity: d > 3 ? 0 : 1 - d * 0.14, filter: `brightness(${1 - d * 0.2})`, zIndex: 20 - d };
      gsap.to(c, { ...props, duration: instant || state.calm ? 0 : 0.85, ease: 'expo.out', transformOrigin: '50% 100%' });
      c.setAttribute('aria-hidden', String(d !== 0));
    });
    count.textContent = `${String(cur + 1).padStart(2, '0')} / ${String(cards.length).padStart(2, '0')}`;
  };
  const go = (n) => { cur = (n + cards.length) % cards.length; layout(); };
  layout(true);
  $('[data-flip-prev]').addEventListener('click', () => go(cur - 1));
  $('[data-flip-next]').addEventListener('click', () => go(cur + 1));
  flip.setAttribute('tabindex', '0');
  flip.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft') go(cur - 1); if (e.key === 'ArrowRight') go(cur + 1); });
  let sx = null;
  flip.addEventListener('pointerdown', (e) => { sx = e.clientX; });
  flip.addEventListener('pointerup', (e) => { if (sx === null) return; const dx = e.clientX - sx; if (Math.abs(dx) > 40) go(cur + (dx < 0 ? 1 : -1)); sx = null; });
  if (!state.calm) {
    let hover = false; flip.addEventListener('pointerenter', () => { hover = true; }); flip.addEventListener('pointerleave', () => { hover = false; });
    let visible = false; ScrollTrigger.create({ trigger: flip, start: 'top bottom', end: 'bottom top', onToggle: (s) => { visible = s.isActive; } });
    setInterval(() => { if (visible && !hover && !document.hidden) go(cur + 1); }, 3600);
  }
}
