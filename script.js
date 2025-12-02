/* ====== Utilities ====== */
const $ = sel => document.querySelector(sel);
const $days = $('#days'), $hours = $('#hours'), $minutes = $('#minutes'), $seconds = $('#seconds');
const $start = $('#startBtn'), $reset = $('#resetBtn'), $input = $('#targetInput');
const $message = $('#message'), $popper = $('#popper'), $celebrate = $('#celebrate');
const $overlay = $('#overlay'); // оверлей

/* ====== Robust default target (next Jan 1) ====== */
function defaultTarget(){
  const now = new Date();
  const year = now.getFullYear();
  const candidate = new Date(year + 1, 0, 1, 0, 0, 0); // Всегда 1 января СЛЕДУЮЩЕГО года
  return candidate;
}

/* Prefill input in local format YYYY-MM-DDTHH:MM */
function prefillInputWith(date){
  const dt = new Date(date);
  const pad = n => String(n).padStart(2, '0');
  $input.value = `${dt.getFullYear()}-${pad(dt.getMonth()+1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
}

/* ====== Countdown ====== */
let timerId = null;
let celebrating = false;

function updateCountdown(target){
  const now = new Date();
  let diff = target - now;
  if (diff < 0) diff = 0;

  const sec = Math.floor(diff / 1000) % 60;
  const min = Math.floor(diff / 60000) % 60;
  const hrs = Math.floor(diff / 3600000) % 24;
  const days = Math.floor(diff / 86400000);

  $days.textContent = days;
  $hours.textContent = String(hrs).padStart(2, '0');
  $minutes.textContent = String(min).padStart(2, '0');
  $seconds.textContent = String(sec).padStart(2, '0');

  if (diff <= 0 && !celebrating) triggerCelebration();
}

function startTimer(target){
  stopTimer();
  updateCountdown(target);
  timerId = setInterval(()=> updateCountdown(target), 250);
}

function stopTimer(){
  if (timerId) { clearInterval(timerId); timerId = null; }
}

/* ====== Confetti engine (improved) ====== */
const canvas = $('#confettiCanvas');
const ctx = canvas.getContext('2d');
let particles = [];

function resizeCanvas(){
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function rand(a,b){ return Math.random() * (b - a) + a; }

function createParticles(count=150, origin){
  const colors = ['#7c5cff','#2dd4bf','#ffd166','#ff6b6b','#9be15d','#ffb3e6'];
  const shapes = ['rect','circle','triangle'];
  const cx = origin ? origin.x : window.innerWidth / 2;
  const cy = origin ? origin.y : window.innerHeight / 3;
  for (let i = 0; i < count; i++){
    particles.push({
      x: cx + rand(-120, 120),
      y: cy + rand(-60, 60),
      vx: rand(-8, 8),
      vy: rand(-6, 6),
      size: rand(6, 14),
      rot: rand(0, Math.PI*2),
      vr: rand(-0.15, 0.15),
      color: colors[Math.floor(rand(0, colors.length))],
      life: rand(80, 260),
      shape: shapes[Math.floor(rand(0, shapes.length))]
    });
  }
}

function drawParticles(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  for (let i = particles.length - 1; i >= 0; i--){
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.18; // gravity
    p.vx *= 0.995; // slight air drag
    p.rot += p.vr;
    p.life -= 1;

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);

    ctx.fillStyle = p.color;
    if (p.shape === 'rect'){
      ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size*0.6);
    } else if (p.shape === 'circle'){
      ctx.beginPath();
      ctx.arc(0, 0, p.size/2, 0, Math.PI*2);
      ctx.fill();
    } else { // triangle
      ctx.beginPath();
      ctx.moveTo(0, -p.size/2);
      ctx.lineTo(p.size/2, p.size/2);
      ctx.lineTo(-p.size/2, p.size/2);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();

    if (p.y > canvas.height + 60 || p.life <= 0) particles.splice(i, 1);
  }
}

let animating = false;
function animateConfetti(){
  if (!animating){
    animating = true;
    requestAnimationFrame(loop);
  }
  function loop(){
    drawParticles();
    if (particles.length > 0) requestAnimationFrame(loop);
    else animating = false;
  }
}

/* ====== Sound (popper) ====== */
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function popSound(f=800){
  try{
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(f, audioCtx.currentTime);
    g.gain.setValueAtTime(0.001, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.28, audioCtx.currentTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.36);
    o.connect(g); g.connect(audioCtx.destination);
    o.start(); o.stop(audioCtx.currentTime + 0.36);
  }catch(e){}
}

/* ====== Visual popper ====== */
function showPopper(){
  $popper.classList.add('show');
  setTimeout(()=> $popper.classList.remove('show'), 2000);
}

/* ====== Birthday overlay ====== */
function showBirthdayOverlay() {
  if ($overlay) $overlay.classList.add("show");
}

/* ====== Celebration flow ====== */
function triggerCelebration(){
  celebrating = true;
  stopTimer();

  $celebrate.setAttribute('aria-hidden', 'false');
  $message.style.display = 'block';
  $message.style.opacity = '1';

  $message.animate([{transform:'scale(.96)'},{transform:'scale(1.04)'},{transform:'scale(1)'}], {duration:1200, iterations:3});

  createParticles(240);
  animateConfetti();

  let pops = 6, i = 0;
  function doPop(){
    if (i >= pops) return;
    popSound(700 + Math.random()*600);
    showPopper();
    createParticles(40, {x: window.innerWidth/2 + rand(-60,60), y: window.innerHeight/3 + rand(-30,30)});
    animateConfetti();
    i++;
    setTimeout(doPop, 330 + Math.random()*320);
  }

  if (audioCtx.state === 'suspended') {
    audioCtx.resume().then(doPop).catch(doPop);
  } else doPop();

  // Показать оверлей
  if ($overlay) {
    $overlay.classList.add("show");
    // Скрыть оверлей через 5 секунд
    setTimeout(() => {
      $overlay.classList.remove("show");
    }, 5000);
  }

  // fade message
  setTimeout(()=>{
    $message.style.transition = 'opacity 1s';
    $message.style.opacity = '0';
    setTimeout(()=> $message.style.display = 'none', 1100);
  }, 7000);
}

/* ====== UI wiring ====== */
prefillInputWith(defaultTarget());

$start.addEventListener('click', ()=>{
  if (audioCtx.state === 'suspended') audioCtx.resume().catch(()=>{});

  const val = $input.value;
  let target = val ? new Date(val) : defaultTarget();
  if (isNaN(target)){
    alert('Неверная дата');
    return;
  }

  celebrating = false;
  $message.style.display = 'none';
  $celebrate.setAttribute('aria-hidden', 'true');

  // hide overlay if visible
  if ($overlay) $overlay.classList.remove("show");

  startTimer(target);
});

$reset.addEventListener('click', ()=>{
  stopTimer();
  celebrating = false;
  $message.style.display = 'none';
  $celebrate.setAttribute('aria-hidden', 'true');
  prefillInputWith(defaultTarget());
  updateCountdown(defaultTarget());
  if ($overlay) $overlay.classList.remove("show");
});

/* start initial timer */
startTimer(defaultTarget());
