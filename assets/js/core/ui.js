// En-tête, menu, curseur, boutons magnétiques, cartes 3D, bras de lecture, grain, onde au survol
import { state, $, $$ } from './state.js';
import { scrollProgress } from './smooth.js';

export function initGrain() {
  const c = document.createElement('canvas'); c.width = c.height = 160;
  const ctx = c.getContext('2d'); const img = ctx.createImageData(160, 160);
  for (let i = 0; i < img.data.length; i += 4) { const v = Math.random() * 255; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
  ctx.putImageData(img, 0, 0);
  document.documentElement.style.setProperty('--grain-url', `url(${c.toDataURL('image/png')})`);
}

export function initHeader() {
  const header = $('[data-header]');
  if (!header) return;
  let last = window.scrollY; let ticking = false;
  const update = () => {
    const y = window.scrollY;
    header.classList.toggle('is-solid', y > 40);
    const menuOpen = document.documentElement.classList.contains('menu-open');
    if (!menuOpen) header.classList.toggle('is-hidden', y > 200 && y > last + 2);
    if (y < last - 2) header.classList.remove('is-hidden');
    last = y; ticking = false;
  };
  window.addEventListener('scroll', () => { if (!ticking) { requestAnimationFrame(update); ticking = true; } }, { passive: true });
  update();
}

export function initMenu() {
  const btn = $('[data-menu-btn]'); const menu = $('[data-menu]'); const html = document.documentElement;
  if (!btn || !menu) return;
  const set = (open) => {
    html.classList.toggle('menu-open', open);
    btn.setAttribute('aria-expanded', String(open));
    btn.querySelector('.sr-only').textContent = open ? 'Fermer le menu' : 'Ouvrir le menu';
    menu.setAttribute('aria-hidden', String(!open));
    if (open) menu.removeAttribute('inert'); else menu.setAttribute('inert', '');
    if (state.lenis) open ? state.lenis.stop() : state.lenis.start();
    if (open) {
      setTimeout(() => menu.querySelector('a')?.focus(), 350);
      if (!state.calm) window.gsap.from(menu.querySelectorAll('ol a'), { yPercent: 60, opacity: 0, duration: 0.8, stagger: 0.06, ease: 'expo.out', delay: 0.25 });
    }
  };
  btn.addEventListener('click', () => set(!html.classList.contains('menu-open')));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && html.classList.contains('menu-open')) { set(false); btn.focus(); } });
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) set(false); });
}

export function initCursor() {
  if (!state.finePointer) return;
  const { gsap } = window;
  const root = $('[data-cursor]'); const ring = $('[data-cursor-ring]'); const dot = $('[data-cursor-dot]'); const text = $('[data-cursor-text]');
  if (!root) return;
  document.documentElement.classList.add('has-cursor');
  const rx = gsap.quickTo(ring, 'x', { duration: state.calm ? 0.01 : 0.38, ease: 'power3' });
  const ry = gsap.quickTo(ring, 'y', { duration: state.calm ? 0.01 : 0.38, ease: 'power3' });
  const dx = gsap.quickTo(dot, 'x', { duration: 0.06 }); const dy = gsap.quickTo(dot, 'y', { duration: 0.06 });
  gsap.set([ring, dot], { x: -100, y: -100 });
  window.addEventListener('pointermove', (e) => { if (e.pointerType !== 'mouse') return; rx(e.clientX); ry(e.clientY); dx(e.clientX); dy(e.clientY); root.style.opacity = 1; }, { passive: true });
  document.addEventListener('pointerleave', () => { root.style.opacity = 0; });
  document.addEventListener('pointerover', (e) => {
    const lab = e.target.closest('[data-cursor-label]');
    const hov = e.target.closest('a, button, [data-tilt], label, summary, input[type="range"]');
    root.classList.toggle('is-label', !!lab);
    root.classList.toggle('is-hover', !lab && !!hov);
    if (lab) text.textContent = lab.dataset.cursorLabel;
  });
}

export function initMagnetic() {
  if (!state.finePointer || state.calm) return;
  const { gsap } = window;
  $$('[data-magnetic]').forEach((el) => {
    const label = el.querySelector('.btn__label');
    const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3' }); const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3' });
    const lx = label ? gsap.quickTo(label, 'x', { duration: 0.6, ease: 'power3' }) : null; const ly = label ? gsap.quickTo(label, 'y', { duration: 0.6, ease: 'power3' }) : null;
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect(); const mx = e.clientX - (r.left + r.width / 2); const my = e.clientY - (r.top + r.height / 2);
      xTo(mx * 0.28); yTo(my * 0.4); lx?.(mx * 0.12); ly?.(my * 0.16);
    });
    el.addEventListener('pointerleave', () => { xTo(0); yTo(0); lx?.(0); ly?.(0); });
  });
}

export function initTilt() {
  if (!state.finePointer || state.calm) return;
  const { gsap } = window;
  $$('[data-tilt]').forEach((card) => {
    const rX = gsap.quickTo(card, 'rotationX', { duration: 0.6, ease: 'power3' }); const rY = gsap.quickTo(card, 'rotationY', { duration: 0.6, ease: 'power3' });
    const glare = card.querySelector('.acard__glare');
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect(); const px = (e.clientX - r.left) / r.width; const py = (e.clientY - r.top) / r.height;
      rY((px - 0.5) * 12); rX((0.5 - py) * 10);
      if (glare) { glare.style.setProperty('--gx', `${px * 100}%`); glare.style.setProperty('--gy', `${py * 100}%`); }
    });
    card.addEventListener('pointerleave', () => { rX(0); rY(0); });
  });
}

export function initTonearm() {
  const arm = $('[data-arm]');
  if (!arm) return;
  let ticking = false;
  const update = () => { arm.style.transform = `rotate(${-4 + scrollProgress() * 24}deg)`; ticking = false; };
  window.addEventListener('scroll', () => { if (!ticking) { requestAnimationFrame(update); ticking = true; } }, { passive: true });
  update();
}

// Onde « sonore » au survol des photos (filtre SVG partagé)
export function initWave() {
  if (!state.finePointer || state.calm) return;
  const { gsap } = window;
  const disp = $('[data-wave-disp]'); const turb = $('[data-wave-turb]');
  if (!disp) return;
  let current = null; const o = { s: 0, f: 0.022 };
  const render = () => { disp.setAttribute('scale', o.s.toFixed(2)); turb.setAttribute('baseFrequency', `0.004 ${o.f.toFixed(4)}`); };
  document.addEventListener('pointerover', (e) => {
    const img = e.target.closest('[data-lightbox], .media--wave')?.querySelector('img');
    if (!img || img === current) return;
    if (current) current.style.filter = '';
    current = img; img.style.filter = 'url(#wave)';
    gsap.killTweensOf(o);
    gsap.fromTo(o, { s: 0, f: 0.03 }, { s: 16, f: 0.012, duration: 0.45, ease: 'power2.out', onUpdate: render,
      onComplete: () => gsap.to(o, { s: 0, duration: 0.9, ease: 'power3.out', onUpdate: render, onComplete: () => { if (current === img) { img.style.filter = ''; current = null; } } }) });
  });
}

// Visionneuse de la galerie
export function initLightbox() {
  const triggers = $$('[data-lightbox]');
  if (!triggers.length) return;
  const dlg = document.createElement('dialog');
  dlg.className = 'lightbox'; dlg.setAttribute('aria-label', 'Photo agrandie');
  dlg.innerHTML = `<button class="icon-btn lightbox__close" type="button" aria-label="Fermer" data-close><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
    <div class="lightbox__stage"><img alt=""></div>
    <div class="lightbox__bar"><button class="icon-btn" type="button" aria-label="Photo précédente" data-prev><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M15 6l-6 6 6 6"/></svg></button>
    <p class="mono muted" data-cap></p><button class="icon-btn" type="button" aria-label="Photo suivante" data-next><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 6l6 6-6 6"/></svg></button></div>`;
  document.body.appendChild(dlg);
  const im = dlg.querySelector('img'); const cap = dlg.querySelector('[data-cap]');
  let idx = 0;
  const show = (i) => {
    idx = (i + triggers.length) % triggers.length;
    const src = triggers[idx].querySelector('img');
    const big = (src.getAttribute('srcset') || '').split(',').map((s) => s.trim().split(' ')[0]).pop() || src.src;
    im.src = big; im.alt = src.alt; cap.textContent = `${String(idx + 1).padStart(2, '0')} / ${String(triggers.length).padStart(2, '0')} · ${src.alt}`;
  };
  triggers.forEach((t, i) => t.addEventListener('click', () => { show(i); dlg.showModal(); state.lenis?.stop(); }));
  dlg.addEventListener('close', () => state.lenis?.start());
  dlg.querySelector('[data-close]').addEventListener('click', () => dlg.close());
  dlg.querySelector('[data-prev]').addEventListener('click', () => show(idx - 1));
  dlg.querySelector('[data-next]').addEventListener('click', () => show(idx + 1));
  dlg.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft') show(idx - 1); if (e.key === 'ArrowRight') show(idx + 1); });
  dlg.addEventListener('click', (e) => { if (e.target === dlg || e.target.classList.contains('lightbox__stage')) dlg.close(); });
}
