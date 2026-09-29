/**
 * Compliance: the readiness check and the commissioner's legal pad.
 */
(() => {
  const SIG = (window.SIG = window.SIG || {});

  const VERDICTS = [
    [0, 'Tick what you already have in place.'],
    [1, 'There is work to do before monitoring is on safe ground. A site assessment is the place to start.'],
    [5, 'A good base. The gaps are usually notification, retention and review, which is exactly what setup covers.'],
    [8, 'Nearly there. An assessment would confirm the last details before anything goes live.'],
    [10, 'Ready. Eagle Eye is built to fit a workplace that already works this way.'],
  ];

  /* Readiness: a live score. Nothing leaves the page. */
  function initReadiness() {
    const box = document.querySelector('[data-ready]');
    if (!box) return;
    const inputs = Array.from(box.querySelectorAll('[data-ready-box]'));
    const ring = box.querySelector('[data-ready-ring]');
    const num = box.querySelector('[data-ready-num]');
    const verdict = box.querySelector('[data-ready-verdict]');
    const update = () => {
      const n = inputs.filter((i) => i.checked).length;
      ring.style.strokeDashoffset = String(100 - n * 10);
      num.textContent = String(n);
      box.dataset.level = n >= 8 ? 'high' : n >= 5 ? 'mid' : 'low';
      let text = VERDICTS[0][1];
      VERDICTS.forEach(([min, t]) => {
        if (n >= min) text = t;
      });
      verdict.textContent = text;
    };
    inputs.forEach((i) => i.addEventListener('change', update));
    update();
  }

  function initMotion(gsap) {
    const copy = document.querySelector('[data-co-copy]');
    if (copy) gsap.from(copy.children, { y: 30, opacity: 0, duration: 1, ease: 'power3.out', stagger: 0.08, delay: 0.1 });
    const seals = document.querySelectorAll('.co-seal');
    if (seals.length) gsap.from(seals, { x: -24, opacity: 0, duration: 0.7, ease: 'power3.out', stagger: 0.1, delay: 0.6 });

    /* Each tick draws itself as its row reaches the middle of the screen,
       and the answer in the margin comes in with it. */
    document.querySelectorAll('[data-pad-row]').forEach((row) => {
      const tick = row.querySelector('.pad__tick path');
      const answer = row.querySelector('.pad__a');
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: row, start: 'top 82%', end: 'top 52%', scrub: 0.6 },
      });
      tl.fromTo(tick, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.5 }, 0).fromTo(
        answer,
        { opacity: 0.18, x: -8 },
        { opacity: 1, x: 0, duration: 0.6 },
        0.2
      );
    });
  }

  function boot() {
    initReadiness();
    if (SIG.whenMotion) SIG.whenMotion(initMotion);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
