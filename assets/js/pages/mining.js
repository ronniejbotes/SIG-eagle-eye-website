/**
 * Mining: letterbox hero reveal, trend bars, and the proximity check.
 */
(() => {
  const SIG = (window.SIG = window.SIG || {});
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* Proximity check: a slider moves the pedestrian along a line to the truck. */
  function initProximity() {
    const section = document.querySelector('[data-prox]');
    if (!section) return;
    const range = section.querySelector('[data-prox-range]');
    const out = section.querySelector('[data-prox-out]');
    const status = section.querySelector('[data-prox-status]');
    const state = section.querySelector('[data-prox-state]');
    const desc = section.querySelector('[data-prox-desc]');
    const person = section.querySelector('[data-prox-person]');
    // Scale: 80 m = 250px from the centre. Walk in along a diagonal.
    const angle = (35 * Math.PI) / 180;
    const levels = {
      clear: ['Clear', "Outside the vehicle's zones. Logged as normal movement on the pit floor."],
      caution: ['Caution · Logged', 'Inside the 50 m caution zone while the vehicle is working. Logged, and counted towards the crossing-point trend.'],
      breach: ['Exclusion zone · Human review', 'Inside the 15 m exclusion zone of a working machine. Flagged with the clip and time for a person to review.'],
    };
    const render = (m) => {
      const r = Math.max(0, (m / 80) * 250);
      const x = 300 + Math.cos(angle) * r;
      const y = 300 + Math.sin(angle) * r;
      person.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
      out.textContent = String(m);
      const level = m < 15 ? 'breach' : m <= 50 ? 'caution' : 'clear';
      if (status.dataset.level !== level) {
        status.dataset.level = level;
        section.dataset.level = level;
        state.textContent = levels[level][0];
        desc.textContent = levels[level][1];
      }
    };
    let userMoved = false;
    range.addEventListener('input', () => {
      userMoved = true;
      render(Number(range.value));
    });
    render(Number(range.value));

    // Walk the pedestrian in once, the first time the stage is seen.
    if (reduceMotion.matches) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const from = 78;
        const to = 11;
        const dur = 3800;
        const step = (now) => {
          if (userMoved) return;
          const t = Math.min(1, (now - start) / dur);
          const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
          const v = Math.round(from + (to - from) * e);
          range.value = String(v);
          render(v);
          if (t < 1) requestAnimationFrame(step);
        };
        setTimeout(() => requestAnimationFrame(step), 500);
      },
      { threshold: 0.55 }
    );
    io.observe(section.querySelector('.prox__stage'));
  }

  function initMotion(gsap) {
    const frame = document.querySelector('[data-reveal-frame]');
    if (frame) {
      gsap.fromTo(
        frame,
        { clipPath: 'inset(10% 8% 10% 8% round 28px)' },
        {
          clipPath: 'inset(0% 0% 0% 0% round 0px)',
          ease: 'none',
          scrollTrigger: { trigger: frame, start: 'top 85%', end: 'top 15%', scrub: true },
        }
      );
      gsap.fromTo(
        frame.querySelector('img'),
        { scale: 1.18 },
        { scale: 1, ease: 'none', scrollTrigger: { trigger: frame, start: 'top bottom', end: 'bottom top', scrub: true } }
      );
      gsap.from(frame.querySelectorAll('.frame__tag'), {
        opacity: 0,
        y: 12,
        stagger: 0.25,
        duration: 0.6,
        scrollTrigger: { trigger: frame, start: 'top 40%', toggleActions: 'play none none reverse' },
      });
    }
    const bars = document.querySelectorAll('.mine-trend__bar');
    if (bars.length) {
      gsap.from(bars, {
        scaleY: 0,
        duration: 1.2,
        ease: 'expo.out',
        stagger: 0.14,
        scrollTrigger: { trigger: '.mine-trend', start: 'top 80%', toggleActions: 'play none none reverse' },
      });
    }
  }

  function boot() {
    initProximity();
    if (SIG.whenMotion) SIG.whenMotion(initMotion);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
