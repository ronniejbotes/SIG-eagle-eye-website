/**
 * Contact: pre-select the industry from the link that brought you here, and
 * preview what the site assessment will look at for that industry.
 */
(() => {
  const SIG = (window.SIG = window.SIG || {});

  const PREVIEW = {
    manufacturing: ['Machine guarding, PPE and exclusion zones', 'Break times and early knock-off', 'Materials and tools leaving the floor', 'Idle stations and line stops'],
    logistics: ['Pick, stage and load counts', 'Seals and handovers at the gate', 'Yard and dock safety', 'Vehicle and fuel use'],
    mining: ['Vehicle and pedestrian interaction', 'PPE, isolation and exclusion zones', 'Diesel, stores and scrap', 'Plant used out of hours'],
    healthcare: ['Medicine room access', 'Night and weekend cover', 'Infection-control practice', 'Privacy masking for patient areas'],
    retail: ['Voids, refunds and no-sale openings', 'Stock room and receiving', 'Opening and closing routines', 'Warehouse aisles and pick lines'],
    security: ['Posts manned, reliefs and handovers', 'Patrol routes and checkpoints', 'Access control at the gate', 'What your monthly service record would show'],
    other: ['Your zones and the risks that keep coming back', 'Your disciplinary code and site rules', 'Existing camera coverage', 'What should never be monitored'],
  };
  const NAMES = {
    manufacturing: 'a manufacturing site',
    logistics: 'a depot or DC',
    mining: 'a mine or earthmoving site',
    healthcare: 'a hospital or clinic',
    retail: 'a store or warehouse',
    security: 'a guarded site',
  };

  function initIndustry() {
    const select = document.querySelector('[data-ct-industry]');
    const title = document.querySelector('[data-ct-preview-title]');
    const list = document.querySelector('[data-ct-preview-list]');
    if (!select || !list) return;
    const render = () => {
      const key = PREVIEW[select.value] ? select.value : 'other';
      title.textContent = NAMES[key] ? `At ${NAMES[key]} we'll look at` : "On the day we'll look at";
      list.innerHTML = '';
      PREVIEW[key].forEach((text) => {
        const li = document.createElement('li');
        li.textContent = text;
        list.appendChild(li);
      });
      if (window.gsap && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        window.gsap.from(list.children, { opacity: 0, x: 10, duration: 0.35, stagger: 0.05, ease: 'power2.out' });
      }
    };
    const wanted = new URLSearchParams(window.location.search).get('industry');
    if (wanted && select.querySelector(`option[value="${CSS.escape(wanted)}"]`)) select.value = wanted;
    select.addEventListener('change', render);
    if (select.value) render();
  }

  function initMotion(gsap) {
    const intro = document.querySelector('[data-ct-intro]');
    if (intro) gsap.from(intro.children, { y: 26, opacity: 0, duration: 0.9, ease: 'power3.out', stagger: 0.06, delay: 0.1 });
    const card = document.querySelector('.ct-card');
    if (card) gsap.from(card, { y: 40, opacity: 0, duration: 1, ease: 'power3.out', delay: 0.3, clearProps: 'transform' });
  }

  function boot() {
    initIndustry();
    if (SIG.whenMotion) SIG.whenMotion(initMotion);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
