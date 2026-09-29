/**
 * Security operations: the multiview monitor and the case files.
 */
(() => {
  const SIG = (window.SIG = window.SIG || {});
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* Case files: the record opens under the file, line by line, then the
     reviewer's stamp lands. Works without GSAP. */
  function initCases() {
    document.querySelectorAll('[data-case]').forEach((file) => {
      const btn = file.querySelector('[data-case-toggle]');
      const record = file.querySelector('[data-case-record]');
      const label = file.querySelector('[data-case-label]');
      if (!btn || !record) return;
      btn.addEventListener('click', () => {
        const open = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!open));
        record.hidden = open;
        file.classList.toggle('is-open', !open);
        if (label) label.textContent = open ? 'Check the record' : 'Close the record';
        const gsap = window.gsap;
        if (open || !gsap || reduceMotion.matches) return;
        const lines = record.querySelectorAll('[data-case-line]');
        const stamp = record.querySelector('[data-case-stamp]');
        const outcome = record.querySelector('.case__outcome');
        const tl = gsap.timeline();
        tl.from(record, { height: 0, opacity: 0, duration: 0.45, ease: 'power3.out', clearProps: 'height,opacity' })
          .from(lines, { opacity: 0, x: -14, duration: 0.35, stagger: 0.14, ease: 'power2.out' }, 0.15)
          .fromTo(stamp, { opacity: 0, scale: 1.9, rotate: -14 }, { opacity: 1, scale: 1, rotate: -6, duration: 0.42, ease: 'back.out(2.4)' }, '+=0.1')
          .from(outcome, { opacity: 0, y: 10, duration: 0.4, ease: 'power2.out' }, '-=0.15');
        if (window.ScrollTrigger) tl.eventCallback('onComplete', () => window.ScrollTrigger.refresh());
      });
    });
  }

  function initMotion(gsap, ScrollTrigger) {
    const hero = document.querySelector('[data-sec-hero]');
    if (!hero) return;
    const copy = hero.querySelector('[data-sec-copy]');
    const stage = hero.querySelector('.sec-hero__stage');
    const mv = hero.querySelector('[data-mv]');
    const feeds = hero.querySelectorAll('[data-feed]');
    const boxes = hero.querySelectorAll('[data-box]');

    if (copy) gsap.from(copy.children, { y: 32, opacity: 0, duration: 1.05, ease: 'power3.out', stagger: 0.08, delay: 0.1 });

    /* The wall powers on one channel at a time, with a short flicker.
       The entrance moves the stage; the monitor itself only turns, so the
       two transforms never fight. */
    const boot = gsap.timeline({ delay: 0.35 });
    boot.from(stage, { opacity: 0, y: 40, duration: 0.9, ease: 'power3.out', clearProps: 'transform' });
    feeds.forEach((feed, i) => {
      boot.fromTo(feed, { opacity: 0 }, { opacity: 1, duration: 0.32, ease: 'steps(4)' }, 0.45 + i * 0.16);
    });
    boot.from(boxes, { opacity: 0, scale: 0.82, transformOrigin: '50% 50%', duration: 0.6, ease: 'power3.out', stagger: 0.12, clearProps: 'transform' }, 1.05);

    /* On wide screens the monitor starts angled and turns to face you. */
    const mm = gsap.matchMedia();
    mm.add('(min-width: 1000px)', () => {
      gsap.set(mv, { rotationY: -11, rotationX: 4 });
      gsap.to(mv, {
        rotationY: 0,
        rotationX: 0,
        scale: 1.04,
        ease: 'none',
        scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom 30%', scrub: 0.8 },
      });
      return () => gsap.set(mv, { clearProps: 'transform' });
    });
  }

  function boot() {
    initCases();
    if (SIG.whenMotion) SIG.whenMotion(initMotion);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
