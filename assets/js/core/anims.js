// Mini-jeux des cartes « Animations » (karaoké, chaises musicales, buzzer de quiz)
import { state, $, $$ } from './state.js';
import { audio } from './audio.js';

export function initAnimToys(root = document) {
  const { gsap, ScrollTrigger } = window;
  const kara = $('[data-karaoke]', root);
  if (kara && !state.calm) {
    const rows = $$('i', kara);
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.4, paused: true });
    rows.forEach((r) => tl.fromTo(r, { '--k': 0 }, { '--k': 1, duration: 1.6, ease: 'none' }));
    tl.to(rows, { '--k': 0, duration: 0.3 });
    ScrollTrigger.create({ trigger: kara, start: 'top bottom', end: 'bottom top', onToggle: (st) => (st.isActive ? tl.play() : tl.pause()) });
  } else if (kara) $$('i', kara).forEach((r) => r.style.setProperty('--k', '0.6'));

  const chairs = $('[data-chairs]', root);
  if (chairs) {
    const svg = '<svg viewBox="0 0 22 26" fill="currentColor" aria-hidden="true"><rect x="3" y="0" width="3" height="16" rx="1"/><rect x="3" y="13" width="16" height="3" rx="1"/><rect x="4" y="16" width="2.4" height="10" rx="1"/><rect x="15.6" y="16" width="2.4" height="10" rx="1"/></svg>';
    chairs.innerHTML = svg.repeat(7);
    const items = $$('svg', chairs);
    if (!state.calm) {
      let out = 0; let acc = 0; let visible = false;
      ScrollTrigger.create({ trigger: chairs, start: 'top bottom', end: 'bottom top', onToggle: (st) => { visible = st.isActive; } });
      gsap.ticker.add((t, dt) => {
        if (!visible) return;
        acc += dt / 1000;
        const every = (60 / state.bpm) * 4;
        if (acc > every) { acc = 0; if (out >= items.length - 1) { out = 0; items.forEach((i) => i.classList.remove('is-out')); } else { items[Math.floor(Math.random() * items.length)].classList.add('is-out'); out = $$('svg.is-out', chairs).length; } }
      });
    }
  }

  const buzzer = $('[data-buzzer]', root); const buzzText = $('[data-buzz-text]', root);
  if (buzzer) {
    let n = 0;
    buzzer.addEventListener('click', () => {
      n += 1; buzzer.classList.add('is-hit'); buzzText.textContent = n === 1 ? 'Buzz !' : `Buzz ! ×${n}`;
      audio.buzz();
      setTimeout(() => buzzer.classList.remove('is-hit'), 600);
    });
  }

}
