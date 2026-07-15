// título letra por letra
const title = document.getElementById('title');
const word = "yTauron";
[...word].forEach((ch,i)=>{
  const s = document.createElement('span');
  s.textContent = ch;
  s.style.animationDelay = (0.15 + i*0.06)+'s';
  title.appendChild(s);
});

// partículas: brasas + pétalos
const pc = document.getElementById('particles');
const ctx = pc.getContext('2d');
function sizeCanvas(){ pc.width = window.innerWidth; pc.height = window.innerHeight; }
sizeCanvas();
window.addEventListener('resize', sizeCanvas);

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const N = reduceMotion ? 0 : 40;
const parts = Array.from({length:N}, ()=>{
  const depth = Math.random();
  const isPetal = Math.random() > 0.55;
  return {
    x: Math.random()*pc.width, y: Math.random()*pc.height, depth,
    r: isPetal ? (2.2+depth*3.5) : (1+depth*2.2),
    vy: -(0.12+depth*0.35), vx: (Math.random()-0.5)*0.25,
    sway: Math.random()*Math.PI*2, isPetal,
    hue: isPetal ? '255,176,120' : '255,209,140'
  };
});
function tick(){
  ctx.clearRect(0,0,pc.width,pc.height);
  parts.forEach(p=>{
    p.sway += 0.01;
    p.x += p.vx + Math.sin(p.sway)*0.15;
    p.y += p.vy;
    if(p.y < -10){ p.y = pc.height+10; p.x = Math.random()*pc.width; }
    const alpha = 0.15 + p.depth*0.5;
    ctx.beginPath();
    ctx.fillStyle = `rgba(${p.hue},${alpha})`;
    if(p.isPetal){ ctx.ellipse(p.x,p.y,p.r,p.r*0.6,p.sway,0,7); } else { ctx.arc(p.x,p.y,p.r,0,7); }
    ctx.fill();
  });
  requestAnimationFrame(tick);
}
tick();

// ---- PLAYLIST: "The Boy Is Mine" siempre arranca primero ----
const playlist = [
  { title: "Brandy & Monica — The Boy Is Mine", src: "assets/audio/01-the-boy-is-mine.mp3" },
  { title: "Mariah Carey — My All", src: "assets/audio/02-my-all.mp3" },
  { title: "Chrystal — The Days", src: "assets/audio/03-the-days.mp3" },
  { title: "Britney Spears — Gimme More", src: "assets/audio/04-gimme-more.mp3" },
  { title: "Kreisler/Rachmaninoff — Love's Sorrow", src: "assets/audio/05-loves-sorrow.mp3" }
];

let trackIndex = 0;
const audio = document.getElementById('audioPlayer');
const playBtn = document.getElementById('playBtn');
const trackLabel = document.getElementById('playerTrack');
const volumeSlider = document.getElementById('volumeSlider');

function loadTrack(i){
  trackIndex = i;
  audio.src = playlist[trackIndex].src;
  trackLabel.textContent = playlist[trackIndex].title;
}
function playTrack(){ audio.play().catch(()=>{}); playBtn.textContent = "⏸"; }
function pauseTrack(){ audio.pause(); playBtn.textContent = "▶"; }

loadTrack(0);
audio.volume = 0.5;

playBtn.addEventListener('click', ()=>{
  if(audio.paused){ playTrack(); } else { pauseTrack(); }
});
document.getElementById('nextBtn').addEventListener('click', ()=>{
  loadTrack((trackIndex+1) % playlist.length);
  playTrack();
});
document.getElementById('prevBtn').addEventListener('click', ()=>{
  loadTrack((trackIndex-1+playlist.length) % playlist.length);
  playTrack();
});
audio.addEventListener('ended', ()=>{
  loadTrack((trackIndex+1) % playlist.length);
  playTrack();
});
volumeSlider.addEventListener('input', (e)=>{ audio.volume = e.target.value; });

// ---- rotación de fondos cada 20s ----
const bgA = document.querySelector('.hero-bg-a');
const bgB = document.querySelector('.hero-bg-b');
let showingA = true;
setInterval(()=>{
  showingA = !showingA;
  bgA.style.opacity = showingA ? 1 : 0;
  bgB.style.opacity = showingA ? 0 : 1;
}, 20000);