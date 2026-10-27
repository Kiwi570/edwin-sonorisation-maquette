// Contact (Face D) : table de mixage, devis « Construisez votre set », horaires, zone
import { state, $, $$, SITE } from '../core/state.js?v=20261027';
import { simpleHero } from '../core/hero-simple.js?v=20261027';
import { initZoneBlock, communeCombobox, describe, loadZoneData } from '../core/zonemap.js?v=20261027';
import { audio } from '../core/audio.js?v=20261027';

export default function contact() {
  const { gsap } = window;
  simpleHero();

  /* ---------- D0 : table de mixage (faders qu'on peut pousser, vumètres sur le tempo) ---------- */
  const mixer = $('[data-mixer]');
  if (mixer) {
    const N = window.innerWidth < 700 ? 4 : 6;
    for (let i = 0; i < N; i++) {
      const ch = document.createElement('div'); ch.className = 'mixer__ch';
      ch.innerHTML = `<span class="mixer__knob" style="--k:${-60 + i * 22}deg"></span><span class="mixer__knob" style="--k:${20 - i * 15}deg"></span>
        <span class="mixer__slot"><span class="mixer__cap" style="--f:${20 + ((i * 37) % 55)}%"></span><span class="mixer__meter">${'<i></i>'.repeat(16)}</span></span>`;
      mixer.appendChild(ch);
    }
    const chans = $$('.mixer__ch', mixer).map((ch) => ({ cap: $('.mixer__cap', ch), slot: $('.mixer__slot', ch), leds: $$('.mixer__meter i', ch), f: parseFloat($('.mixer__cap', ch).style.getPropertyValue('--f')) / 100 }));
    // Glisser un fader (souris ou doigt)
    chans.forEach((c) => {
      c.slot.style.pointerEvents = 'auto'; c.slot.style.touchAction = 'none';
      const set = (e) => { const r = c.slot.getBoundingClientRect(); c.f = Math.min(0.92, Math.max(0, 1 - (e.clientY - r.top) / r.height)); c.cap.style.setProperty('--f', `${c.f * 100}%`); };
      c.slot.addEventListener('pointerdown', (e) => { c.slot.setPointerCapture(e.pointerId); set(e); });
      c.slot.addEventListener('pointermove', (e) => { if (c.slot.hasPointerCapture(e.pointerId)) set(e); });
    });
    $('.mixer-hero').style.pointerEvents = 'auto';
    let t = 0;
    gsap.ticker.add((time, dt) => {
      t += dt / 1000;
      chans.forEach((c, i) => {
        const wob = state.calm ? 0.5 : 0.5 + 0.5 * Math.sin(t * (1.3 + i * 0.4) + i);
        const lvl = state.calm ? c.f * 0.8 : Math.min(1, c.f * (0.55 + state.level * 0.9) + wob * 0.15);
        const n = Math.round(lvl * 16);
        c.leds.forEach((l, j) => { const idx = 15 - j; l.classList.toggle('on', idx < n); l.classList.toggle('hi', idx >= 13 && idx < n); });
      });
    });
  }

  /* ---------- D1 : devis en 6 pistes ---------- */
  const form = $('[data-devis]');
  const steps = $$('[data-step]', form);
  const segs = $$('[data-devis-steps] button', form);
  const prev = $('[data-prev]', form); const next = $('[data-next]', form); const nextLabel = $('[data-next-label]', form);
  const status = $('[data-devis-status]', form);
  const pressed = $('[data-pressed]', form);
  const disc = $('[data-record-disc]'); const label = $('[data-record-label]');
  const rlType = $('[data-rl-type]'); const rlDate = $('[data-rl-date]');
  const tl = $$('[data-tl]'); const tlCount = $('[data-tl-count]');
  const data = { type: '', date: '', dateUnknown: false, commune: null, communeText: '', salle: '', guests: 80, styles: [], animations: [], name: '', tel: '', mail: '', rgpd: false };
  const done = new Set();
  let cur = 1;

  if (!state.calm) gsap.to(disc, { rotation: 360, duration: 1.8, ease: 'none', repeat: -1 });

  const setTrack = (n, val, meta) => {
    const li = tl[n - 1]; if (!li) return;
    $('[data-tl-val]', li).textContent = val; $('[data-tl-meta]', li).textContent = meta || '';
    const was = li.classList.contains('is-set'); li.classList.add('is-set'); done.add(n);
    tlCount.textContent = `${done.size} / 6`;
    if (!was && !state.calm) {
      gsap.fromTo(li, { x: -16, opacity: 0.2 }, { x: 0, opacity: 1, duration: 0.6, ease: 'expo.out' });
      gsap.fromTo('[data-record]', { scale: 0.97 }, { scale: 1, duration: 0.6, ease: 'elastic.out(1, 0.5)' });
    }
  };

  const show = (n) => {
    cur = n;
    steps.forEach((s) => s.classList.toggle('is-current', +s.dataset.step === n));
    segs.forEach((b, i) => { b.classList.toggle('is-current', i + 1 === n); b.classList.toggle('is-done', done.has(i + 1) && i + 1 !== n); });
    prev.style.visibility = n === 1 ? 'hidden' : 'visible';
    nextLabel.textContent = n === 6 ? 'Presser ma demande' : 'Suivant';
    status.textContent = ''; status.className = 'form-status';
    const s = steps[n - 1];
    if (!state.calm) gsap.fromTo(s, { opacity: 0, x: 24 }, { opacity: 1, x: 0, duration: 0.5, ease: 'power3.out' });
  };

  // Piste 1 : type d'événement
  $$('[data-single="type"] .chip', form).forEach((chip) => chip.addEventListener('click', () => {
    $$('[data-single="type"] .chip', form).forEach((c) => { c.setAttribute('aria-checked', 'false'); c.classList.remove('is-on'); });
    chip.setAttribute('aria-checked', 'true'); chip.classList.add('is-on');
    data.type = chip.dataset.val; rlType.textContent = data.type; setTrack(1, data.type, '');
  }));

  // Piste 2 : date + compte à rebours
  const dateIn = $('[data-date]', form); const unknown = $('[data-date-unknown]', form);
  const cdNum = $('[data-cd-num]', form); const cdLabel = $('[data-cd-label]', form);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  dateIn.min = today.toISOString().slice(0, 10);
  const updateDate = () => {
    data.dateUnknown = unknown.checked;
    if (unknown.checked) { data.date = ''; cdNum.textContent = '?'; cdLabel.textContent = 'Date à fixer'; rlDate.textContent = 'Date à fixer'; setTrack(2, 'Date à fixer', ''); return; }
    if (!dateIn.value) { cdNum.textContent = '—'; cdLabel.textContent = 'Choisissez une date'; return; }
    const d = new Date(`${dateIn.value}T00:00:00`);
    const days = Math.round((d - today) / 86400000);
    if (days < 0) { cdNum.textContent = '—'; cdLabel.textContent = 'Cette date est passée'; data.date = ''; return; }
    data.date = dateIn.value;
    cdNum.textContent = days === 0 ? 'J' : `J-${days}`;
    const fr = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    cdLabel.textContent = fr;
    rlDate.textContent = d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    setTrack(2, d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }), days === 0 ? 'J' : `J-${days}`);
  };
  dateIn.addEventListener('change', updateDate); dateIn.addEventListener('input', updateDate); unknown.addEventListener('change', updateDate);

  // Piste 3 : commune (contrôle du rayon de 50 km)
  const cIn = $('[data-devis-commune]', form); const cList = $('[data-devis-commune-list]', form); const zoneOut = $('[data-devis-zone]', form);
  const onCommune = (it) => {
    data.commune = it; data.communeText = it ? it.name : cIn.value;
    const d = describe(it); zoneOut.className = `zone-result ${d.cls}`; zoneOut.innerHTML = d.html;
    if (it) setTrack(3, it.name, `${it.d.toFixed(0)} km`);
  };
  communeCombobox(cIn, cList, onCommune);
  cIn.addEventListener('change', () => { if (!data.commune || data.commune.name !== cIn.value) { data.commune = null; data.communeText = cIn.value; } });
  $('[data-salle]', form).addEventListener('input', (e) => { data.salle = e.target.value; });

  // Piste 4 : invités
  const g = $('[data-guests]', form); const gOut = $('[data-guests-out]', form);
  const updG = () => { data.guests = +g.value; gOut.textContent = g.value; setTrack(4, `${g.value} invités`, ''); };
  g.addEventListener('input', updG);

  // Piste 5 : styles et animations
  $$('[data-multi]', form).forEach((group) => {
    const key = group.dataset.multi;
    $$('.chip', group).forEach((chip) => chip.addEventListener('click', () => {
      const on = chip.getAttribute('aria-pressed') !== 'true';
      chip.setAttribute('aria-pressed', String(on));
      data[key] = $$('.chip[aria-pressed="true"]', group).map((c) => c.dataset.val);
      const all = [...data.styles, ...data.animations];
      if (all.length) setTrack(5, data.styles.join(', ') || 'Ambiance', data.animations.length ? `+${data.animations.length} anim.` : '');
    }));
  });

  // Piste 6 : coordonnées
  const nameIn = $('[data-name]', form), telIn = $('[data-tel]', form), mailIn = $('[data-mail]', form), rgpd = $('[data-rgpd]', form);

  const validate = (n) => {
    if (n === 1 && !data.type) return 'Choisissez un type d’événement.';
    if (n === 2 && !data.date && !data.dateUnknown) return dateIn.value ? 'Cette date est passée.' : 'Indiquez une date, ou cochez « pas encore fixée ».';
    if (n === 3 && !data.commune && !cIn.value.trim()) return 'Indiquez la commune de la salle.';
    if (n === 3 && !data.commune && cIn.value.trim()) { data.communeText = cIn.value.trim(); setTrack(3, data.communeText, '?'); }
    if (n === 6) {
      data.name = nameIn.value.trim(); data.tel = telIn.value.trim(); data.mail = mailIn.value.trim(); data.rgpd = rgpd.checked;
      if (!data.name) return 'Indiquez votre nom.';
      if (!data.tel && !data.mail) return 'Laissez un téléphone ou un e-mail.';
      if (data.mail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.mail)) return 'L’adresse e-mail semble incomplète.';
      if (data.tel && data.tel.replace(/\D/g, '').length < 10) return 'Le numéro de téléphone semble incomplet.';
      if (!data.rgpd) return 'Cochez la case de consentement.';
      setTrack(6, data.name, data.tel ? 'tél.' : 'e-mail');
    }
    if (n === 4) updG();
    return '';
  };

  next.addEventListener('click', () => {
    const err = validate(cur);
    if (err) { status.className = 'form-status is-err'; status.textContent = err; return; }
    done.add(cur);
    if (cur < 6) { show(cur + 1); steps[cur - 1].querySelector('button, input, select, textarea')?.focus({ preventScroll: true }); return; }
    press();
  });
  prev.addEventListener('click', () => { if (cur > 1) show(cur - 1); });
  segs.forEach((b, i) => b.addEventListener('click', () => { if (done.has(i + 1) || i + 1 < cur) show(i + 1); }));

  function press() {
    steps.forEach((s) => s.classList.remove('is-current'));
    $('.step__nav', form).style.display = 'none';
    $('[data-devis-steps]', form).style.display = 'none';
    pressed.classList.add('is-visible'); pressed.focus({ preventScroll: true });
    if (!state.calm) {
      gsap.timeline()
        .to('[data-record]', { scale: 0.86, duration: 0.18, ease: 'power2.in' })
        .to('[data-record]', { scale: 1, duration: 0.9, ease: 'elastic.out(1, 0.45)' })
        .fromTo(pressed, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, 0.2);
      if (audio.on) audio.buzz();
    }
    label.style.background = 'var(--paper)';
  }
  $('[data-restart]', form).addEventListener('click', () => {
    pressed.classList.remove('is-visible'); $('.step__nav', form).style.display = ''; $('[data-devis-steps]', form).style.display = '';
    label.style.background = ''; show(1);
  });
  show(1);

  /* ---------- D2 : copier le numéro ---------- */
  $$('[data-copy]').forEach((b) => b.addEventListener('click', async () => {
    const lab = $('.btn__label', b);
    try { await navigator.clipboard.writeText(b.dataset.copy); lab.textContent = 'Numéro copié ✓'; }
    catch (e) { lab.textContent = SITE.phone; }
    setTimeout(() => { lab.textContent = 'Copier le numéro'; }, 2200);
  }));

  /* ---------- D3 : zone ---------- */
  const zone = $('#zone');
  if (zone) initZoneBlock(zone);
  loadZoneData();
}
