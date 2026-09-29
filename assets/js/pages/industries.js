/**
 * Industries hub: the index backdrop and the risk matrix.
 */
(() => {
  const SIG = (window.SIG = window.SIG || {});

  /* Index: hovering or focusing an industry fades its photo in behind the
     whole list. Each photo loads the first time it is wanted, the hovered one
     first, so visitors who never hover never download them. */
  function initIndex() {
    const section = document.querySelector('[data-ind]');
    if (!section) return;
    const rows = Array.from(section.querySelectorAll('[data-ind-row]'));
    const bgs = Array.from(section.querySelectorAll('[data-ind-bg]'));
    const list = section.querySelector('[data-ind-list]');
    let rest = false;
    const load = (i) => {
      const img = bgs[i];
      if (!img || img.getAttribute('src')) return;
      img.decoding = 'async';
      img.src = img.dataset.src;
    };
    const loadRest = () => {
      if (rest) return;
      rest = true;
      const run = () => bgs.forEach((_, k) => load(k));
      if (window.requestIdleCallback) window.requestIdleCallback(run, { timeout: 2000 });
      else setTimeout(run, 600);
    };
    const show = (i) => {
      if (i >= 0) {
        load(i);
        loadRest();
      }
      bgs.forEach((img, k) => img.classList.toggle('is-on', k === i));
    };
    rows.forEach((row, i) => {
      row.addEventListener('pointerenter', (e) => {
        if (e.pointerType === 'mouse') show(i);
      });
      row.addEventListener('focus', () => show(i));
    });
    list.addEventListener('pointerleave', () => show(-1));
    list.addEventListener('focusout', (e) => {
      if (!list.contains(e.relatedTarget)) show(-1);
    });
  }

  /* Matrix: choose an industry (header or any cell in its column) and the
     panel summarises it; hovering a cell lights its row and column. */
  const INDUSTRIES = [
    { name: 'Manufacturing', title: 'Where Eagle Eye starts on a factory floor', href: '/industries/manufacturing/', link: 'Eagle Eye for manufacturing' },
    { name: 'Logistics & fleet', title: 'Where Eagle Eye starts in a depot and yard', href: '/industries/logistics-fleet/', link: 'Eagle Eye for logistics' },
    { name: 'Mining & earthmoving', title: 'Where Eagle Eye starts on a mine', href: '/industries/mining-earthmoving/', link: 'Eagle Eye for mining' },
    { name: 'Healthcare facilities', title: 'Where Eagle Eye starts in a hospital or clinic', href: '/industries/healthcare/', link: 'Eagle Eye for healthcare' },
    { name: 'Retail & warehousing', title: 'Where Eagle Eye starts in a store or DC', href: '/industries/retail-warehousing/', link: 'Eagle Eye for retail' },
    { name: 'Security operations', title: 'Where Eagle Eye starts on a guarded site', href: '/industries/security-operations/', link: 'Eagle Eye for security' },
  ];

  function initMatrix() {
    const mx = document.querySelector('[data-mx]');
    if (!mx) return;
    const table = mx.querySelector('table');
    const cols = Array.from(mx.querySelectorAll('[data-mx-col]'));
    const chips = mx.querySelector('[data-mx-chips]');
    if (chips) chips.hidden = false;
    const bodyRows = Array.from(table.tBodies[0].rows);
    const kicker = mx.querySelector('[data-mx-kicker]');
    const title = mx.querySelector('[data-mx-title]');
    const list = mx.querySelector('[data-mx-list]');
    const link = mx.querySelector('[data-mx-link]');
    const cellsIn = (c) => [table.tHead.rows[0].cells[c + 1], ...bodyRows.map((r) => r.cells[c + 1])];
    let current = 0;

    const escape = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
    const select = (c) => {
      current = c;
      cols.forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.mxCol) === c)));
      table.querySelectorAll('.is-col').forEach((el) => el.classList.remove('is-col'));
      cellsIn(c).forEach((el) => el.classList.add('is-col'));
      const items = bodyRows
        .map((r) => ({ area: r.cells[0].textContent.trim(), lvl: Number(r.cells[c + 1].dataset.lvl), text: r.cells[c + 1].textContent.trim() }))
        .sort((a, b) => b.lvl - a.lvl);
      const info = INDUSTRIES[c];
      kicker.textContent = info.name;
      title.textContent = info.title;
      list.innerHTML = items
        .map((it) => `<li data-lvl="${it.lvl}"><span class="mx__dot" aria-hidden="true"></span><span><strong>${escape(it.area)}.</strong> ${escape(it.text)}</span></li>`)
        .join('');
      link.href = info.href;
      link.firstChild.textContent = `${info.link} `;
      if (window.gsap && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        window.gsap.from(list.children, { opacity: 0, x: 12, duration: 0.4, stagger: 0.05, ease: 'power2.out' });
      }
    };

    cols.forEach((b) => b.addEventListener('click', () => select(Number(b.dataset.mxCol))));
    bodyRows.forEach((r) => {
      Array.from(r.cells).forEach((cell, k) => {
        if (k === 0) return;
        cell.addEventListener('click', () => select(k - 1));
        cell.addEventListener('pointerenter', () => {
          r.querySelectorAll('td, th').forEach((el) => el.classList.add('is-row'));
          cellsIn(k - 1).forEach((el) => el.classList.add('is-hover'));
        });
        cell.addEventListener('pointerleave', () => {
          table.querySelectorAll('.is-row').forEach((el) => el.classList.remove('is-row'));
          table.querySelectorAll('.is-hover').forEach((el) => el.classList.remove('is-hover'));
        });
      });
    });
    select(current);
  }

  function initMotion(gsap) {
    const head = document.querySelector('[data-ind-head]');
    if (head) gsap.from(head.children, { y: 30, opacity: 0, duration: 1, ease: 'power3.out', stagger: 0.08, delay: 0.1 });
    const rows = document.querySelectorAll('[data-ind-row]');
    if (rows.length) gsap.from(rows, { y: 36, opacity: 0, duration: 0.9, ease: 'power3.out', stagger: 0.07, delay: 0.35 });
  }

  function boot() {
    initIndex();
    initMatrix();
    if (SIG.whenMotion) SIG.whenMotion(initMotion);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
