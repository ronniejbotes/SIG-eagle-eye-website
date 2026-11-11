/**
 * Contact: the lead form.
 * Name, email and phone. site.js sends the form to api/lead.php (form[data-lead-form]),
 * which emails the team. This script only adds the page's own touches:
 * - industry links (?industry=retail) fill the hidden industry field, so the email says
 *   which industry page the visitor came from;
 * - old /contact/#speak links put the cursor in the name field;
 * - the entrance animation.
 */
(() => {
  const SIG = (window.SIG = window.SIG || {});
  const INDUSTRIES = ['manufacturing', 'logistics', 'mining', 'healthcare', 'retail', 'security'];

  function initIndustry() {
    const field = document.querySelector('[data-ct-industry]');
    if (!field) return;
    const wanted = new URLSearchParams(window.location.search).get('industry');
    if (wanted && INDUSTRIES.includes(wanted)) field.value = wanted;
  }

  function initFocus() {
    if (window.location.hash !== '#speak') return;
    const name = document.getElementById('f-name');
    if (name) name.focus({ preventScroll: true });
  }

  function initMotion(gsap) {
    const intro = document.querySelector('[data-ct-intro]');
    if (intro) gsap.from(intro.children, { y: 26, opacity: 0, duration: 0.9, ease: 'power3.out', stagger: 0.06, delay: 0.1 });
    const card = document.querySelector('.ct-card');
    if (card) gsap.from(card, { y: 40, opacity: 0, duration: 1, ease: 'power3.out', delay: 0.3, clearProps: 'transform' });
  }

  function boot() {
    initIndustry();
    initFocus();
    if (SIG.whenMotion) SIG.whenMotion(initMotion);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
