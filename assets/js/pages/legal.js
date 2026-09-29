/**
 * Legal pages: highlight the section being read in the table of contents.
 */
(() => {
  function initToc() {
    const links = Array.from(document.querySelectorAll('[data-toc-link]'));
    const sections = Array.from(document.querySelectorAll('[data-toc-section]'));
    if (!links.length || !('IntersectionObserver' in window)) return;
    const setActive = (id) => links.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === `#${id}`));
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: '-20% 0px -70% 0px' }
    );
    sections.forEach((s) => io.observe(s));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initToc);
  else initToc();
})();
