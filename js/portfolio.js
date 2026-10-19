// ==================================================
// yTauron Portfolio — Bento Grid + Filtros (bilingüe)
// ==================================================

let allBuilds = [];
let allCategories = [];
let activeCategory = 'featured';

function lang() {
  return typeof currentLang !== 'undefined' ? currentLang : 'es';
}

async function loadCategories() {
  try {
    const res = await fetch('data/categories.json');
    allCategories = await res.json();
  } catch (err) {
    console.error('No se pudo cargar data/categories.json:', err);
    allCategories = [];
  }
  renderFilterBar();
}

function renderFilterBar() {
  const bar = document.getElementById('filterBar');
  if (!bar) return;
  bar.innerHTML = '';

  const l = lang();
  const featuredLabel = (typeof getText === 'function') ? getText('portfolio.filter_featured') : 'Destacados';

  const featuredBtn = document.createElement('button');
  featuredBtn.className = 'filter-btn' + (activeCategory === 'featured' ? ' active' : '');
  featuredBtn.dataset.filter = 'featured';
  featuredBtn.textContent = featuredLabel;
  bar.appendChild(featuredBtn);

  allCategories.forEach(cat => {
    const label = cat['label_' + l] || cat.label || cat.id;
    const desc = cat['description_' + l] || cat.description || '';
    const btn = document.createElement('button');
    btn.className = 'filter-btn' + (activeCategory === cat.id ? ' active' : '');
    btn.dataset.filter = cat.id;
    btn.textContent = `${cat.icon} ${label}`;
    btn.title = desc;
    bar.appendChild(btn);
  });

  setupFilters();
}

async function loadBuilds() {
  try {
    const res = await fetch('data/builds.json');
    allBuilds = await res.json();
    renderGrid();
    updateBuildsCounter();
  } catch (err) {
    console.error('No se pudo cargar data/builds.json:', err);
    const grid = document.getElementById('bentoGrid');
    if (grid) grid.innerHTML = '<p style="color:#a8a8b3">No se pudieron cargar los builds. Revisá data/builds.json</p>';
  }
}

function renderGrid() {
  const grid = document.getElementById('bentoGrid');
  if (!grid) return;
  grid.innerHTML = '';

  const l = lang();

  allBuilds.forEach((build, index) => {
    const catInfo = allCategories.find(c => c.id === build.category);
    const catLabel = catInfo ? (catInfo['label_' + l] || catInfo.label) : build.category;
    const title = build['title_' + l] || build.title;
    const desc = build['description_' + l] || build.description;

    const item = document.createElement('div');
    item.className = `bento-item size-${build.size}`;
    item.dataset.category = build.category;
    item.dataset.featured = build.featured ? 'true' : 'false';
    item.innerHTML = `
      <img src="${build.thumb || build.image}" alt="${title}" loading="lazy">
      <div class="item-overlay">
        <span class="item-category">${catLabel}</span>
        <div class="item-title">${title}</div>
      </div>
    `;
    item.classList.add('hidden-by-filter', 'filtered-out');
    const extra = Array.isArray(build.gallery) ? build.gallery.length : 0;
    if (extra > 0) {
      const badge = document.createElement('span');
      badge.className = 'item-gallery-badge';
      badge.textContent = '🖼 +' + extra;
      item.appendChild(badge);
    }
    // Cada build abre su propia página (dentro de la misma web, así la música no se corta)
    item.tabIndex = 0;
    item.setAttribute('role', 'link');
    item.addEventListener('click', () => { if (window.openProject) window.openProject(build.id); });
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (window.openProject) window.openProject(build.id); }
    });
    grid.appendChild(item);

    setTimeout(() => item.classList.add('visible'), index * 60);
  });

  applyFilter();
}

function updateBuildsCounter() {
  const el = document.getElementById('buildsCounter');
  if (!el) return;
  const target = allBuilds.length;
  let current = 0;
  const step = Math.max(1, Math.ceil(target / 30));
  const interval = setInterval(() => {
    current += step;
    if (current >= target) { current = target; clearInterval(interval); }
    el.textContent = current;
  }, 30);
}

function applyFilter() {
  const items = Array.from(document.querySelectorAll('.bento-item'));
  const FADE_DURATION = 400;

  items.forEach(item => {
    const matches = activeCategory === 'featured'
      ? item.dataset.featured === 'true'
      : item.dataset.category === activeCategory;

    const wasVisible = !item.classList.contains('hidden-by-filter');

    if (matches && !wasVisible) {
      // Entra: primero lo devolvemos al flujo del grid, ocultando aún la opacidad
      item.classList.remove('filtered-out');
      item.style.transitionDelay = '0ms';
      // Forzamos un reflow para que el navegador registre el estado "oculto" antes de animar
      void item.offsetWidth;
      requestAnimationFrame(() => {
        item.classList.remove('hidden-by-filter');
      });
    } else if (!matches && wasVisible) {
      // Sale: se desvanece, y recién después de terminar la animación lo sacamos del flujo
      item.classList.add('hidden-by-filter');
      setTimeout(() => {
        item.classList.add('filtered-out');
      }, FADE_DURATION);
    }
  });

  const empty = document.getElementById('gridEmpty');
  if (empty) empty.hidden = items.some(item => (activeCategory === 'featured'
    ? item.dataset.featured === 'true'
    : item.dataset.category === activeCategory));

  // Escalonado sutil solo entre los que están entrando
  let visibleIndex = 0;
  items.forEach(item => {
    const matches = activeCategory === 'featured'
      ? item.dataset.featured === 'true'
      : item.dataset.category === activeCategory;
    if (matches) {
      item.style.transitionDelay = `${visibleIndex * 40}ms`;
      visibleIndex++;
    }
  });
}

function setupFilters() {
  const buttons = document.querySelectorAll('.filter-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeCategory = btn.dataset.filter;
      applyFilter();
    });
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadCategories();
  await loadBuilds();
  document.dispatchEvent(new Event('portfolio:ready'));
// ---- Tilt / efecto vidrio al mover el mouse sobre los builds ----
(function bentoTilt() {
  const grid = document.getElementById('bentoGrid');
  if (!grid) return;

  const isCoarse = window.matchMedia('(pointer: coarse)').matches;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (isCoarse || reduceMotion) return;

  const MAX_TILT = 8;
  let currentItem = null;
  let pendingEvent = null;
  let ticking = false;

  function applyTilt() {
    ticking = false;
    if (!currentItem || !pendingEvent) return;

    const rect = currentItem.getBoundingClientRect();
    const x = pendingEvent.clientX - rect.left;
    const y = pendingEvent.clientY - rect.top;

    const px = (x / rect.width) * 100;
    const py = (y / rect.height) * 100;
    const rotateY = ((x / rect.width) - 0.5) * MAX_TILT * 2;
    const rotateX = ((y / rect.height) - 0.5) * -MAX_TILT * 2;

    currentItem.style.setProperty('--mx', `${px}%`);
    currentItem.style.setProperty('--my', `${py}%`);
    currentItem.style.setProperty('--rx', `${rotateX}deg`);
    currentItem.style.setProperty('--ry', `${rotateY}deg`);
    currentItem.style.setProperty('--tilt-scale', '1.03');
  }

  function resetItem(item) {
    if (!item) return;
    item.classList.remove('tilting');
    item.style.setProperty('--rx', '0deg');
    item.style.setProperty('--ry', '0deg');
    item.style.setProperty('--tilt-scale', '1');
  }

  grid.addEventListener('mousemove', (e) => {
    const item = e.target.closest('.bento-item');
    if (!item) return;

    if (item !== currentItem) {
      if (currentItem) resetItem(currentItem);
      currentItem = item;
      currentItem.classList.add('tilting');
    }

    pendingEvent = e;
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(applyTilt);
    }
  });

  grid.addEventListener('mouseleave', () => {
    if (currentItem) resetItem(currentItem);
    currentItem = null;
    pendingEvent = null;
  });

  // Red de seguridad: si el mouse sale de la ventana del navegador de golpe
  window.addEventListener('blur', () => {
    if (currentItem) resetItem(currentItem);
    currentItem = null;
  });
})();

});
