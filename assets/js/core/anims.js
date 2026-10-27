// Mini-jeux des cartes « Animations » (karaoké, chaises musicales, buzzer de quiz)
import { state, $, $$ } from './state.js?v=20261027c';
import { audio } from './audio.js?v=20261027c';

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
    // Chaise vue de trois quarts : dossier, assise, quatre pieds
    const svg = '<svg viewBox="0 0 26 32" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 2v15M19 2v15M7 5h12M7 10h12"/><path d="M4 17h18l-2 4H6z" fill="currentColor"/><path d="M6 21v9M20 21v9M9 21v6M17 21v6"/></svg>';
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
