/**
 * SIG Eagle Eye: interface behaviour (no animation library needed).
 * Header tone and visibility, navigation, mobile menu, the hero lens,
 * the live clock, the balance scale, HUD label sizing and forms.
 */
(() => {
  const SIG = (window.SIG = window.SIG || {});
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

  /* ---------------- Header ---------------- */
  function initHeader() {
    const header = $('[data-site-header]');
    if (!header) return;
    const darkSections = () => $$('.tone-dark, [data-dark], .stack__panel, .ph--split, .ph--bleed, .site-footer');
    let lastY = window.scrollY;
    let ticking = false;

    const toneUnderHeader = () => {
      const probe = header.offsetHeight * 0.5;
      const hit = darkSections().some((el) => {
        const r = el.getBoundingClientRect();
        return r.top <= probe && r.bottom >= probe;
      });
      header.dataset.tone = hit ? 'dark' : 'light';
    };

    const update = () => {
      ticking = false;
      const y = window.scrollY;
      header.classList.toggle('is-scrolled', y > 24);
      const menuOpen = header.classList.contains('is-open');
      const ddOpen = Boolean($('.nav__item.is-open', header));
      if (!menuOpen && !ddOpen) {
        if (y > 480 && y > lastY + 4) header.classList.add('is-hidden');
        else if (y < lastY - 4 || y < 480) header.classList.remove('is-hidden');
      }
      lastY = y;
      toneUnderHeader();
    };
    window.addEventListener(
      'scroll',
      () => {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(update);
        }
      },
      { passive: true }
    );
    window.addEventListener('resize', update);
    header.addEventListener('focusin', () => header.classList.remove('is-hidden'));
    update();
  }

  /* ---------------- Dropdown navigation ---------------- */
  function initDropdowns() {
    const items = $$('[data-dropdown]');
    let closeTimer;
    const close = (item) => {
      item.classList.remove('is-open');
      const btn = $('button', item);
      if (btn) btn.setAttribute('aria-expanded', 'false');
    };
    const closeAll = (except) => items.forEach((i) => i !== except && close(i));
    const open = (item) => {
      closeAll(item);
      item.classList.add('is-open');
      $('button', item).setAttribute('aria-expanded', 'true');
    };
    items.forEach((item) => {
      const btn = $('button', item);
      let hoverOpened = false;
      btn.addEventListener('click', (e) => {
        // A mouse user who hovered it open expects a click to keep it open;
        // moving away or clicking elsewhere still closes it.
        if (hoverOpened && e.pointerType === 'mouse' && item.classList.contains('is-open')) return;
        if (item.classList.contains('is-open')) close(item);
        else open(item);
      });
      item.addEventListener('pointerenter', (e) => {
        if (e.pointerType !== 'mouse') return;
        clearTimeout(closeTimer);
        open(item);
        hoverOpened = true;
      });
      item.addEventListener('pointerleave', (e) => {
        if (e.pointerType === 'mouse') hoverOpened = false;
      });
      item.addEventListener('pointerleave', (e) => {
        if (e.pointerType !== 'mouse') return;
        closeTimer = setTimeout(() => close(item), 160);
      });
      item.addEventListener('focusout', (e) => {
        if (!item.contains(e.relatedTarget)) close(item);
      });
    });
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      const openItem = items.find((i) => i.classList.contains('is-open'));
      if (openItem) {
        close(openItem);
        $('button', openItem).focus();
      }
    });
    document.addEventListener('click', (e) => {
      if (!e.target.closest('[data-dropdown]')) closeAll();
    });
  }

  /* ---------------- Mobile menu ---------------- */
  function initMobileMenu() {
    const toggle = $('[data-menu-toggle]');
    const menu = $('[data-mobile-menu]');
    const header = $('[data-site-header]');
    if (!toggle || !menu) return;
    const setOpen = (state) => {
      toggle.setAttribute('aria-expanded', String(state));
      menu.classList.toggle('is-open', state);
      header.classList.toggle('is-open', state);
      document.documentElement.classList.toggle('menu-open', state);
      if (SIG.lenis) state ? SIG.lenis.stop() : SIG.lenis.start();
      if (state) header.classList.remove('is-hidden');
    };
    toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
    menu.addEventListener('click', (e) => {
      if (e.target.closest('a')) setOpen(false);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menu.classList.contains('is-open')) {
        setOpen(false);
        toggle.focus();
      }
    });
    $$('[data-mm-toggle]', menu).forEach((btn) => {
      const panel = document.getElementById(btn.getAttribute('aria-controls'));
      btn.addEventListener('click', () => {
        const expanded = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!expanded));
        panel.hidden = expanded;
      });
    });
    window.matchMedia('(min-width: 1080px)').addEventListener('change', (mq) => mq.matches && setOpen(false));
  }

  /* ---------------- Live clock (SAST) ---------------- */
  function initClock() {
    const clocks = $$('[data-clock]');
    if (!clocks.length) return;
    const fmt = new Intl.DateTimeFormat('en-ZA', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: 'Africa/Johannesburg',
    });
    const tick = () => {
      const t = `${fmt.format(new Date())} SAST`;
      clocks.forEach((c) => (c.textContent = t));
    };
    tick();
    setInterval(tick, 1000);
  }

  /* ---------------- HUD tags: fit each label box to its text ---------------- */
  function fitHudTags(root = document) {
    $$('.hud__tag, [data-fit-tag]', root).forEach((tag) => {
      const rect = $('rect', tag);
      const texts = $$('text', tag);
      if (!rect || !texts.length) return;
      let width = 0;
      texts.forEach((t) => {
        try {
          width = Math.max(width, t.getComputedTextLength());
        } catch (e) {
          /* not rendered yet */
        }
      });
      if (width > 0) rect.setAttribute('width', Math.ceil(width + 28));
    });
  }
  SIG.fitHudTags = fitHudTags;

  /* ---------------- Hero lens ---------------- */
  function initLens() {
    const lens = $('[data-lens]');
    const frame = $('[data-hero-frame]');
    const hero = $('[data-hero]');
    if (!lens || !frame || !hero) return;
    const state = { x: 0.7, y: 0.46, tx: 0.7, ty: 0.46, pointer: null, leftAt: 0, t: 0, visible: true };
    const apply = () => {
      lens.style.setProperty('--x', `${(state.x * 100).toFixed(2)}%`);
      lens.style.setProperty('--y', `${(state.y * 100).toFixed(2)}%`);
    };
    if (reduceMotion.matches) {
      apply();
      return;
    }
    // Listen on the whole hero, not just the footage: the headline, the status
    // bar and the incident register (invisible until you scroll) all sit above
    // the footage, and the lens has to follow the cursor over every one of them.
    hero.addEventListener(
      'pointermove',
      (e) => {
        if (e.pointerType !== 'mouse') return;
        state.pointer = { x: e.clientX, y: e.clientY };
      },
      { passive: true }
    );
    hero.addEventListener('pointerleave', (e) => {
      if (e.pointerType !== 'mouse') return;
      state.pointer = null;
      state.leftAt = performance.now();
    });
    const io = new IntersectionObserver(([entry]) => (state.visible = entry.isIntersecting));
    io.observe(frame);
    const loop = (now) => {
      requestAnimationFrame(loop);
      if (!state.visible || document.hidden) return;
      let following = false;
      if (state.pointer) {
        // Measured every frame, so the lens stays under a resting cursor even
        // while the footage shrinks and slides as the page scrolls.
        const r = frame.getBoundingClientRect();
        const px = (state.pointer.x - r.left) / r.width;
        const py = (state.pointer.y - r.top) / r.height;
        if (px >= 0 && px <= 1 && py >= 0 && py <= 1) {
          state.tx = px;
          state.ty = py;
          following = true;
        }
      }
      if (!following && now - state.leftAt > 1200) {
        // Nobody pointing at the footage: a slow drift across the floor, like a camera sweeping.
        state.t += 0.0042;
        const wide = finePointer.matches;
        state.tx = (wide ? 0.66 : 0.55) + Math.sin(state.t) * (wide ? 0.2 : 0.22);
        state.ty = 0.5 + Math.sin(state.t * 1.7 + 1) * 0.16;
      }
      state.x += (state.tx - state.x) * 0.085;
      state.y += (state.ty - state.y) * 0.085;
      apply();
    };
    requestAnimationFrame(loop);
  }

  /* ---------------- Balance scale ---------------- */
  function initBalance() {
    $$('[data-balance]').forEach((section) => {
      const sides = $$('[data-balance-side]', section);
      const set = (side) => {
        if (side) section.dataset.tilt = side;
        else delete section.dataset.tilt;
      };
      sides.forEach((el) => {
        const side = el.dataset.balanceSide;
        el.addEventListener('pointerenter', (e) => e.pointerType === 'mouse' && set(side));
        el.addEventListener('pointerleave', (e) => e.pointerType === 'mouse' && set(null));
        el.addEventListener('focus', () => set(side));
        el.addEventListener('blur', () => set(null));
        el.addEventListener('click', (e) => {
          if (e.pointerType === 'mouse') return;
          set(section.dataset.tilt === side ? null : side);
        });
      });
    });
  }

  /* ---------------- Forms ---------------- */
  function initForms() {
    $$('form[data-lead-form]').forEach((form) => {
      const status = $('[data-form-status]', form);
      const endpoint = form.getAttribute('data-endpoint') || '';
      const email = form.getAttribute('data-email') || '';
      const showError = (field, msg) => {
        const wrap = field.closest('.field');
        if (!wrap) return;
        wrap.classList.add('has-error');
        let err = $('.field__error', wrap);
        if (!err) {
          err = document.createElement('p');
          err.className = 'field__error';
          err.id = `${field.id}-error`;
          wrap.appendChild(err);
        }
        err.textContent = msg;
        field.setAttribute('aria-invalid', 'true');
        field.setAttribute('aria-describedby', err.id);
      };
      const clearError = (field) => {
        const wrap = field.closest('.field');
        if (!wrap) return;
        wrap.classList.remove('has-error');
        const err = $('.field__error', wrap);
        if (err) err.remove();
        field.removeAttribute('aria-invalid');
        field.removeAttribute('aria-describedby');
      };
      $$('input, select, textarea', form).forEach((f) => f.addEventListener('input', () => clearError(f)));

      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (status) {
          status.hidden = true;
          status.className = 'form__status';
        }
        let firstBad = null;
        $$('[required]', form).forEach((f) => {
          clearError(f);
          const empty = f.type === 'checkbox' ? !f.checked : !f.value.trim();
          if (empty) {
            showError(f, f.dataset.msg || 'Please complete this field.');
            firstBad = firstBad || f;
          } else if (f.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.value.trim())) {
            showError(f, 'Please enter a valid email address.');
            firstBad = firstBad || f;
          }
        });
        if (firstBad) {
          firstBad.focus();
          return;
        }
        const data = new FormData(form);
        if (data.get('company_website')) return; // honeypot
        const btn = $('button[type="submit"]', form);
        if (btn) btn.disabled = true;

        const done = (ok, msg) => {
          if (btn) btn.disabled = false;
          if (!status) return;
          status.hidden = false;
          status.classList.add(ok ? 'form__status--ok' : 'form__status--err');
          status.textContent = msg;
          status.focus();
        };

        if (endpoint) {
          try {
            const res = await fetch(endpoint, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
            if (!res.ok) throw new Error(String(res.status));
            form.reset();
            done(true, 'Thank you. Your request is in, and we will be in touch within one business day.');
          } catch (err) {
            done(false, `Something went wrong sending your request. Please email us at ${email}.`);
          }
          return;
        }
        // No form service configured yet: hand the details to the visitor's email app.
        // Checkbox groups become one line, and selects use the text people chose.
        const answers = new Map();
        data.forEach((value, key) => {
          if (key === 'company_website' || key === 'consent') return;
          const v = String(value).trim();
          if (!v) return;
          if (!answers.has(key)) answers.set(key, []);
          answers.get(key).push(v);
        });
        const lines = [];
        answers.forEach((values, key) => {
          const field = $(`[name="${key}"]`, form);
          const wrap = field && field.closest('.field');
          const labelEl = wrap && (wrap.querySelector('legend') || wrap.querySelector('label'));
          const label = (labelEl ? labelEl.textContent : key).replace('*', '').trim();
          const shown = field && field.tagName === 'SELECT' && field.selectedOptions[0] ? [field.selectedOptions[0].textContent.trim()] : values;
          lines.push(`${label}: ${shown.join(', ')}`);
        });
        const company = String(data.get('company') || '').trim();
        const subject = encodeURIComponent(company ? `Site assessment request: ${company}` : 'Site assessment request');
        const body = encodeURIComponent(lines.join('\n'));
        window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
        done(true, 'Your email app should now open with your request filled in. Press send to complete it.');
      });
    });
  }

  /* ---------------- Tabs (WAI-ARIA pattern, arrow keys move) ---------------- */
  function initTabs() {
    $$('[data-tabs]').forEach((wrap) => {
      const tabs = $$('[role="tab"]', wrap);
      const select = (tab, focus) => {
        tabs.forEach((t) => {
          const on = t === tab;
          t.setAttribute('aria-selected', String(on));
          t.tabIndex = on ? 0 : -1;
          const panel = document.getElementById(t.getAttribute('aria-controls'));
          if (panel) panel.hidden = !on;
        });
        if (focus) tab.focus();
        wrap.dispatchEvent(new CustomEvent('sig:tab', { detail: { tab } }));
        if (window.ScrollTrigger) window.ScrollTrigger.refresh();
      };
      tabs.forEach((tab, i) => {
        tab.addEventListener('click', () => select(tab));
        tab.addEventListener('keydown', (e) => {
          let next = null;
          if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = tabs[(i + 1) % tabs.length];
          if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = tabs[(i - 1 + tabs.length) % tabs.length];
          if (e.key === 'Home') next = tabs[0];
          if (e.key === 'End') next = tabs[tabs.length - 1];
          if (next) {
            e.preventDefault();
            select(next, true);
          }
        });
      });
    });
  }

  function boot() {
    initTabs();
    initHeader();
    initDropdowns();
    initMobileMenu();
    initClock();
    initLens();
    initBalance();
    initForms();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => fitHudTags());
    else fitHudTags();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
