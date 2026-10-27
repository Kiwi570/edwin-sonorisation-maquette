// Livre d'or (Face C)
import { state, on, $, $$ } from '../core/state.js';
import { initStrip } from '../core/strip.js';
import { simpleHero } from '../core/hero-simple.js';

export default function livre() {
  const { gsap } = window;
  simpleHero();
  initStrip();

  // Les emplacements d'avis tombent dans le bac
  if (!state.calm) {
    gsap.from($$('.review-slot'), { y: 80, rotation: (i) => (i - 1) * 4, opacity: 0, stagger: 0.12, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: '[data-reviews]', start: 'top 85%', once: true } });
    $$('.review-slot__disc').forEach((d) => gsap.to(d, { rotation: 360, duration: 4, ease: 'none', repeat: -1 }));
  }

  // Formulaire de témoignage (simulé) : le disque est « pressé »
  const form = $('[data-testi-form]'); const status = $('[data-form-status]'); const press = $('[data-press]');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const missing = Array.from(form.querySelectorAll('[required]')).filter((f) => (f.type === 'checkbox' ? !f.checked : !f.value.trim()));
    form.querySelectorAll('[aria-invalid]').forEach((f) => f.removeAttribute('aria-invalid'));
    if (missing.length) {
      missing.forEach((f) => f.setAttribute('aria-invalid', 'true'));
      status.className = 'form-status is-err';
      status.textContent = 'Merci de compléter le prénom, l’événement, le message et la case de consentement.';
      missing[0].focus();
      return;
    }
    status.className = 'form-status is-ok';
    status.textContent = `Merci ${form.prenom.value.trim()} ! Votre disque est pressé. (Démonstration : rien n’a été envoyé.)`;
    if (!state.calm) {
      gsap.timeline()
        .fromTo(press, { opacity: 0, scale: 0.3, rotation: 0 }, { opacity: 1, scale: 1, rotation: 540, duration: 1.2, ease: 'expo.out' })
        .to(press, { scale: 0.92, duration: 0.12, yoyo: true, repeat: 1 })
        .to(press, { y: 260, opacity: 0, rotation: 720, duration: 0.9, ease: 'power3.in', delay: 0.6 })
        .set(press, { y: 0 });
    }
    form.reset();
  });
}
