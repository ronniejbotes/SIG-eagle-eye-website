/**
 * For employees: myth and fact cards, the questions checklist, sharing.
 */
(() => {
  const SIG = (window.SIG = window.SIG || {});

  function initFlips() {
    document.querySelectorAll('[data-flip]').forEach((card) => {
      card.addEventListener('click', () => {
        card.setAttribute('aria-pressed', String(card.getAttribute('aria-pressed') !== 'true'));
      });
    });
  }

  /* Clipboard with a fallback for older browsers and non-secure previews. */
  async function copyText(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (e) {
      /* fall through to the fallback */
    }
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.cssText = 'position:fixed;top:-1000px;opacity:0';
    document.body.appendChild(area);
    area.select();
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch (e) {
      ok = false;
    }
    area.remove();
    return ok;
  }

  function initAsk() {
    const box = document.querySelector('[data-ask]');
    if (!box) return;
    const list = box.querySelector('[data-ask-list]');
    const status = box.querySelector('[data-ask-status]');
    const copyBtn = box.querySelector('[data-ask-copy]');
    const printBtn = box.querySelector('[data-ask-print]');
    const say = (msg) => {
      status.textContent = msg;
    };

    copyBtn.addEventListener('click', async () => {
      const items = Array.from(list.children).map((li, i) => `${i + 1}. ${li.textContent.trim()}`);
      const text = `Questions to ask about workplace monitoring (SIG Eagle Eye)\n\n${items.join('\n')}\n\n${window.location.href}`;
      const ok = await copyText(text);
      say(ok ? 'Copied. Paste them into a message or an email.' : 'Copying is blocked in this browser. Select the questions and copy them instead.');
    });

    printBtn.addEventListener('click', () => {
      const root = document.documentElement;
      root.classList.add('print-ask');
      const done = () => {
        root.classList.remove('print-ask');
        window.removeEventListener('afterprint', done);
      };
      window.addEventListener('afterprint', done);
      window.print();
      setTimeout(done, 1000);
    });
  }

  function initShare() {
    const btn = document.querySelector('[data-share]');
    if (!btn) return;
    const label = btn.textContent;
    btn.addEventListener('click', async () => {
      const data = { title: document.title, text: 'What SIG Eagle Eye means for you at work', url: window.location.href.split('#')[0] };
      if (navigator.share) {
        try {
          await navigator.share(data);
          return;
        } catch (e) {
          if (e && e.name === 'AbortError') return;
        }
      }
      const ok = await copyText(data.url);
      btn.textContent = ok ? 'Link copied' : label;
      setTimeout(() => (btn.textContent = label), 2400);
    });
  }

  function initMotion(gsap) {
    const copy = document.querySelector('[data-emp-copy]');
    if (copy) gsap.from(copy.children, { y: 30, opacity: 0, duration: 1, ease: 'power3.out', stagger: 0.08, delay: 0.1 });
    const quote = document.querySelector('.emp-hero__quote');
    if (quote) gsap.from(quote, { y: 24, opacity: 0, duration: 0.9, ease: 'power3.out', delay: 0.8 });
  }

  function boot() {
    initFlips();
    initAsk();
    initShare();
    if (SIG.whenMotion) SIG.whenMotion(initMotion);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
