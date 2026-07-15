// ==================================================
// yTauron Portfolio — script.js
// ==================================================

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;

// ---- Title letter-by-letter animation ----
(function animateTitle() {
  const el = document.getElementById('title');
  const text = 'yTauron';
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
})();

// ---- Hero background crossfade every 20s ----
(function heroCrossfade() {
  const bgA = document.querySelector('.hero-bg-a');
  const bgB = document.querySelector('.hero-bg-b');
  if (!bgA || !bgB || reduceMotion) return;

  let showingA = true;
  setInterval(() => {
    showingA = !showingA;
    bgA.style.opacity = showingA ? '1' : '0';
    bgB.style.opacity = showingA ? '0' : '1';
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

    const avatarEl = document.getElementById('discordAvatar');
    const nameEl = document.getElementById('discordName');
    const dotEl = document.getElementById('discordStatusDot');

    if (avatarEl) avatarEl.src = avatarUrl;
    if (nameEl) nameEl.textContent = user.global_name || user.username;
    if (dotEl) dotEl.className = 'discord-status-dot ' + (data.discord_status || 'offline');
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
// ---- Spotify player con autoplay al primer clic del usuario ----
let spotifyController = null;

window.onSpotifyIframeApiReady = (IFrameAPI) => {
  const element = document.getElementById('musicCard');
  const options = {
    uri: 'spotify:playlist:6Xux2xcM7pATKcXVzvfLuI',
    width: '100%',
    height: '152'
  };
  IFrameAPI.createController(element, options, (controller) => {
    spotifyController = controller;
  });
};

function startMusicOnce() {
  if (spotifyController) {
    spotifyController.play();
  }
  document.removeEventListener('click', startMusicOnce);
}

document.addEventListener('click', startMusicOnce, { once: true });