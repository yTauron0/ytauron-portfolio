// ==================================================
// yTauron Portfolio — Sistema de idiomas (ES / EN)
// ==================================================

let currentLang = localStorage.getItem('ytauron_lang') || 'es';
let translations = {};

async function loadTranslations() {
  try {
    const res = await fetch('data/i18n.json');
    translations = await res.json();
  } catch (err) {
    console.error('No se pudo cargar data/i18n.json:', err);
    translations = { es: {}, en: {} };
  }
  applyTranslations();
}

function getText(path, lang = currentLang) {
  const parts = path.split('.');
  let node = translations[lang];
  for (const p of parts) {
    if (!node) return path;
    node = node[p];
  }
  return node || path;
}

function applyTranslations() {
  document.documentElement.lang = currentLang;

  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = getText(el.dataset.i18n);
  });

  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    el.innerHTML = getText(el.dataset.i18nHtml);
  });

  const toggleBtn = document.getElementById('langToggle');
  if (toggleBtn) toggleBtn.textContent = getText('lang_toggle');

  if (typeof renderFilterBar === 'function' && typeof allCategories !== 'undefined' && allCategories.length) {
    renderFilterBar();
  }
  if (typeof renderGrid === 'function' && typeof allBuilds !== 'undefined' && allBuilds.length) {
    renderGrid();
  }
}

function toggleLanguage() {
  currentLang = currentLang === 'es' ? 'en' : 'es';
  localStorage.setItem('ytauron_lang', currentLang);
  applyTranslations();
}

document.addEventListener('DOMContentLoaded', () => {
  loadTranslations();
  const toggleBtn = document.getElementById('langToggle');
  if (toggleBtn) toggleBtn.addEventListener('click', toggleLanguage);
});