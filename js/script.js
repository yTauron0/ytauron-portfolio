// ==================================================
// yTauron Portfolio — script.js
// ==================================================

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;

// ---- Title letter-by-letter animation ----
(function animateTitle() {
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
})();

// ---- Ciclo de tema + fondo del hero (cada 20s) ----
(function themeAndBackgroundCycle() {
  const bgA = document.querySelector('.hero-bg-a');
  const bgB = document.querySelector('.hero-bg-b');
  if (!bgA || !bgB || reduceMotion) return;

  const themes = ['city', 'moon', 'sepia'];
  let step = 0;

  function applyStep(i) {
    const theme = themes[i];
    document.documentElement.setAttribute('data-theme', theme);

    // "moon" usa el fondo de la luna; los otros dos reutilizan el de la ciudad
    const showA = theme !== 'moon';
    bgA.style.opacity = showA ? '1' : '0';
    bgB.style.opacity = showA ? '0' : '1';
  }

  applyStep(step);

  setInterval(() => {
    step = (step + 1) % themes.length;
    applyStep(step);
  }, 20000);
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

  function tick() {
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

// ---- Spotify player: autoplay al primer clic ----
let spotifyController = null;
let userWantsMusic = false;
let musicStarted = false;

window.onSpotifyIframeApiReady = (IFrameAPI) => {
  const element = document.getElementById('musicCard');
  const options = {
    uri: 'spotify:playlist:6Xux2xcM7pATKcXVzvfLuI',
    width: '100%',
    height: '152'
  };
  IFrameAPI.createController(element, options, (controller) => {
    spotifyController = controller;
    if (userWantsMusic && !musicStarted) {
      controller.play();
      musicStarted = true;
    }
  });
};

function startMusicOnce() {
  userWantsMusic = true;
  if (spotifyController && !musicStarted) {
    spotifyController.play();
    musicStarted = true;
  }
  document.removeEventListener('click', startMusicOnce);
}

document.addEventListener('click', startMusicOnce, { once: true });

// ---- Expandir el reproductor al llegar al final de la página ----
(function expandPlayerAtBottom() {
  const sentinel = document.getElementById('scrollSentinel');
  const wrap = document.getElementById('musicCardWrap');
  if (!sentinel || !wrap) return;

  function updatePlayerHeightVar() {
    const h = wrap.getBoundingClientRect().height;
    document.documentElement.style.setProperty('--player-height', `${Math.ceil(h)}px`);
  }

  const resizeObserver = new ResizeObserver(updatePlayerHeightVar);
  resizeObserver.observe(wrap);
  updatePlayerHeightVar();

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      wrap.classList.toggle('expanded', entry.isIntersecting);
      setTimeout(updatePlayerHeightVar, 650);
    });
  }, { threshold: 0 });

  observer.observe(sentinel);
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