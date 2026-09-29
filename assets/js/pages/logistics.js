/**
 * Logistics: hero route, the truck on the chain-of-custody map, and the ledger.
 */
(() => {
  const SIG = (window.SIG = window.SIG || {});

  /* Ledger: the flagged row resolves when the review is opened. Works without GSAP. */
  function initLedger() {
    const btn = document.querySelector('[data-ledger-toggle]');
    const review = document.querySelector('[data-ledger-review]');
    const status = document.querySelector('[data-ledger-status]');
    const row = document.querySelector('[data-ledger-flag]');
    if (!btn || !review) return;
    const label = btn.firstChild;
    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      review.hidden = open;
      label.textContent = open ? 'Open the review ' : 'Close the review ';
      status.textContent = open ? 'Review' : 'Resolved';
      status.classList.toggle('chip--review', open);
      status.classList.toggle('chip--ok', !open);
      if (window.gsap && !open) {
        window.gsap.from(review, { y: 16, opacity: 0, duration: 0.5, ease: 'power3.out' });
        window.gsap.fromTo(row, { backgroundColor: 'rgba(214,178,107,0.45)' }, { backgroundColor: 'rgba(214,178,107,0.18)', duration: 1.2 });
      }
    });
  }

  function initMotion(gsap, ScrollTrigger) {
    if (window.MotionPathPlugin) gsap.registerPlugin(window.MotionPathPlugin);

    /* Hero: the route draws in, then drifts with scroll. */
    const route = document.querySelector('[data-hero-route]');
    if (route) {
      gsap.fromTo(route, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 2.2, ease: 'power2.inOut', delay: 0.3 });
      gsap.from('.log-hero__stop', { opacity: 0, y: 10, duration: 0.6, stagger: 0.5, delay: 1.2 });
    }
    const bg = document.querySelector('[data-hero-bg]');
    if (bg) {
      gsap.to(bg, { yPercent: 8, ease: 'none', scrollTrigger: { trigger: bg.parentElement, start: 'top top', end: 'bottom top', scrub: true } });
    }

    /* Chain of custody: the truck drives segment by segment as the steps pass. */
    const section = document.querySelector('[data-custody]');
    if (!section) return;
    const segs = Array.from(section.querySelectorAll('[data-seg]'));
    const nodes = Array.from(section.querySelectorAll('[data-node]'));
    const truck = section.querySelector('[data-truck]');
    const steps = Array.from(section.querySelectorAll('[data-custody-step]'));
    const mm = gsap.matchMedia();
    mm.add('(min-width: 980px)', () => {
      gsap.set(segs, { strokeDashoffset: 1 });
      nodes[0].classList.add('is-on');
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: section.querySelector('.custody__steps'),
          start: 'top 55%',
          end: 'bottom 70%',
          scrub: 0.8,
          onUpdate: (self) => {
            const reached = self.progress * segs.length;
            nodes.forEach((n, i) => n.classList.toggle('is-on', i === 0 || reached >= i - 0.02));
          },
        },
      });
      segs.forEach((seg, i) => {
        tl.to(seg, { strokeDashoffset: 0, duration: 1 }, i);
        if (window.MotionPathPlugin) {
          tl.to(truck, { motionPath: { path: seg, align: seg, alignOrigin: [0.5, 0.5], autoRotate: true }, duration: 1 }, i);
        }
      });
      /* The step in view is highlighted; the others stay fully readable. */
      steps.forEach((step) => {
        ScrollTrigger.create({
          trigger: step,
          start: 'top 65%',
          end: 'bottom 35%',
          onToggle: (self) => step.classList.toggle('is-active', self.isActive),
        });
      });
      return () => {
        gsap.set([...segs, truck, ...steps], { clearProps: 'all' });
        truck.setAttribute('transform', 'translate(200 50)');
        nodes.forEach((n) => n.classList.remove('is-on'));
        steps.forEach((st) => st.classList.remove('is-active'));
      };
    });
  }

  function boot() {
    initLedger();
    if (SIG.whenMotion) SIG.whenMotion(initMotion);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
