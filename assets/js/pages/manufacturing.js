/**
 * Manufacturing: the pinned shift timeline and the floor plan.
 */
(() => {
  const SIG = (window.SIG = window.SIG || {});

  /* Floor plan: one zone selected at a time. Works without GSAP. */
  function initPlan() {
    const plan = document.querySelector('[data-plan]');
    if (!plan) return;
    const pins = Array.from(plan.querySelectorAll('[data-zone]'));
    const shapes = Array.from(plan.querySelectorAll('[data-zone-shape]'));
    const infos = Array.from(plan.querySelectorAll('[data-zone-info]'));
    const select = (zone) => {
      pins.forEach((p) => p.setAttribute('aria-pressed', String(p.dataset.zone === zone)));
      shapes.forEach((s) => s.classList.toggle('is-active', s.dataset.zoneShape === zone));
      infos.forEach((i) => (i.hidden = i.dataset.zoneInfo !== zone));
    };
    pins.forEach((p) => p.addEventListener('click', () => select(p.dataset.zone)));
    select('press');
  }

  /* Shift: pin the section and move the cards sideways as the clock runs. */
  function initShift(gsap, ScrollTrigger) {
    const section = document.querySelector('[data-shift]');
    if (!section) return;
    const track = section.querySelector('[data-shift-track]');
    const bar = section.querySelector('[data-shift-bar]');
    const clock = section.querySelector('[data-shift-clock]');
    const cards = Array.from(track.children);
    const fmt = (mins) => {
      const h = Math.floor(mins / 60);
      const m = Math.floor(mins % 60);
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    };
    const mm = gsap.matchMedia();
    mm.add('(min-width: 1000px) and (min-height: 660px)', () => {
      section.classList.add('is-scrubbed');
      const distance = () => Math.max(0, track.scrollWidth - document.documentElement.clientWidth * 0.7);
      const setHeight = () => section.style.setProperty('--shift-h', `${distance() + window.innerHeight * 1.3}px`);
      setHeight();
      const state = { p: 0 };
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.6,
          invalidateOnRefresh: true,
          onRefreshInit: setHeight,
        },
      });
      tl.to(track, { x: () => -distance(), duration: 1 }, 0)
        .to(bar, { scaleX: 1, duration: 1 }, 0)
        .to(state, {
          p: 1,
          duration: 1,
          onUpdate: () => {
            clock.textContent = fmt(360 + state.p * 720);
          },
        }, 0);
      gsap.set(cards, { opacity: 0.35 });
      cards.forEach((card) => {
        ScrollTrigger.create({
          trigger: card,
          containerAnimation: tl,
          start: 'left 82%',
          end: 'right 10%',
          onToggle: (self) => gsap.to(card, { opacity: self.isActive ? 1 : 0.35, duration: 0.35, overwrite: 'auto' }),
        });
      });
      ScrollTrigger.refresh();
      return () => {
        section.classList.remove('is-scrubbed');
        section.style.removeProperty('--shift-h');
        gsap.set([track, bar, ...cards], { clearProps: 'all' });
        clock.textContent = '06:00';
      };
    });
    mm.add('(max-width: 999px), (max-height: 659px)', () => {
      const times = cards.map((c) => c.dataset.time).filter(Boolean);
      cards.forEach((card) => {
        if (!card.dataset.time) return;
        ScrollTrigger.create({
          trigger: card,
          start: 'top 60%',
          onEnter: () => (clock.textContent = card.dataset.time),
          onEnterBack: () => (clock.textContent = card.dataset.time),
        });
      });
      clock.textContent = times[0] || '06:00';
    });
  }

  function boot() {
    initPlan();
    if (SIG.whenMotion) SIG.whenMotion(initShift);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
