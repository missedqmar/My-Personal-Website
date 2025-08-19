/* Duck Runner — time-based 60fps runner
 * Controls: Space/ArrowUp or Tap to jump, R to restart
 * - Time-based physics keeps the same pace regardless of frame rate
 * - Larger obstacle gaps
 * - Fixed colors (theme-independent)
 * - Pekin duck: white body, orange beak/legs
 */
(function () {
  const canvas = document.getElementById("duckCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  // ---------- Responsive canvas size ----------
  function resize() {
    const ratio = 1200 / 400; // logical aspect ratio
    const w = Math.min(window.innerWidth * 0.92, 1100);
    canvas.width = w;
    canvas.height = Math.floor(w / ratio);
  }
  resize();
  window.addEventListener("resize", resize);

  // ---------- Fixed palette (not affected by theme) ----------
  const SKY_TOP = "#0e1224";
  const SKY_BOTTOM = "#0b0f1a";
  const GROUND_LINE = "rgba(255,255,255,0.20)";
  const CLOUD_COLOR = "rgba(255,255,255,0.65)";
  const OBSTACLE_COLOR = "rgba(255,255,255,0.90)";
  const DUCK_WHITE = "#ffffff";
  const DUCK_ORANGE = "#f59e0b";
  const DUCK_EYE = "#0b0d10";

  // ---------- Game state ----------
  let started = false;
  let gameOver = false;
  let score = 0;
  let scoreAccum = 0;

  // Physics (per-second units) — slightly faster start than before
  let speedPPS = 270;     // px/s (was 240)
  const gravity = 720;    // px/s^2
  const jumpVel = -405;   // px/s
  const groundY = () => canvas.height - 40;

  const duck = { x: 80, y: 0, w: 44, h: 34, vy: 0, onGround: true };

  // Obstacles & clouds
  let obstacles = [];
  let clouds = [];
  let distSinceSpawn = 0;
  const GAP_MIN = 380;
  const GAP_RAND = 180;

  function spawnObstacle() {
    const h = 30 + Math.random() * 35;
    const w = 18 + Math.random() * 20;
    obstacles.push({ x: canvas.width + 10, y: groundY() - h, w, h });
  }

  function spawnClouds() {
    clouds = [];
    for (let i = 0; i < 4; i++) {
      clouds.push({
        x: Math.random() * canvas.width,
        y: 40 + Math.random() * (canvas.height * 0.4),
        w: 60 + Math.random() * 50,
        h: 20 + Math.random() * 10,
        spd: 20 + Math.random() * 20 // px/s (slow parallax)
      });
    }
  }

  // ---------- Controls ----------
  function jump() {
    if (!started) started = true;
    if (gameOver) return;
    if (duck.onGround) {
      duck.vy = jumpVel;
      duck.onGround = false;
    }
  }

  window.addEventListener("keydown", (e) => {
    if (e.code === "Space" || e.code === "ArrowUp") {
      e.preventDefault();
      jump();
    } else if (e.code === "KeyR") {
      reset();
    }
  }, { passive: false });

  canvas.addEventListener("pointerdown", () => jump());

  // ---------- Helpers ----------
  function reset() {
    started = false; gameOver = false;
    score = 0; scoreAccum = 0;
    speedPPS = 270; // keep slightly faster
    obstacles = []; distSinceSpawn = 0;
    spawnClouds();
    duck.y = groundY() - duck.h; duck.vy = 0; duck.onGround = true;
    draw(0);
  }

  function collide(a, b) {
    return a.x < b.x + b.w &&
           a.x + a.w > b.x &&
           a.y < b.y + b.h &&
           a.y + a.h > b.y;
  }

  // ---------- Drawing ----------
  function drawBackground() {
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, SKY_TOP);
    grad.addColorStop(1, SKY_BOTTOM);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  function drawGround() {
    ctx.strokeStyle = GROUND_LINE; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, groundY()); ctx.lineTo(canvas.width, groundY()); ctx.stroke();
  }

  function drawCloud(c) {
    ctx.fillStyle = CLOUD_COLOR;
    ctx.beginPath(); ctx.roundRect(c.x, c.y, c.w, c.h, 12); ctx.fill();
  }

  function drawObstacle(o) {
    ctx.fillStyle = OBSTACLE_COLOR;
    ctx.beginPath(); ctx.roundRect(o.x, o.y, o.w, o.h, 4); ctx.fill();
  }

  function drawDuck() {
    // Body (white)
    ctx.fillStyle = DUCK_WHITE;
    ctx.beginPath(); ctx.roundRect(duck.x, duck.y, duck.w, duck.h, 8); ctx.fill();

    // Head (white)
    const headX = duck.x + duck.w - 10, headY = duck.y - 10;
    ctx.fillStyle = DUCK_WHITE;
    ctx.beginPath(); ctx.arc(headX, headY, 14, 0, Math.PI * 2); ctx.fill();

    // Beak (orange)
    ctx.fillStyle = DUCK_ORANGE;
    ctx.beginPath(); ctx.moveTo(headX + 8, headY - 2); ctx.lineTo(headX + 18, headY + 2); ctx.lineTo(headX + 8, headY + 6); ctx.closePath(); ctx.fill();

    // Eye
    ctx.fillStyle = DUCK_EYE;
    ctx.beginPath(); ctx.arc(headX - 3, headY - 3, 2.6, 0, Math.PI * 2); ctx.fill();

    // Legs (orange) when on ground
    if (duck.onGround) {
      ctx.strokeStyle = DUCK_ORANGE; ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(duck.x + 10, duck.y + duck.h); ctx.lineTo(duck.x + 10, duck.y + duck.h + 8);
      ctx.moveTo(duck.x + 24, duck.y + duck.h); ctx.lineTo(duck.x + 24, duck.y + duck.h + 8);
      ctx.stroke();
    }
  }

  function drawHUD() {
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.font = "16px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
    ctx.textAlign = "right";
    ctx.fillText(`Score: ${Math.floor(score)}`, canvas.width - 14, 24);
  }

  function drawGameOver() {
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.font = "22px system-ui, sans-serif";
    ctx.fillText("Game Over.", canvas.width / 2, canvas.height / 2 - 8);
    ctx.font = "14px system-ui, sans-serif";
    ctx.fillText("Press R to restart", canvas.width / 2, canvas.height / 2 + 16);
  }

  // ---------- Update & loop (time-based) ----------
  let lastTs = 0;
  function update(dt) {
    if (!started || gameOver) return;

    // Clouds parallax
    clouds.forEach(c => {
      c.x -= c.spd * dt;
      if (c.x + c.w < 0) {
        c.x = canvas.width + Math.random() * 100;
        c.y = 40 + Math.random() * (canvas.height * 0.4);
      }
    });

    // Gravity & motion
    duck.vy += gravity * dt;
    duck.y += duck.vy * dt;
    if (duck.y + duck.h >= groundY()) {
      duck.y = groundY() - duck.h;
      duck.vy = 0;
      duck.onGround = true;
    }

    // Obstacles
    const dx = speedPPS * dt;
    obstacles.forEach(o => o.x -= dx);
    obstacles = obstacles.filter(o => o.x + o.w > -10);

    distSinceSpawn += dx;
    const targetGap = GAP_MIN + Math.random() * GAP_RAND;
    if (distSinceSpawn >= targetGap) {
      spawnObstacle();
      distSinceSpawn = 0;
    }

    // Collision
    for (const o of obstacles) {
      if (collide(duck, o)) { gameOver = true; break; }
    }

    // Score & difficulty
    const inc = 30 * dt; score += inc; scoreAccum += inc;
    if (scoreAccum >= 250) { speedPPS += 18; scoreAccum = 0; }
  }

  function draw(dt) {
    drawBackground();
    clouds.forEach(drawCloud);
    drawGround();
    obstacles.forEach(drawObstacle);
    drawDuck();
    drawHUD();

    if (!started && !gameOver) {
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.textAlign = "center";
      ctx.font = "16px system-ui, sans-serif";
      ctx.fillText("Press Space/▲ or Tap to start", canvas.width / 2, canvas.height / 2 + 60);
    }
    if (gameOver) drawGameOver();
  }

  function loop(ts) {
    if (!lastTs) lastTs = ts;
    const dt = Math.min((ts - lastTs) / 1000, 0.05); // clamp for stability
    lastTs = ts;
    update(dt);
    draw(dt);
    requestAnimationFrame(loop);
  }

  // Kickoff
  reset();
  requestAnimationFrame(loop);
})();