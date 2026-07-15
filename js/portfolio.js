// ==================================================
// yTauron Portfolio — Bento Grid + Filtros + Lightbox (bilingüe)
// ==================================================

let allBuilds = [];
let allCategories = [];
let activeCategory = 'all';

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
  const allLabel = (typeof getText === 'function') ? getText('portfolio.filter_all') : 'Todos';

  const allBtn = document.createElement('button');
  allBtn.className = 'filter-btn' + (activeCategory === 'all' ? ' active' : '');
  allBtn.dataset.filter = 'all';
  allBtn.textContent = allLabel;
  bar.appendChild(allBtn);

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
    item.innerHTML = `
      <img src="${build.image}" alt="${title}" loading="lazy">
      <div class="item-overlay">
        <span class="item-category">${catLabel}</span>
        <div class="item-title">${title}</div>
      </div>
    `;
    item.addEventListener('click', () => openLightbox(build, catLabel, title, desc));
    grid.appendChild(item);

    setTimeout(() => item.classList.add('visible'), index * 60);
  });

  applyFilter();
}

function applyFilter() {
  const items = document.querySelectorAll('.bento-item');
  items.forEach(item => {
    const matches = activeCategory === 'all' || item.dataset.category === activeCategory;
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

function openLightbox(build, catLabel, title, desc) {
  const lightbox = document.getElementById('lightbox');
  document.getElementById('lightboxImg').src = build.image;
  document.getElementById('lightboxImg').alt = title;
  document.getElementById('lightboxTitle').textContent = title;
  document.getElementById('lightboxCoords').textContent = build.coords;
  document.getElementById('lightboxDesc').textContent = desc;
  lightbox.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  document.getElementById('lightbox').classList.remove('open');
  document.body.style.overflow = '';
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadCategories();
  await loadBuilds();

  document.getElementById('lightboxCloseBtn').addEventListener('click', closeLightbox);
  document.getElementById('lightbox').addEventListener('click', (e) => {
    if (e.target.id === 'lightbox') closeLightbox();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLightbox();
  });
});