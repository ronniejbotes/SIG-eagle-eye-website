/**
 * Contact: the get-started funnel.
 * Step 1 counts cameras and sites. A small setup (up to data-max-cameras cameras on
 * up to data-max-sites sites) books online: a pretend installation calendar, contact
 * details and a simulated DebiCheck debit order. Anything bigger tells us about the
 * business, and we contact them to set up a meeting. It is a demo: nothing is sent
 * anywhere, and both paths finish in the browser.
 * Industry links (?industry=retail) pre-select the industry, and the meeting path
 * previews what we'll look at for that industry.
 */
(() => {
  const SIG = (window.SIG = window.SIG || {});
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const SPRITE = '/assets/icons/sprite.svg';

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
    manufacturing: 'manufacturing sites',
    logistics: 'depots and DCs',
    mining: 'mines and earthmoving sites',
    healthcare: 'hospitals and clinics',
    retail: 'stores and warehouses',
    security: 'guarded sites',
  };

  const PATHS = {
    install: { steps: ['setup', 'date', 'details', 'debit', 'booked'], labels: ['Your setup', 'Installation date', 'Your details', 'Debit order', 'Booked'] },
    meeting: { steps: ['setup', 'business', 'sent'], labels: ['Your setup', 'Your business', 'Request sent'] },
  };

  /* ---------------- Small helpers ---------------- */
  const plural = (n, one, many) => `${n.toLocaleString('en-ZA')} ${n === 1 ? one : many}`;
  const rand = (n) => `R${Math.round(n).toLocaleString('en-ZA')}`;
  const ordinal = (n) => `${n}${n % 10 === 1 && n !== 11 ? 'st' : n % 10 === 2 && n !== 12 ? 'nd' : n % 10 === 3 && n !== 13 ? 'rd' : 'th'}`;
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const fromIso = (s) => {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d);
  };
  const fmtLong = new Intl.DateTimeFormat('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const fmtDay = new Intl.DateTimeFormat('en-ZA', { weekday: 'long', day: 'numeric', month: 'long' });
  const fmtDate = new Intl.DateTimeFormat('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' });
  const fmtMonth = new Intl.DateTimeFormat('en-ZA', { month: 'long', year: 'numeric' });
  const optionText = (select) => (select && select.value && select.selectedOptions[0] ? select.selectedOptions[0].textContent.trim() : '');

  /* ---------------- Industry preview and pre-selection ---------------- */
  function prefillIndustry() {
    const wanted = new URLSearchParams(window.location.search).get('industry');
    $$('[data-ct-prefill]').forEach((select) => {
      if (wanted && select.querySelector(`option[value="${CSS.escape(wanted)}"]`)) select.value = wanted;
    });
  }

  function initIndustry() {
    prefillIndustry();
    const select = $('[data-ct-industry]');
    const title = $('[data-ct-preview-title]');
    const list = $('[data-ct-preview-list]');
    if (!select || !list) return;
    const render = () => {
      const key = PREVIEW[select.value] ? select.value : 'other';
      title.textContent = NAMES[key] ? `For ${NAMES[key]} we'll look at` : "In the meeting we'll look at";
      list.innerHTML = '';
      PREVIEW[key].forEach((text) => {
        const li = document.createElement('li');
        li.textContent = text;
        list.appendChild(li);
      });
      if (window.gsap && !reduceMotion.matches) {
        window.gsap.from(list.children, { opacity: 0, x: 10, duration: 0.35, stagger: 0.05, ease: 'power2.out' });
      }
    };
    select.addEventListener('change', render);
    if (select.value) render();
  }

  /* ---------------- Count pickers: a row of tiles plus a number field ---------------- */
  function initPicker(el, onChange) {
    const tiles = Number(el.dataset.tiles);
    const input = $('[data-picker-input]', el);
    const wrap = $('[data-picker-tiles]', el);
    const { one, many, icon } = el.dataset;
    const buttons = [];
    for (let n = 1; n <= tiles + 1; n += 1) {
      const more = n > tiles;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = more ? 'fx-tile fx-tile--more' : 'fx-tile';
      b.style.setProperty('--i', String(n - 1));
      b.setAttribute('aria-label', more ? `${n} or more ${many}` : plural(n, one, many));
      b.innerHTML = more
        ? `<span class="fx-tile__more mono" aria-hidden="true">${n}+</span>`
        : `<svg class="icon" aria-hidden="true"><use href="${SPRITE}#${icon}"/></svg><span class="fx-tile__n mono" aria-hidden="true">${n}</span>`;
      wrap.appendChild(b);
      buttons.push(b);
    }
    const value = () => {
      const v = parseInt(input.value, 10);
      return Number.isFinite(v) && v > 0 ? v : 0;
    };
    const paint = (preview) => {
      const v = value();
      buttons.forEach((b, i) => {
        const n = i + 1;
        b.classList.toggle('is-on', v >= n);
        b.classList.toggle('is-preview', preview !== undefined && n <= preview && v < n);
        b.setAttribute('aria-pressed', String(n <= tiles ? v === n : v > tiles));
      });
    };
    const set = (v) => {
      input.value = v > 0 ? String(v) : '';
      SIG.forms.clearError(input);
      paint();
      onChange();
    };
    buttons.forEach((b, i) => {
      const n = i + 1;
      b.addEventListener('click', () => {
        if (n <= tiles) return set(n);
        // The "15+" tile starts at 15 and hands over to the number field for the real count.
        set(Math.max(value(), n));
        input.focus();
        input.select();
      });
      b.addEventListener('pointerenter', (e) => e.pointerType === 'mouse' && paint(n));
      b.addEventListener('pointerleave', (e) => e.pointerType === 'mouse' && paint());
    });
    $$('[data-qty]', el).forEach((btn) => btn.addEventListener('click', () => set(Math.max(1, value() + Number(btn.dataset.qty)))));
    input.addEventListener('input', () => {
      paint();
      onChange();
    });
    paint();
    return { input, value, paint };
  }

  /* ---------------- Pretend installation calendar ---------------- */
  // South African public holidays, so the calendar never offers one.
  function holidays(year) {
    const out = new Set();
    ['01-01', '03-21', '04-27', '05-01', '06-16', '08-09', '09-24', '12-16', '12-25', '12-26'].forEach((md) => {
      const d = fromIso(`${year}-${md}`);
      out.add(iso(d));
      if (d.getDay() === 0) out.add(iso(new Date(year, d.getMonth(), d.getDate() + 1)));
    });
    // Good Friday and Family Day hang off Easter Sunday (anonymous Gregorian algorithm).
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const h = (19 * a + b - Math.floor(b / 4) - Math.floor((b - Math.floor((b + 8) / 25) + 1) / 3) + 15) % 30;
    const l = (32 + 2 * (b % 4) + 2 * Math.floor(c / 4) - h - (c % 4)) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31) - 1;
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    out.add(iso(new Date(year, month, day - 2)));
    out.add(iso(new Date(year, month, day + 1)));
    return out;
  }

  // Pretend bookings: a hash of the date decides which days and windows look taken,
  // so the same ones stay taken every time the page loads.
  const SLOTS = ['08:00', '10:00', '12:00', '14:00'];
  const hash = (s) => {
    let h = 2166136261;
    for (let i = 0; i < s.length; i += 1) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
    return h >>> 0;
  };
  const slotLabel = (t) => `${t}–${String(Number(t.slice(0, 2)) + 2).padStart(2, '0')}:00`;
  const slotTaken = (key, t) => hash(`${key} ${t}`) % 3 === 0;
  const dayFull = (key) => hash(key) % 6 === 0 || SLOTS.every((t) => slotTaken(key, t));

  function initCalendar(state) {
    const root = $('[data-cal]');
    const grid = $('[data-cal-grid]', root);
    const month = $('[data-cal-month]', root);
    const prev = $('[data-cal-prev]', root);
    const next = $('[data-cal-next]', root);
    const slots = $('[data-cal-slots]');
    const slotGrid = $('[data-cal-slot-grid]');
    const slotDay = $('[data-cal-day]');
    const dateInput = $('[data-cal-date]');
    const error = $('[data-cal-error]');

    const holidayCache = new Map();
    const isHoliday = (d) => {
      const y = d.getFullYear();
      if (!holidayCache.has(y)) holidayCache.set(y, holidays(y));
      return holidayCache.get(y).has(iso(d));
    };
    const isWorkday = (d) => d.getDay() !== 0 && d.getDay() !== 6 && !isHoliday(d);

    // The earliest installation is two working days out; bookings open six weeks ahead.
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const first = new Date(today);
    for (let n = 0; n < 2; ) {
      first.setDate(first.getDate() + 1);
      if (isWorkday(first)) n += 1;
    }
    const last = new Date(first);
    last.setDate(last.getDate() + 42);
    let view = new Date(first.getFullYear(), first.getMonth(), 1);

    const status = (d) => {
      if (d < first || d > last || !isWorkday(d)) return 'closed';
      return dayFull(iso(d)) ? 'full' : 'open';
    };

    const renderSlots = () => {
      slots.hidden = !state.date;
      if (!state.date) return;
      slotDay.textContent = fmtDay.format(fromIso(state.date));
      slotGrid.innerHTML = '';
      SLOTS.forEach((t) => {
        const taken = slotTaken(state.date, t);
        const label = document.createElement('label');
        label.className = 'fx-choice';
        const input = document.createElement('input');
        input.type = 'radio';
        input.name = 'install_time';
        input.value = slotLabel(t);
        input.disabled = taken;
        input.checked = !taken && state.time === input.value;
        input.addEventListener('change', () => {
          state.time = input.value;
          error.hidden = true;
        });
        const span = document.createElement('span');
        if (taken) {
          const time = document.createElement('s');
          time.textContent = slotLabel(t);
          const note = document.createElement('small');
          note.textContent = 'Taken';
          span.append(time, note);
        } else span.textContent = slotLabel(t);
        label.append(input, span);
        slotGrid.appendChild(label);
      });
    };

    const render = (focusIso) => {
      month.textContent = fmtMonth.format(view);
      prev.disabled = view <= new Date(first.getFullYear(), first.getMonth(), 1);
      next.disabled = view >= new Date(last.getFullYear(), last.getMonth(), 1);
      grid.innerHTML = '';
      const lead = (view.getDay() + 6) % 7;
      for (let i = 0; i < lead; i += 1) grid.appendChild(document.createElement('span'));
      const days = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
      const buttons = [];
      for (let n = 1; n <= days; n += 1) {
        const d = new Date(view.getFullYear(), view.getMonth(), n);
        const key = iso(d);
        const st = status(d);
        const b = document.createElement('button');
        b.type = 'button';
        b.className = `fx-day fx-day--${st}`;
        b.textContent = String(n);
        b.dataset.date = key;
        b.disabled = st !== 'open';
        b.tabIndex = -1;
        if (key === iso(today)) b.classList.add('is-today');
        b.setAttribute('aria-pressed', String(state.date === key));
        b.setAttribute('aria-label', `${fmtDay.format(d)}${st === 'full' ? ', fully booked' : st === 'closed' ? ', not available' : ''}`);
        grid.appendChild(b);
        buttons.push(b);
      }
      // One tab stop for the whole month: the chosen day, or the first open one.
      const open = buttons.filter((b) => !b.disabled);
      const stop = open.find((b) => b.dataset.date === (focusIso || state.date)) || open[0];
      if (stop) stop.tabIndex = 0;
      if (focusIso && stop) stop.focus();
    };

    const select = (key) => {
      state.date = key;
      state.time = '';
      dateInput.value = key;
      error.hidden = true;
      render(key);
      renderSlots();
    };

    grid.addEventListener('click', (e) => {
      const b = e.target.closest('.fx-day');
      if (b && !b.disabled) select(b.dataset.date);
    });
    // Arrow keys move between open days, crossing into the next or previous month.
    grid.addEventListener('keydown', (e) => {
      const moves = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
      const b = e.target.closest('.fx-day');
      if (!b || !(e.key in moves)) return;
      e.preventDefault();
      const d = fromIso(b.dataset.date);
      do {
        d.setDate(d.getDate() + moves[e.key]);
      } while (d >= first && d <= last && status(d) !== 'open');
      if (d < first || d > last) return;
      view = new Date(d.getFullYear(), d.getMonth(), 1);
      render(iso(d));
    });
    prev.addEventListener('click', () => {
      view = new Date(view.getFullYear(), view.getMonth() - 1, 1);
      render();
    });
    next.addEventListener('click', () => {
      view = new Date(view.getFullYear(), view.getMonth() + 1, 1);
      render();
    });

    render();
    return {
      check() {
        let msg = '';
        if (!state.date) msg = 'Please choose a day for the installation.';
        else if (!state.time) msg = 'Please choose an arrival window.';
        error.textContent = msg;
        error.hidden = !msg;
        if (msg) (state.date ? $('input:not(:disabled)', slotGrid) : $('.fx-day[tabindex="0"]', grid))?.focus();
        return !msg;
      },
      reset() {
        state.date = '';
        state.time = '';
        dateInput.value = '';
        error.hidden = true;
        view = new Date(first.getFullYear(), first.getMonth(), 1);
        render();
        renderSlots();
      },
    };
  }

  /* ---------------- The funnel ---------------- */
  function initFunnel() {
    const form = $('[data-funnel]');
    if (!form || !SIG.forms) return;
    const card = form.closest('[data-fx-card]') || form;
    const cfg = {
      price: Number(form.dataset.price) || 100,
      maxCameras: Number(form.dataset.maxCameras) || 14,
      maxSites: Number(form.dataset.maxSites) || 1,
    };
    const step = (name) => $(`[data-step="${name}"]`, form);
    const field = (id) => document.getElementById(id);
    const state = { path: 'install', current: 'setup', date: '', time: '', reference: '' };

    /* Step 1: counts and the route they lead to */
    const routeBox = $('[data-fx-route]', form);
    const nextLabel = $('[data-fx-next-label]', form);
    const routeCards = $$('.ct-route');
    const pickers = $$('[data-picker]', form).map((el) => initPicker(el, () => renderRoute()));
    const [cameras, sites] = pickers;
    const route = () => {
      const c = cameras.value();
      if (!c) return null;
      return c <= cfg.maxCameras && (sites.value() || 1) <= cfg.maxSites ? 'install' : 'meeting';
    };
    function renderRoute() {
      const r = route();
      const c = cameras.value();
      const s = sites.value() || 1;
      routeCards.forEach((li) => li.classList.toggle('is-active', li.dataset.route === r));
      routeCards.forEach((li) => li.classList.toggle('is-dim', Boolean(r) && li.dataset.route !== r));
      routeBox.hidden = !r;
      nextLabel.textContent = r === 'install' ? 'Choose an installation date' : r === 'meeting' ? 'Tell us about your business' : 'Continue';
      if (r === 'install') {
        routeBox.className = 'fx-route fx-route--install';
        routeBox.innerHTML = `<span class="icon-tile icon-tile--gold"><svg class="icon" aria-hidden="true"><use href="${SPRITE}#i-calendar"/></svg></span>
          <div><p class="fx-route__title">You can book online</p>
          <p>${plural(c, 'camera', 'cameras')} × ${rand(cfg.price)} = <strong>${rand(c * cfg.price)} a month</strong>, by debit order. Pick a date and we'll install.</p></div>`;
      } else if (r === 'meeting') {
        routeBox.className = 'fx-route fx-route--meeting';
        routeBox.innerHTML = `<span class="icon-tile"><svg class="icon" aria-hidden="true"><use href="${SPRITE}#i-users"/></svg></span>
          <div><p class="fx-route__title">Let's plan this with you</p>
          <p>${plural(c, 'camera', 'cameras')} across ${plural(s, 'site', 'sites')} gets a rollout planned with our team. Tell us about your business and we'll set up a meeting.</p></div>`;
      }
      if (state.current === 'setup') {
        state.path = r || 'install';
        progress();
      }
    }

    /* Progress, step switching and focus */
    const count = $('[data-fx-count]', form);
    const label = $('[data-fx-label]', form);
    const bar = $('[data-fx-bar]', form);
    function progress() {
      const { steps, labels } = PATHS[state.path];
      const i = steps.indexOf(state.current);
      const total = steps.length - 1;
      const done = i === total;
      count.textContent = done ? 'Done' : `Step ${i + 1} of ${total}`;
      label.textContent = labels[i];
      bar.style.width = `${done ? 100 : Math.max(6, (i / total) * 100)}%`;
    }
    function show(name) {
      $$('[data-step]', form).forEach((s) => (s.hidden = s.dataset.step !== name));
      state.current = name;
      progress();
      const el = step(name);
      const header = $('[data-site-header]');
      const top = card.getBoundingClientRect().top;
      const offset = (header ? header.offsetHeight : 76) + 16;
      if (top < offset) {
        const y = top + window.scrollY - offset;
        if (SIG.lenis) SIG.lenis.scrollTo(y, { immediate: reduceMotion.matches });
        else window.scrollTo({ top: y, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
      }
      $('.fx-title', el).focus({ preventScroll: true });
      if (window.gsap && !reduceMotion.matches) {
        window.gsap.fromTo(el, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.45, ease: 'power3.out', clearProps: 'opacity,transform' });
      }
    }
    const back = () => {
      const { steps } = PATHS[state.path];
      show(steps[Math.max(0, steps.indexOf(state.current) - 1)]);
    };

    /* Checks beyond "is it filled in" */
    const checkPhone = (input) => {
      if (input.value.replace(/\D/g, '').length >= 9) return true;
      SIG.forms.showError(input, 'Please check the number. It looks too short.');
      return false;
    };
    const checkStep = (el) => {
      const bad = SIG.forms.checkRequired(el);
      if (bad) {
        bad.focus();
        return false;
      }
      const phone = $('[data-phone]', el);
      if (phone && !checkPhone(phone)) {
        phone.focus();
        return false;
      }
      return true;
    };

    /* Debit order (simulated) */
    const debitDay = () => Number(($('input[name="debit_day"]:checked', form) || {}).value || 25);
    const firstDebit = () => {
      const installed = fromIso(state.date);
      const d = new Date(installed.getFullYear(), installed.getMonth(), debitDay());
      return d < installed ? new Date(installed.getFullYear(), installed.getMonth() + 1, debitDay()) : d;
    };
    function renderBill() {
      const c = cameras.value();
      const total = c * cfg.price;
      $('[data-bill-cameras]', form).textContent = plural(c, 'camera', 'cameras');
      $('[data-bill-rate]', form).textContent = `× ${rand(cfg.price)} a month`;
      $('[data-bill-total]', form).textContent = rand(total);
      $('[data-bill-first]', form).textContent = fmtDate.format(firstDebit());
      $('[data-debit-mandate]', form).textContent = `I authorise SIG Eagle Eye to collect ${rand(total)} a month from this account on the ${ordinal(debitDay())}, starting ${fmtDate.format(firstDebit())}, until I cancel.`;
    }
    $('[data-debit-days]', form).addEventListener('change', renderBill);
    const account = $('[data-debit-account]', form);
    account.addEventListener('input', () => {
      account.value = account.value.replace(/\D/g, '');
    });

    async function authorise() {
      const fields = $('[data-debit-fields]', form);
      const wait = $('[data-debit-wait]', form);
      const title = $('[data-debit-wait-title]', form);
      const text = $('[data-debit-wait-text]', form);
      const bank = $('[data-debit-bank]', form).value;
      const total = rand(cameras.value() * cfg.price);
      fields.hidden = true;
      wait.hidden = false;
      wait.classList.remove('is-approved');
      title.textContent = 'Check your banking app';
      text.textContent = `We've sent a DebiCheck request to ${bank === 'Other' ? 'your bank' : bank} for ${total} a month. Approve it in your banking app to finish your booking.`;
      await sleep(reduceMotion.matches ? 1200 : 3200);
      wait.classList.add('is-approved');
      title.textContent = 'Debit order approved';
      text.textContent = 'Finishing your booking…';
      state.reference = `SIG-${Date.now().toString(36).slice(-3).toUpperCase()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
      await sleep(1000);
      booked(bank);
      fields.hidden = false;
      wait.hidden = true;
    }

    /* The two finish lines. Nothing is sent anywhere: this is a demo. */
    const fillSummary = (dl, rows) => {
      dl.innerHTML = '';
      rows.forEach(([term, value]) => {
        if (!value) return;
        const dt = document.createElement('dt');
        dt.textContent = term;
        const dd = document.createElement('dd');
        dd.textContent = value;
        dl.append(dt, dd);
      });
    };
    const firstName = (id) => field(id).value.trim().split(/\s+/)[0];

    function booked(bank) {
      const email = field('f-i-email').value.trim();
      const acct = account.value;
      $('[data-booked-title]', form).textContent = `You're booked, ${firstName('f-i-name')}.`;
      $('[data-booked-ref]', form).textContent = state.reference;
      fillSummary($('[data-booked-summary]', form), [
        ['Installation', `${fmtLong.format(fromIso(state.date))}, arriving ${state.time}`],
        ['Site', field('f-i-address').value.trim()],
        ['Cameras', plural(cameras.value(), 'camera', 'cameras')],
        ['Debit order', `${rand(cameras.value() * cfg.price)} a month on the ${ordinal(debitDay())}, from ${fmtDate.format(firstDebit())}`],
        ['Account', `${bank} ••••${acct.slice(-4)}`],
      ]);
      $('[data-booked-note]', form).textContent = `Demo: nothing was booked or sent. On the live site, these details would be emailed to ${email}.`;
      show('booked');
    }

    async function requestMeeting(btn) {
      btn.disabled = true;
      await sleep(1000);
      btn.disabled = false;
      $('[data-sent-title]', form).textContent = `Thank you, ${firstName('f-m-name')}. We'll be in touch shortly.`;
      $('[data-sent-note]', form).textContent = `Someone from our team will contact you within one business day to set up a meeting. Demo: nothing was sent. On the live site, a copy would be emailed to ${field('f-m-email').value.trim()}.`;
      fillSummary($('[data-sent-summary]', form), [
        ['Company', field('f-m-company').value.trim()],
        ['Industry', optionText(field('f-m-industry'))],
        ['Cameras', plural(cameras.value(), 'camera', 'cameras')],
        ['Sites', plural(sites.value() || 1, 'site', 'sites')],
      ]);
      show('sent');
    }

    /* Next, per step */
    const calendar = initCalendar(state);
    const NEXT = {
      setup() {
        const input = cameras.input;
        if (!checkStep(step('setup'))) return;
        if (cameras.value() > 100000) {
          SIG.forms.showError(input, 'That looks like a typo. How many cameras do you have?');
          input.focus();
          return;
        }
        state.path = route();
        if (state.path === 'meeting') {
          $('[data-business-hint]', form).textContent = `With ${plural(cameras.value(), 'camera', 'cameras')} across ${plural(sites.value() || 1, 'site', 'sites')}, we'd rather plan it with you. A few details and we'll be in touch to set up a meeting.`;
          show('business');
        } else show('date');
      },
      date() {
        if (calendar.check()) show('details');
      },
      details() {
        if (!checkStep(step('details'))) return;
        const holder = field('f-d-holder');
        if (!holder.value.trim()) holder.value = field('f-i-name').value.trim();
        renderBill();
        show('debit');
      },
      debit() {
        if (!checkStep(step('debit'))) return;
        if (account.value.length < 6 || account.value.length > 16) {
          SIG.forms.showError(account, 'Please check the account number. It should be 6 to 16 digits.');
          account.focus();
          return;
        }
        authorise();
      },
      business(btn) {
        if (checkStep(step('business'))) requestMeeting(btn);
      },
    };

    form.addEventListener('click', (e) => {
      const nextBtn = e.target.closest('[data-fx-next]');
      if (nextBtn) NEXT[state.current](nextBtn);
      if (e.target.closest('[data-fx-back]')) back();
      if (e.target.closest('[data-fx-restart]')) {
        form.reset();
        calendar.reset();
        pickers.forEach((p) => p.paint());
        prefillIndustry();
        $('[data-ct-industry]').dispatchEvent(new Event('change'));
        $('[data-form-status]', step('business')).hidden = true;
        show('setup');
        renderRoute();
      }
    });
    // Enter in a single-line field moves on, like a normal form.
    form.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' || !e.target.matches('input:not([type="checkbox"]):not([type="radio"])')) return;
      e.preventDefault();
      const btn = $('[data-fx-next]', step(state.current));
      if (btn && !btn.disabled) btn.click();
    });
    form.addEventListener('submit', (e) => e.preventDefault());
    form.addEventListener('input', (e) => SIG.forms.clearError(e.target));
    form.addEventListener('change', (e) => SIG.forms.clearError(e.target));

    renderRoute();
  }

  function initMotion(gsap) {
    const intro = document.querySelector('[data-ct-intro]');
    if (intro) gsap.from(intro.children, { y: 26, opacity: 0, duration: 0.9, ease: 'power3.out', stagger: 0.06, delay: 0.1 });
    const card = document.querySelector('.ct-card');
    if (card) gsap.from(card, { y: 40, opacity: 0, duration: 1, ease: 'power3.out', delay: 0.3, clearProps: 'transform' });
  }

  function boot() {
    initIndustry();
    initFunnel();
    if (SIG.whenMotion) SIG.whenMotion(initMotion);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
