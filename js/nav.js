// ==================================================
// yTauron Portfolio — Navbar (fondo al scrollear, menú móvil, sección activa)
// ==================================================
(function navbar() {
  const nav = document.getElementById('siteNav');
  if (!nav) return;

  const burger = document.getElementById('navBurger');
  const links = [...nav.querySelectorAll('.nav-links a[data-nav]')];

  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 24);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  function setMenu(open) {
    nav.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', String(open));
  }
  burger.addEventListener('click', () => setMenu(!nav.classList.contains('menu-open')));
  nav.querySelectorAll('.nav-links a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  function setActive(name) {
    links.forEach(a => a.classList.toggle('active', a.dataset.nav === name));
  }

  // Sección visible (scrollspy)
  const spy = new IntersectionObserver((entries) => {
    if (document.body.classList.contains('view-project')) return;
    entries.forEach(entry => { if (entry.isIntersecting) setActive(entry.target.id); });
  }, { rootMargin: '-45% 0px -50% 0px' });
  links.forEach(a => { const s = document.getElementById(a.dataset.nav); if (s) spy.observe(s); });

  // Dentro de un proyecto, "Portfolio" queda marcado
  new MutationObserver(() => {
    if (document.body.classList.contains('view-project')) setActive('portfolio');
  }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
})();
