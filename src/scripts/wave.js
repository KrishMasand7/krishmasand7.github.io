/**
 * Hero backdrop: a rolling surface of ridgelines, drawn in 3D on a 2D canvas.
 *
 * A height field — slow travelling waves over a soft rise and dip — is
 * sampled on a grid, rotated, projected with perspective and drawn back to
 * front, one line per row. Each line is filled beneath with the page colour
 * before it is stroked, so nearer ridges hide the ones behind them the way a
 * solid surface would. Every line runs from the web blue to the ML gold, the
 * same pairing as the reading-progress bar at the top of the page.
 *
 * 40 lines of 90 points; one rAF loop that parks itself when the hero
 * scrolls away or the tab is hidden.
 */

const ROWS = 40;
const COLS = 90;
const HALF_W = 6.4;   // surface half-width, world units
const HALF_D = 4.4;   // surface half-depth

/** Surface height at (x, z) and time t. Smooth, slow, never repeating exactly. */
function height(x, z, t) {
  return (
    0.42 * Math.sin(x * 0.8 + t * 0.5) * Math.cos(z * 0.65 - t * 0.32) +
    0.2 * Math.sin((x - z) * 1.3 + t * 0.85) +
    1.1 * Math.exp(-((x - 1.5) ** 2 + (z + 0.4) ** 2) / 4.4) * (0.8 + 0.2 * Math.sin(t * 0.37)) -
    0.55 * Math.exp(-((x + 2.4) ** 2 + (z - 1.3) ** 2) / 3.4)
  );
}

const smooth = (e0, e1, v) => {
  const u = Math.max(0, Math.min(1, (v - e0) / (e1 - e0)));
  return u * u * (3 - 2 * u);
};

export function mountWave(canvas) {
  if (!canvas || !canvas.getContext) return () => {};
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return () => {};

  const sx = new Float32Array(COLS);
  const sy = new Float32Array(COLS);

  /* The canvas is transparent and composited over the page, so it has to be
     told which palette is in force. Reading the tokens rather than hard-coding
     them keeps 01-tokens.css the only place a colour is defined — and the same
     ink weights that read as "faint" on a near-black page read as "invisible"
     on paper, hence the gain multiplier. */
  const cssVar = (name, fallback) => {
    const v = getComputedStyle(canvas).getPropertyValue(name).trim();
    return v || fallback;
  };
  const rgb = (name, fallback) => {
    const parts = cssVar(name, fallback).split(/[\s,]+/).map(Number);
    return parts.length === 3 && parts.every((n) => Number.isFinite(n)) ? parts : fallback.split(' ').map(Number);
  };

  let web, ml, ink, gain;
  function readPalette() {
    web = rgb('--wave-web', '123 163 255');
    ml = rgb('--wave-ml', '231 180 90');
    ink = cssVar('--ink', '#08090c');
    gain = Number(cssVar('--wave-gain', '1')) || 1;
  }
  readPalette();

  const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${Math.max(0, Math.min(1, a)).toFixed(3)})`;
  const mid = () => web.map((c, i) => Math.round((c + ml[i]) / 2));

  let w = 0, h = 0, dpr = 1;
  let time = 0, lastTs = 0;
  let targetX = 0, targetY = 0, easeX = 0, easeY = 0;
  let raf = 0, running = false, visible = true;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = Math.max(1, rect.width);
    h = Math.max(1, rect.height);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function draw() {
    // Ease toward the pointer so the parallax glides rather than jumps.
    easeX += (targetX - easeX) * 0.04;
    easeY += (targetY - easeY) * 0.04;

    const yaw = -0.32 + Math.sin(time * 0.11) * 0.14 + easeX * 0.14;
    const pitch = 0.46 + easeY * 0.06;
    const cosY = Math.cos(yaw), sinY = Math.sin(yaw);
    const cosX = Math.cos(pitch), sinX = Math.sin(pitch);

    // Anchor toward the right of the frame; the copy occupies the left.
    const cx = w * (w < 780 ? 0.5 : 0.72);
    const cy = h * (w < 780 ? 0.4 : 0.44);
    const scale = Math.min(w, h) * (w < 780 ? 0.055 : 0.074);
    const depth = 15;
    const middle = mid();

    ctx.clearRect(0, 0, w, h);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    // Far rows first; each row's fill hides whatever lies behind and below it.
    for (let r = ROWS - 1; r >= 0; r--) {
      const z = -HALF_D + (2 * HALF_D * r) / (ROWS - 1);
      let persp = 1;
      for (let c = 0; c < COLS; c++) {
        const x = -HALF_W + (2 * HALF_W * c) / (COLS - 1);
        const y = height(x, z, time);
        const x1 = x * cosY - z * sinY;
        const z1 = x * sinY + z * cosY;
        const up = y * cosX + z1 * sinX;
        const away = z1 * cosX - y * sinX;
        persp = depth / (depth + away);
        sx[c] = cx + x1 * scale * persp;
        sy[c] = cy - up * scale * persp;
      }

      ctx.beginPath();
      ctx.moveTo(sx[0], sy[0]);
      for (let c = 1; c < COLS; c++) ctx.lineTo(sx[c], sy[c]);
      ctx.lineTo(sx[COLS - 1], h + 10);
      ctx.lineTo(sx[0], h + 10);
      ctx.closePath();
      ctx.globalAlpha = 1;
      ctx.fillStyle = ink;
      ctx.fill();

      // Nearer rows read stronger; the first and last few fade out entirely.
      const t = r / (ROWS - 1);
      const a = (0.13 + (1 - t) * 0.5) * smooth(0, 0.12, t) * smooth(1, 0.8, t) * gain;
      const grad = ctx.createLinearGradient(sx[0], 0, sx[COLS - 1], 0);
      grad.addColorStop(0, rgba(web, 0));
      grad.addColorStop(0.16, rgba(web, a));
      grad.addColorStop(0.5, rgba(middle, a * 0.9));
      grad.addColorStop(0.84, rgba(ml, a));
      grad.addColorStop(1, rgba(ml, 0));

      ctx.beginPath();
      ctx.moveTo(sx[0], sy[0]);
      for (let c = 1; c < COLS; c++) ctx.lineTo(sx[c], sy[c]);
      ctx.strokeStyle = grad;
      ctx.lineWidth = Math.max(0.6, 1.15 * persp);
      ctx.stroke();
    }
  }

  function frame(now) {
    raf = 0;
    if (!running) return;
    const dt = lastTs ? Math.min(0.05, (now - lastTs) / 1000) : 1 / 60;
    lastTs = now;
    time += dt;
    draw();
    raf = requestAnimationFrame(frame);
  }

  function start() {
    if (running || !visible) return;
    running = true;
    lastTs = 0;
    if (!raf) raf = requestAnimationFrame(frame);
  }
  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  const onPointer = (e) => {
    targetX = (e.clientX / window.innerWidth - 0.5) * 2;
    targetY = (e.clientY / window.innerHeight - 0.5) * 2;
  };
  const onVisibility = () => (document.hidden ? stop() : start());
  const onResize = () => { resize(); if (!running) draw(); };
  /* main.js fires this after the palette attribute changes. */
  const onTheme = () => { readPalette(); if (!running) draw(); };

  resize();

  const io = 'IntersectionObserver' in window
    ? new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        visible ? start() : stop();
      }, { threshold: 0 })
    : null;
  if (io) io.observe(canvas); else { visible = true; }

  window.addEventListener('resize', onResize, { passive: true });
  window.addEventListener('themechange', onTheme);
  document.addEventListener('visibilitychange', onVisibility);
  if (window.matchMedia('(pointer: fine)').matches) {
    window.addEventListener('pointermove', onPointer, { passive: true });
  }

  draw();
  start();
  canvas.dataset.ready = 'true';

  return () => {
    stop();
    io && io.disconnect();
    window.removeEventListener('resize', onResize);
    window.removeEventListener('themechange', onTheme);
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('pointermove', onPointer);
  };
}
