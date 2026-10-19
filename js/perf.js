// ==================================================
// yTauron Portfolio — Modo liviano automático
// Si el equipo es modesto o la página va a menos de ~40 fps, se activa la clase "lite"
// (sin desenfoques ni animaciones de fondo). Probarlo a mano:  ?lite=1  (activar)  ·  ?lite=0  (desactivar)
// ==================================================
(function perf() {
  const root = document.documentElement;
  const KEY = 'ytauron_lite';
  const store = {
    get() { try { return localStorage.getItem(KEY); } catch (e) { return null; } },
    set(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }
  };

  const q = new URLSearchParams(location.search).get('lite');
  if (q === '1' || q === '0') store.set(q);

  const saved = store.get();
  if (saved === '1') { root.classList.add('lite'); return; }
  if (saved === '0') return;

  // Equipos modestos: directo a modo liviano
  const weak = (navigator.deviceMemory && navigator.deviceMemory <= 2) ||
               (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2);
  if (weak) { root.classList.add('lite'); return; }

  // Medición: 1,5 s de fotogramas, unos segundos después de cargar (cuando ya pasó la intro)
  function measure() {
    if (document.hidden) { setTimeout(measure, 2000); return; }
    let frames = 0;
    const start = performance.now();
    function loop(now) {
      frames++;
      if (document.hidden) return;                 // se interrumpe si cambió de pestaña
      if (now - start < 1500) { requestAnimationFrame(loop); return; }
      const fps = frames / ((now - start) / 1000);
      if (fps < 40) root.classList.add('lite');
    }
    requestAnimationFrame(loop);
  }
  window.addEventListener('load', () => setTimeout(measure, 4000));
})();
