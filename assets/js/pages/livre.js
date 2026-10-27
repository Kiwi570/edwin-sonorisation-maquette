// Livre d'or (Face C)
import { state, $ } from '../core/state.js?v=20261027c';
import { initStrip } from '../core/strip.js?v=20261027c';
import { simpleHero } from '../core/hero-simple.js?v=20261027c';

export default function livre() {
  const { gsap } = window;
  simpleHero();
  initStrip();

  // Formulaire de témoignage (simulé) : le disque est « pressé »
  const form = $('[data-testi-form]'); const status = $('[data-form-status]'); const press = $('[data-press]');
  const fields = [
    [form.prenom, 'Indiquez votre prénom.'],
    [form.evenement, 'Choisissez le type d’événement.'],
    [form.message, 'Écrivez quelques mots sur votre soirée.'],
    [form.rgpd, 'Cochez la case pour autoriser la publication.'],
  ];
  const errFor = (f) => document.getElementById(f.getAttribute('aria-describedby'));
  const clear = () => fields.forEach(([f]) => { f.removeAttribute('aria-invalid'); f.closest('.check')?.classList.remove('is-invalid'); const e = errFor(f); if (e) { e.textContent = ''; e.classList.remove('is-on'); } });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    clear();
    const missing = fields.filter(([f]) => (f.type === 'checkbox' ? !f.checked : !f.value.trim()));
    if (missing.length) {
      missing.forEach(([f, msg]) => {
        f.setAttribute('aria-invalid', 'true'); f.closest('.check')?.classList.add('is-invalid');
        const el = errFor(f); if (el) { el.textContent = msg; el.classList.add('is-on'); }
      });
      status.className = 'form-status is-err';
      status.textContent = missing.length > 1 ? `${missing.length} champs à compléter.` : '';
      missing[0][0].focus();
      return;
    }
    status.className = 'form-status is-ok';
    status.textContent = `Merci ${form.prenom.value.trim()} ! Votre témoignage est prêt à être publié. (Démonstration : rien n’a été envoyé.)`;
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
