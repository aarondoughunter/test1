// === SETUP ===
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const CW = 900, CH = 600;
canvas.width = CW;
canvas.height = CH;

const DT = 1 / 60;
const FLIRT_RADIUS = 85;
const LINE_REACH_RADIUS = 130;

// === GAME STATE ===
let state = 'MENU';
let currentLevel = 1;
let score = 0;
let levelCompleteTimer = 0;
let gameOverTimer = 0;
let menuTicker = 0;
let bgCanvas = null;

// === NAMES & LINES ===
const DOUCHE_NAMES = [
  'Brad', 'Chad', 'Thad', 'Tad', 'Blaine', 'Bryce', 'Chet', 'Tanner',
  'Brock', 'Dax', 'Gage', 'Knox', 'Lance', 'Ryder', 'Skip', 'Trey',
  'Zane', 'Rhett', 'Cord', 'Buck',
];

const CATCALLS = [
  "HEY BEAUTIFUL!!",
  "DAMN, GIRL!!",
  "SMILE FOR ME!!",
  "YO, WHAT'S YOUR NAME?!",
  "HEY! HEY! HEY!!",
  "WHERE YOU GOING?!",
  "YOU SINGLE?!",
  "COME HERE OFTEN?!",
  "LET ME TAKE YOU OUT!",
  "YOU LOOK LONELY!!",
  "WOOOOOOO!!",
  "HEY GORGEOUS!!",
];

const PICKUP_LINES = [
  "Do you have a map? I keep getting lost in your eyes.",
  "Are you a parking ticket? You've got FINE written all over you.",
  "Is your name Google? You have everything I've been searching for.",
  "Do you believe in love at first sight, or should I walk by again?",
  "Are you a magician? Everyone else disappears when I look at you.",
  "Your hand looks heavy — can I hold it for you?",
  "Do you have a Band-Aid? I scraped my knee falling for you.",
  "Are you made of copper and tellurium? Because you're CuTe.",
  "Is your dad a boxer? Because you're a knockout.",
  "My love for you is like diarrhea. I just can't hold it in.",
  "Do you work at Starbucks? Because I like you a latte.",
  "Are you a campfire? You're hot and I want s'more.",
  "If you were a Transformer, you'd be Optimus Fine.",
  "Are you a bank loan? Because you have my interest.",
  "Heaven's missing an angel — I'm filing a missing persons report.",
  "Are you a time traveler? I see you in my future.",
  "Do you like science? Because we have amazing chemistry.",
  "Are you a cat? Because you're purr-fect.",
  "Is your name Wi-Fi? Because I'm feeling a connection.",
  "Do you play soccer? Because you're a keeper.",
];

const NICOLE_MESSAGES = [
  { text: "Aaron! You're my hero!", sub: "Nicole blows you a kiss 💋" },
  { text: "Nobody messes with MY man!", sub: "Nicole runs over and hugs Aaron tight 🤗" },
  { text: "That's why I said YES!", sub: "Nicole shows off her ring 💍" },
  { text: "You're literally the best!", sub: "Nicole does a happy little dance ❤️" },
  { text: "Stay right there, I'm coming!", sub: "Nicole skips across the arena 🥰" },
  { text: "You protect me every time!", sub: "Nicole gives Aaron the biggest smile 💖" },
  { text: "I love you more every level!", sub: "Nicole and Aaron share a moment 💗" },
  { text: "My knight in a hoodie!", sub: "Nicole cheers louder than ever 🦸" },
];

const GAME_OVER_LINES = [
  "Omg stop, you're so funny 😂",
  "Wow, nobody's ever said that to me before...",
  "You had me at 'parking ticket' 😍",
  "How did you know I love chemistry?!",
  "A keeper? I've been looking for one of those...",
];

// === ENTITIES ===
let player, nicole, enemies, bullets, particles;

function initEntities() {
  player = {
    x: CW * 0.2, y: CH * 0.5,
    vx: 0, vy: 0,
    speed: 190,
    angle: 0,
    hp: 100, maxHp: 100,
    radius: 18,
    shootCooldown: 0,
    shootRate: 0.22,
    invincible: 0,
  };
  nicole = {
    x: CW * 0.78, y: CH * 0.5,
    radius: 18,
    happiness: 100,
    flirtedAt: 0,
    walkX: CW * 0.78,
    walkAnim: 0,
  };
  enemies = [];
  bullets = [];
  particles = [];
}

// === LEVEL CONFIG ===
function getLevelConfig(level) {
  return {
    enemyCount: 3 + level * 2,
    enemySpeed: 55 + level * 14,
    enemyHp: 2 + Math.floor(level * 0.8),
    spawnInterval: Math.max(0.6, 2.2 - level * 0.16),
    lineInterval: Math.max(2.2, 5.5 - level * 0.35),
    lineHappinessDmg: 7 + level * 2,
  };
}

let levelConfig = getLevelConfig(1);
let enemiesSpawned = 0;
let enemiesDefeated = 0;
let spawnTimer = 0;
let enemyIdCounter = 0;

function resetLevel() {
  levelConfig = getLevelConfig(currentLevel);
  enemiesSpawned = 0;
  enemiesDefeated = 0;
  spawnTimer = 0;
  enemies = [];
  bullets = [];
  particles = [];
}

// === INPUT ===
const keys = {};
const mouse = { x: CW / 2, y: CH / 2, down: false, clicked: false };

window.addEventListener('keydown', e => {
  keys[e.code] = true;
  if (e.code === 'Enter' || e.code === 'Space') handleConfirm();
  e.preventDefault();
});
window.addEventListener('keyup', e => { keys[e.code] = false; });
canvas.addEventListener('mousemove', e => {
  const r = canvas.getBoundingClientRect();
  mouse.x = (e.clientX - r.left) * (CW / r.width);
  mouse.y = (e.clientY - r.top) * (CH / r.height);
});
canvas.addEventListener('mousedown', () => { mouse.down = true; mouse.clicked = true; });
canvas.addEventListener('mouseup', () => { mouse.down = false; });

function handleConfirm() {
  if (state === 'MENU') startGame();
  else if (state === 'GAME_OVER' && gameOverTimer > 1.5) startGame();
  else if (state === 'LEVEL_COMPLETE' && levelCompleteTimer > 2.0) nextLevel();
}

// === AUDIO ===
let audioCtx = null;
function ensureAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
}
function playBeep(freq, dur, type = 'square', vol = 0.12) {
  if (!audioCtx) return;
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.type = type; osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    osc.start(); osc.stop(audioCtx.currentTime + dur);
  } catch (e) {}
}

canvas.addEventListener('mousedown', ensureAudio, { once: true });
window.addEventListener('keydown', ensureAudio, { once: true });

// === GAME FLOW ===
function startGame() {
  currentLevel = 1;
  score = 0;
  initEntities();
  resetLevel();
  state = 'PLAYING';
}

function nextLevel() {
  currentLevel++;
  initEntities();
  resetLevel();
  nicole.happiness = Math.min(100, nicole.happiness + 20);
  state = 'PLAYING';
}

// === SPAWNING ===
function spawnEnemy() {
  const side = Math.floor(Math.random() * 4);
  let x, y;
  if (side === 0) { x = Math.random() * CW; y = -30; }
  else if (side === 1) { x = CW + 30; y = Math.random() * CH; }
  else if (side === 2) { x = Math.random() * CW; y = CH + 30; }
  else { x = -30; y = Math.random() * CH; }

  const variant = Math.floor(Math.random() * 3);
  const cfg = levelConfig;
  const name = DOUCHE_NAMES[Math.floor(Math.random() * DOUCHE_NAMES.length)];
  const entryCatcall = CATCALLS[Math.floor(Math.random() * CATCALLS.length)];

  enemies.push({
    x, y, vx: 0, vy: 0,
    speed: cfg.enemySpeed + (Math.random() - 0.5) * 20,
    angle: 0,
    hp: cfg.enemyHp, maxHp: cfg.enemyHp,
    radius: 17,
    state: 'approach',
    lineTimer: cfg.lineInterval * (0.5 + Math.random() * 0.5),
    lineInterval: cfg.lineInterval,
    activeLine: { text: `${entryCatcall} -${name}`, timer: 3.0 },
    variant,
    name,
    id: enemyIdCounter++,
    wobblePhase: Math.random() * Math.PI * 2,
    stunTimer: 0,
  });
  enemiesSpawned++;
}

function spawnBullet(x, y, angle) {
  const spd = 520;
  bullets.push({
    x, y,
    vx: Math.cos(angle) * spd,
    vy: Math.sin(angle) * spd,
    radius: 5,
    damage: 25,
    lifetime: 2.0,
  });
  playBeep(440, 0.07, 'square', 0.08);
  spawnParticles(x, y, 3, '#FFE000', 'spark');
}

function spawnParticles(x, y, count, color, type) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const spd = 40 + Math.random() * 120;
    particles.push({
      x, y,
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd,
      life: 1, maxLife: 0.4 + Math.random() * 0.3,
      color, type,
      size: 3 + Math.random() * 5,
    });
  }
}

function spawnHearts(x, y, count) {
  for (let i = 0; i < count; i++) {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI;
    const spd = 30 + Math.random() * 60;
    particles.push({
      x, y,
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd - 20,
      life: 1, maxLife: 1.2 + Math.random() * 0.5,
      color: '#FF69B4', type: 'heart',
      size: 10 + Math.random() * 8,
    });
  }
}

// === UPDATE ===
let lastTime = null;
let accumulator = 0;

function update(dt) {
  if (state !== 'PLAYING') return;

  // Player movement
  let mvx = 0, mvy = 0;
  if (keys['ArrowLeft'] || keys['KeyA']) mvx -= 1;
  if (keys['ArrowRight'] || keys['KeyD']) mvx += 1;
  if (keys['ArrowUp'] || keys['KeyW']) mvy -= 1;
  if (keys['ArrowDown'] || keys['KeyS']) mvy += 1;
  if (mvx && mvy) { mvx *= 0.707; mvy *= 0.707; }
  player.vx = mvx * player.speed;
  player.vy = mvy * player.speed;
  player.x = Math.max(player.radius, Math.min(CW - player.radius, player.x + player.vx * dt));
  player.y = Math.max(player.radius, Math.min(CH - player.radius, player.y + player.vy * dt));

  player.angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);

  if (player.invincible > 0) player.invincible -= dt;
  if (player.shootCooldown > 0) player.shootCooldown -= dt;

  if (mouse.down && player.shootCooldown <= 0) {
    spawnBullet(player.x, player.y, player.angle);
    player.shootCooldown = player.shootRate;
  }

  // Bullets
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.lifetime -= dt;
    if (b.lifetime <= 0 || b.x < -10 || b.x > CW + 10 || b.y < -10 || b.y > CH + 10) {
      bullets.splice(i, 1);
    }
  }

  // Enemies
  const time = performance.now() / 1000;
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];

    if (e.stunTimer > 0) {
      e.stunTimer -= dt;
      e.state = 'stunned';
    } else {
      e.state = 'approach';
    }

    const dx = nicole.x - e.x;
    const dy = nicole.y - e.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > FLIRT_RADIUS) {
      const nx = dx / dist, ny = dy / dist;
      const wobble = Math.sin(time * 1.5 + e.wobblePhase) * 25;
      const spd = e.stunTimer > 0 ? e.speed * 0.4 : e.speed;
      e.vx = nx * spd + (-ny) * wobble;
      e.vy = ny * spd + nx * wobble;
    } else {
      e.vx *= 0.88;
      e.vy *= 0.88;
      e.state = e.stunTimer > 0 ? 'stunned' : 'flirting';

      // Fire pickup line
      e.lineTimer -= dt;
      if (e.lineTimer <= 0) {
        e.lineTimer = e.lineInterval + Math.random() * 1.5;
        const line = PICKUP_LINES[Math.floor(Math.random() * PICKUP_LINES.length)];
        e.activeLine = { text: `${line} -${e.name}`, timer: 3.8 };
        playBeep(660, 0.15, 'sine', 0.07);
        if (dist < LINE_REACH_RADIUS) {
          nicole.happiness = Math.max(0, nicole.happiness - levelConfig.lineHappinessDmg);
          nicole.flirtedAt = 1.0;
          spawnParticles(nicole.x, nicole.y, 5, '#FF69B4', 'spark');
          if (nicole.happiness <= 0) {
            state = 'GAME_OVER';
            gameOverTimer = 0;
          }
        }
      }
    }

    if (e.activeLine) {
      e.activeLine.timer -= dt;
      if (e.activeLine.timer <= 0) e.activeLine = null;
    }

    e.x += e.vx * dt;
    e.y += e.vy * dt;
    e.angle = Math.atan2(nicole.y - e.y, nicole.x - e.x);

    // Enemy separation
    for (let j = 0; j < enemies.length; j++) {
      if (i === j) continue;
      const o = enemies[j];
      const sdx = e.x - o.x, sdy = e.y - o.y;
      const sdist = Math.sqrt(sdx * sdx + sdy * sdy);
      const minDist = e.radius + o.radius + 4;
      if (sdist < minDist && sdist > 0) {
        const push = (minDist - sdist) / sdist * 0.5;
        e.x += sdx * push; e.y += sdy * push;
      }
    }

    // Enemy touches player
    if (player.invincible <= 0) {
      const pdx = e.x - player.x, pdy = e.y - player.y;
      if (pdx * pdx + pdy * pdy < (e.radius + player.radius) ** 2) {
        player.hp -= 12;
        player.invincible = 0.8;
        playBeep(180, 0.2, 'sawtooth');
        if (player.hp <= 0) {
          state = 'GAME_OVER';
          gameOverTimer = 0;
        }
      }
    }
  }

  // Bullet vs enemy collisions
  for (let bi = bullets.length - 1; bi >= 0; bi--) {
    const b = bullets[bi];
    let hit = false;
    for (let ei = enemies.length - 1; ei >= 0; ei--) {
      const e = enemies[ei];
      const dx = b.x - e.x, dy = b.y - e.y;
      if (dx * dx + dy * dy < (b.radius + e.radius) ** 2) {
        e.hp -= b.damage;
        e.stunTimer = 0.25;
        hit = true;
        playBeep(220, 0.08, 'sawtooth');
        spawnParticles(e.x, e.y, 4, '#FF6600', 'spark');
        if (e.hp <= 0) {
          spawnParticles(e.x, e.y, 12, '#FF4400', 'spark');
          spawnParticles(e.x, e.y, 6, '#FFD700', 'spark');
          playBeep(140, 0.35, 'sawtooth');
          enemies.splice(ei, 1);
          enemiesDefeated++;
          score += 100 * currentLevel;
        }
        break;
      }
    }
    if (hit) bullets.splice(bi, 1);
  }

  // Particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 30 * dt;
    p.life -= dt / p.maxLife;
    if (p.life <= 0) particles.splice(i, 1);
  }

  // Nicole flirt timer
  if (nicole.flirtedAt > 0) nicole.flirtedAt -= dt;

  // Spawn enemies
  if (enemiesSpawned < levelConfig.enemyCount) {
    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      spawnEnemy();
      spawnTimer = levelConfig.spawnInterval;
    }
  }

  // Level complete check
  if (enemiesDefeated >= levelConfig.enemyCount && enemies.length === 0) {
    state = 'LEVEL_COMPLETE';
    levelCompleteTimer = 0;
    nicole.walkX = player.x + 60;
    spawnHearts(nicole.x, nicole.y, 15);
    playBeep(523, 0.15, 'sine'); // C
    setTimeout(() => playBeep(659, 0.15, 'sine'), 160); // E
    setTimeout(() => playBeep(784, 0.3, 'sine'), 320); // G
  }

  mouse.clicked = false;
}

function updateNonPlay(dt) {
  if (state === 'LEVEL_COMPLETE') {
    levelCompleteTimer += dt;
    nicole.walkAnim += dt * 3;
    // Nicole walks toward player
    if (levelCompleteTimer < 2.0) {
      const targetX = player.x + 60;
      nicole.x += (targetX - nicole.x) * dt * 1.2;
    }
    // Particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy -= 20 * dt;
      p.life -= dt / p.maxLife;
      if (p.life <= 0) particles.splice(i, 1);
    }
    if (mouse.clicked && levelCompleteTimer > 2.0) nextLevel();
  }
  if (state === 'GAME_OVER') {
    gameOverTimer += dt;
  }
  if (state === 'MENU') {
    menuTicker += dt;
  }
  mouse.clicked = false;
}

// === BACKGROUND ===
function buildBg() {
  bgCanvas = document.createElement('canvas');
  bgCanvas.width = CW; bgCanvas.height = CH;
  const bc = bgCanvas.getContext('2d');

  // Floor
  bc.fillStyle = '#1a472a';
  bc.fillRect(0, 0, CW, CH);

  // Tile grid
  bc.strokeStyle = 'rgba(0,0,0,0.15)';
  bc.lineWidth = 1;
  for (let x = 0; x <= CW; x += 48) {
    bc.beginPath(); bc.moveTo(x, 0); bc.lineTo(x, CH); bc.stroke();
  }
  for (let y = 0; y <= CH; y += 48) {
    bc.beginPath(); bc.moveTo(0, y); bc.lineTo(CW, y); bc.stroke();
  }

  // Corner plants
  drawPlant(bc, 30, 30);
  drawPlant(bc, CW - 30, 30);
  drawPlant(bc, 30, CH - 30);
  drawPlant(bc, CW - 30, CH - 30);

  // Nicole safe zone ring
  bc.strokeStyle = 'rgba(255,215,0,0.35)';
  bc.lineWidth = 2;
  bc.setLineDash([6, 6]);
  bc.beginPath();
  bc.arc(CW * 0.78, CH * 0.5, 75, 0, Math.PI * 2);
  bc.stroke();
  bc.setLineDash([]);
}

function drawPlant(bc, x, y) {
  bc.fillStyle = '#2d5a27';
  bc.beginPath(); bc.arc(x, y, 18, 0, Math.PI * 2); bc.fill();
  bc.fillStyle = '#3a7a33';
  bc.beginPath(); bc.arc(x - 5, y - 5, 10, 0, Math.PI * 2); bc.fill();
  bc.beginPath(); bc.arc(x + 5, y - 5, 10, 0, Math.PI * 2); bc.fill();
  bc.fillStyle = '#5c3317';
  bc.fillRect(x - 5, y + 10, 10, 12);
}

// === DRAWING ===
function roundRect(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.lineTo(x + w - r, y);
  c.arcTo(x + w, y, x + w, y + r, r);
  c.lineTo(x + w, y + h - r);
  c.arcTo(x + w, y + h, x + w - r, y + h, r);
  c.lineTo(x + r, y + h);
  c.arcTo(x, y + h, x, y + h - r, r);
  c.lineTo(x, y + r);
  c.arcTo(x, y, x + r, y, r);
  c.closePath();
}

function drawAaron(x, y, angle, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha ?? 1;
  ctx.translate(x, y);

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.ellipse(2, 20, 16, 5, 0, 0, Math.PI * 2); ctx.fill();

  // Gun arm (behind body)
  ctx.save();
  ctx.rotate(angle);
  ctx.fillStyle = '#FDBCB4';
  ctx.fillRect(8, -4, 22, 7); // arm
  ctx.fillStyle = '#555';
  ctx.fillRect(24, -3, 14, 5); // gun barrel
  ctx.fillStyle = '#333';
  ctx.fillRect(18, 2, 8, 7); // grip
  ctx.restore();

  // Body (shirt)
  ctx.fillStyle = '#1a3a6b';
  ctx.beginPath(); ctx.ellipse(0, 5, 14, 17, 0, 0, Math.PI * 2); ctx.fill();

  // Collar
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.moveTo(-5, -6); ctx.lineTo(0, -2); ctx.lineTo(5, -6);
  ctx.fill();

  // Head
  ctx.fillStyle = '#FDBCB4';
  ctx.beginPath(); ctx.arc(0, -14, 11, 0, Math.PI * 2); ctx.fill();

  // Hair (short, neat)
  ctx.fillStyle = '#5C3317';
  ctx.beginPath(); ctx.arc(0, -18, 11, Math.PI, 0); ctx.fill();
  ctx.beginPath(); ctx.arc(0, -20, 8, Math.PI + 0.3, -0.3); ctx.fill();

  // Eyes
  const eyeAngle = angle;
  const eyeOffX = Math.cos(eyeAngle) * 3;
  const eyeOffY = Math.sin(eyeAngle) * 3;
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.ellipse(-4 + eyeOffX * 0.3, -14 + eyeOffY * 0.3, 3, 3.5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(4 + eyeOffX * 0.3, -14 + eyeOffY * 0.3, 3, 3.5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#2c1810';
  ctx.beginPath(); ctx.arc(-4 + eyeOffX * 0.5, -14 + eyeOffY * 0.5, 1.8, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(4 + eyeOffX * 0.5, -14 + eyeOffY * 0.5, 1.8, 0, Math.PI * 2); ctx.fill();

  // Good-guy glow
  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(-4, -18, 5, Math.PI, Math.PI * 1.5); ctx.stroke();

  ctx.restore();
}

function drawNicole(x, y, state, happiness, flirtedAt) {
  ctx.save();
  ctx.translate(x, y);

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath(); ctx.ellipse(0, 24, 16, 5, 0, 0, Math.PI * 2); ctx.fill();

  // Dress / skirt
  ctx.fillStyle = '#FF85A1';
  ctx.beginPath();
  ctx.moveTo(-10, 0);
  ctx.lineTo(-22, 32); ctx.lineTo(22, 32); ctx.lineTo(10, 0);
  ctx.closePath(); ctx.fill();

  // Dress bodice
  ctx.fillStyle = '#e8607e';
  ctx.beginPath(); ctx.ellipse(0, -2, 11, 8, 0, 0, Math.PI * 2); ctx.fill();

  // Hair (long, flowing)
  ctx.fillStyle = '#6B3A2A';
  ctx.beginPath();
  ctx.moveTo(-12, -20);
  ctx.bezierCurveTo(-22, -5, -20, 18, -14, 32);
  ctx.lineTo(-8, 32);
  ctx.bezierCurveTo(-14, 14, -16, -2, -12, -14);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(12, -20);
  ctx.bezierCurveTo(22, -5, 20, 18, 14, 32);
  ctx.lineTo(8, 32);
  ctx.bezierCurveTo(14, 14, 16, -2, 12, -14);
  ctx.fill();

  // Head
  ctx.fillStyle = '#FDBCB4';
  ctx.beginPath(); ctx.arc(0, -16, 12, 0, Math.PI * 2); ctx.fill();

  // Hair top
  ctx.fillStyle = '#6B3A2A';
  ctx.beginPath(); ctx.arc(0, -21, 12, Math.PI, 0); ctx.fill();
  ctx.beginPath(); ctx.ellipse(0, -24, 9, 6, 0, 0, Math.PI, true); ctx.fill();

  // Eyes
  if (state === 'LEVEL_COMPLETE' || flirtedAt > 0.5) {
    // Heart eyes (level complete or flirted)
    ctx.fillStyle = flirtedAt > 0.5 ? '#FF1493' : '#FF69B4';
    drawHeart(ctx, -5, -17, 5);
    drawHeart(ctx, 5, -17, 5);
  } else if (happiness < 40) {
    // Worried eyes
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.ellipse(-4, -17, 3, 3.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(4, -17, 3, 3.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2c1810';
    ctx.beginPath(); ctx.arc(-4, -16, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(4, -16, 2, 0, Math.PI * 2); ctx.fill();
    // furrowed brows
    ctx.strokeStyle = '#5C3317'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-7, -22); ctx.lineTo(-1, -20); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(7, -22); ctx.lineTo(1, -20); ctx.stroke();
  } else {
    // Normal happy eyes
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.ellipse(-4, -17, 3, 3.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(4, -17, 3, 3.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2c1810';
    ctx.beginPath(); ctx.arc(-4, -16, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(4, -16, 2, 0, Math.PI * 2); ctx.fill();
    // small smile
    ctx.strokeStyle = '#c0666a'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(0, -14, 4, 0.2, Math.PI - 0.2); ctx.stroke();
  }

  // Ring sparkle
  ctx.fillStyle = '#FFD700';
  ctx.font = '10px serif';
  ctx.fillText('💍', 10, -22);

  ctx.restore();
}

function drawHeart(c, x, y, size) {
  c.save();
  c.translate(x, y);
  c.beginPath();
  c.moveTo(0, size * 0.3);
  c.bezierCurveTo(size * 0.5, -size * 0.3, size, size * 0.1, 0, size);
  c.bezierCurveTo(-size, size * 0.1, -size * 0.5, -size * 0.3, 0, size * 0.3);
  c.fill();
  c.restore();
}

function drawEnemy(enemy) {
  const { x, y, angle, variant, hp, maxHp, stunTimer, activeLine } = enemy;
  ctx.save();
  ctx.translate(x, y);

  if (stunTimer > 0) {
    ctx.globalAlpha = 0.55 + Math.sin(stunTimer * 30) * 0.3;
  }

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath(); ctx.ellipse(2, 21, 17, 5, 0, 0, Math.PI * 2); ctx.fill();

  // Body (spray-tan gut)
  const bodyColor = '#E8824A';
  ctx.fillStyle = bodyColor;
  ctx.beginPath(); ctx.ellipse(0, 4, 16, 18, 0, 0, Math.PI * 2); ctx.fill();

  if (variant === 0) {
    // THE CHAD — orange shirt, popped collar, gold chain
    ctx.fillStyle = '#FF4500';
    ctx.beginPath(); ctx.ellipse(0, 4, 14, 16, 0, 0, Math.PI * 2); ctx.fill();
    // Popped collar left
    ctx.fillStyle = '#FF4500';
    ctx.beginPath(); ctx.moveTo(-14, -2); ctx.lineTo(-8, -10); ctx.lineTo(-4, -2); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(14, -2); ctx.lineTo(8, -10); ctx.lineTo(4, -2); ctx.closePath(); ctx.fill();
    // Gold chain
    ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(0, 2, 11, -0.6, Math.PI + 0.6); ctx.stroke();
    ctx.fillStyle = '#FFD700';
    ctx.font = '8px serif'; ctx.textAlign = 'center';
    ctx.fillText('✦', 0, 6);
  } else if (variant === 1) {
    // THE BRO — purple affliction, sunglasses, bluetooth
    ctx.fillStyle = '#6a1b8a';
    ctx.beginPath(); ctx.ellipse(0, 4, 14, 16, 0, 0, Math.PI * 2); ctx.fill();
    // Tribal tattoo suggestion
    ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 1.5;
    ctx.setLineDash([2, 2]);
    ctx.beginPath(); ctx.moveTo(-10, 0); ctx.bezierCurveTo(-14, 5, -12, 12, -8, 16); ctx.stroke();
    ctx.setLineDash([]);
    // Bluetooth earpiece
    ctx.fillStyle = '#888';
    ctx.fillRect(13, -16, 4, 7);
    ctx.strokeStyle = '#aaa'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(15, -16); ctx.lineTo(15, -20); ctx.stroke();
  } else {
    // THE SMOOTHIE — silk shirt, rose, wink
    ctx.fillStyle = '#1a5276';
    ctx.beginPath(); ctx.ellipse(0, 4, 14, 16, 0, 0, Math.PI * 2); ctx.fill();
    // Silk diagonal stripes
    ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 5]);
    for (let s = -20; s < 20; s += 7) {
      ctx.beginPath(); ctx.moveTo(s - 10, -8); ctx.lineTo(s + 10, 16); ctx.stroke();
    }
    ctx.setLineDash([]);
    // Rose in pocket
    ctx.font = '11px serif'; ctx.textAlign = 'center';
    ctx.fillText('🌹', 6, 2);
  }

  // Head (spray-tan)
  ctx.fillStyle = '#E8824A';
  ctx.beginPath(); ctx.arc(0, -16, 12, 0, Math.PI * 2); ctx.fill();

  // Variant hair
  if (variant === 0) {
    // Bleached spiked tips
    ctx.fillStyle = '#F5D800';
    for (let s = -2; s <= 2; s++) {
      const hx = s * 4.5;
      ctx.beginPath();
      ctx.moveTo(hx - 3, -23);
      ctx.lineTo(hx, -34 + Math.abs(s) * 2);
      ctx.lineTo(hx + 3, -23);
      ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = '#E8B800';
    ctx.beginPath(); ctx.arc(0, -24, 11, Math.PI, 0); ctx.fill();
  } else if (variant === 1) {
    // Dark gelled flat hair
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath(); ctx.arc(0, -22, 12, Math.PI, 0); ctx.fill();
    ctx.fillRect(-12, -22, 24, 6);
    // Shine streak
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-6, -26); ctx.lineTo(2, -26); ctx.stroke();
    // Sunglasses
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    roundRect(ctx, -12, -19, 10, 6, 2); ctx.fill();
    roundRect(ctx, 2, -19, 10, 6, 2); ctx.fill();
    ctx.strokeStyle = '#888'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-2, -16); ctx.lineTo(2, -16); ctx.stroke();
  } else {
    // Center-part pomaded
    ctx.fillStyle = '#111';
    ctx.beginPath(); ctx.arc(0, -22, 12, Math.PI, 0); ctx.fill();
    ctx.fillRect(-12, -22, 24, 6);
    // Center part shine
    ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, -28); ctx.lineTo(0, -22); ctx.stroke();
    // Wink: one eye open, one closed
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.ellipse(-4, -17, 3, 3.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2c1810';
    ctx.beginPath(); ctx.arc(-4, -16, 2, 0, Math.PI * 2); ctx.fill();
    // wink (closed eye)
    ctx.strokeStyle = '#2c1810'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(4, -16, 3, 0, Math.PI); ctx.stroke();
    // Smirk
    ctx.strokeStyle = '#c0666a'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(-3, -11); ctx.quadraticCurveTo(2, -9, 6, -11); ctx.stroke();
  }

  // HP bar
  const bw = 30, bh = 4;
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#333';
  ctx.fillRect(-bw / 2, -36, bw, bh);
  ctx.fillStyle = hp / maxHp > 0.5 ? '#44ff44' : '#ff4444';
  ctx.fillRect(-bw / 2, -36, bw * (hp / maxHp), bh);

  ctx.restore();

  // Speech bubble (outside save/restore so not clipped)
  if (activeLine) {
    const alpha = Math.min(1, activeLine.timer, activeLine.timer < 1 ? activeLine.timer : 1);
    drawSpeechBubble(x, y - 38, activeLine.text, alpha);
  }
}

function drawSpeechBubble(bx, by, text, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  const fontSize = 10;
  ctx.font = `bold ${fontSize}px Arial`;
  const maxChars = 42;
  const displayText = text.length > maxChars ? text.slice(0, maxChars - 1) + '…' : text;
  const tw = ctx.measureText(displayText).width;
  const pad = 7;
  const bw = tw + pad * 2, bh = 20;
  const rx = bx - bw / 2, ry = by - bh - 10;

  // Bubble
  ctx.fillStyle = 'rgba(255,255,240,0.94)';
  ctx.strokeStyle = '#cc0000';
  ctx.lineWidth = 1.5;
  roundRect(ctx, rx, ry, bw, bh, 5);
  ctx.fill(); ctx.stroke();

  // Tail
  ctx.beginPath();
  ctx.moveTo(bx - 5, ry + bh);
  ctx.lineTo(bx + 5, ry + bh);
  ctx.lineTo(bx, ry + bh + 8);
  ctx.closePath();
  ctx.fillStyle = 'rgba(255,255,240,0.94)'; ctx.fill();
  ctx.strokeStyle = '#cc0000'; ctx.stroke();

  // Text
  ctx.fillStyle = '#880000';
  ctx.textAlign = 'left';
  ctx.fillText(displayText, rx + pad, ry + bh - 6);
  ctx.restore();
}

function drawBullet(b) {
  // Streak
  ctx.strokeStyle = 'rgba(255,220,50,0.45)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(b.x, b.y);
  ctx.lineTo(b.x - b.vx * 0.035, b.y - b.vy * 0.035);
  ctx.stroke();
  // Core
  ctx.fillStyle = '#FFE000';
  ctx.beginPath(); ctx.arc(b.x, b.y, 5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(b.x, b.y, 2, 0, Math.PI * 2); ctx.fill();
}

function drawParticle(p) {
  ctx.save();
  ctx.globalAlpha = Math.max(0, p.life);
  if (p.type === 'heart') {
    ctx.fillStyle = p.color;
    drawHeart(ctx, p.x, p.y, p.size * p.life);
  } else {
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function drawHUD() {
  // Aaron HP
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  roundRect(ctx, 10, 10, 160, 48, 6); ctx.fill();

  ctx.font = 'bold 12px Arial';
  ctx.fillStyle = '#ff4444';
  ctx.textAlign = 'left';
  ctx.fillText('❤ AARON', 18, 26);
  ctx.fillStyle = '#333';
  ctx.fillRect(18, 30, 140, 12);
  ctx.fillStyle = player.hp > 50 ? '#ff4444' : '#ff0000';
  ctx.fillRect(18, 30, 140 * (player.hp / player.maxHp), 12);
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 1;
  ctx.strokeRect(18, 30, 140, 12);

  // Nicole Happiness
  ctx.fillStyle = '#ff85a1';
  ctx.textAlign = 'left';
  ctx.fillText('💕 NICOLE', 18, 56);
  ctx.fillStyle = '#333';
  ctx.fillRect(18, 60, 140, 10); // (moved up slightly in layout from 60 to 60 is fine)

  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  roundRect(ctx, 10, 46, 160, 28, 6); ctx.fill();
  ctx.fillStyle = '#ff85a1';
  ctx.font = 'bold 11px Arial';
  ctx.fillText('💕 NICOLE', 18, 60);
  ctx.fillStyle = '#333';
  ctx.fillRect(18, 63, 140, 10);
  ctx.fillStyle = nicole.happiness > 40 ? '#FF85A1' : '#ff1493';
  ctx.fillRect(18, 63, 140 * (nicole.happiness / 100), 10);
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 1;
  ctx.strokeRect(18, 63, 140, 10);

  // Level
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  roundRect(ctx, CW / 2 - 55, 10, 110, 30, 6); ctx.fill();
  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(`LEVEL ${currentLevel}`, CW / 2, 30);

  // Score
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  roundRect(ctx, CW - 150, 10, 140, 30, 6); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'right';
  ctx.fillText(`SCORE: ${score}`, CW - 18, 30);
}

function drawMenu() {
  ctx.fillStyle = 'rgba(0,0,0,0.88)';
  ctx.fillRect(0, 0, CW, CH);

  // Title
  ctx.textAlign = 'center';
  ctx.font = 'bold 56px Arial';
  ctx.fillStyle = '#333';
  ctx.fillText('AARON DEFENDER', CW / 2 + 3, CH / 2 - 143);
  ctx.fillStyle = '#FFD700';
  ctx.fillText('AARON DEFENDER', CW / 2, CH / 2 - 146);

  ctx.font = 'bold 20px Arial';
  ctx.fillStyle = '#FF85A1';
  ctx.fillText('Protect Nicole from the Douchebags!', CW / 2, CH / 2 - 108);

  // Draw Aaron large on left
  ctx.save();
  ctx.translate(CW * 0.22, CH * 0.45);
  ctx.scale(1.8, 1.8);
  drawAaron(0, 0, 0.3, 1);
  ctx.restore();

  // Draw Nicole large on right
  ctx.save();
  ctx.translate(CW * 0.78, CH * 0.45);
  ctx.scale(1.8, 1.8);
  drawNicole(0, 0, 'MENU', 100, 0);
  ctx.restore();

  // Controls box
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  roundRect(ctx, CW / 2 - 180, CH * 0.62, 360, 90, 10); ctx.fill();
  ctx.strokeStyle = 'rgba(255,215,0,0.3)'; ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = '#aaa';
  ctx.font = '15px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('🏹 Arrow Keys — Move', CW / 2, CH * 0.62 + 25);
  ctx.fillText('🖱 Mouse — Aim & Shoot', CW / 2, CH * 0.62 + 47);
  ctx.fillText("Protect Nicole's happiness from the Douchebags!", CW / 2, CH * 0.62 + 70);

  // Pulsing start prompt
  const pulse = 0.7 + 0.3 * Math.sin(menuTicker * 3);
  ctx.globalAlpha = pulse;
  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 22px Arial';
  ctx.fillText('Click or Press Enter to Start', CW / 2, CH - 40);
  ctx.globalAlpha = 1;

  // Scrolling ticker
  const lineIdx = Math.floor(menuTicker * 0.4) % PICKUP_LINES.length;
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, CH - 22, CW, 22);
  ctx.fillStyle = '#cc0000';
  ctx.font = 'italic 11px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(`"${PICKUP_LINES[lineIdx]}"`, CW / 2, CH - 7);
}

function drawLevelComplete() {
  ctx.fillStyle = 'rgba(0,0,0,0.65)';
  ctx.fillRect(0, 0, CW, CH);

  // Background glow
  const grad = ctx.createRadialGradient(CW / 2, CH / 2, 10, CW / 2, CH / 2, 250);
  grad.addColorStop(0, 'rgba(255,105,180,0.25)');
  grad.addColorStop(1, 'rgba(255,105,180,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CW, CH);

  ctx.textAlign = 'center';
  ctx.font = 'bold 50px Arial';
  ctx.fillStyle = '#333';
  ctx.fillText(`LEVEL ${currentLevel} COMPLETE!`, CW / 2 + 2, CH / 2 - 132);
  ctx.fillStyle = '#FFD700';
  ctx.fillText(`LEVEL ${currentLevel} COMPLETE!`, CW / 2, CH / 2 - 135);

  const msg = NICOLE_MESSAGES[(currentLevel - 1) % NICOLE_MESSAGES.length];

  // Expanding heart
  const heartSize = 40 + Math.sin(levelCompleteTimer * 3) * 10;
  ctx.fillStyle = '#FF69B4';
  drawHeart(ctx, CW / 2, CH / 2 - 85, heartSize);

  // Nicole message
  ctx.font = 'bold 28px Arial';
  ctx.fillStyle = '#FF85A1';
  const fadeIn = Math.min(1, (levelCompleteTimer - 0.5) * 2);
  ctx.globalAlpha = Math.max(0, fadeIn);
  ctx.fillText(`"${msg.text}"`, CW / 2, CH / 2 + 10);
  ctx.font = 'italic 18px Arial';
  ctx.fillStyle = '#fff';
  ctx.fillText(msg.sub, CW / 2, CH / 2 + 40);
  ctx.globalAlpha = 1;

  // Nicole and Aaron sprites
  drawNicole(nicole.x, nicole.y, 'LEVEL_COMPLETE', 100, 0);
  drawAaron(player.x, player.y, 0, 1);

  // Next level prompt
  if (levelCompleteTimer > 2.0) {
    const pulse = 0.6 + 0.4 * Math.sin(levelCompleteTimer * 4);
    ctx.globalAlpha = pulse;
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 20px Arial';
    ctx.fillText('Click or Press Enter for Next Level →', CW / 2, CH - 35);
    ctx.globalAlpha = 1;
  }
}

function drawGameOver() {
  ctx.fillStyle = 'rgba(0,0,0,0.82)';
  ctx.fillRect(0, 0, CW, CH);

  ctx.textAlign = 'center';

  // Dripping GAME OVER
  ctx.font = 'bold 64px Arial';
  ctx.fillStyle = '#660000';
  ctx.fillText('GAME OVER', CW / 2 + 3, CH / 2 - 145);
  ctx.fillStyle = '#ff1111';
  ctx.fillText('GAME OVER', CW / 2, CH / 2 - 148);

  const fade = Math.min(1, (gameOverTimer - 0.5) * 1.5);
  if (fade > 0) {
    ctx.globalAlpha = Math.max(0, fade);

    ctx.font = 'bold 22px Arial';
    ctx.fillStyle = '#FF85A1';
    ctx.fillText("Nicole got charmed... 😬", CW / 2, CH / 2 - 100);

    // Nicole with heart eyes looking at enemy direction
    ctx.save();
    ctx.translate(CW * 0.55, CH / 2 - 10);
    ctx.scale(1.5, 1.5);
    drawNicole(0, 0, 'GAME_OVER', 0, 1.5);
    ctx.restore();

    // Floating 😍
    const floatY = -Math.sin(gameOverTimer * 2) * 15;
    ctx.font = '40px serif';
    ctx.fillText('😍', CW * 0.55, CH / 2 - 80 + floatY);

    // The line that worked
    const lineIdx = Math.floor(gameOverTimer * 0.3) % GAME_OVER_LINES.length;
    ctx.font = 'bold 17px Arial';
    ctx.fillStyle = '#FF69B4';
    ctx.fillText(`Nicole: "${GAME_OVER_LINES[Math.floor(gameOverTimer) % GAME_OVER_LINES.length]}"`, CW / 2, CH / 2 + 100);

    ctx.font = '14px Arial';
    ctx.fillStyle = '#aaa';
    ctx.fillText(`Score: ${score}  |  Reached Level ${currentLevel}`, CW / 2, CH / 2 + 130);

    ctx.globalAlpha = 1;
  }

  if (gameOverTimer > 1.5) {
    const pulse = 0.6 + 0.4 * Math.sin(gameOverTimer * 3);
    ctx.globalAlpha = pulse;
    ctx.font = 'bold 19px Arial';
    ctx.fillStyle = '#FFD700';
    ctx.fillText('Click or Press Enter to Try Again', CW / 2, CH - 35);
    ctx.globalAlpha = 1;
  }

  // Click to restart
  if (mouse.clicked && gameOverTimer > 1.5) startGame();
}

function drawPlaying() {
  // Background
  ctx.drawImage(bgCanvas, 0, 0);

  // Particles (behind entities)
  particles.forEach(drawParticle);

  // Nicole
  drawNicole(nicole.x, nicole.y, state, nicole.happiness, nicole.flirtedAt);

  // Enemies sorted by Y
  [...enemies].sort((a, b) => a.y - b.y).forEach(drawEnemy);

  // Bullets
  bullets.forEach(drawBullet);

  // Aaron (invincible flash)
  const aaronAlpha = player.invincible > 0 ? (Math.sin(player.invincible * 25) > 0 ? 0.4 : 1) : 1;
  drawAaron(player.x, player.y, player.angle, aaronAlpha);

  // HUD
  drawHUD();

  // Danger flash if Nicole low
  if (nicole.happiness < 30) {
    const flashAlpha = 0.15 + 0.1 * Math.sin(performance.now() / 100);
    ctx.fillStyle = `rgba(255,0,0,${flashAlpha})`;
    ctx.fillRect(0, 0, CW, CH);
  }
}

// === MAIN LOOP ===
function gameLoop(timestamp) {
  if (!lastTime) lastTime = timestamp;
  let delta = (timestamp - lastTime) / 1000;
  lastTime = timestamp;
  delta = Math.min(delta, 0.1);
  accumulator += delta;

  while (accumulator >= DT) {
    if (state === 'PLAYING') update(DT);
    else updateNonPlay(DT);
    accumulator -= DT;
  }

  // Render
  ctx.clearRect(0, 0, CW, CH);

  if (state === 'MENU') {
    if (bgCanvas) ctx.drawImage(bgCanvas, 0, 0);
    drawMenu();
    if (mouse.clicked) startGame();
  } else if (state === 'PLAYING') {
    drawPlaying();
  } else if (state === 'LEVEL_COMPLETE') {
    if (bgCanvas) ctx.drawImage(bgCanvas, 0, 0);
    particles.forEach(drawParticle);
    drawLevelComplete();
  } else if (state === 'GAME_OVER') {
    if (bgCanvas) ctx.drawImage(bgCanvas, 0, 0);
    drawGameOver();
  }

  mouse.clicked = false;
  requestAnimationFrame(gameLoop);
}

// === INIT ===
buildBg();
initEntities();
requestAnimationFrame(gameLoop);
