// === MOBILE TOUCH CONTROLS ===
// Loaded after game.js — reuses its global `keys`, `mouse`, `player`, `CW`, `CH`.

IS_MOBILE = true;
controlHint = 'Tap';

const MAX_RADIUS = 50;
const AIM_DEADZONE = 12;

const moveBase = document.getElementById('moveBase');
const moveKnob = document.getElementById('moveKnob');
const aimBase = document.getElementById('aimBase');
const aimKnob = document.getElementById('aimKnob');

const moveStick = { active: false, touchId: null, baseX: 0, baseY: 0 };
const aimStick = { active: false, touchId: null, baseX: 0, baseY: 0 };

function clampVec(dx, dy, max) {
  const dist = Math.hypot(dx, dy);
  if (dist > max) {
    const scale = max / dist;
    return { x: dx * scale, y: dy * scale };
  }
  return { x: dx, y: dy };
}

function showStick(baseEl, knobEl, x, y) {
  baseEl.style.left = `${x - 50}px`;
  baseEl.style.top = `${y - 50}px`;
  baseEl.style.display = 'block';
  knobEl.style.left = `${x - 25}px`;
  knobEl.style.top = `${y - 25}px`;
  knobEl.style.display = 'block';
}

function positionKnob(knobEl, baseX, baseY, dx, dy) {
  knobEl.style.left = `${baseX + dx - 25}px`;
  knobEl.style.top = `${baseY + dy - 25}px`;
}

function hideStick(baseEl, knobEl) {
  baseEl.style.display = 'none';
  knobEl.style.display = 'none';
}

function clearMoveKeys() {
  keys['ArrowUp'] = false;
  keys['ArrowDown'] = false;
  keys['ArrowLeft'] = false;
  keys['ArrowRight'] = false;
}

function applyMoveDelta(dx, dy) {
  const threshold = MAX_RADIUS * 0.3;
  keys['ArrowLeft'] = dx < -threshold;
  keys['ArrowRight'] = dx > threshold;
  keys['ArrowUp'] = dy < -threshold;
  keys['ArrowDown'] = dy > threshold;
}

function applyAimDelta(dx, dy) {
  const dist = Math.hypot(dx, dy);
  if (dist > AIM_DEADZONE) {
    const nx = dx / dist, ny = dy / dist;
    mouse.x = player.x + nx * 1000;
    mouse.y = player.y + ny * 1000;
    mouse.down = true;
  } else {
    mouse.down = false;
  }
}

window.addEventListener('touchstart', (e) => {
  ensureAudio();
  for (const touch of e.changedTouches) {
    const x = touch.clientX, y = touch.clientY;

    // Any tap also acts as a "click" for menu / game-over / level-complete screens
    mouse.clicked = true;

    if (x < window.innerWidth / 2) {
      if (!moveStick.active) {
        moveStick.active = true;
        moveStick.touchId = touch.identifier;
        moveStick.baseX = x; moveStick.baseY = y;
        showStick(moveBase, moveKnob, x, y);
      }
    } else {
      if (!aimStick.active) {
        aimStick.active = true;
        aimStick.touchId = touch.identifier;
        aimStick.baseX = x; aimStick.baseY = y;
        showStick(aimBase, aimKnob, x, y);
      }
    }
  }
  e.preventDefault();
}, { passive: false });

window.addEventListener('touchmove', (e) => {
  for (const touch of e.changedTouches) {
    if (touch.identifier === moveStick.touchId) {
      const dx = touch.clientX - moveStick.baseX;
      const dy = touch.clientY - moveStick.baseY;
      const c = clampVec(dx, dy, MAX_RADIUS);
      applyMoveDelta(c.x, c.y);
      positionKnob(moveKnob, moveStick.baseX, moveStick.baseY, c.x, c.y);
    } else if (touch.identifier === aimStick.touchId) {
      const dx = touch.clientX - aimStick.baseX;
      const dy = touch.clientY - aimStick.baseY;
      const c = clampVec(dx, dy, MAX_RADIUS);
      applyAimDelta(dx, dy);
      positionKnob(aimKnob, aimStick.baseX, aimStick.baseY, c.x, c.y);
    }
  }
  e.preventDefault();
}, { passive: false });

function releaseTouch(touch) {
  if (touch.identifier === moveStick.touchId) {
    moveStick.active = false;
    moveStick.touchId = null;
    clearMoveKeys();
    hideStick(moveBase, moveKnob);
  } else if (touch.identifier === aimStick.touchId) {
    aimStick.active = false;
    aimStick.touchId = null;
    mouse.down = false;
    hideStick(aimBase, aimKnob);
  }
}

window.addEventListener('touchend', (e) => {
  for (const touch of e.changedTouches) releaseTouch(touch);
  e.preventDefault();
}, { passive: false });

window.addEventListener('touchcancel', (e) => {
  for (const touch of e.changedTouches) releaseTouch(touch);
  e.preventDefault();
}, { passive: false });
