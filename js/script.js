// ==================================================
// yTauron Portfolio — script.js
// ==================================================

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
// ---- Intro con saludo bilingüe + pregunta de música + difuminado ----
// La playlist SOLO suena si la persona elige "Sí, con música". La elección se recuerda
// durante la sesión para no repetir la intro (p. ej. al recargar o volver de un proyecto).
(function curtainIntro() {
  const intro = document.getElementById('curtainIntro');
  if (!intro) return;

  let seen = false;
  try { seen = sessionStorage.getItem('ytauron_intro') !== null; } catch (e) {}

  if (reduceMotion || seen) {
    intro.remove();
    return;
  }

  document.body.classList.add('curtain-active');
  if (window.siteScroll) window.siteScroll.stop();

  const es = intro.querySelector('.greeting-es');
  const en = intro.querySelector('.greeting-en');
  const ask = document.getElementById('curtainAsk');
  const yes = document.getElementById('introMusicYes');
  const no = document.getElementById('introMusicNo');

  function choose(wantsMusic) {
    try { sessionStorage.setItem('ytauron_intro', wantsMusic ? 'music' : 'nomusic'); } catch (e) {}

    // El clic de la persona es lo que permite al navegador reproducir audio
    if (wantsMusic && typeof window.startMusic === 'function') window.startMusic();

    ask.classList.remove('show');
    intro.classList.add('fade-out');
    document.body.classList.remove('curtain-active');
    if (window.siteScroll) window.siteScroll.start();
    document.dispatchEvent(new Event('intro:opening'));
    setTimeout(() => { intro.remove(); document.dispatchEvent(new Event('intro:done')); }, 950);
  }

  yes.addEventListener('click', () => choose(true), { once: true });
  no.addEventListener('click', () => choose(false), { once: true });

  function run() {
    // 1. Aparece el saludo en español
    es.classList.add('show');

    // 2. A los 1100ms, se va el español y entra el inglés
    setTimeout(() => {
      es.classList.remove('show');
      es.classList.add('hide');
      en.classList.add('show');
    }, 1100);

    // 3. A los 2200ms, se va el saludo y aparece la pregunta de música
    setTimeout(() => {
      en.classList.remove('show');
      en.classList.add('hide');
      ask.classList.add('show');
      yes.focus({ preventScroll: true });
    }, 2200);
  }

  if (document.readyState === 'complete') {
    run();
  } else {
    window.addEventListener('load', run);
  }
})();

// ---- Title letter-by-letter animation ----
function animateTitle() {
  const el = document.getElementById('title');
  if (!el) return;
  const text = 'yTauron';

  try {
    el.textContent = '';
    text.split('').forEach((ch, i) => {
      const span = document.createElement('span');
      span.textContent = ch;
      span.style.opacity = reduceMotion ? '1' : '0';
      span.style.display = 'inline-block';
      span.style.transition = `opacity 0.5s cubic-bezier(0.16,1,0.3,1) ${i * 0.06}s, transform 0.5s cubic-bezier(0.16,1,0.3,1) ${i * 0.06}s`;
      span.style.transform = reduceMotion ? 'none' : 'translateY(10px)';
      el.appendChild(span);
    });

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        [...el.children].forEach(span => {
          span.style.opacity = '1';
          span.style.transform = 'translateY(0)';
        });
      });
    });

    setTimeout(() => {
      const stillHidden = [...el.children].some(span => span.style.opacity !== '1');
      if (stillHidden) {
        el.textContent = text;
      }
    }, 1500);

  } catch (err) {
    console.error('Fallo la animación del título, mostrando texto plano:', err);
    el.textContent = text;
  }
}

// Con intro, el título se anima justo cuando se abre; sin intro, de inmediato
if (document.getElementById('curtainIntro')) {
  document.addEventListener('intro:opening', animateTitle, { once: true });
} else {
  animateTitle();
}

// (El tema y el fondo del hero ahora los maneja js/themes.js + css/themes.css)
// ---- Parallax del fondo del hero ----
(function heroParallax() {
  const bgA = document.querySelector('.hero-bg-a');
  const bgB = document.querySelector('.hero-bg-b');
  const bgC = document.querySelector('.hero-bg-c');
  if (!bgA || !bgB || reduceMotion) return;

  function update() {
    const y = window.scrollY * 0.35;
    const transform = `translateY(${y}px) scale(1.08)`;
    bgA.style.transform = transform;
    bgB.style.transform = transform;
    if (bgC) bgC.style.transform = transform;
  }

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => { update(); ticking = false; });
      ticking = true;
    }
  }, { passive: true });
  update();
})();

// ---- Particles (embers + petals) ----
(function particles() {
  const canvas = document.getElementById('particles');
  if (!canvas || isCoarsePointer || reduceMotion) return;
  const ctx = canvas.getContext('2d');
  let w, h;

  function resize() {
    w = canvas.width = canvas.offsetWidth;
    h = canvas.height = canvas.offsetHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  const COUNT = 46;
  const particlesArr = Array.from({ length: COUNT }, () => spawn());

  function spawn() {
    const depth = Math.random();
    return {
      x: Math.random() * w,
      y: h + Math.random() * h,
      r: 1 + depth * 2.5,
      speed: 0.15 + depth * 0.5,
      drift: (Math.random() - 0.5) * 0.4,
      opacity: 0.2 + depth * 0.6,
      hue: Math.random() > 0.7 ? '188, 212, 255' : '255, 176, 87'
    };
  }

  let heroVisible = true;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((en) => { heroVisible = en[0].isIntersecting; }, { threshold: 0 }).observe(canvas);
  }

  function tick() {
    if (document.hidden || !heroVisible || canvas.offsetParent === null || document.documentElement.classList.contains('lite')) {
      requestAnimationFrame(tick);
      return;
    }
    ctx.clearRect(0, 0, w, h);
    particlesArr.forEach(p => {
      p.y -= p.speed;
      p.x += p.drift;
      if (p.y < -10) Object.assign(p, spawn(), { y: h + 10 });
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.hue}, ${p.opacity})`;
      ctx.fill();
    });
    requestAnimationFrame(tick);
  }
  tick();
})();

// ---- Discord live profile (Lanyard) ----
const DISCORD_USER_ID = '847591632890363954';

function getDiscordStatusLabel(data) {
  const custom = (data.activities || []).find(a => a.type === 4);
  if (custom && custom.state) return custom.state;
  const labels = { online: 'En línea', idle: 'Ausente', dnd: 'No molestar', offline: 'Desconectado' };
  return labels[data.discord_status] || 'Desconectado';
}

function getDiscordActivityLabel(data) {
  if (data.listening_to_spotify && data.spotify) {
    return `🎵 ${data.spotify.song} — ${data.spotify.artist}`;
  }
  const playing = (data.activities || []).find(a => a.type === 0);
  if (playing && playing.name) {
    return `🎮 Jugando a ${playing.name}`;
  }
  const labels = { online: 'En línea', idle: 'Ausente', dnd: 'No molestar', offline: 'Desconectado' };
  return labels[data.discord_status] || 'Desconectado';
}

async function updateDiscordCard() {
  try {
    const res = await fetch(`https://api.lanyard.rest/v1/users/${DISCORD_USER_ID}`);
    const json = await res.json();
    if (!json.success) return;

    const data = json.data;
    const user = data.discord_user;
    const avatarExt = user.avatar && user.avatar.startsWith('a_') ? 'gif' : 'png';
    const avatarUrl = user.avatar
      ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${avatarExt}?size=128`
      : `https://cdn.discordapp.com/embed/avatars/0.png`;
    const statusClass = 'discord-status-dot ' + (data.discord_status || 'offline');
    const statusLabel = getDiscordStatusLabel(data);

    const bubbleAvatarEl = document.getElementById('discordBubbleAvatar');
    const bubbleDotEl = document.getElementById('discordBubbleStatusDot');
    const bubbleNameEl = document.getElementById('discordBubbleName');
    const statusTextEl = document.getElementById('discordBubbleStatus');
    if (bubbleAvatarEl) bubbleAvatarEl.src = avatarUrl;
    if (bubbleDotEl) bubbleDotEl.className = statusClass;
    if (bubbleNameEl) bubbleNameEl.textContent = user.global_name || user.username;
    if (statusTextEl) statusTextEl.textContent = statusLabel;

    const subAvatarEl = document.getElementById('discordSubcardAvatar');
    const subUserEl = document.getElementById('discordSubcardUsername');
    const subActivityEl = document.getElementById('discordSubcardActivity');
    if (subAvatarEl) subAvatarEl.src = avatarUrl;
    if (subUserEl) subUserEl.textContent = '@' + user.username;
    if (subActivityEl) subActivityEl.textContent = getDiscordActivityLabel(data);

  } catch (err) {
    console.error('No se pudo cargar el perfil de Discord:', err);
  }
}

updateDiscordCard();
setInterval(updateDiscordCard, 60000);

// ---- Visit counter (GoatCounter) ----
fetch('https://ytauron-portfolio.goatcounter.com/counter/TOTAL.json')
  .then(res => res.json())
  .then(data => {
    const el = document.getElementById('visitCount');
    if (el) el.textContent = data.count;
  })
  .catch(err => console.error('No se pudo cargar el contador:', err));

// ---- Reveal on scroll (IntersectionObserver) ----
(function revealOnScroll() {
  const targets = document.querySelectorAll('.reveal, .reveal-stagger');
  if (!targets.length) return;

  if (reduceMotion) {
    targets.forEach(el => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

  targets.forEach(el => observer.observe(el));
})();

// ---- Spotify player: la playlist cambia con el tema; SOLO suena si la persona aceptó ----
let spotifyController = null;
let userWantsMusic = false;
let musicStarted = false;
let playAfterLoad = false;
let loadedUri = null;
let lastPaused = true;       // lo informa Spotify (playback_update)
let nudgeTimer = null;
const FALLBACK_PLAYLIST = 'spotify:playlist:6Xux2xcM7pATKcXVzvfLuI';

window.onSpotifyIframeApiReady = (IFrameAPI) => {
  const element = document.getElementById('musicCard');
  const uri = window.currentPlaylistUri || FALLBACK_PLAYLIST;
  loadedUri = uri;
  IFrameAPI.createController(element, { uri, width: '100%', height: '152' }, (controller) => {
    spotifyController = controller;
    controller.addListener('playback_update', (e) => {
      if (e && e.data) lastPaused = !!e.data.isPaused;
    });
    controller.addListener('ready', () => {
      if (playAfterLoad) { playAfterLoad = false; controller.play(); nudgeIfSilent(); }
    });
    if (userWantsMusic && !musicStarted) {
      controller.play();
      musicStarted = true;
      nudgeIfSilent();
    }
    // Si el tema cambió mientras cargaba la API
    if (window.currentPlaylistUri && window.currentPlaylistUri !== loadedUri) window.setPlaylist(window.currentPlaylistUri);
  });
};

// Spotify a veces no deja arrancar la música desde código. Si pasados unos segundos
// sigue en pausa, se abre el reproductor y el botón 🎵 pulsa: un clic en ▶ lo resuelve.
function nudgeIfSilent() {
  clearTimeout(nudgeTimer);
  nudgeTimer = setTimeout(() => {
    if (userWantsMusic && lastPaused && typeof window.showMusicPanel === 'function') window.showMusicPanel();
  }, 3000);
}

// Lo llama js/themes.js al cambiar de tema
window.setPlaylist = function (uri) {
  if (!uri || uri === loadedUri) return;     // misma playlist: la música sigue sin cortarse
  loadedUri = uri;
  if (!spotifyController) return;            // se usará cuando cargue la API
  playAfterLoad = userWantsMusic && musicStarted;
  spotifyController.loadUri(uri);
  if (playAfterLoad) nudgeIfSilent();
};

// Lo llama la pantalla de bienvenida cuando la persona elige "Sí, con música"
window.startMusic = function () {
  userWantsMusic = true;
  if (spotifyController && !musicStarted) {
    spotifyController.play();
    musicStarted = true;
    nudgeIfSilent();
  }
};

// ---- Botón 🎵: abre y cierra el reproductor (la música sigue sonando cerrado) ----
(function musicToggle() {
  const btn = document.getElementById('musicToggle');
  const wrap = document.getElementById('musicCardWrap');
  if (!btn || !wrap) return;
  function setOpen(open) {
    wrap.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', String(open));
    if (open) btn.classList.remove('attention');
  }
  // Lo usa el plan B de la música: abre el panel y hace pulsar el botón
  window.showMusicPanel = () => { setOpen(true); btn.classList.add('attention'); };
  btn.addEventListener('click', (e) => { e.stopPropagation(); btn.classList.remove('attention'); setOpen(!wrap.classList.contains('open')); });
  document.addEventListener('click', (e) => { if (!wrap.contains(e.target) && e.target !== btn) setOpen(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
})();

// ---- Tarjeta de Discord: viaja del hero al "Add me", se compacta a mitad de camino ----
(function discordFloatingCard() {
  const card = document.getElementById('discordFloatingCard');
  const anchorHero = document.getElementById('discordAnchorHero');
  const anchorAbout = document.getElementById('discordAnchorAbout');
  const aboutSection = document.getElementById('about');
  const nameEl = document.getElementById('discordBubbleName');
  const statusEl = document.getElementById('discordBubbleStatus');
  const subcard = document.getElementById('discordSubcard');
  const addMeBtn = document.getElementById('discordAddMeBtn');

  if (!card || !anchorHero || !anchorAbout || !aboutSection) return;
  if (!card || !anchorHero || !anchorAbout || !aboutSection) return;

  function updateAnchorHeight() {
    document.documentElement.style.setProperty('--discord-anchor-height', `${card.offsetHeight}px`);
  }
  const cardResizeObserver = new ResizeObserver(updateAnchorHeight);
  cardResizeObserver.observe(card);
  updateAnchorHeight();

  if (reduceMotion) {
    const r = anchorHero.getBoundingClientRect();
    card.style.position = 'absolute';
    card.style.left = `${r.left + r.width / 2 + window.scrollX}px`;
    card.style.top = `${r.top + r.height / 2 + window.scrollY}px`;
    return;
  }

  function update() {
    if (document.body.classList.contains('view-project')) return;
    const heroRect = anchorHero.getBoundingClientRect();
    const aboutAnchorRect = anchorAbout.getBoundingClientRect();
    const aboutSectionRect = aboutSection.getBoundingClientRect();

    const startTrigger = window.innerHeight;
    const endTrigger = window.innerHeight * 0.35;
    let progress = (startTrigger - aboutSectionRect.top) / (startTrigger - endTrigger);
    progress = Math.max(0, Math.min(1, progress));

    const startX = heroRect.left + heroRect.width / 2;
    const startY = heroRect.top + heroRect.height / 2;
    const endX = aboutAnchorRect.left + aboutAnchorRect.width / 2;
    const endY = aboutAnchorRect.top + aboutAnchorRect.height / 2;

    const x = startX + (endX - startX) * progress;
    const y = startY + (endY - startY) * progress;

    const bell = Math.sin(progress * Math.PI);
    const minScale = 0.34;
    const scale = 1 - bell * (1 - minScale);

    card.style.left = `${x}px`;
    card.style.top = `${y}px`;
    card.style.transform = `translate(-50%, -50%) scale(${scale})`;

    const contentOpacity = Math.max(0, 1 - bell * 1.6);
    if (nameEl) nameEl.style.opacity = contentOpacity;
    if (statusEl) statusEl.style.opacity = contentOpacity;
    if (subcard) subcard.style.opacity = contentOpacity;

    const addMeOpacity = progress > 0.82 ? Math.min(1, (progress - 0.82) / 0.18) : 0;
    if (addMeBtn) {
      addMeBtn.style.opacity = addMeOpacity;
      addMeBtn.style.pointerEvents = addMeOpacity > 0.5 ? 'auto' : 'none';
    }
  }

  let ticking = false;
  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(() => { update(); ticking = false; });
      ticking = true;
    }
  }

  window.addEventListener('load', update);
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', update);
  update();
})();
// ---- Acordeón de términos y condiciones ----
(function termsAccordion() {
  const btn = document.getElementById('termsToggleBtn');
  const wrap = document.getElementById('termsContentWrap');
  if (!btn || !wrap) return;

  btn.addEventListener('click', () => {
    const isOpen = wrap.classList.toggle('open');
    btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });
})();
// ---- Efecto de tecleo en la frase del hero ----
(function typeTagline() {
  const el = document.getElementById('tagline');
  if (!el || reduceMotion) return;

  const hasIntro = !!document.getElementById('curtainIntro');

  function start() {
    const fullText = el.textContent;
    el.textContent = '';
    el.classList.add('typing');
    let i = 0;
    function step() {
      if (i <= fullText.length) {
        el.textContent = fullText.slice(0, i);
        i++;
        setTimeout(step, 28);
      } else {
        setTimeout(() => el.classList.remove('typing'), 1200);
      }
    }
    step();
  }

  if (hasIntro) document.addEventListener('intro:opening', () => setTimeout(start, 500), { once: true });
  else setTimeout(start, 300);
})();
// ---- Estallido de partículas al hacer click en botones ----
(function buttonBurst() {
  if (reduceMotion) return;

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn');
    if (!btn) return;

    const rect = btn.getBoundingClientRect();
    const originX = e.clientX - rect.left;
    const originY = e.clientY - rect.top;

    for (let i = 0; i < 8; i++) {
      const particle = document.createElement('span');
      particle.className = 'btn-particle';
      const angle = (Math.PI * 2 * i) / 8 + Math.random() * 0.5;
      const distance = 20 + Math.random() * 18;
      particle.style.left = `${originX}px`;
      particle.style.top = `${originY}px`;
      particle.style.setProperty('--px', `${Math.cos(angle) * distance}px`);
      particle.style.setProperty('--py', `${Math.sin(angle) * distance}px`);
      btn.appendChild(particle);
      setTimeout(() => particle.remove(), 600);
    }
  });
})();
