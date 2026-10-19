// ==================================================
// yTauron Portfolio — Visor de imágenes con zoom
// Rueda: zoom hacia el cursor · Arrastrar: mover · Doble clic/toque: acercar
// Pellizco en celular · Teclado: + − 0 ← → Esc
// Uso: Viewer.open([{ src, title }], indiceInicial)
// ==================================================
(function imageViewer() {
  const MIN = 1, MAX = 8;
  let el, stage, img, countEl, zoomEl, titleEl, hintEl, prevBtn, nextBtn;
  let items = [], idx = 0;
  let s = 1, tx = 0, ty = 0;
  let lastFocus = null;
  const pointers = new Map();
  let drag = null, pinch = null, swipe = null, lastTap = { t: 0, x: 0, y: 0 };

  const tr = (key, fallback) => {
    if (typeof getText !== 'function') return fallback;
    const v = getText(key);
    return v === key ? fallback : v;
  };

  function build() {
    el = document.createElement('div');
    el.className = 'viewer';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.innerHTML = `
      <div class="viewer-top">
        <span class="viewer-count"></span>
        <div class="viewer-tools">
          <button class="viewer-btn" data-act="out" type="button">−</button>
          <span class="viewer-zoom">100%</span>
          <button class="viewer-btn" data-act="in" type="button">+</button>
          <button class="viewer-btn" data-act="fit" type="button">⤢</button>
          <button class="viewer-btn" data-act="close" type="button">✕</button>
        </div>
      </div>
      <div class="viewer-stage">
        <img class="viewer-img" draggable="false" alt="">
        <span class="viewer-watermark">yTauron</span>
      </div>
      <button class="viewer-nav viewer-prev" type="button">‹</button>
      <button class="viewer-nav viewer-next" type="button">›</button>
      <div class="viewer-caption"><strong></strong><span class="viewer-hint"></span></div>`;
    document.body.appendChild(el);

    stage = el.querySelector('.viewer-stage');
    img = el.querySelector('.viewer-img');
    countEl = el.querySelector('.viewer-count');
    zoomEl = el.querySelector('.viewer-zoom');
    titleEl = el.querySelector('.viewer-caption strong');
    hintEl = el.querySelector('.viewer-hint');
    prevBtn = el.querySelector('.viewer-prev');
    nextBtn = el.querySelector('.viewer-next');

    el.querySelector('[data-act="out"]').addEventListener('click', () => zoomAt(s / 1.5, 0, 0, true));
    el.querySelector('[data-act="in"]').addEventListener('click', () => zoomAt(s * 1.5, 0, 0, true));
    el.querySelector('[data-act="fit"]').addEventListener('click', () => zoomAt(1, 0, 0, true));
    el.querySelector('[data-act="close"]').addEventListener('click', close);
    prevBtn.addEventListener('click', () => step(-1));
    nextBtn.addEventListener('click', () => step(1));

    stage.addEventListener('wheel', onWheel, { passive: false });
    stage.addEventListener('pointerdown', onDown);
    stage.addEventListener('pointermove', onMove);
    stage.addEventListener('pointerup', onUp);
    stage.addEventListener('pointercancel', onUp);
    stage.addEventListener('dblclick', (e) => { if (e.pointerType !== 'touch') toggleZoom(e); });
    window.addEventListener('resize', () => { if (el.classList.contains('open')) apply(false); });
    document.addEventListener('keydown', onKey);
  }

  const point = (e) => {
    const r = stage.getBoundingClientRect();
    return { x: e.clientX - r.left - r.width / 2, y: e.clientY - r.top - r.height / 2 };
  };

  function clampPan() {
    const mx = Math.max(0, (img.offsetWidth * s - stage.clientWidth) / 2);
    const my = Math.max(0, (img.offsetHeight * s - stage.clientHeight) / 2);
    tx = Math.min(mx, Math.max(-mx, tx));
    ty = Math.min(my, Math.max(-my, ty));
  }

  function apply(animate) {
    clampPan();
    img.classList.toggle('animating', !!animate);
    img.style.transform = `translate(${tx}px, ${ty}px) scale(${s})`;
    zoomEl.textContent = Math.round(s * 100) + '%';
    stage.classList.toggle('zoomed', s > 1.001);
  }

  // Zoom manteniendo fijo el punto (cx, cy) medido desde el centro del visor
  function zoomAt(newS, cx, cy, animate) {
    newS = Math.min(MAX, Math.max(MIN, newS));
    const k = newS / s;
    tx = cx - (cx - tx) * k;
    ty = cy - (cy - ty) * k;
    s = newS;
    if (s <= 1.001) { s = 1; tx = 0; ty = 0; }
    apply(animate);
  }

  function toggleZoom(e) {
    const p = point(e);
    zoomAt(s > 1.05 ? 1 : 2.8, p.x, p.y, true);
  }

  function onWheel(e) {
    e.preventDefault();
    const p = point(e);
    const delta = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
    zoomAt(s * Math.exp(-delta * (e.ctrlKey ? 0.012 : 0.0018)), p.x, p.y, false);
  }

  function onDown(e) {
    stage.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    img.classList.remove('animating');
    if (pointers.size === 1) {
      drag = { x: e.clientX, y: e.clientY, tx0: tx, ty0: ty };
      swipe = { x: e.clientX, y: e.clientY, moved: 0 };
      stage.classList.add('dragging');
    } else if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      const r = stage.getBoundingClientRect();
      pinch = {
        d0: Math.hypot(a.x - b.x, a.y - b.y) || 1,
        s0: s, tx0: tx, ty0: ty,
        cx0: (a.x + b.x) / 2 - r.left - r.width / 2,
        cy0: (a.y + b.y) / 2 - r.top - r.height / 2
      };
      drag = null;
    }
  }

  function onMove(e) {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch && pointers.size >= 2) {
      const [a, b] = [...pointers.values()];
      const r = stage.getBoundingClientRect();
      const cx = (a.x + b.x) / 2 - r.left - r.width / 2;
      const cy = (a.y + b.y) / 2 - r.top - r.height / 2;
      const newS = Math.min(MAX, Math.max(MIN, pinch.s0 * (Math.hypot(a.x - b.x, a.y - b.y) / pinch.d0)));
      const k = newS / pinch.s0;
      tx = cx - (pinch.cx0 - pinch.tx0) * k;
      ty = cy - (pinch.cy0 - pinch.ty0) * k;
      s = newS;
      apply(false);
    } else if (drag && s > 1.001) {
      tx = drag.tx0 + (e.clientX - drag.x);
      ty = drag.ty0 + (e.clientY - drag.y);
      apply(false);
    }
    if (swipe) swipe.moved = Math.max(swipe.moved, Math.hypot(e.clientX - swipe.x, e.clientY - swipe.y));
  }

  function onUp(e) {
    const wasSingle = pointers.size === 1;
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinch = null;
    if (pointers.size === 0) {
      stage.classList.remove('dragging');
      if (wasSingle && swipe && e.pointerType === 'touch') {
        const dx = e.clientX - swipe.x, dy = e.clientY - swipe.y;
        if (s <= 1.001 && Math.abs(dx) > 60 && Math.abs(dy) < 90) step(dx < 0 ? 1 : -1);
        else if (swipe.moved < 10) {            // doble toque
          const now = Date.now();
          if (now - lastTap.t < 320 && Math.hypot(e.clientX - lastTap.x, e.clientY - lastTap.y) < 30) { toggleZoom(e); lastTap.t = 0; }
          else lastTap = { t: now, x: e.clientX, y: e.clientY };
        }
      }
      drag = null; swipe = null;
    } else if (pointers.size === 1) {
      const [p] = [...pointers.values()];
      drag = { x: p.x, y: p.y, tx0: tx, ty0: ty };
    }
  }

  function onKey(e) {
    if (!el || !el.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') step(-1);
    else if (e.key === 'ArrowRight') step(1);
    else if (e.key === '+' || e.key === '=') zoomAt(s * 1.4, 0, 0, true);
    else if (e.key === '-' || e.key === '_') zoomAt(s / 1.4, 0, 0, true);
    else if (e.key === '0') zoomAt(1, 0, 0, true);
  }

  function show() {
    const it = items[idx];
    s = 1; tx = 0; ty = 0;
    img.classList.remove('animating');
    img.style.transform = '';
    zoomEl.textContent = '100%';
    stage.classList.remove('zoomed');
    img.src = it.src;
    img.alt = it.title || '';
    titleEl.textContent = it.title || '';
    countEl.textContent = items.length > 1 ? `${idx + 1} / ${items.length}` : '';
    const multi = items.length > 1;
    prevBtn.style.display = nextBtn.style.display = multi ? '' : 'none';
    hintEl.textContent = tr('viewer.hint', 'Rueda: zoom · Arrastrá para mover · Doble clic: acercar');
    [-1, 1].forEach(d => { const n = items[(idx + d + items.length) % items.length]; if (n && n.src !== it.src) new Image().src = n.src; });
  }

  function step(d) {
    if (items.length < 2) return;
    idx = (idx + d + items.length) % items.length;
    show();
  }

  function open(list, index = 0) {
    if (!list || !list.length) return;
    if (!el) build();
    items = list; idx = Math.max(0, Math.min(list.length - 1, index));
    lastFocus = document.activeElement;
    show();
    el.querySelector('[data-act="in"]').setAttribute('aria-label', tr('viewer.zoom_in', 'Acercar'));
    el.querySelector('[data-act="out"]').setAttribute('aria-label', tr('viewer.zoom_out', 'Alejar'));
    el.querySelector('[data-act="fit"]').setAttribute('aria-label', tr('viewer.reset', 'Restablecer'));
    el.querySelector('[data-act="close"]').setAttribute('aria-label', tr('viewer.close', 'Cerrar'));
    prevBtn.setAttribute('aria-label', tr('viewer.prev', 'Anterior'));
    nextBtn.setAttribute('aria-label', tr('viewer.next', 'Siguiente'));
    el.classList.add('open');
    if (window.siteScroll) window.siteScroll.stop();
    el.querySelector('[data-act="close"]').focus({ preventScroll: true });
  }

  function close() {
    if (!el) return;
    el.classList.remove('open');
    pointers.clear(); drag = pinch = swipe = null;
    if (window.siteScroll) window.siteScroll.start();
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }

  window.Viewer = { open, close };
})();
