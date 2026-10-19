// ==================================================
// yTauron Portfolio — Sonidos de interfaz (botón 🔊 en la barra)
// ==================================================
(function buttonSound() {
  const toggleBtn = document.getElementById('soundToggle');
  if (!toggleBtn) return;

  let muted = localStorage.getItem('ytauron_sound_muted') === 'true';
  let audioCtx = null;

  function updateIcon() {
    toggleBtn.textContent = muted ? '🔇' : '🔊';
  }
  updateIcon();

  function playClick() {
    if (muted) return;
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(720, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(280, audioCtx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.09);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
  }

  toggleBtn.addEventListener('click', () => {
    muted = !muted;
    localStorage.setItem('ytauron_sound_muted', muted);
    updateIcon();
  });

  document.addEventListener('click', (e) => {
    if (e.target.closest('.btn') || e.target.closest('.filter-btn')) {
      playClick();
    }
  });
})();