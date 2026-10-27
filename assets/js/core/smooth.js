// Défilement fluide (Lenis) relié à ScrollTrigger
import { Lenis } from '../vendor/lenis.esm.js';
import { state } from './state.js?v=20261027c';

export function initSmooth() {
  const { gsap, ScrollTrigger } = window;
  if (state.calm) return null;
  const lenis = new Lenis({ lerp: 0.105, wheelMultiplier: 1, touchMultiplier: 1.1, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  state.lenis = lenis;
  return lenis;
}

export function scrollToTarget(target, { offset = -90, immediate = false } = {}) {
  const el = typeof target === 'string' ? document.querySelector(target) : target;
  if (!el) return;
  if (state.lenis) state.lenis.scrollTo(el, { offset, immediate, duration: 1.4 });
  else window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY + offset, behavior: immediate || state.calm ? 'auto' : 'smooth' });
}

export function initAnchors() {
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href*="#"]');
    if (!a || e.defaultPrevented) return;
    const url = new URL(a.href, location.href);
    if (url.pathname !== location.pathname || !url.hash || url.hash.length < 2) return;
    const el = document.getElementById(decodeURIComponent(url.hash.slice(1)));
    if (!el) return;
    e.preventDefault();
    scrollToTarget(el);
    history.replaceState(null, '', url.hash);
  });
}

export function scrollProgress() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  return max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
}
