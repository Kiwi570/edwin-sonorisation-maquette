// Ouverture (loader « l'aiguille se pose »), transitions de page « balayage laser », révélations au défilement
import { state, $, $$, store, emit } from './state.js?v=20261027';

const FACES = { 'index.html': 'Face A · Accueil', '': 'Face A · Accueil', 'prestations.html': 'Face B · Prestations', 'prestations': 'Face B · Prestations',
  'livre-d-or.html': 'Face C · Livre d’or', 'livre-d-or': 'Face C · Livre d’or', 'contact.html': 'Face D · Contact', 'contact': 'Face D · Contact',
  'mentions-legales.html': 'Mentions légales', 'mentions-legales': 'Mentions légales' };

/* ---------- Ouverture (première visite de l'accueil) ---------- */
export function runLoader() {
  const html = document.documentElement;
  const loader = $('[data-loader]');
  const { gsap } = window;
  if (!loader || !html.classList.contains('show-loader')) return Promise.resolve(false);
  loader.classList.add('is-active');
  html.classList.remove('show-loader');
  store.set('sono-seen', '1', true);
  return new Promise((resolve) => {
    const rpm = { v: 0 };
    const rpmEl = $('[data-l-rpm]');
    const word = $('[data-l-word]');
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    gsap.set('[data-l-arm]', { rotation: -26, svgOrigin: '276 34' });
    tl.from('[data-l-disc]', { scale: 0.7, opacity: 0, duration: 0.5, svgOrigin: '150 150' })
      .to('[data-l-disc]', { rotation: 360, duration: 3.2, ease: 'none', svgOrigin: '150 150' }, 0.1)
      .to('[data-l-arm]', { rotation: 0, duration: 0.6, ease: 'power3.inOut' }, 0.25)
      .to('[data-l-ring]', { strokeDashoffset: 0, duration: 0.75, ease: 'power2.inOut' }, 0.8)
      .to(rpm, { v: 33.3, duration: 0.75, ease: 'power2.out', onUpdate: () => { rpmEl.textContent = rpm.v >= 33.3 ? '33⅓' : rpm.v.toFixed(0).padStart(2, '0'); } }, 0.8)
      .from(word.children, { yPercent: 100, opacity: 0, duration: 0.5, stagger: 0.08 }, 0.95)
      .to(loader, { yPercent: -100, duration: 0.75, ease: 'expo.inOut', onStart: () => resolve(true) }, 1.65)
      .add(() => { loader.classList.remove('is-active'); loader.remove(); });
    setTimeout(() => { resolve(true); loader.remove(); }, 4500); // filet de sécurité
  });
}

/* ---------- Transitions entre pages ---------- */
export function initTransitions() {
  const wipe = $('[data-wipe]');
  if (!wipe) return;
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if ((a.target && a.target !== '_self') || a.hasAttribute('download')) return;
    const href = a.getAttribute('href') || '';
    if (!href || href.startsWith('#') || /^(tel|mailto|sms):/i.test(href)) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return;
    if (url.pathname === location.pathname) return; // même page : laissé aux ancres
    e.preventDefault();
    leave(url.href);
  });
  window.addEventListener('pageshow', (e) => { if (e.persisted) { wipe.classList.remove('is-covering'); window.gsap.set(wipe.children, { clearProps: 'all' }); } });
}

function faceFor(href) {
  const file = new URL(href).pathname.split('/').pop();
  return FACES[file] || 'Sonorisation';
}

function leave(href) {
  const { gsap } = window;
  state.leaving = true; emit('leave');
  const wipe = $('[data-wipe]'); const panel = wipe.querySelector('.wipe__panel'); const laser = wipe.querySelector('.wipe__laser'); const label = wipe.querySelector('[data-wipe-label]');
  store.set('sono-wipe', '1', true);
  label.textContent = faceFor(href);
  wipe.style.visibility = 'visible';
  if (state.calm) {
    gsap.fromTo(panel, { scaleX: 1, opacity: 0 }, { opacity: 1, duration: 0.2, onComplete: () => { location.href = href; } });
    return;
  }
  const w = window.innerWidth;
  gsap.timeline({ onComplete: () => { location.href = href; } })
    .set(panel, { transformOrigin: 'left center', scaleX: 0 })
    .set(laser, { x: 0, opacity: 1 })
    .to(panel, { scaleX: 1, duration: 0.62, ease: 'power3.inOut' }, 0)
    .to(laser, { x: w, duration: 0.62, ease: 'power3.inOut' }, 0)
    .to(label, { opacity: 1, duration: 0.3 }, 0.3);
  setTimeout(() => { location.href = href; }, 1100);
}

export function arrive() {
  const html = document.documentElement; const { gsap } = window;
  const wipe = $('[data-wipe]');
  store.del('sono-wipe', true);
  if (!wipe || !html.classList.contains('is-arriving')) { html.classList.remove('is-arriving'); return Promise.resolve(); }
  const panel = wipe.querySelector('.wipe__panel'); const laser = wipe.querySelector('.wipe__laser');
  return new Promise((resolve) => {
    wipe.style.visibility = 'visible';
    gsap.set(panel, { scaleX: 1, transformOrigin: 'right center' });
    html.classList.remove('is-arriving');
    if (state.calm) { gsap.to(panel, { opacity: 0, duration: 0.25, onComplete: () => { wipe.style.visibility = ''; gsap.set(panel, { clearProps: 'all' }); resolve(); } }); return; }
    gsap.timeline({ onComplete: () => { wipe.style.visibility = ''; gsap.set([panel, laser], { clearProps: 'all' }); } })
      .set(laser, { x: 0, opacity: 1 })
      .to(panel, { scaleX: 0, duration: 0.7, ease: 'power3.inOut' }, 0)
      .to(laser, { x: window.innerWidth, duration: 0.7, ease: 'power3.inOut' }, 0)
      .to(laser, { opacity: 0, duration: 0.15 }, 0.62)
      .add(resolve, 0.3);
  });
}

/* ---------- Révélations au défilement ---------- */
export function initReveal() {
  const { gsap, ScrollTrigger, SplitText } = window;
  if (state.calm) return;

  $$('[data-reveal="lines"]').forEach((el) => {
    if (!SplitText) return;
    SplitText.create(el, {
      type: 'lines', mask: 'lines', autoSplit: true, linesClass: 'split-line',
      onSplit(self) {
        return gsap.from(self.lines, { yPercent: 115, duration: 1.15, stagger: 0.09, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
      },
    });
  });

  $$('[data-reveal="fade"]').forEach((el) => {
    gsap.from(el, { y: 36, opacity: 0, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
  });

  $$('[data-reveal="img"]').forEach((el) => {
    gsap.fromTo(el, { clipPath: 'inset(18% 12% 18% 12% round 18px)' }, { clipPath: 'inset(0% 0% 0% 0% round 18px)', ease: 'power3.out', duration: 1.4, scrollTrigger: { trigger: el, start: 'top 85%', once: true } });
  });

  $$('[data-parallax]').forEach((el) => {
    const v = parseFloat(el.dataset.parallax) || 0.1;
    gsap.fromTo(el, { y: () => -v * window.innerHeight }, { y: () => v * window.innerHeight, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true } });
  });

  // Compteurs façon afficheur BPM : chaque chiffre défile
  $$('[data-count]').forEach((el) => {
    const val = String(el.dataset.count);
    el.setAttribute('aria-label', val); el.textContent = '';
    const wrap = document.createElement('span'); wrap.className = 'roll'; wrap.setAttribute('aria-hidden', 'true');
    const cols = val.split('').map((d) => {
      const col = document.createElement('span'); col.className = 'roll__col';
      for (let k = 0; k < 3; k++) for (let n = 0; n < 10; n++) { const s = document.createElement('span'); s.textContent = n; col.appendChild(s); }
      wrap.appendChild(col); return { col, d: +d };
    });
    el.appendChild(wrap);
    cols.forEach(({ col, d }, i) => {
      gsap.fromTo(col, { yPercent: 0 }, { yPercent: -((20 + d) / 30) * 100, duration: 1.6 + i * 0.25, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
    });
  });

  ScrollTrigger.refresh();
}
