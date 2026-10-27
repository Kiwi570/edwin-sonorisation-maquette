// Point d'entrée commun à toutes les pages
import { state, initMoodFromSession, emit, $, store } from './core/state.js';
import { initHours } from './core/hours.js';
import { initSmooth, initAnchors, scrollToTarget } from './core/smooth.js';
import { initDeck } from './core/deck.js';
import { initGrain, initHeader, initMenu, initCursor, initMagnetic, initTilt, initTonearm, initWave, initLightbox } from './core/ui.js';
import { runLoader, initTransitions, arrive, initReveal } from './core/intro.js';

const html = document.documentElement;
const PAGES = ['home', 'prestations', 'livre', 'contact', 'legal', 'e404'];

function failsafe() { html.classList.remove('show-loader', 'is-arriving'); }

// Bandeau final « On lance le son ? » : les lettres ondulent doucement avec le tempo
function initCTA() {
  const { gsap, ScrollTrigger, SplitText } = window;
  const title = $('[data-cta-title]');
  if (!title || state.calm || !SplitText) return;
  const split = SplitText.create(title, { type: 'chars,words', charsClass: 'char' });
  const chars = split.chars;
  gsap.from(chars, { yPercent: 80, opacity: 0, stagger: 0.025, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: title, start: 'top 85%', once: true } });
  let visible = false;
  ScrollTrigger.create({ trigger: title, start: 'top bottom', end: 'bottom top', onToggle: (st) => { visible = st.isActive; } });
  gsap.ticker.add(() => {
    if (!visible) return;
    const t = performance.now() / 1000; const lv = state.level;
    chars.forEach((c, i) => { c.style.transform = `translateY(${(-Math.max(0, Math.sin(t * 2.2 - i * 0.45)) * lv * 0.12).toFixed(3)}em)`; });
  });
}

async function boot() {
  const { gsap, ScrollTrigger, SplitText } = window;
  if (!gsap || !ScrollTrigger) { failsafe(); return; }
  gsap.registerPlugin(ScrollTrigger);
  if (SplitText) gsap.registerPlugin(SplitText);
  ScrollTrigger.config({ ignoreMobileResize: true });

  initMoodFromSession();
  initGrain();
  if (document.querySelector('[data-ph]')) import('./core/placeholders.js').then((m) => m.initPlaceholders());
  // Liens « Devis » préremplis : le type d'événement suit le visiteur jusqu'au formulaire
  document.addEventListener('click', (e) => { const a = e.target.closest('[data-prefill]'); if (a) store.set('sono-prefill', a.dataset.prefill, true); }, true);
  initHours();
  initHeader();
  initMenu();
  initSmooth();
  initAnchors();
  initDeck();
  initCursor();
  initMagnetic();
  initTilt();
  initTonearm();
  initWave();
  initLightbox();
  initTransitions();

  if (PAGES.includes(state.page)) {
    try { const mod = await import(`./pages/${state.page}.js`); await mod.default?.(); }
    catch (e) { console.error('[page]', e); }
  }

  await Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), new Promise((r) => setTimeout(r, 1500))]);
  initReveal();
  initCTA();

  const hadLoader = await runLoader();
  if (!hadLoader) await arrive();
  emit('intro');
  ScrollTrigger.refresh();

  if (location.hash.length > 1) {
    const el = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (el) setTimeout(() => scrollToTarget(el, { immediate: true }), 60);
  }
}

boot().catch((e) => { console.error(e); failsafe(); });
