// Ouverture des pages internes : titre sur les temps, visuel qui recule au défilement
import { state, on, $, $$ } from './state.js?v=20261028';

export function simpleHero(root = document) {
  const { gsap } = window;
  const hero = $('[data-phero-simple]', root);
  if (!hero) return;
  const lines = $$('[data-phero-line]', hero); const fades = $$('[data-phero-fade]', hero);
  const media = $('.phero__media', hero);
  if (state.calm) return;
  gsap.set(lines, { yPercent: 110 }); gsap.set(fades, { opacity: 0, y: 24 });
  gsap.set(media, { scale: 1.12 });
  on('intro', () => {
    gsap.to(media, { scale: 1, duration: 2, ease: 'expo.out' });
    gsap.to(lines, { yPercent: 0, duration: 1, stagger: 60 / state.bpm / 2, ease: 'expo.out', delay: 0.05 });
    gsap.to(fades, { opacity: 1, y: 0, duration: 0.9, stagger: 0.1, ease: 'power3.out', delay: 0.4 });
  });
  gsap.to(media, { yPercent: 18, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to($('.phero__content .shell', hero), { yPercent: -20, opacity: 0.2, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
}
