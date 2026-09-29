/**
 * FAQ: live search, topic filters, highlighted matches, deep links.
 */
(() => {
  const SIG = (window.SIG = window.SIG || {});
  const fold = (s) =>
    s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[’']/g, "'");
  const escape = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  function initFaq() {
    const input = document.querySelector('[data-faq-search]');
    const count = document.querySelector('[data-faq-count]');
    const chips = Array.from(document.querySelectorAll('[data-faq-chip]'));
    const groups = Array.from(document.querySelectorAll('[data-faq-group]'));
    const empty = document.querySelector('[data-faq-empty]');
    if (!input || !groups.length) return;

    /* Wrap each question's text so matches can be highlighted safely. */
    const items = groups.flatMap((group) =>
      Array.from(group.querySelectorAll('[data-faq-item]')).map((el) => {
        const summary = el.querySelector('summary');
        const textNode = Array.from(summary.childNodes).find((n) => n.nodeType === 3 && n.textContent.trim());
        const q = document.createElement('span');
        q.className = 'faq-q';
        q.textContent = textNode ? textNode.textContent : '';
        if (textNode) summary.replaceChild(q, textNode);
        return { el, group: group.dataset.faqGroup, q, question: q.textContent, haystack: fold(el.textContent) };
      })
    );

    let topic = 'all';
    const openedBySearch = new Set();

    const highlight = (item, terms) => {
      if (!terms.length) {
        item.q.textContent = item.question;
        return;
      }
      const pattern = new RegExp(`(${terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
      // Split first, then escape each piece, so a match can never cut into markup.
      item.q.innerHTML = item.question
        .split(pattern)
        .map((part, i) => (i % 2 ? `<mark>${escape(part)}</mark>` : escape(part)))
        .join('');
    };

    const apply = () => {
      const raw = input.value.trim();
      const terms = fold(raw).split(/\s+/).filter((t) => t.length > 1);
      let shown = 0;
      openedBySearch.forEach((el) => (el.open = false));
      openedBySearch.clear();
      const matches = [];
      items.forEach((item) => {
        const inTopic = topic === 'all' || item.group === topic;
        const hit = terms.every((t) => item.haystack.includes(t));
        const visible = inTopic && hit;
        item.el.hidden = !visible;
        highlight(item, visible ? terms : []);
        if (visible) {
          shown += 1;
          matches.push(item);
        }
      });
      groups.forEach((g) => {
        g.hidden = !g.querySelector('[data-faq-item]:not([hidden])');
      });
      if (terms.length && matches.length <= 3) {
        matches.forEach((m) => {
          if (!m.el.open) {
            m.el.open = true;
            openedBySearch.add(m.el);
          }
        });
      }
      empty.hidden = shown > 0;
      count.textContent = raw || topic !== 'all' ? `${shown} ${shown === 1 ? 'answer' : 'answers'}` : '';
      if (window.ScrollTrigger) window.ScrollTrigger.refresh();
    };

    let timer;
    input.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(apply, 120);
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        input.value = '';
        apply();
      }
    });
    chips.forEach((chip) =>
      chip.addEventListener('click', () => {
        topic = chip.dataset.faqChip;
        chips.forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
        apply();
      })
    );

    /* Opening a question updates the address, so answers can be shared. */
    items.forEach(({ el }) =>
      el.addEventListener('toggle', () => {
        if (el.open && !openedBySearch.has(el) && history.replaceState) history.replaceState(null, '', `#${el.id}`);
      })
    );
    const target = window.location.hash && document.getElementById(window.location.hash.slice(1));
    if (target && target.matches('[data-faq-item]')) {
      target.open = true;
      requestAnimationFrame(() => target.scrollIntoView({ block: 'start' }));
    }
  }

  function initNav() {
    const links = Array.from(document.querySelectorAll('[data-faq-link]'));
    const groups = Array.from(document.querySelectorAll('[data-faq-group]'));
    if (!links.length || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) links.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === `#${e.target.id}`));
        }),
      { rootMargin: '-30% 0px -60% 0px' }
    );
    groups.forEach((g) => io.observe(g));
  }

  function initMotion(gsap) {
    const head = document.querySelector('[data-faq-head]');
    if (head) gsap.from(head.children, { y: 26, opacity: 0, duration: 0.9, ease: 'power3.out', stagger: 0.06, delay: 0.1 });
  }

  function boot() {
    initFaq();
    initNav();
    if (SIG.whenMotion) SIG.whenMotion(initMotion);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
