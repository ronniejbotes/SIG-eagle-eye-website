/**
 * Retail: the shrinkage calculator and the printing review slip.
 */
(() => {
  const SIG = (window.SIG = window.SIG || {});

  const rand = (n) => `R${Math.round(n).toLocaleString('en-ZA').replace(/,/g, ' ')}`;
  const parseRand = (s) => Number(String(s).replace(/[^\d]/g, '')) || 0;

  function initCalc() {
    const form = document.querySelector('[data-calc]');
    if (!form) return;
    const turnover = form.querySelector('[data-calc-turnover]');
    const rate = form.querySelector('[data-calc-rate]');
    const rateOut = form.querySelector('[data-calc-rate-out]');
    const stores = form.querySelector('[data-calc-stores]');
    const outYear = form.querySelector('[data-calc-year]');
    const outMonth = form.querySelector('[data-calc-month]');
    const outPoint = form.querySelector('[data-calc-point]');
    const shown = { year: 0, month: 0, point: 0 };

    const paint = (vals) => {
      outYear.textContent = rand(vals.year);
      outMonth.textContent = rand(vals.month);
      outPoint.textContent = `${rand(vals.point)} a year`;
    };
    const update = () => {
      const t = parseRand(turnover.value);
      const r = Number(rate.value);
      const n = Math.max(1, Number(stores.value) || 1);
      rateOut.textContent = r.toFixed(1);
      const target = { year: (t * r) / 100, month: (t * r) / 100 / n / 12, point: t * 0.001 };
      if (window.gsap && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        window.gsap.to(shown, { ...target, duration: 0.6, ease: 'power3.out', overwrite: true, onUpdate: () => paint(shown) });
      } else {
        Object.assign(shown, target);
        paint(shown);
      }
    };
    turnover.addEventListener('input', () => {
      const pos = turnover.selectionStart;
      const before = turnover.value.length;
      const digits = parseRand(turnover.value);
      turnover.value = digits ? digits.toLocaleString('en-ZA').replace(/,/g, ' ') : '';
      const delta = turnover.value.length - before;
      try {
        turnover.setSelectionRange(pos + delta, pos + delta);
      } catch (e) {
        /* some inputs don't support selection */
      }
      update();
    });
    rate.addEventListener('input', update);
    stores.addEventListener('input', update);
    update();
  }

  function initMotion(gsap, ScrollTrigger) {
    const bg = document.querySelector('[data-hero-bg]');
    if (bg) {
      gsap.to(bg, { yPercent: 8, scale: 1.04, ease: 'none', scrollTrigger: { trigger: bg.parentElement, start: 'top top', end: 'bottom top', scrub: true } });
    }
    const card = document.querySelector('[data-hero-card]');
    if (card) gsap.from(card, { y: 60, opacity: 0, duration: 1.1, ease: 'power3.out', delay: 0.15 });

    const section = document.querySelector('[data-slip]');
    if (!section) return;
    const paper = section.querySelector('[data-slip-paper]');
    const lines = section.querySelectorAll('[data-slip-line]');
    const mm = gsap.matchMedia();
    mm.add('(min-width: 1000px) and (min-height: 760px)', () => {
      section.classList.add('is-scrubbed');
      ScrollTrigger.refresh();
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: section.querySelector('.slip-sec__track'), start: 'top top', end: 'bottom bottom', scrub: 0.6 },
      });
      tl.fromTo(paper, { clipPath: 'inset(0 0 100% 0)', yPercent: -6 }, { clipPath: 'inset(0 0 0% 0)', yPercent: 0, duration: 1 });
      tl.from(lines, { opacity: 0, x: -10, stagger: 0.08, duration: 0.2 }, 0.12);
      return () => {
        section.classList.remove('is-scrubbed');
        gsap.set([paper, ...lines], { clearProps: 'all' });
      };
    });
    mm.add('(max-width: 999px), (max-height: 759px)', () => {
      gsap.fromTo(
        paper,
        { clipPath: 'inset(0 0 100% 0)' },
        { clipPath: 'inset(0 0 0% 0)', ease: 'none', scrollTrigger: { trigger: section.querySelector('.slip-wrap'), start: 'top 80%', end: 'bottom 60%', scrub: 0.6 } }
      );
    });
  }

  function boot() {
    initCalc();
    if (SIG.whenMotion) SIG.whenMotion(initMotion);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
