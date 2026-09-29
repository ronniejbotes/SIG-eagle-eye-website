/**
 * How it works: stage stepper, the sorter, the review console and the
 * record anatomy. Every module works without GSAP; GSAP only adds motion.
 */
(() => {
  const SIG = (window.SIG = window.SIG || {});
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const animate = () => window.gsap && !reduceMotion.matches;
  const escape = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

  /* ---------------- Stepper: highlight the stage in view ---------------- */
  function initStepper() {
    const links = Array.from(document.querySelectorAll('[data-stage-link]'));
    const stages = Array.from(document.querySelectorAll('[data-stage]'));
    if (!links.length || !('IntersectionObserver' in window)) return;
    const setActive = (id) => links.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === `#${id}`));
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: '-40% 0px -55% 0px' }
    );
    stages.forEach((s) => io.observe(s));
  }

  /* ---------------- Classify: the sorter ---------------- */
  const EVENTS = [
    {
      bin: 'safety',
      label: 'Health & safety',
      rule: 'Site rule 3.1 · Pedestrian walkways',
      next: '<strong>Safety first.</strong> The unsafe act is stopped and the driver is retrained. Breaking a known safety rule is a conduct matter under your disciplinary code, handled progressively unless it is serious.',
    },
    {
      bin: 'time',
      label: 'Time & attendance',
      rule: 'Break policy · Meal interval (BCEA s14)',
      next: '<strong>A pattern, not a one-off.</strong> A conversation first, then warnings under progressive discipline if it continues. The record shows the rule is applied the same way to everyone.',
    },
    {
      bin: 'performance',
      label: 'Poor performance',
      rule: 'Line standard · Output per shift',
      next: '<strong>Incapacity, not misconduct.</strong> The Dismissal Code treats poor performance differently: make the standard clear, give guidance or training, and allow time to improve before anything formal.',
    },
    {
      bin: 'misconduct',
      label: 'Misconduct',
      rule: 'Disciplinary code · Removal of company property',
      next: '<strong>Serious, so the procedure matters most.</strong> The reviewed record goes to management, and a fair procedure follows: the allegation in writing, time to prepare and a real chance to respond.',
    },
    {
      bin: 'assets',
      label: 'Assets & stock',
      rule: 'Vehicle policy · Authorised use only',
      next: '<strong>Often a misunderstanding.</strong> The first step is usually a conversation about the policy. Repeated or deliberate use is dealt with through your disciplinary code.',
    },
  ];

  function initSorter() {
    const sorter = document.querySelector('[data-sorter]');
    if (!sorter) return;
    const buttons = Array.from(sorter.querySelectorAll('[data-sort]'));
    const bins = Array.from(sorter.querySelectorAll('[data-bin]'));
    const result = sorter.querySelector('[data-sort-result]');
    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const ev = EVENTS[Number(btn.dataset.sort)];
        buttons.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
        let target = null;
        bins.forEach((bin) => {
          const on = bin.dataset.bin === ev.bin;
          bin.classList.toggle('is-on', on);
          if (on) target = bin;
        });
        result.innerHTML = `
          <p class="sorter__cat"><span class="chip chip--review">${escape(ev.label)}</span><span class="chip chip--sky">${escape(ev.rule)}</span></p>
          <p class="sorter__next">${ev.next}</p>`;
        if (animate()) {
          const gsap = window.gsap;
          if (target) gsap.fromTo(target, { scale: 1.08 }, { scale: 1, duration: 0.6, ease: 'elastic.out(1, 0.5)' });
          gsap.from(result.children, { opacity: 0, y: 10, duration: 0.4, stagger: 0.08, ease: 'power2.out' });
        }
      });
    });
  }

  /* ---------------- Review: the console ---------------- */
  const DECISIONS = {
    confirm: {
      text: '<strong>Confirmed.</strong> Incident 0412 is opened on the register, and the picking team gets a safety talk at the next shift briefing. The record now carries your name and the time you decided.',
      log: 'Reviewer confirmed · Incident 0412 opened',
    },
    context: {
      text: '<strong>Context added.</strong> Maintenance contractor, escorted, permit PTW-118 on file. The flag is closed with no action against anyone, and the reason stays on record.',
      log: 'Reviewer added context · Authorised entry, permit on file',
    },
    dismiss: {
      text: '<strong>Dismissed.</strong> A reflection on the racking was read as a person. The flag is closed and the detection is tuned so it does not happen again.',
      log: 'Reviewer dismissed · False alarm, detection tuned',
    },
  };

  function initConsole() {
    const box = document.querySelector('[data-console]');
    if (!box) return;
    const buttons = Array.from(box.querySelectorAll('[data-decide]'));
    const outcome = box.querySelector('[data-console-outcome]');
    const log = box.querySelector('[data-console-log]');
    const reset = box.querySelector('[data-console-reset]');
    const initialOutcome = outcome.innerHTML;
    const initialLog = log.innerHTML;

    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const d = DECISIONS[btn.dataset.decide];
        buttons.forEach((b) => {
          b.disabled = true;
          b.classList.toggle('is-chosen', b === btn);
        });
        box.classList.add('is-done');
        outcome.innerHTML = `<p class="console__result">${d.text}</p>`;
        const li = document.createElement('li');
        li.className = 'is-new';
        li.innerHTML = `<span class="mono">14:41</span>${escape(d.log)}`;
        log.appendChild(li);
        reset.hidden = false;
        if (animate()) {
          window.gsap.from(outcome.firstElementChild, { opacity: 0, y: 12, duration: 0.45, ease: 'power2.out' });
          window.gsap.from(li, { opacity: 0, x: -12, duration: 0.45, delay: 0.15, ease: 'power2.out' });
        }
        reset.focus({ preventScroll: true });
      });
    });

    reset.addEventListener('click', () => {
      buttons.forEach((b) => {
        b.disabled = false;
        b.classList.remove('is-chosen');
      });
      box.classList.remove('is-done');
      outcome.innerHTML = initialOutcome;
      log.innerHTML = initialLog;
      reset.hidden = true;
      buttons[0].focus({ preventScroll: true });
    });
  }

  /* ---------------- Report: link notes and fields ---------------- */
  function initAnatomy() {
    const wrap = document.querySelector('[data-anatomy]');
    if (!wrap) return;
    const fields = Array.from(wrap.querySelectorAll('[data-field]'));
    const notes = Array.from(wrap.querySelectorAll('[data-note]'));
    const set = (n) => {
      fields.forEach((f) => f.classList.toggle('is-hl', f.dataset.field === n));
      notes.forEach((x) => x.classList.toggle('is-hl', x.dataset.note === n));
    };
    const clear = () => set(null);
    notes.forEach((note) => {
      note.addEventListener('pointerenter', () => set(note.dataset.note));
      note.addEventListener('focus', () => set(note.dataset.note));
      note.addEventListener('click', () => set(note.dataset.note));
    });
    fields.forEach((field) => {
      field.addEventListener('pointerenter', () => set(field.dataset.field));
    });
    wrap.addEventListener('pointerleave', clear);
    wrap.addEventListener('focusout', (e) => {
      if (!wrap.contains(e.relatedTarget)) clear();
    });
  }

  /* ---------------- Motion ---------------- */
  function initMotion(gsap, ScrollTrigger) {
    const copy = document.querySelector('[data-how-copy]');
    if (copy) gsap.from(copy.children, { y: 30, opacity: 0, duration: 1, ease: 'power3.out', stagger: 0.08, delay: 0.1 });
    const cards = document.querySelectorAll('[data-flow-card]');
    if (cards.length) gsap.from(cards, { y: 26, opacity: 0, scale: 0.96, duration: 0.8, ease: 'power3.out', stagger: 0.9, delay: 0.7 });

    const bar = document.querySelector('[data-stages-bar]');
    const panels = document.querySelector('.stages__panels');
    if (bar && panels) {
      gsap.fromTo(
        bar,
        { scaleY: 0.04 },
        { scaleY: 1, ease: 'none', scrollTrigger: { trigger: panels, start: 'top 45%', end: 'bottom 55%', scrub: true } }
      );
    }
    const track = document.querySelector('[data-track]');
    if (track) {
      gsap.from(track.children, {
        y: 36,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
        stagger: 0.12,
        scrollTrigger: { trigger: track, start: 'top 82%', toggleActions: 'play none none reverse' },
      });
    }
  }

  function boot() {
    initStepper();
    initSorter();
    initConsole();
    initAnatomy();
    if (SIG.whenMotion) SIG.whenMotion(initMotion);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
