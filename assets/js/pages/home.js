// Accueil (Face A)
import { state, on, $, $$, setMood, MOODS } from '../core/state.js?v=20261027';
import { setSound, audio } from '../core/deck.js?v=20261027';
import { initZoneBlock } from '../core/zonemap.js?v=20261027';
import { initAnimToys } from '../core/anims.js?v=20261027';

export default function home() {
  const { gsap, ScrollTrigger } = window;
  const mm = gsap.matchMedia();

  /* ---------- Ouverture : vinyle WebGL + titre sur 4 temps ---------- */
  const hero = $('[data-hero]');
  let vinyl = null;
  const lines = $$('[data-hero-line]', hero);
  const fades = $$('[data-hero-fade]', hero);
  const kicker = $('[data-hero-kicker]', hero);
  if (!state.calm) {
    gsap.set(lines, { yPercent: 110 });
    gsap.set([kicker, ...fades], { opacity: 0, y: 24 });
    import('../gl/vinyl.js?v=20261027').then(({ initVinyl }) => {
      vinyl = initVinyl($('[data-vinyl-gl]', hero));
      if (!vinyl) startFallbackSpin();
      if (introDone && vinyl) vinyl.intro(0);
      if (vinyl) {
        ScrollTrigger.create({ trigger: hero, start: 'top top', end: 'bottom top', scrub: true, onUpdate: (st) => { vinyl.layout.scroll = st.progress; } });
      }
    });
  }
  let introDone = false;
  on('intro', () => {
    introDone = true;
    if (state.calm) return;
    const beat = 60 / state.bpm / 2; // croches
    const tl = gsap.timeline();
    tl.to(kicker, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }, 0)
      .to(lines, { yPercent: 0, duration: 1.0, ease: 'expo.out', stagger: beat }, 0.05)
      .to(fades, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.12 }, 0.05 + beat * 3);
    vinyl?.intro(0);
  });
  if (!state.calm) {
    gsap.to('.hero__content .shell', { yPercent: -18, opacity: 0.15, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
  }
  function startFallbackSpin() {
    const el = $('.hero__fallback [data-spin]');
    if (el) gsap.to(el, { rotation: 360, duration: 1.8, ease: 'none', repeat: -1 });
  }

  /* ---------- A1 : la photo sort de sa pochette, le disque glisse ---------- */
  if (!state.calm) {
    const vis = $('[data-dj-visual]');
    mm.add({ wide: '(min-width: 960px)', narrow: '(max-width: 959px)' }, (ctx) => {
      const { wide } = ctx.conditions;
      gsap.timeline({ scrollTrigger: { trigger: vis, start: 'top 85%', end: 'bottom 35%', scrub: 0.8 } })
        .fromTo('[data-dj-vinyl]', { xPercent: 0, rotation: 0 }, { xPercent: wide ? 26 : 22, rotation: 240, ease: 'none' }, 0)
        .fromTo('[data-dj-sleeve]', { xPercent: 0, rotation: 0 }, { xPercent: wide ? -8 : -4, rotation: -3, ease: 'none' }, 0);
    });
  }

  /* ---------- A2 : pochettes en défilement horizontal, les disques sortent ---------- */
  const evSec = $('[data-events]');
  const track = $('[data-events-track]', evSec);
  const evs = $$('[data-ev]', evSec);
  const bar = $('[data-ev-bar]', evSec); const count = $('[data-ev-count]', evSec);
  const setCount = (p) => { const i = Math.min(evs.length, Math.max(1, Math.round(p * (evs.length - 1)) + 1)); count.textContent = `${String(i).padStart(2, '0')} / ${String(evs.length).padStart(2, '0')}`; bar.style.transform = `scaleX(${p})`; };
  if (!state.calm) {
    mm.add('(min-width: 900px)', () => {
      evSec.classList.add('is-pinned');
      const dist = () => track.scrollWidth - window.innerWidth;
      const tween = gsap.to(track, { x: () => -dist(), ease: 'none', scrollTrigger: {
        trigger: '[data-events-pin]', start: 'center 52%', end: () => `+=${dist()}`, pin: '[data-events-pin]', scrub: 0.6, invalidateOnRefresh: true, anticipatePin: 1,
        onUpdate: (st) => setCount(st.progress),
      } });
      evs.forEach((ev) => {
        const v = $('[data-ev-vinyl]', ev);
        gsap.fromTo(v, { xPercent: -30, rotation: -90 }, { xPercent: 12, rotation: 200, ease: 'none', scrollTrigger: { trigger: ev, containerAnimation: tween, start: 'left 85%', end: 'right 35%', scrub: true } });
      });
      return () => evSec.classList.remove('is-pinned');
    });
    mm.add('(max-width: 899px)', () => {
      const vp = $('[data-events-viewport]', evSec);
      const onScroll = () => setCount(vp.scrollLeft / Math.max(1, vp.scrollWidth - vp.clientWidth));
      vp.addEventListener('scroll', onScroll, { passive: true });
      const spins = evs.map((ev) => gsap.to($('[data-ev-vinyl]', ev), { rotation: 360, duration: 1.8, ease: 'none', repeat: -1, paused: true }));
      const io = new IntersectionObserver((ents) => ents.forEach((e) => { const i = evs.indexOf(e.target); e.isIntersecting ? spins[i].play() : spins[i].pause(); }), { root: vp, threshold: 0.6 });
      evs.forEach((ev) => io.observe(ev));
      return () => { vp.removeEventListener('scroll', onScroll); io.disconnect(); spins.forEach((s) => s.kill()); };
    });
  } else {
    const vp = $('[data-events-viewport]', evSec);
    vp.addEventListener('scroll', () => setCount(vp.scrollLeft / Math.max(1, vp.scrollWidth - vp.clientWidth)), { passive: true });
  }

  /* ---------- A3 : pads d'ambiance ---------- */
  const pads = $$('[data-pad]');
  const bgs = $$('[data-mood-bg]');
  const reflect = (key) => {
    pads.forEach((p) => p.setAttribute('aria-pressed', String(p.dataset.pad === key)));
    bgs.forEach((b) => b.classList.toggle('is-active', b.dataset.moodBg === key));
  };
  reflect(state.mood);
  on('mood', reflect);
  pads.forEach((pad) => pad.addEventListener('click', () => {
    const key = pad.dataset.pad;
    setMood(key);
    if (!audio.on) setSound(true);
    if (!state.calm) {
      gsap.fromTo($('.pad__ripple', pad), { opacity: 0.9, scale: 1 }, { opacity: 0, scale: 1.25, duration: 0.7, ease: 'power2.out' });
      gsap.fromTo(pad, { scale: 0.94 }, { scale: 1, duration: 0.5, ease: 'elastic.out(1, 0.5)' });
    }
  }));
  // Les pads respirent avec le tempo (sans flash)
  if (!state.calm) {
    gsap.ticker.add(() => {
      const active = pads.find((p) => p.getAttribute('aria-pressed') === 'true');
      if (active) active.style.setProperty('--glow', String(state.level));
    });
  }

  /* ---------- A4 : mini-jeux des cartes d'animation ---------- */
  initAnimToys(document);

  /* ---------- A6 : carte radar ---------- */
  const zone = $('#zone');
  if (zone) initZoneBlock(zone);

  /* ---------- A7 : bac de disques ---------- */
  const crate = $('[data-crate]');
  if (crate && !state.calm) {
    const recs = $$('.rec', crate);
    gsap.from(recs, { yPercent: 70, opacity: 0, stagger: 0.09, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: crate, start: 'top 75%', once: true } });
    if (state.finePointer) {
      crate.addEventListener('pointermove', (e) => {
        const r = crate.getBoundingClientRect(); const px = (e.clientX - r.left) / r.width;
        recs.forEach((rec, i) => { const d = Math.abs(px - (0.04 + i * 0.17 + 0.19)); gsap.to(rec, { y: d < 0.1 ? -40 : 0, duration: 0.5, ease: 'power3.out' }); });
      });
      crate.addEventListener('pointerleave', () => gsap.to(recs, { y: 0, duration: 0.6, ease: 'power3.out' }));
    }
  }
}
