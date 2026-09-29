/**
 * Healthcare: privacy compare slider and the night-shift dial.
 */
(() => {
  const SIG = (window.SIG = window.SIG || {});
  const NS = 'http://www.w3.org/2000/svg';

  function initCompare() {
    document.querySelectorAll('[data-compare]').forEach((cmp) => {
      const range = cmp.querySelector('[data-compare-range]');
      const set = (v) => cmp.style.setProperty('--pos', `${v}%`);
      range.addEventListener('input', () => set(range.value));
      set(range.value);
    });
  }

  /* Dial geometry: 24 hours round the face, 00:00 at the top. */
  const angleFor = (mins) => (mins / 1440) * 360;
  const events = [
    { t: 19 * 60 + 5, flag: false },
    { t: 22 * 60 + 40, flag: false },
    { t: 25 * 60 + 50, flag: true },
    { t: 27 * 60 + 15, flag: true },
    { t: 29 * 60 + 30, flag: false },
    { t: 31 * 60, flag: false },
  ];

  function buildDial(section) {
    const ticks = section.querySelector('[data-ticks]');
    const evG = section.querySelector('[data-dial-events]');
    for (let h = 0; h < 24; h += 1) {
      const a = (h / 24) * 2 * Math.PI;
      const major = h % 6 === 0;
      const r1 = major ? 214 : 222;
      const line = document.createElementNS(NS, 'line');
      line.setAttribute('x1', (Math.sin(a) * r1).toFixed(1));
      line.setAttribute('y1', (-Math.cos(a) * r1).toFixed(1));
      line.setAttribute('x2', (Math.sin(a) * 234).toFixed(1));
      line.setAttribute('y2', (-Math.cos(a) * 234).toFixed(1));
      if (major) line.setAttribute('class', 'major');
      ticks.appendChild(line);
    }
    return events.map((ev) => {
      const a = (angleFor(ev.t) * Math.PI) / 180;
      const g = document.createElementNS(NS, 'g');
      g.setAttribute('transform', `translate(${(Math.sin(a) * 236).toFixed(1)} ${(-Math.cos(a) * 236).toFixed(1)})`);
      if (ev.flag) g.setAttribute('class', 'is-flag');
      const c = document.createElementNS(NS, 'circle');
      c.setAttribute('r', '10');
      g.appendChild(c);
      evG.appendChild(g);
      return g;
    });
  }

  function initDial(gsap, ScrollTrigger) {
    const section = document.querySelector('[data-dial]');
    if (!section) return;
    const dots = buildDial(section);
    const hand = section.querySelector('[data-dial-hand]');
    const timeEl = section.querySelector('[data-dial-time]');
    const items = Array.from(section.querySelectorAll('[data-dial-item]'));
    const start = 19 * 60;
    const end = 31 * 60;
    const fmt = (mins) => {
      const m = Math.round(mins) % 1440;
      return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
    };
    const render = (p) => {
      const mins = start + (end - start) * p;
      hand.setAttribute('transform', `rotate(${angleFor(mins).toFixed(2)})`);
      timeEl.textContent = fmt(mins);
      let current = -1;
      events.forEach((ev, i) => {
        const reached = mins >= ev.t - 2;
        dots[i].classList.toggle('is-on', reached);
        items[i].classList.toggle('is-past', reached);
        if (reached) current = i;
      });
      items.forEach((it, i) => it.classList.toggle('is-now', i === current));
    };
    const mm = gsap.matchMedia();
    mm.add('(min-width: 1000px) and (min-height: 700px)', () => {
      section.classList.add('is-scrubbed');
      ScrollTrigger.refresh();
      const st = ScrollTrigger.create({
        trigger: section.querySelector('.dial-sec__track'),
        start: 'top top',
        end: 'bottom bottom',
        scrub: true,
        onUpdate: (self) => render(self.progress),
      });
      render(st.progress);
      return () => section.classList.remove('is-scrubbed');
    });
    mm.add('(max-width: 999px), (max-height: 699px)', () => {
      const st = ScrollTrigger.create({
        trigger: section.querySelector('.dial'),
        start: 'top 85%',
        end: 'bottom 25%',
        onUpdate: (self) => render(self.progress),
      });
      render(st.progress);
    });
  }

  function staticDial() {
    const section = document.querySelector('[data-dial]');
    if (!section || section.querySelector('[data-dial-events] g')) return;
    const dots = buildDial(section);
    dots.forEach((d) => d.classList.add('is-on'));
  }

  function boot() {
    initCompare();
    if (SIG.whenMotion) SIG.whenMotion(initDial);
    // Without motion, still draw the full dial.
    setTimeout(() => {
      if (!document.documentElement.classList.contains('has-motion')) staticDial();
    }, 0);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
