// 404 « Disque rayé » : le disque saute comme un sillon rayé
import { state, $ } from '../core/state.js?v=20261027c';
export default function e404() {
  const { gsap } = window;
  const v = $('[data-scratch]');
  if (!v || state.calm) return;
  gsap.timeline({ repeat: -1 })
    .to(v, { rotation: '+=200', duration: 0.6, ease: 'none' })
    .to(v, { rotation: '-=40', duration: 0.12, ease: 'power2.out' })
    .to(v, { rotation: '+=40', duration: 0.12, ease: 'power2.in' })
    .to(v, { rotation: '-=40', duration: 0.12, ease: 'power2.out' })
    .to(v, { rotation: '+=160', duration: 0.5, ease: 'none' });
}
