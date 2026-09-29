/**
 * SIG Eagle Eye: scroll choreography (GSAP + ScrollTrigger + SplitText, Lenis).
 *
 * Rules this file keeps (same as the Vital Socks build):
 * - Content is never hidden by CSS. Every from-state is set here, so with
 *   JavaScript off or reduced motion the page is static and complete.
 * - Scroll-linked motion is scrubbed, so scrolling back rewinds it.
 * - Only transform and opacity animate on the hot path.
 * - Reveals use opacity, never visibility, so links stay keyboard reachable.
 * Page scripts can hook in with SIG.whenMotion((gsap, ScrollTrigger) => {...}).
 */
(() => {
  const SIG = (window.SIG = window.SIG || {});
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const queue = [];
  SIG.whenMotion = (fn) => {
    if (SIG.motionReady) fn(window.gsap, window.ScrollTrigger);
    else queue.push(fn);
  };

  function boot() {
    const { gsap, ScrollTrigger } = window;
    if (reduceMotion.matches || !gsap || !ScrollTrigger) {
      document.documentElement.classList.add('no-motion');
      return;
    }
    gsap.registerPlugin(ScrollTrigger);
    if (window.SplitText) gsap.registerPlugin(window.SplitText);
    document.documentElement.classList.add('has-motion');

    initSmoothScroll(gsap, ScrollTrigger);
    initHero(gsap, ScrollTrigger);
    initMarquee(gsap, ScrollTrigger);
    initEscalation(gsap, ScrollTrigger);
    initPipeline(gsap, ScrollTrigger);
    initStack(gsap);
    initParallax(gsap);
    initBars(gsap);
    initCounters(gsap, ScrollTrigger);
    initSplit(gsap);
    initReveals(gsap, document);
    initFooterWord(gsap);
    initReticle(gsap);

    SIG.motionReady = true;
    queue.splice(0).forEach((fn) => fn(gsap, ScrollTrigger));

    window.addEventListener('load', () => ScrollTrigger.refresh());
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
  }

  /* Lenis smooth scrolling, driven by GSAP's ticker so ScrollTrigger stays in sync. */
  function initSmoothScroll(gsap, ScrollTrigger) {
    if (!window.Lenis) return;
    const lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true });
    SIG.lenis = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
    document.addEventListener('click', (event) => {
      const link = event.target.closest('a[href^="#"]');
      if (!link || link.getAttribute('href').length < 2) return;
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      event.preventDefault();
      lenis.scrollTo(target, { offset: -90 });
      if (target.id === 'main') target.focus({ preventScroll: true });
    });
  }

  /* Hero: detection boxes arrive, then (on wide screens) the footage shrinks
     into a monitor while the incident register slides in. */
  function initHero(gsap, ScrollTrigger) {
    const hero = document.querySelector('[data-hero]');
    if (!hero) return;
    const content = hero.querySelector('[data-hero-content]');
    const frame = hero.querySelector('[data-hero-frame]');
    const register = hero.querySelector('[data-register]');
    const rows = hero.querySelectorAll('[data-register-row]');
    const boxes = hero.querySelectorAll('[data-box]');
    const flow = hero.querySelectorAll('.hud__flow, .hud__label');
    const scrim = hero.querySelector('.hero__scrim');

    if (boxes.length) {
      gsap.from(boxes, {
        opacity: 0,
        scale: 0.86,
        transformOrigin: '50% 50%',
        duration: 0.8,
        ease: 'power3.out',
        stagger: 0.18,
        delay: 0.6,
      });
    }
    if (flow.length) gsap.from(flow, { opacity: 0, duration: 1.2, delay: 1.2 });
    if (content) {
      gsap.from(content.children, { y: 34, opacity: 0, duration: 1.1, ease: 'power3.out', stagger: 0.09, delay: 0.1 });
    }

    const mm = gsap.matchMedia();
    mm.add('(min-width: 1000px) and (min-height: 620px)', () => {
      hero.classList.add('is-scrubbed');
      ScrollTrigger.refresh();
      gsap.set(register, { opacity: 0, x: 70 });
      gsap.set(rows, { opacity: 0, y: 18 });
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom bottom', scrub: 0.7 },
      });
      tl.to(content, { opacity: 0, y: -90, duration: 0.3 }, 0)
        .to(frame, { scale: 0.56, xPercent: -19, borderRadius: 26, duration: 0.6, ease: 'power1.inOut' }, 0.08)
        .to(scrim, { opacity: 0.25, duration: 0.5 }, 0.12)
        .to(register, { opacity: 1, x: 0, duration: 0.28 }, 0.46)
        .to(rows, { opacity: 1, y: 0, duration: 0.2, stagger: 0.07 }, 0.56)
        .to({}, { duration: 0.2 });
      return () => {
        hero.classList.remove('is-scrubbed');
        gsap.set([content, frame, scrim, register, rows], { clearProps: 'all' });
      };
    });
  }

  /* Marquee speeds up with scroll velocity and follows scroll direction. */
  function initMarquee(gsap, ScrollTrigger) {
    document.querySelectorAll('[data-marquee]').forEach((el) => {
      const track = el.querySelector('[data-marquee-track]');
      if (!track) return;
      el.classList.add('is-js-driven');
      const duration = parseFloat(getComputedStyle(el).getPropertyValue('--marquee-duration')) || 38;
      const loop = gsap.to(track, { xPercent: -50, duration, ease: 'none', repeat: -1 });
      ScrollTrigger.create({
        trigger: el,
        start: 'top bottom',
        end: 'bottom top',
        onUpdate(self) {
          const boost = gsap.utils.clamp(0, 6, Math.abs(self.getVelocity()) / 260);
          gsap.to(loop, { timeScale: self.direction * (1 + boost), duration: 0.2, overwrite: true });
          gsap.to(loop, { timeScale: self.direction, duration: 1.2, delay: 0.3 });
        },
      });
    });
  }

  /* Escalation curve: on wide screens a pinned stage draws as you scroll; on
     phones the chart plays through once it is in view. */
  function initEscalation(gsap, ScrollTrigger) {
    const section = document.querySelector('[data-escalation]');
    if (!section) return;
    const q = (s) => section.querySelector(s);
    const track = q('[data-escalation-track]');
    const figure = q('.escalation__figure');
    const steps = Array.from(section.querySelectorAll('[data-esc-step]'));
    const lateA = q('[data-curve-late-a]');
    const lateB = q('[data-curve-late-b]');
    const eeA = q('[data-curve-ee-a]');
    const eeB = q('[data-curve-ee-b]');
    const nodes = section.querySelectorAll('[data-curve-node]');
    const gap = section.querySelectorAll('[data-curve-gap]');
    const marker = q('[data-curve-marker]');
    const all = [lateA, lateB, eeA, eeB, ...nodes, ...gap, marker, ...steps];

    // dimSteps: the steps light up in turn beside the chart (pinned layout only).
    const build = (scrollTrigger, { dimSteps = true, ease = 'none' } = {}) => {
      gsap.set([lateA, lateB, eeA, eeB], { strokeDashoffset: 1 });
      gsap.set(nodes, { opacity: 0, scale: 0.3, transformOrigin: '50% 50%' });
      gsap.set(gap, { opacity: 0 });
      gsap.set(marker, { opacity: 0, y: 24 });
      if (dimSteps) gsap.set(steps, { opacity: 0.28 });
      const tl = gsap.timeline({ defaults: { ease }, scrollTrigger });
      const light = (i, at) => {
        if (!dimSteps) return;
        if (i > 0) tl.to(steps[i - 1], { opacity: 0.5, duration: 0.3 }, at);
        tl.to(steps[i], { opacity: 1, duration: 0.3 }, at);
      };
      light(0, 0);
      tl.to(lateA, { strokeDashoffset: 0, duration: 0.9 }, 0);
      light(1, 1);
      tl.to(nodes[0], { opacity: 1, scale: 1, duration: 0.45, ease: 'back.out(2.2)' }, 1.05);
      light(2, 2);
      tl.to(eeA, { strokeDashoffset: 0, duration: 0.5 }, 2)
        .to(nodes[1], { opacity: 1, scale: 1, duration: 0.45, ease: 'back.out(2.2)' }, 2.4);
      light(3, 3);
      tl.to(eeB, { strokeDashoffset: 0, duration: 1 }, 3)
        .to(lateB, { strokeDashoffset: 0, duration: 1 }, 3)
        .to(marker, { opacity: 1, y: 0, duration: 0.4 }, 3.55)
        .to(gap, { opacity: 1, duration: 0.5 }, 3.75)
        .to({}, { duration: 0.45 });
      return tl;
    };

    const mm = gsap.matchMedia();
    mm.add('(min-width: 1000px) and (min-height: 680px)', () => {
      section.classList.add('is-scrubbed');
      ScrollTrigger.refresh();
      build({ trigger: track, start: 'top top', end: 'bottom bottom', scrub: 0.6 });
      return () => {
        section.classList.remove('is-scrubbed');
        gsap.set(all, { clearProps: 'all' });
      };
    });
    // Stacked layout: the steps sit above the chart, so they stay fully readable,
    // and the chart plays through once it is in view rather than waiting on the scroll.
    mm.add('(max-width: 999px), (max-height: 679px)', () => {
      build(
        { trigger: figure, start: 'top 70%', toggleActions: 'play none none none' },
        { dimSteps: false, ease: 'power1.inOut' }
      ).timeScale(1.5);
      return () => gsap.set(all, { clearProps: 'all' });
    });
  }

  /* Pipeline: pinned horizontal track on wide screens, swipeable strip elsewhere. */
  function initPipeline(gsap, ScrollTrigger) {
    const section = document.querySelector('[data-pipeline]');
    if (!section) return;
    const track = section.querySelector('[data-pipeline-track]');
    const bar = section.querySelector('[data-pipeline-bar]');
    const mm = gsap.matchMedia();
    mm.add('(min-width: 1000px) and (min-height: 640px)', () => {
      section.classList.add('is-scrubbed');
      const distance = () => Math.max(0, track.scrollWidth - document.documentElement.clientWidth);
      const setHeight = () => section.style.setProperty('--pipe-h', `${distance() + window.innerHeight * 1.2}px`);
      setHeight();
      const st = { trigger: section, start: 'top top', end: 'bottom bottom', scrub: 0.6, invalidateOnRefresh: true, onRefreshInit: setHeight };
      gsap.to(track, { x: () => -distance(), ease: 'none', scrollTrigger: st });
      if (bar) gsap.fromTo(bar, { scaleX: 0 }, { scaleX: 1, ease: 'none', scrollTrigger: { ...st, scrub: true, onRefreshInit: undefined } });
      ScrollTrigger.refresh();
      return () => {
        section.classList.remove('is-scrubbed');
        section.style.removeProperty('--pipe-h');
        gsap.set([track, bar], { clearProps: 'all' });
      };
    });
  }

  /* Industry panels: each new panel slides over the last, which recedes. */
  function initStack(gsap) {
    const panels = gsap.utils.toArray('[data-stack-panel]');
    panels.forEach((panel, i) => {
      const media = panel.querySelector('[data-parallax-media]');
      const inner = panel.querySelector('.stack__inner');
      if (media) {
        gsap.fromTo(
          media,
          { yPercent: 7, scale: 1.08 },
          { yPercent: 0, scale: 1, ease: 'none', scrollTrigger: { trigger: panel, start: 'top bottom', end: 'top top', scrub: true } }
        );
      }
      if (inner) {
        gsap.from(inner.children, {
          y: 40,
          opacity: 0,
          stagger: 0.07,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: { trigger: panel, start: 'top 55%', toggleActions: 'play none none reverse' },
        });
      }
      const next = panels[i + 1];
      if (!next) return;
      gsap.to(panel, {
        scale: 0.9,
        borderRadius: 28,
        ease: 'none',
        scrollTrigger: { trigger: next, start: 'top bottom', end: 'top top', scrub: true },
      });
      if (inner) {
        gsap.to(inner, {
          opacity: 0.15,
          y: -50,
          ease: 'none',
          scrollTrigger: { trigger: next, start: 'top 80%', end: 'top 20%', scrub: true },
        });
      }
    });
  }

  /* Generic parallax: a photo moves slower than the page. */
  function initParallax(gsap) {
    document.querySelectorAll('[data-parallax]').forEach((wrap) => {
      const media = wrap.querySelector('[data-parallax-media]');
      if (!media) return;
      gsap.fromTo(
        media,
        { yPercent: -7, scale: 1.05 },
        { yPercent: 7, scale: 1, ease: 'none', scrollTrigger: { trigger: wrap, start: 'top bottom', end: 'bottom top', scrub: true } }
      );
    });
  }

  function initBars(gsap) {
    document.querySelectorAll('[data-bars]').forEach((fig) => {
      gsap.fromTo(
        fig.querySelectorAll('[data-bar]'),
        { scaleX: 0 },
        {
          scaleX: 1,
          ease: 'none',
          stagger: 0.12,
          scrollTrigger: { trigger: fig, start: 'top 85%', end: 'top 35%', scrub: 0.6 },
        }
      );
    });
  }

  function initCounters(gsap, ScrollTrigger) {
    document.querySelectorAll('[data-count]').forEach((el) => {
      const target = parseFloat(el.dataset.count);
      if (!Number.isFinite(target)) return;
      const thousands = el.dataset.format === 'thousands';
      const decimals = parseInt(el.dataset.decimals || '0', 10);
      const fmt = (v) => {
        const n = decimals ? v.toFixed(decimals) : Math.round(v);
        return thousands ? Number(n).toLocaleString('en-US') : String(n);
      };
      const obj = { v: 0 };
      el.textContent = fmt(0);
      ScrollTrigger.create({
        trigger: el,
        start: 'top 88%',
        once: true,
        onEnter: () => gsap.to(obj, { v: target, duration: 1.8, ease: 'power3.out', onUpdate: () => (el.textContent = fmt(obj.v)) }),
      });
    });
  }

  /* Headings rise line by line from behind a mask. */
  function initSplit(gsap) {
    if (!window.SplitText) return;
    document.querySelectorAll('[data-split]').forEach((el) => {
      window.SplitText.create(el, {
        type: 'lines',
        mask: 'lines',
        autoSplit: true,
        onSplit(self) {
          return gsap.from(self.lines, {
            yPercent: 110,
            duration: 1.05,
            ease: 'expo.out',
            stagger: 0.09,
            scrollTrigger: { trigger: el, start: 'top 86%', toggleActions: 'play none none reverse' },
          });
        },
      });
    });
  }

  /* Reveals state both ends explicitly. A from() tween re-reads the resting
     position when ScrollTrigger refreshes, and on cards with a CSS transform
     transition (hover lifts) it read the transition mid-flight and left them
     44px low, overlapping whatever came next. The resting opacity is read once
     here, before anything moves, and the inline transform is cleared at the
     end so CSS hover transforms work again. */
  function initReveals(gsap, root) {
    const skip = (el) => Boolean(el.closest('[data-hero], [data-stack-panel]'));
    const reveal = (targets, distance, vars) => {
      const rest = targets.map((el) => parseFloat(getComputedStyle(el).opacity) || 1);
      gsap.fromTo(
        targets,
        { y: distance, opacity: 0 },
        { y: 0, opacity: (i) => rest[i], ease: 'power3.out', clearProps: 'transform', ...vars }
      );
    };
    root.querySelectorAll('[data-reveal]').forEach((el) => {
      if (skip(el) || el.dataset.revealed) return;
      el.dataset.revealed = 'true';
      reveal([el], 40, {
        duration: 1,
        scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none reverse' },
      });
    });
    root.querySelectorAll('[data-stagger]').forEach((group) => {
      if (skip(group) || group.dataset.revealed) return;
      group.dataset.revealed = 'true';
      reveal(Array.from(group.children), 44, {
        duration: 0.85,
        stagger: 0.08,
        scrollTrigger: { trigger: group, start: 'top 86%', toggleActions: 'play none none reverse' },
      });
    });
  }
  SIG.initReveals = (root) => window.gsap && initReveals(window.gsap, root);

  function initFooterWord(gsap) {
    const word = document.querySelector('[data-footer-word]');
    if (!word) return;
    gsap.fromTo(
      word,
      { yPercent: 55 },
      { yPercent: 0, ease: 'none', scrollTrigger: { trigger: word.closest('footer'), start: 'top bottom', end: 'bottom bottom', scrub: true } }
    );
  }

  function initReticle(gsap) {
    document.querySelectorAll('[data-reticle]').forEach((el) => {
      gsap.fromTo(
        el,
        { rotate: -30, scale: 0.9 },
        { rotate: 30, scale: 1.05, ease: 'none', scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } }
      );
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
