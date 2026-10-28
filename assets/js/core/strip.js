// Bande de photos horizontale : glisser à la souris, inertie douce
import { $$, state } from './state.js?v=20261028-2';

export function initStrip() {
  $$('[data-strip]').forEach((strip) => {
    let down = false, sx = 0, sl = 0, moved = 0, v = 0, lastX = 0, raf = null;
    strip.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse') return;
      down = true; moved = 0; sx = lastX = e.clientX; sl = strip.scrollLeft; v = 0; cancelAnimationFrame(raf);
      strip.classList.add('is-drag');
    });
    window.addEventListener('pointermove', (e) => {
      if (!down) return;
      const dx = e.clientX - sx; moved = Math.max(moved, Math.abs(dx));
      v = e.clientX - lastX; lastX = e.clientX;
      strip.scrollLeft = sl - dx;
    });
    window.addEventListener('pointerup', () => {
      if (!down) return; down = false; strip.classList.remove('is-drag');
      if (state.calm) return;
      const glide = () => { v *= 0.94; strip.scrollLeft -= v; if (Math.abs(v) > 0.4) raf = requestAnimationFrame(glide); };
      raf = requestAnimationFrame(glide);
    });
    // Un glisser ne doit pas ouvrir la visionneuse
    strip.addEventListener('click', (e) => { if (moved > 6) { e.stopPropagation(); e.preventDefault(); } }, true);
    // La molette verticale fait défiler la bande quand elle est survolée
    strip.addEventListener('wheel', (e) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      const max = strip.scrollWidth - strip.clientWidth;
      if ((e.deltaY > 0 && strip.scrollLeft < max - 1) || (e.deltaY < 0 && strip.scrollLeft > 0)) { e.preventDefault(); e.stopPropagation(); strip.scrollLeft += e.deltaY; }
    }, { passive: false });
  });
}
