// Contact (Face D) : devis en 6 étapes (erreurs sous les champs), horaires, numéro à copier
import { state, $, $$, SITE, store } from '../core/state.js?v=20261027c';
import { simpleHero } from '../core/hero-simple.js?v=20261027c';
import { communeCombobox, describe, loadZoneData } from '../core/zonemap.js?v=20261027c';
import { scrollToTarget } from '../core/smooth.js?v=20261027c';
import { audio } from '../core/audio.js?v=20261027c';

export default function contact() {
  const { gsap } = window;
  simpleHero();

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
    nextLabel.textContent = n === 6 ? 'Envoyer ma demande' : 'Suivant';
    status.textContent = ''; status.className = 'form-status'; clearErrors();
    const s = steps[n - 1];
    if (!state.calm) gsap.fromTo(s, { opacity: 0, x: 24 }, { opacity: 1, x: 0, duration: 0.5, ease: 'power3.out' });
  };

  // Piste 1 : type d'événement
  $$('[data-single="type"] .chip', form).forEach((chip) => chip.addEventListener('click', () => {
    $$('[data-single="type"] .chip', form).forEach((c) => { c.setAttribute('aria-checked', 'false'); c.classList.remove('is-on'); });
    chip.setAttribute('aria-checked', 'true'); chip.classList.add('is-on');
    data.type = chip.dataset.val; rlType.textContent = data.type; setTrack(1, data.type, '');
  }));

  // Clavier : le groupe de types se parcourt aux flèches (un seul arrêt de tabulation)
  const typeChips = $$('[data-single="type"] .chip', form);
  const rove = () => { const cur = typeChips.find((c) => c.getAttribute('aria-checked') === 'true') || typeChips[0]; typeChips.forEach((c) => c.setAttribute('tabindex', c === cur ? '0' : '-1')); };
  rove();
  typeChips.forEach((chip, i) => {
    chip.addEventListener('click', rove);
    chip.addEventListener('keydown', (e) => {
      const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (!d) return; e.preventDefault();
      const n = typeChips[(i + d + typeChips.length) % typeChips.length]; n.focus(); n.click();
    });
  });
  // Arrivée depuis une pochette ou la liste des prestations : le type est déjà choisi
  const pre = store.get('sono-prefill', true);
  if (pre) {
    store.del('sono-prefill', true);
    const chip = typeChips.find((c) => c.dataset.val === pre);
    if (chip) { chip.click(); setTimeout(() => { status.className = 'form-status is-ok'; status.textContent = `Type d’événement choisi : ${pre}. Passez à l’étape suivante.`; }, 50); }
  }

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

  const errEls = Object.fromEntries($$('[data-err]', form).map((el) => [el.dataset.err, el]));
  const targets = { type: () => $('[data-single="type"]', form), date: () => dateIn, commune: () => cIn, name: () => nameIn, tel: () => telIn, mail: () => mailIn, rgpd: () => rgpd };
  function clearErrors() {
    Object.values(errEls).forEach((el) => { el.textContent = ''; el.classList.remove('is-on'); });
    $$('[aria-invalid]', form).forEach((el) => el.removeAttribute('aria-invalid'));
    $$('.check.is-invalid', form).forEach((el) => el.classList.remove('is-invalid'));
  }
  const showErrors = (errs) => {
    clearErrors();
    errs.forEach(([key, msg]) => {
      const el = errEls[key]; if (el) { el.textContent = msg; el.classList.add('is-on'); }
      const t = targets[key]?.(); if (!t) return;
      t.setAttribute('aria-invalid', 'true');
      if (key === 'rgpd') t.closest('.check')?.classList.add('is-invalid');
    });
    const first = targets[errs[0][0]]?.();
    const focusEl = first?.matches('[role="radiogroup"]') ? (first.querySelector('[tabindex="0"]') || first.querySelector('button')) : first;
    focusEl?.focus();
    status.className = 'form-status is-err';
    status.textContent = errs.length > 1 ? `${errs.length} champs à corriger.` : '';
  };

  const validate = (n) => {
    const errs = [];
    if (n === 1 && !data.type) errs.push(['type', 'Choisissez un type d’événement.']);
    if (n === 2 && !data.date && !data.dateUnknown) errs.push(['date', dateIn.value ? 'Cette date est passée.' : 'Indiquez une date, ou cochez « La date n’est pas encore fixée ».']);
    if (n === 3 && !data.commune && !cIn.value.trim()) errs.push(['commune', 'Indiquez la commune de la salle.']);
    if (n === 3 && !data.commune && cIn.value.trim()) { data.communeText = cIn.value.trim(); setTrack(3, data.communeText, '?'); }
    if (n === 6) {
      data.name = nameIn.value.trim(); data.tel = telIn.value.trim(); data.mail = mailIn.value.trim(); data.rgpd = rgpd.checked;
      if (!data.name) errs.push(['name', 'Indiquez votre nom.']);
      if (!data.tel && !data.mail) errs.push(['tel', 'Laissez un téléphone ou un e-mail.']);
      if (data.tel && data.tel.replace(/\D/g, '').length < 10) errs.push(['tel', 'Le numéro de téléphone semble incomplet (10 chiffres).']);
      if (data.mail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.mail)) errs.push(['mail', 'L’adresse e-mail semble incomplète.']);
      if (!data.rgpd) errs.push(['rgpd', 'Cochez la case pour que je puisse vous recontacter.']);
      if (!errs.length) setTrack(6, data.name, data.tel ? 'tél.' : 'e-mail');
    }
    if (n === 4) updG();
    return errs;
  };

  next.addEventListener('click', () => {
    const errs = validate(cur);
    if (errs.length) { showErrors(errs); return; }
    clearErrors();
    done.add(cur);
    if (cur < 6) { show(cur + 1); steps[cur - 1].querySelector('button[tabindex="0"], button:not([tabindex]), input, select, textarea')?.focus({ preventScroll: true }); return; }
    press();
  });
  prev.addEventListener('click', () => { if (cur > 1) show(cur - 1); });
  segs.forEach((b, i) => b.addEventListener('click', () => { if (done.has(i + 1) || i + 1 < cur) show(i + 1); }));

  function press() {
    steps.forEach((s) => s.classList.remove('is-current'));
    $('.step__nav', form).style.display = 'none';
    $('[data-devis-steps]', form).style.display = 'none';
    pressed.classList.add('is-visible');
    // La confirmation est amenée à l'écran et reçoit le focus
    scrollToTarget(form, { offset: -(72 + 24) });
    setTimeout(() => pressed.focus({ preventScroll: true }), state.calm ? 0 : 400);
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

  loadZoneData(); // communes de l'étape 3
}
