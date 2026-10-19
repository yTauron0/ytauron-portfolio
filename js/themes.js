// ==================================================
// yTauron Portfolio — Temas (selector + playlist por tema)
// Datos en data/themes.json. El tema inicial lo decide el <script> del <head>.
// ==================================================
(function themeManager() {
  const root = document.documentElement;
  const DEFAULT_PLAYLIST = 'spotify:playlist:6Xux2xcM7pATKcXVzvfLuI';
  let themes = [];
  let defaultPlaylist = DEFAULT_PLAYLIST;
  const loadedFonts = new Set();

  const lang = () => (typeof currentLang !== 'undefined' ? currentLang : 'es');

  // Acepta "spotify:playlist:ID", un link de open.spotify.com o solo el ID
  function normalizeSpotify(value) {
    if (!value) return '';
    value = String(value).trim();
    if (value.startsWith('spotify:')) return value;
    const m = value.match(/open\.spotify\.com\/(?:intl-[a-z]+\/)?(playlist|album|artist)\/([A-Za-z0-9]+)/);
    if (m) return `spotify:${m[1]}:${m[2]}`;
    if (/^[A-Za-z0-9]{22}$/.test(value)) return `spotify:playlist:${value}`;
    return '';
  }

  function loadFonts(theme) {
    if (!theme || !theme.fonts || loadedFonts.has(theme.id)) return;
    loadedFonts.add(theme.id);
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = theme.fonts;
    document.head.appendChild(link);
  }

  function playlistFor(theme) {
    return normalizeSpotify(theme && theme.playlist) || normalizeSpotify(defaultPlaylist) || DEFAULT_PLAYLIST;
  }

  function applyPlaylist(theme, { fromUser } = {}) {
    const uri = playlistFor(theme);
    window.currentPlaylistUri = uri;
    if (typeof window.setPlaylist === 'function') window.setPlaylist(uri, { fromUser });
  }

  function current() { return themes.find(t => t.id === root.getAttribute('data-theme')) || themes[0]; }

  function setTheme(id, { fromUser = false } = {}) {
    const theme = themes.find(t => t.id === id);
    if (!theme) return;
    root.setAttribute('data-theme', id);
    try {
      sessionStorage.setItem('ytauron_theme', id);
      if (fromUser) sessionStorage.setItem('ytauron_theme_user', '1');
    } catch (e) {}
    loadFonts(theme);
    applyPlaylist(theme, { fromUser });
    renderPicker();
  }

  function label(t) { return t['label_' + lang()] || t.label_es || t.id; }

  function renderPicker() {
    const menu = document.getElementById('themeMenu');
    const btnLabel = document.getElementById('themeBtnLabel');
    const btn = document.getElementById('themeBtn');
    if (!menu || !themes.length) return;
    const cur = current();
    if (btnLabel) btnLabel.textContent = label(cur);
    if (btn) btn.setAttribute('aria-label', (typeof getText === 'function' ? getText('nav.theme') : 'Tema') + ': ' + label(cur));
    menu.innerHTML = '';
    themes.forEach(t => {
      const li = document.createElement('li');
      li.setAttribute('role', 'none');
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'theme-option';
      b.setAttribute('role', 'option');
      b.setAttribute('aria-selected', String(t.id === cur.id));
      const sw = (t.swatch || ['#222', '#888']);
      b.innerHTML = `<span class="theme-swatch" style="background:linear-gradient(135deg,${sw[0]} 50%,${sw[1]} 50%)"></span><span>${label(t)}</span>`;
      b.addEventListener('click', () => {
        setTheme(t.id, { fromUser: true });
        closeMenu();
      });
      li.appendChild(b);
      menu.appendChild(li);
    });
  }

  function closeMenu() {
    const picker = document.getElementById('themePicker');
    const btn = document.getElementById('themeBtn');
    if (picker) picker.classList.remove('open');
    if (btn) btn.setAttribute('aria-expanded', 'false');
  }

  function bindPicker() {
    const picker = document.getElementById('themePicker');
    const btn = document.getElementById('themeBtn');
    if (!picker || !btn) return;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = picker.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('click', (e) => { if (!picker.contains(e.target)) closeMenu(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });
  }

  async function init() {
    try {
      const res = await fetch('data/themes.json');
      const data = await res.json();
      themes = data.themes || [];
      defaultPlaylist = data.default_playlist || DEFAULT_PLAYLIST;
    } catch (err) {
      console.error('No se pudo cargar data/themes.json:', err);
      return;
    }
    bindPicker();
    const cur = current();
    loadFonts(cur);
    applyPlaylist(cur);
    renderPicker();
  }

  document.addEventListener('langchange', renderPicker);
  document.addEventListener('DOMContentLoaded', init);
  window.siteThemes = { setTheme, normalizeSpotify };
})();
