// « Joignable maintenant » : calculé à l'heure de Paris à partir des disponibilités publiées
import { SITE, $$ } from './state.js?v=20261027';

const DAYS = ['', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
const WD = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };

export function parisNow(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Paris', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(date);
  const get = (t) => parts.find((p) => p.type === t)?.value;
  return { wd: WD[get('weekday')], min: parseInt(get('hour'), 10) * 60 + parseInt(get('minute'), 10) };
}

export const fmt = (min) => `${Math.floor(min / 60)}h${String(min % 60).padStart(2, '0')}`;

export function status(date) {
  const { wd, min } = parisNow(date);
  const today = SITE.hours[wd] || [];
  const cur = today.find(([a, b]) => min >= a && min < b);
  if (cur) return { open: true, wd, text: `Joignable maintenant · jusqu’à ${fmt(cur[1])}` };
  for (let i = 0; i < 8; i++) {
    const d = ((wd - 1 + i) % 7) + 1;
    const slots = SITE.hours[d] || [];
    const s = slots.find(([a]) => i > 0 || a > min);
    if (s) {
      const when = i === 0 ? 'aujourd’hui' : i === 1 ? 'demain' : DAYS[d];
      return { open: false, wd, text: `Prochain créneau d’appel : ${when} à ${fmt(s[0])}` };
    }
  }
  return { open: false, wd, text: 'Horaires d’appel' };
}

export function initHours() {
  const update = () => {
    const s = status();
    $$('[data-hours]').forEach((el) => {
      el.classList.toggle('is-open', s.open);
      const t = el.querySelector('[data-hours-text]');
      if (t) t.textContent = s.text;
    });
    $$('[data-day]').forEach((row) => row.classList.toggle('is-today', +row.dataset.day === s.wd));
  };
  update();
  setInterval(update, 30000);
}
