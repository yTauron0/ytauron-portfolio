// ==================================================
// yTauron Portfolio — Scroll suave con inercia (Lenis, incluido en js/vendor)
// Reemplaza "scroll-behavior: smooth + scroll-snap", que peleaban con la rueda del mouse.
// El scroll sigue siendo el nativo de la página (no se rompe nada que lo escuche).
// ==================================================
(function smoothScroll() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let lenis = null;

  if (typeof Lenis !== 'undefined' && !reduce) {
    lenis = new Lenis({
      lerp: 0.09,            // suavidad: menor = más inercia
      wheelMultiplier: 0.95,
      smoothWheel: true,
      // En pantallas táctiles se deja el scroll nativo (se siente mejor)
      syncTouch: false
    });
    const raf = (time) => { lenis.raf(time); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }

  const api = {
    lenis,
    stop() { lenis ? lenis.stop() : (document.documentElement.style.overflow = 'hidden'); },
    start() { lenis ? lenis.start() : (document.documentElement.style.overflow = ''); },
    to(target, opts = {}) {
      if (lenis) {
        lenis.scrollTo(target, { duration: opts.immediate ? 0 : 1.3, immediate: !!opts.immediate, offset: opts.offset || 0 });
      } else if (typeof target === 'number') {
        window.scrollTo({ top: target, behavior: opts.immediate ? 'auto' : 'smooth' });
      } else {
        target.scrollIntoView({ behavior: opts.immediate ? 'auto' : 'smooth' });
      }
    }
  };
  window.siteScroll = api;

  // Enlaces internos (#about, index.html#portfolio, etc.)
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href*="#"]');
    if (!a || a.target === '_blank') return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || url.pathname !== location.pathname) return;
    const id = decodeURIComponent(url.hash.slice(1));
    if (!id) return;
    const el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();

    const go = () => {
      api.to(id === 'hero' ? 0 : el, {});
      history.replaceState(history.state, '', url.pathname + url.search + url.hash);
    };
    if (document.body.classList.contains('view-project') && typeof window.closeProject === 'function') {
      window.closeProject({ silent: true });
      requestAnimationFrame(() => requestAnimationFrame(go));
    } else {
      go();
    }
  });

  // Si se entra con un #hash, se posiciona cuando ya cargó el contenido
  if (location.hash.length > 1) {
    window.addEventListener('load', () => {
      const el = document.getElementById(decodeURIComponent(location.hash.slice(1)));
      if (el) setTimeout(() => api.to(el, { immediate: true }), 350);
    });
  }
})();

// ---- Protección básica de imágenes (disuade, no impide) ----
(function protectImages() {
  document.addEventListener('contextmenu', (e) => {
    if (e.target.closest('img, .bento-item, .project-hero, .gallery-thumb, .viewer')) e.preventDefault();
  });
  document.addEventListener('dragstart', (e) => {
    if (e.target.tagName === 'IMG') e.preventDefault();
  });
})();
