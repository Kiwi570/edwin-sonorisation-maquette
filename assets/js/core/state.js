// État partagé + petit bus d'événements
const html = document.documentElement;

export const MOODS = {
  lounge:  { name: 'Lounge',  bpm: 90,  tint: '#ffb35c' },
  dansant: { name: 'Dansant', bpm: 124, tint: '#72e15b' },
  retro:   { name: 'Rétro',   bpm: 116, tint: '#ff5fa2' },
  moderne: { name: 'Moderne', bpm: 128, tint: '#7fe0ff' },
};

export const SITE = {
  phone: '07 86 39 91 56',
  tel: 'tel:+33786399156',
  city: 'Bruay-La-Buissière',
  radiusKm: 50,
  // Disponibilités publiées sur le site actuel (heure de Paris), en minutes depuis minuit. 1 = lundi.
  hours: {
    1: [[16 * 60 + 30, 19 * 60]],
    2: [[16 * 60 + 30, 19 * 60]],
    3: [[16 * 60 + 30, 19 * 60]],
    4: [[16 * 60 + 30, 19 * 60]],
    5: [[8 * 60, 12 * 60], [13 * 60, 16 * 60 + 30]],
  },
  cited: ['Saint-Pol-sur-Ternoise', 'Bully-les-Mines', 'Avion', 'Aire-sur-la-Lys', 'Mazingarbe', 'Béthune', 'Nœux-les-Mines', 'Auchel'],
  landmarks: ['Lens', 'Arras', 'Lille', 'Saint-Omer', 'Douai', 'Hazebrouck'],
};

const mq = (q) => window.matchMedia && window.matchMedia(q).matches;

export const state = {
  calm: html.classList.contains('calm'),
  reduced: mq('(prefers-reduced-motion: reduce)'),
  finePointer: mq('(hover: hover) and (pointer: fine)'),
  mood: 'dansant',
  bpm: MOODS.dansant.bpm,
  tint: MOODS.dansant.tint,
  level: 0,          // 0 → 1 : niveau « musical » (son réel ou pulsation simulée)
  beat: 0,           // phase du temps courant 0 → 1
  soundOn: false,
  lenis: null,
  page: document.body.dataset.page || '',
  face: { home: 'A', prestations: 'B', livre: 'C', contact: 'D' }[document.body.dataset.page] || 'A',
};

const bus = new EventTarget();
export const on = (name, fn) => bus.addEventListener(name, (e) => fn(e.detail));
export const emit = (name, detail) => bus.dispatchEvent(new CustomEvent(name, { detail }));

export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

export const store = {
  get(k, session = false) { try { return (session ? sessionStorage : localStorage).getItem(k); } catch (e) { return null; } },
  set(k, v, session = false) { try { (session ? sessionStorage : localStorage).setItem(k, v); } catch (e) { /* stockage indisponible */ } },
  del(k, session = false) { try { (session ? sessionStorage : localStorage).removeItem(k); } catch (e) { /* */ } },
};

export function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function setMood(key, { silent = false } = {}) {
  const m = MOODS[key];
  if (!m) return;
  state.mood = key; state.bpm = m.bpm; state.tint = m.tint;
  const [r, g, b] = hexToRgb(m.tint);
  html.style.setProperty('--tint', m.tint);
  html.style.setProperty('--tint-rgb', `${r}, ${g}, ${b}`);
  $$('[data-bpm]').forEach((el) => { el.textContent = String(m.bpm); });
  $$('[data-mood-name]').forEach((el) => { el.textContent = m.name; });
  store.set('sono-mood', key, true);
  if (!silent) emit('mood', key);
}

export function initMoodFromSession() {
  const k = store.get('sono-mood', true);
  if (k && MOODS[k]) setMood(k, { silent: true });
}
