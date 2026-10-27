// Barre « deck » : son démo, mode calme, crossfader de progression + horloge musicale partagée
import { state, emit, on, $, $$, store, MOODS } from './state.js?v=20261027';
import { audio } from './audio.js?v=20261027';
import { scrollProgress } from './smooth.js?v=20261027';

let hintTimer = null;
export function hint(text, ms = 3200) {
  const el = $('[data-deck-hint]');
  if (!el) return;
  el.textContent = text;
  el.classList.add('is-visible');
  clearTimeout(hintTimer);
  hintTimer = setTimeout(() => el.classList.remove('is-visible'), ms);
}

export async function setSound(onOff) {
  const btn = $('[data-sound-toggle]');
  try {
    if (onOff) { await audio.start(); hint(`Son démo · ambiance ${MOODS[state.mood].name.toLowerCase()} · boucle générée par le navigateur`); }
    else { audio.stop(); }
  } catch (e) {
    hint('Le son n’est pas disponible sur ce navigateur.');
  }
  btn?.setAttribute('aria-pressed', String(audio.on));
}

export function initDeck() {
  const { gsap } = window;
  const soundBtn = $('[data-sound-toggle]');
  const calmBtn = $('[data-calm-toggle]');
  const knob = $('[data-xknob]');
  const fill = $('[data-xfill]');
  const time = $('[data-time]');
  const eqBars = $$('.deck__btn .eq i');

  soundBtn?.addEventListener('click', () => setSound(!audio.on));

  calmBtn?.setAttribute('aria-pressed', String(state.calm));
  calmBtn?.addEventListener('click', () => {
    const next = !state.calm;
    store.set('sono-calm', next ? '1' : '0');
    store.set('sono-scroll', String(window.scrollY), true);
    store.set('sono-calm-hint', next ? 'on' : 'off', true);
    location.reload();
  });
  const calmHint = store.get('sono-calm-hint', true);
  if (calmHint) {
    store.del('sono-calm-hint', true);
    setTimeout(() => hint(calmHint === 'on' ? 'Mode calme activé : animations réduites, aucun effet lumineux.' : 'Mode calme désactivé.'), 900);
  }
  const savedScroll = store.get('sono-scroll', true);
  if (savedScroll) { store.del('sono-scroll', true); requestAnimationFrame(() => window.scrollTo(0, +savedScroll)); }

  on('sound', (v) => soundBtn?.setAttribute('aria-pressed', String(v)));

  // Horloge musicale : niveau réel (son) ou pulsation douce simulée (≤ 2,2 pulsations/s, jamais de flash)
  let smooth = 0;
  const t0 = performance.now();
  gsap.ticker.add(() => {
    const t = (performance.now() - t0) / 1000;
    const beats = t * (state.bpm / 60);
    state.beat = beats % 1;
    let target = 0;
    if (state.calm) target = 0;
    else if (audio.on) target = audio.measure();
    else target = 0.12 + Math.pow(1 - state.beat, 3) * 0.32;
    smooth += (target - smooth) * 0.25;
    state.level = smooth;

    if (eqBars.length) {
      const b = audio.bands(4);
      eqBars.forEach((bar, i) => { bar.style.height = `${b ? 20 + b[i] * 80 : 30 + (state.calm ? 0 : Math.sin(t * 3 + i) * 10)}%`; });
    }
    const p = scrollProgress();
    if (knob) knob.style.left = `${p * 100}%`;
    if (fill) fill.style.width = `${p * 100}%`;
    if (time) {
      const total = 330; const s = Math.round(p * total);
      time.textContent = `${state.face} · ${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
    }
  });

  // Le son se coupe au changement de page : on le signale à l'arrivée
  window.addEventListener('pagehide', () => { if (audio.on) store.set('sono-was-playing', '1', true); });
  on('leave', () => { if (audio.on) { store.set('sono-was-playing', '1', true); audio.stop(); } });
  if (store.get('sono-was-playing', true)) {
    store.del('sono-was-playing', true);
    setTimeout(() => hint('Touchez « Son démo » pour relancer la musique.'), 1400);
  }
}

export { audio };
