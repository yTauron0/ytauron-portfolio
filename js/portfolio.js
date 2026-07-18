// ==================================================
// yTauron Portfolio — Bento Grid + Filtros + Lightbox (bilingüe)
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
  } catch (err) {
    console.error('No se pudo cargar data/builds.json:', err);
    const grid = document.getElementById('bentoGrid');
    if (grid) grid.innerHTML = '<p style="color:#a8a8b3">No se pudieron cargar los builds. Revisá data/builds.json</p>';
  }
}

function getVisibleBuilds() {
  return allBuilds.filter(b => {
    if (activeCategory === 'featured') return !!b.featured;
    return b.category === activeCategory;
  });
}

let currentVisibleBuilds = [];
let currentLightboxIndex = -1;

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
      <img src="${build.image}" alt="${title}" loading="lazy">
      <div class="item-overlay">
        <span class="item-category">${catLabel}</span>
        <div class="item-title">${title}</div>
      </div>
    `;
    item.addEventListener('click', () => openLightbox(build));
    grid.appendChild(item);

    setTimeout(() => item.classList.add('visible'), index * 60);
  });

  applyFilter();
}

function applyFilter() {
  const items = document.querySelectorAll('.bento-item');
  items.forEach(item => {
    const matches = activeCategory === 'featured'
      ? item.dataset.featured === 'true'
      : item.dataset.category === activeCategory;
    item.classList.toggle('hidden-by-filter', !matches);
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

function displayInLightbox(build) {
  const l = lang();
  const title = build['title_' + l] || build.title;
  const desc = build['description_' + l] || build.description;

  document.getElementById('lightboxImg').src = build.image;
  document.getElementById('lightboxImg').alt = title;
  document.getElementById('lightboxTitle').textContent = title;

  const coordsEl = document.getElementById('lightboxCoords');
  if (build.coords && build.coords.trim() !== '') {
    coordsEl.textContent = build.coords;
    coordsEl.style.display = '';
  } else {
    coordsEl.textContent = '';
    coordsEl.style.display = 'none';
  }

  document.getElementById('lightboxDesc').textContent = desc;

  const showNav = currentVisibleBuilds.length > 1;
  const prevBtn = document.getElementById('lightboxPrevBtn');
  const nextBtn = document.getElementById('lightboxNextBtn');
  if (prevBtn) prevBtn.style.display = showNav ? 'flex' : 'none';
  if (nextBtn) nextBtn.style.display = showNav ? 'flex' : 'none';
}

function openLightbox(build) {
  currentVisibleBuilds = getVisibleBuilds();
  currentLightboxIndex = currentVisibleBuilds.findIndex(b => b.id === build.id);
  displayInLightbox(build);

  document.getElementById('lightbox').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function navigateLightbox(direction) {
  if (currentVisibleBuilds.length < 2) return;
  currentLightboxIndex = (currentLightboxIndex + direction + currentVisibleBuilds.length) % currentVisibleBuilds.length;
  displayInLightbox(currentVisibleBuilds[currentLightboxIndex]);
}

function closeLightbox() {
  document.getElementById('lightbox').classList.remove('open');
  document.body.style.overflow = '';
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadCategories();
  await loadBuilds();
// ---- Tilt / efecto vidrio al mover el mouse sobre los builds ----
(function bentoTilt() {
  const grid = document.getElementById('bentoGrid');
  if (!grid) return;

  const isCoarse = window.matchMedia('(pointer: coarse)').matches;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (isCoarse || reduceMotion) return; // no molestar en celular / si el usuario prefiere menos movimiento

  const MAX_TILT = 8; // grados de inclinación máxima

  grid.addEventListener('mousemove', (e) => {
    const item = e.target.closest('.bento-item');
    if (!item) return;

    const rect = item.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const px = (x / rect.width) * 100;
    const py = (y / rect.height) * 100;

    const rotateY = ((x / rect.width) - 0.5) * MAX_TILT * 2;
    const rotateX = ((y / rect.height) - 0.5) * -MAX_TILT * 2;

    item.style.setProperty('--mx', `${px}%`);
    item.style.setProperty('--my', `${py}%`);
    item.style.transform = `perspective(700px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.03)`;
    item.classList.add('tilting');
  });

  grid.addEventListener('mouseout', (e) => {
    const item = e.target.closest('.bento-item');
    if (!item) return;
    if (item.contains(e.relatedTarget)) return; // sigue dentro del mismo item, no resetear

    item.style.transform = 'translateY(0)';
    item.classList.remove('tilting');
  });
})();

  document.getElementById('lightboxCloseBtn').addEventListener('click', closeLightbox);
  document.getElementById('lightbox').addEventListener('click', (e) => {
    if (e.target.id === 'lightbox') closeLightbox();
  });
  document.getElementById('lightboxPrevBtn').addEventListener('click', (e) => {
    e.stopPropagation();
    navigateLightbox(-1);
  });
  document.getElementById('lightboxNextBtn').addEventListener('click', (e) => {
    e.stopPropagation();
    navigateLightbox(1);
  });
  document.addEventListener('keydown', (e) => {
    if (!document.getElementById('lightbox').classList.contains('open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') navigateLightbox(-1);
    if (e.key === 'ArrowRight') navigateLightbox(1);
  });
});
