// ==================================================
// yTauron Portfolio — Vista de proyecto (preview + más imágenes)
// Se abre DENTRO de index.html (sin recargar) para que la música no se corte.
// URL compartible: index.html?p=ID   ·   Botón "atrás" del navegador funciona.
//
// Campos en data/builds.json:
//   image    → imagen de la tarjeta (y preview por defecto)
//   preview  → (opcional) otra imagen para la parte de arriba de la página
//   gallery  → (opcional) [{ "image": "...", "thumb": "..." }, ...]
//   tags_es / tags_en → (opcional) ["Etiqueta", ...]   ·  commission → true/false
//   hours → (opcional) número de horas   ·  edition → "Java Edition"   ·  modded → true/false
//   subtitle_es / subtitle_en → (opcional) título de la tarjeta lateral
//   inside → (opcional) ["img1.jpg", "img2.jpg"] para la sección "Dentro de..."
// ==================================================
(function projectView() {
  let current = null;
  let savedY = 0;
  let originalTitle = document.title;

  const $ = (id) => document.getElementById(id);
  const lang = () => (typeof currentLang !== 'undefined' ? currentLang : 'es');
  const inProject = () => document.body.classList.contains('view-project');

  function findBuild(id) {
    return (typeof allBuilds !== 'undefined' ? allBuilds : []).find(b => String(b.id) === String(id));
  }

  let items = [];      // [{ src, thumb }] → la imagen principal + la galería
  let active = 0;      // imagen principal seleccionada

  const setText = (id, v) => { const el = $(id); if (el) el.textContent = v; };
  const toggle = (id, show) => { const el = $(id); if (el) el.hidden = !show; };

  function setMain(i) {
    active = i;
    const it = items[i];
    if (!it) return;
    const img = $('projectPreview');
    img.src = it.src;
    document.querySelectorAll('#projectGallery .project-thumb').forEach((t, k) => t.classList.toggle('active', k === i));
  }

  function paragraphs(desc) {
    const list = Array.isArray(desc) ? desc : String(desc || '').split(/\n\s*\n/);
    return list.map(t => String(t).trim()).filter(Boolean);
  }

  function render() {
    const b = current;
    if (!b) return;
    const l = lang();
    const title = b['title_' + l] || b.title || '';
    const desc = b['description_' + l] || b.description || '';
    const cat = (typeof allCategories !== 'undefined' ? allCategories : []).find(c => c.id === b.category);
    const catName = cat ? (cat['label_' + l] || cat.label || cat.id) : (b.category || '');
    const preview = b.preview || b.image;
    const gallery = Array.isArray(b.gallery) ? b.gallery : [];
    const tags = b['tags_' + l] || b.tags || [];

    document.title = `${title} — yTauron`;

    // Encabezado
    setText('crumbCat', catName);
    setText('crumbTitle', title);
    setText('projectTitle', title);
    const chips = $('projectTags');
    chips.innerHTML = '';
    (tags.length ? tags : [catName]).filter(Boolean).forEach(t => {
      const c = document.createElement('span');
      c.className = 'chip';
      c.textContent = t;
      chips.appendChild(c);
    });
    const com = $('projectCommission');
    com.hidden = !b.commission;
    com.textContent = b.commission ? `🔑 ${getText('project.commission')}` : '';

    // Imagen principal + miniaturas
    items = [{ src: preview, thumb: b.thumb || preview }].concat(gallery.map(g => ({ src: g.image, thumb: g.thumb || g.image })));
    $('projectPreview').alt = title;
    const grid = $('projectGallery');
    grid.innerHTML = '';
    items.forEach((it, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'gallery-thumb project-thumb';
      btn.setAttribute('aria-label', `${title} ${i + 1}`);
      const im = document.createElement('img');
      im.src = it.thumb; im.alt = ''; im.loading = 'lazy'; im.decoding = 'async';
      btn.appendChild(im);
      btn.addEventListener('click', () => setMain(i));
      grid.appendChild(btn);
    });
    grid.hidden = items.length < 2;
    setMain(0);

    const open = () => Viewer.open(items.map(it => ({ src: it.src, title })), active);
    $('projectHero').onclick = open;
    $('projectHero').onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } };

    // Tarjeta lateral (solo muestra los datos que cargaste en builds.json)
    setText('sideTitle', b['subtitle_' + l] || b.subtitle || title);
    toggle('hoursRow', b.hours != null && b.hours !== '');
    setText('projectHours', b.hours != null ? `${b.hours} h` : '');
    toggle('editionRow', !!b.edition);
    setText('projectEdition', b.edition || '');
    toggle('moddedRow', typeof b.modded === 'boolean');
    setText('projectModded', b.modded ? getText('project.yes') : getText('project.no'));

    // "Dentro de ..." : texto + 2 imágenes
    const paras = paragraphs(desc);
    const inside = $('projectInside');
    inside.hidden = paras.length === 0 && gallery.length === 0;
    setText('insideTitle', `${getText('project.inside')} ${title}`);
    const body = $('projectDesc');
    body.innerHTML = '';
    paras.forEach(t => { const p = document.createElement('p'); p.textContent = t; body.appendChild(p); });
    const insideSrc = (Array.isArray(b.inside) && b.inside.length ? b.inside : gallery.map(g => g.image)).slice(0, 2);
    const box = $('insideImages');
    box.innerHTML = '';
    insideSrc.forEach(src => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'inside-img';
      const im = document.createElement('img');
      im.src = src; im.alt = title; im.loading = 'lazy'; im.decoding = 'async';
      btn.appendChild(im);
      btn.addEventListener('click', () => {
        const idx = Math.max(0, items.findIndex(it => it.src === src));
        Viewer.open(items.map(it => ({ src: it.src, title })), idx);
      });
      box.appendChild(btn);
    });
    inside.classList.toggle('no-images', insideSrc.length === 0);

    $('projectMore').textContent = `${getText('project.explore')} ${catName.toLowerCase()}`;
  }

  function showView() {
    if (!inProject()) savedY = window.scrollY;
    render();
    document.body.classList.add('view-project');
    $('projectView').hidden = false;
    if (window.siteScroll) { window.siteScroll.lenis && window.siteScroll.lenis.resize(); window.siteScroll.to(0, { immediate: true }); }
    else window.scrollTo(0, 0);
  }

  function hideView(restore) {
    document.body.classList.remove('view-project');
    $('projectView').hidden = true;
    document.title = originalTitle;
    current = null;
    requestAnimationFrame(() => {
      if (window.siteScroll) {
        window.siteScroll.lenis && window.siteScroll.lenis.resize();
        if (restore) window.siteScroll.to(savedY, { immediate: true });
      } else if (restore) window.scrollTo(0, savedY);
      window.dispatchEvent(new Event('resize'));   // recalcula la tarjeta de Discord, etc.
    });
  }

  window.openProject = function (id, { push = true } = {}) {
    const b = findBuild(id);
    if (!b) return false;
    current = b;
    showView();
    if (push) history.pushState({ project: b.id }, '', '?p=' + encodeURIComponent(b.id));
    return true;
  };

  window.closeProject = function ({ silent = false } = {}) {
    if (!inProject()) return;
    if (silent) {
      history.replaceState(null, '', location.pathname);
      hideView(false);
    } else if (history.state && history.state.project !== undefined && !history.state.deep) {
      history.back();                      // popstate cierra la vista
    } else {
      history.replaceState(null, '', location.pathname);
      hideView(true);
    }
  };

  window.addEventListener('popstate', (e) => {
    const st = e.state;
    if (st && st.project !== undefined) {
      const b = findBuild(st.project);
      if (b) { current = b; showView(); }
    } else if (inProject()) {
      hideView(true);
    }
  });

  document.addEventListener('langchange', () => { if (inProject() && current) render(); });

  document.addEventListener('DOMContentLoaded', () => {
    const back = () => window.closeProject();
    ['crumbPortfolio', 'crumbCat', 'projectMore'].forEach(id => { const el = $(id); if (el) el.addEventListener('click', back); });
    const home = $('crumbHome');
    if (home) home.addEventListener('click', () => {
      window.closeProject();
      setTimeout(() => { if (window.siteScroll) window.siteScroll.to(0); else window.scrollTo(0, 0); }, 180);
    });
  });

  // Enlace directo: index.html?p=44
  document.addEventListener('portfolio:ready', () => {
    const id = new URLSearchParams(location.search).get('p');
    if (!id) return;
    const b = findBuild(id);
    if (b) {
      current = b;
      savedY = 0;
      showView();
      history.replaceState({ project: b.id, deep: true }, '', location.search);
    } else {
      history.replaceState(null, '', location.pathname);
    }
  });
})();
