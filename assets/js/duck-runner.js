/* Duck Runner — v6
 * - Time-based physics (60fps)
 * - Pekin duck look (white body, orange beak/legs)
 * - Larger obstacle gaps; fixed palette independent of theme
 * - Hero vignette; funny touches (jump "quack!" bubble, occasional hat)
 */
(function () {
  const canvas = document.getElementById("duckCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  // Combine colors and constants
  const C = {
    SKY: { TOP: "#0e1224", BOTTOM: "#0b0f1a" },
    DUCK: { WHITE: "#ffffff", ORANGE: "#f59e0b", EYE: "#0b0d10" },
    MISC: {
      GROUND: "rgba(255,255,255,0.20)",
      CLOUD: "rgba(255,255,255,0.70)",
      OBSTACLE: "rgba(255,255,255,0.92)"
    },
    GAME: {
      SPEED: 270,
      GRAVITY: 720,
      JUMP: -405,
      GAP: { MIN: 380, RAND: 180 }
    }
  };

  /* ---------- Game state ---------- */
  let started = false;
  let gameOver = false;

  let score = 0;
  let scoreAccum = 0;

  // Slightly brisk starting speed
  let speedPPS = 270;
  const gravity = 720;
  const jumpVel = -405;

  const groundY = () => canvas.height - 40;

  const duck = {
    x: 80,
    y: 0,
    w: 44,
    h: 34,
    vy: 0,
    onGround: true,
  };

  // Duck cosmetics (funny): occasional tiny hat
  const cosmetics = {
    hat: Math.random() < 0.25, // 25% of runs
  };

  // "Quack!" bubble when jumping (brief)
  let quackTimer = 0;

  // Obstacles & clouds & ground ticks
  let obstacles = [];
  let clouds = [];
  let ticks = [];
  let distSinceSpawn = 0;

  // Simplified resize with ratio constant
  const RATIO = 1200 / 400;
  const resize = () => {
    const w = Math.min(window.innerWidth * 0.92, 1100);
    canvas.width = w;
    canvas.height = w / RATIO;
  };
  resize();
  window.addEventListener("resize", resize);

  function spawnObstacle() {
    const h = 30 + Math.random() * 35;
    const w = 18 + Math.random() * 20;

    obstacles.push({
      x: canvas.width + 10,
      y: groundY() - h,
      w,
      h,
      bread: Math.random() < 0.2, // 20%: render as a bread slice for comedy
    });
  }

  // Combined cloud and tick spawn with array generation
  const generateItems = (count, factory) => Array.from({length: count}, factory);
  
  const spawnClouds = () => {
    clouds = generateItems(4, () => ({
      x: Math.random() * canvas.width,
      y: 40 + Math.random() * (canvas.height * 0.4),
      w: 60 + Math.random() * 50,
      h: 20 + Math.random() * 10,
      spd: 20 + Math.random() * 20
    }));
  };

  const spawnTicks = () => {
    const spacing = canvas.width / 24;
    ticks = generateItems(24, (_, i) => ({
      x: i * spacing + (Math.random() * 10 - 5),
      w: 18 + Math.random() * 16
    }));
  };

  /* ---------- Controls ---------- */
  function jump() {
    if (!started) started = true;
    if (gameOver) return;

    if (duck.onGround) {
      duck.vy = jumpVel;
      duck.onGround = false;
      quackTimer = 0.25; // seconds
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

  canvas.addEventListener("pointerdown", jump);

  /* ---------- Helpers ---------- */
  function reset() {
    started = false;
    gameOver = false;

    score = 0;
    scoreAccum = 0;

    speedPPS = 270;
    obstacles = [];
    distSinceSpawn = 0;

    spawnClouds();
    spawnTicks();

    cosmetics.hat = Math.random() < 0.25;
    quackTimer = 0;

    duck.y = groundY() - duck.h;
    duck.vy = 0;
    duck.onGround = true;

    draw(0);
  }

  function collide(a, b) {
    return (
      a.x < b.x + b.w &&
      a.x + a.w > b.x &&
      a.y < b.y + b.h &&
      a.y + a.h > b.y
    );
  }

  /* ---------- Drawing ---------- */
  function drawBackground() {
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, C.SKY.TOP);
    grad.addColorStop(1, C.SKY.BOTTOM);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  function drawGround() {
    // Ground line
    ctx.strokeStyle = C.MISC.GROUND;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, groundY());
    ctx.lineTo(canvas.width, groundY());
    ctx.stroke();

    // Ticks (dashes) for sense of speed
    ctx.strokeStyle = "rgba(255,255,255,0.20)";
    ctx.lineWidth = 2;
    ticks.forEach((t) => {
      ctx.beginPath();
      ctx.moveTo(t.x, groundY() + 8);
      ctx.lineTo(t.x + t.w, groundY() + 8);
      ctx.stroke();
    });
  }

  function drawCloud(c) {
    ctx.fillStyle = C.MISC.CLOUD;
    ctx.beginPath();
    ctx.roundRect(c.x, c.y, c.w, c.h, 12);
    ctx.fill();
  }

  function drawObstacle(o) {
    ctx.save();
    ctx.translate(o.x, o.y);
    if (o.bread) {
      // Bread slice
      ctx.fillStyle = "#f5deb3";
      ctx.strokeStyle = C.MISC.OBSTACLE;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(0, 0, o.w + 12, o.h, 6);
      ctx.fill();
      ctx.stroke();

      // Crust
      ctx.strokeStyle = "#b08968";
      ctx.beginPath();
      ctx.roundRect(2, 2, o.w + 8, o.h - 4, 5);
      ctx.stroke();
    } else {
      // Default block
      ctx.fillStyle = C.MISC.OBSTACLE;
      ctx.beginPath();
      ctx.roundRect(0, 0, o.w, o.h, 4);
      ctx.fill();
    }
    ctx.restore();
  }

  const drawShape = (x, y, w, h, radius = 0) => {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, radius);
    ctx.fill();
  };

  const withStyle = (style, fn) => {
    ctx.fillStyle = style;
    fn();
  };

  function drawDuck() {
    const {x, y, w, h} = duck;
    const headX = x + w - 10;
    const headY = y - 10;

    withStyle(C.DUCK.WHITE, () => {
      drawShape(x, y, w, h, 8);
      ctx.beginPath();
      ctx.arc(headX, headY, 14, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw beak
    withStyle(C.DUCK.ORANGE, () => {
      ctx.beginPath();
      ctx.moveTo(headX + 8, headY - 2);
      ctx.lineTo(headX + 18, headY + 2);
      ctx.lineTo(headX + 8, headY + 6);
      ctx.closePath();
      ctx.fill();
    });

    // Eye
    ctx.fillStyle = C.DUCK.EYE;
    ctx.beginPath();
    ctx.arc(headX - 3, headY - 3, 2.6, 0, Math.PI * 2);
    ctx.fill();

    // Tiny hat
    if (cosmetics.hat) {
      ctx.fillStyle = "#dc2626";
      ctx.fillRect(headX - 9, headY - 20, 18, 6); // brim
      ctx.fillStyle = "#991b1b";
      ctx.fillRect(headX - 6, headY - 32, 12, 12); // crown
    }

    // Legs when grounded
    if (duck.onGround) {
      ctx.strokeStyle = C.DUCK.ORANGE;
      ctx.lineWidth = 3;

      ctx.beginPath();
      ctx.moveTo(duck.x + 10, duck.y + duck.h);
      ctx.lineTo(duck.x + 10, duck.y + duck.h + 8);

      ctx.moveTo(duck.x + 24, duck.y + duck.h);
      ctx.lineTo(duck.x + 24, duck.y + duck.h + 8);
      ctx.stroke();
    }
  }

  function drawQuackBubble(dt) {
    if (quackTimer <= 0) return;

    const bx = duck.x + duck.w + 8;
    const by = duck.y - 28;

    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, quackTimer / 0.25));
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.strokeStyle = "rgba(0,0,0,0.15)";
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.roundRect(bx, by, 44, 20, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#111827";
    ctx.font = "12px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
    ctx.textAlign = "center";
    ctx.fillText("quack", bx + 22, by + 14);

    ctx.restore();
  }

  function drawHUD() {
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.font = "16px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
    ctx.textAlign = "right";
    ctx.fillText(`Score: ${Math.floor(score)}`, canvas.width - 14, 24);
  }

  function drawVignette() {
    const g = ctx.createRadialGradient(
      canvas.width / 2,
      canvas.height * 0.45,
      Math.min(canvas.width, canvas.height) * 0.25,
      canvas.width / 2,
      canvas.height * 0.45,
      Math.max(canvas.width, canvas.height) * 0.75
    );
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, "rgba(0,0,0,0.45)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
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

  /* ---------- Update & loop ---------- */
  let lastTs = 0;

  // Combined update logic for moving objects
  const updateMoving = (dt) => {
    clouds.forEach(c => {
      c.x -= c.spd * dt;
      if (c.x + c.w < 0) {
        c.x = canvas.width + Math.random() * 100;
        c.y = 40 + Math.random() * (canvas.height * 0.4);
      }
    });

    const dx = C.GAME.SPEED * dt;
    obstacles.forEach(o => o.x -= dx);
    obstacles = obstacles.filter(o => o.x + o.w > -10);
  };

  function update(dt) {
    if (!started || gameOver) {
      quackTimer = Math.max(0, quackTimer - dt);
      return;
    }

    updateMoving(dt);
    
    // Physics update
    duck.vy += C.GAME.GRAVITY * dt;
    duck.y += duck.vy * dt;
    
    if (duck.y + duck.h >= groundY()) {
      duck.y = groundY() - duck.h;
      duck.vy = 0;
      duck.onGround = true;
    }

    // Obstacles
    const dx = speedPPS * dt;
    obstacles.forEach((o) => (o.x -= dx));
    obstacles = obstacles.filter((o) => o.x + o.w > -10);

    distSinceSpawn += dx;
    const targetGap = C.GAME.GAP.MIN + Math.random() * C.GAME.GAP.RAND;
    if (distSinceSpawn >= targetGap) {
      spawnObstacle();
      distSinceSpawn = 0;
    }

    // Collision
    for (const o of obstacles) {
      if (collide(duck, o)) {
        gameOver = true;
        break;
      }
    }

    // Score & difficulty
    const inc = 30 * dt;
    score += inc;
    scoreAccum += inc;
    if (scoreAccum >= 250) {
      speedPPS += 18;
      scoreAccum = 0;
    }

    // Quack bubble decay
    if (quackTimer > 0) quackTimer = Math.max(0, quackTimer - dt);
  }

  function draw(dt) {
    drawBackground();
    clouds.forEach(drawCloud);
    drawGround();
    obstacles.forEach(drawObstacle);
    drawDuck();
    drawQuackBubble(dt);
    drawHUD();
    drawVignette();

    if (!started && !gameOver) {
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.textAlign = "center";
      ctx.font = "16px system-ui, sans-serif";
      ctx.fillText("Press Space/▲ or Tap to start", canvas.width / 2, canvas.height / 2 + 60);
    }

    if (gameOver) {
      drawGameOver();
    }
  }

  function loop(ts) {
    if (!lastTs) lastTs = ts;
    const dt = Math.min((ts - lastTs) / 1000, 0.05);
    lastTs = ts;

    update(dt);
    draw(dt);
    requestAnimationFrame(loop);
  }

  // Kickoff
  reset();
  requestAnimationFrame(loop);
})();