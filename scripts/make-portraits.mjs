/**
 * Lifts the portrait off its studio background and writes a transparent WebP
 * to src/static/img/, which the build copies to assets/img/.
 *
 * Runs on any OS with Chrome or Edge: the photo is decoded, matted and
 * re-encoded inside a headless browser canvas, so there is nothing to
 * install. The matte suits a photo shot against a plain, light, even
 * backdrop — the kind a studio headshot has:
 *
 *   1. Model the backdrop row by row from the photo's left and right edges,
 *      so a gentle vignette or gradient is not mistaken for the subject.
 *   2. Mark as background whatever is visible from the top, left or right
 *      edge through pixels close to that backdrop, plus small enclosed
 *      pockets above the shoulders. Light clothing the same colour as the
 *      backdrop (a white shirt) is kept, even where it touches it.
 *   3. Unmix the outline: estimate each edge pixel's coverage from how far it
 *      sits between the subject's colour and the backdrop's, and give it the
 *      subject's colour, so hair stays soft without a light fringe.
 *   4. Crop to the subject and scale to the target width.
 *
 * Not part of `npm run build`; the output is committed. Re-run with
 * `npm run portraits` when a photo changes, then update `w`/`h` in
 * src/content/profile.mjs to the size this prints.
 *
 *   --preview <dir>   also write a PNG of each cut-out on both palettes
 */
import { ensureWebSocket, launchChrome } from './chrome.mjs';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

ensureWebSocket();

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'src', 'static', 'img');

const JOBS = [
  { src: 'src/photos/portrait-studio.jpg', out: 'portrait-studio.webp', width: 760 },
];

const previewAt = process.argv.indexOf('--preview');
const previewDir = previewAt > 0 ? path.resolve(process.argv[previewAt + 1]) : null;

/* Runs inside the page. Kept self-contained: it is serialised with toString(). */
async function cutout(dataUrl, targetWidth) {
  const img = new Image();
  img.src = dataUrl;
  await img.decode();
  const W = img.naturalWidth, H = img.naturalHeight, N = W * H;

  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);
  const px = ctx.getImageData(0, 0, W, H).data;

  /* 1. Backdrop model. The global backdrop is the median of the top rows and
        the upper halves of both sides (the lower sides are usually shoulders);
        each row then refines it from its own edges wherever those edges are
        still backdrop, carrying the last good value down past the shoulders. */
  const chan = [[], [], []];
  const take = (x, y) => { const i = (y * W + x) * 4; chan[0].push(px[i]); chan[1].push(px[i + 1]); chan[2].push(px[i + 2]); };
  for (let y = 0; y < 8; y++) for (let x = 0; x < W; x += 3) take(x, y);
  for (let y = 0; y < H / 2; y += 3) for (let x = 0; x < 8; x++) { take(x, y); take(W - 1 - x, y); }
  const median = (a) => a.sort((p, q) => p - q)[a.length >> 1];
  const bg = chan.map(median);
  const off = (c) => Math.hypot(c[0] - bg[0], c[1] - bg[1], c[2] - bg[2]);

  const edgeMean = (y, x0) => {
    const s = [0, 0, 0];
    for (let x = x0; x < x0 + 8; x++) { const i = (y * W + x) * 4; s[0] += px[i]; s[1] += px[i + 1]; s[2] += px[i + 2]; }
    return s.map((v) => v / 8);
  };
  const dist = new Float32Array(N);
  const plate = new Float32Array(N * 3);
  let L = bg, R = bg;
  for (let y = 0; y < H; y++) {
    const l = edgeMean(y, 0), r = edgeMean(y, W - 8);
    if (off(l) < 40) L = l;
    if (off(r) < 40) R = r;
    for (let x = 0; x < W; x++) {
      const k = y * W + x, i = k * 4, f = x / (W - 1);
      let d = 0;
      for (let c = 0; c < 3; c++) {
        const b = L[c] + (R[c] - L[c]) * f;
        plate[k * 3 + c] = b;
        d += (px[i + c] - b) ** 2;
      }
      dist[k] = Math.sqrt(d);
    }
  }

  /* 2. Background is what can be seen from the top, left or right edge along
        a straight run of near-backdrop pixels, grown a few pixels into nooks.
        Not a flood fill: a white shirt is the same colour as the backdrop, and
        a fill leaks into it through the single point where a collar touches
        the backdrop. The bottom edge is never a source, since a shirt usually
        runs off it. */
  const T = 38;
  const cand = new Uint8Array(N);
  for (let k = 0; k < N; k++) cand[k] = dist[k] < T ? 1 : 0;
  const isBg = new Uint8Array(N);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W && cand[y * W + x]; x++) isBg[y * W + x] = 1;
    for (let x = W - 1; x >= 0 && cand[y * W + x]; x--) isBg[y * W + x] = 1;
  }
  for (let x = 0; x < W; x++) for (let y = 0; y < H && cand[y * W + x]; y++) isBg[y * W + x] = 1;

  for (let g = 0; g < 4; g++) {
    const add = [];
    for (let k = 0; k < N; k++) {
      if (isBg[k] || !cand[k]) continue;
      const x = k % W;
      if ((x > 0 && isBg[k - 1]) || (x < W - 1 && isBg[k + 1]) || (k >= W && isBg[k - W]) || (k < N - W && isBg[k + W])) add.push(k);
    }
    for (const k of add) isBg[k] = 1;
  }

  /* Enclosed pockets of backdrop, such as a gap between hair and ear, are
     background too — but only small ones lying wholly above the shoulders,
     the first row where the subject spans most of the frame. Anything light
     that reaches the shoulders is clothing. */
  let shoulders = H;
  for (let y = 0; y < H && shoulders === H; y++) {
    let solidRun = 0;
    for (let x = 0; x < W; x++) if (!isBg[y * W + x]) solidRun++;
    if (solidRun > W * 0.6) shoulders = y;
  }
  const seen = new Uint8Array(N);
  const queue = new Int32Array(N);
  for (let k0 = 0; k0 < shoulders * W; k0++) {
    if (seen[k0] || isBg[k0] || !cand[k0]) continue;
    let head = 0, tail = 0, lowest = 0;
    queue[tail++] = k0;
    seen[k0] = 1;
    while (head < tail) {
      const k = queue[head++], x = k % W;
      lowest = Math.max(lowest, (k / W) | 0);
      const around = [x > 0 ? k - 1 : -1, x < W - 1 ? k + 1 : -1, k >= W ? k - W : -1, k < N - W ? k + W : -1];
      for (const j of around) if (j >= 0 && !seen[j] && !isBg[j] && cand[j]) { seen[j] = 1; queue[tail++] = j; }
    }
    if (lowest < shoulders && tail < 4000) for (let i = 0; i < tail; i++) isBg[queue[i]] = 1;
  }

  /* 3. Unmix the outline. A pixel on the subject's edge is part subject, part
        backdrop. Its subject colour is bled outward from a few pixels inside
        the edge, its backdrop colour comes from the plate, and its coverage is
        how far it sits from the backdrop as a share of how far the subject
        colour does. Fine hair keeps its softness without carrying the light
        fringe a hard cut leaves on a dark page. */
  const erode = (mask) => {
    const out = new Uint8Array(N);
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
      const k = y * W + x;
      out[k] = mask[k] && mask[k - 1] && mask[k + 1] && mask[k - W] && mask[k + W] ? 1 : 0;
    }
    // Keep the subject flush with the frame where it is cut by the photo's edge.
    for (let x = 0; x < W; x++) { out[(H - 1) * W + x] = mask[(H - 1) * W + x] && mask[(H - 2) * W + x]; }
    for (let y = 0; y < H; y++) {
      out[y * W] = mask[y * W] && mask[y * W + 1];
      out[y * W + W - 1] = mask[y * W + W - 1] && mask[y * W + W - 2];
    }
    return out;
  };
  const subject = new Uint8Array(N);
  for (let k = 0; k < N; k++) subject[k] = isBg[k] ? 0 : 1;
  /* Two bands. Every pixel within EDGE of the outline is unmixed against the
     colour just inside it. Sparse hair lets the backdrop through much deeper
     than that, so within HAIR of the outline a pixel is also unmixed when the
     colour well inside is dark (hair), the pixel is clearly lighter, the
     backdrop reaches it through other such pixels, and it lies on the line
     between the hair colour and the backdrop. Skin fails the line test and
     highlights inside the hair are not reached, so ears and the crown keep
     their detail. */
  const EDGE = 4, HAIR = 20;
  let edgeCore = subject;
  for (let i = 0; i < EDGE; i++) edgeCore = erode(edgeCore);
  let core = edgeCore;
  for (let i = EDGE; i < HAIR; i++) core = erode(core);

  /** Colour bled outward from `seed` pixels for `passes` rings. */
  const bleed = (seed, passes) => {
    const rgb = new Float32Array(N * 3);
    const known = new Uint8Array(N);
    for (let k = 0; k < N; k++) {
      if (!seed[k]) continue;
      known[k] = 1;
      for (let c = 0; c < 3; c++) rgb[k * 3 + c] = px[k * 4 + c];
    }
    for (let pass = 0; pass < passes; pass++) {
      const fill = [];
      for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
        const k = y * W + x;
        if (known[k]) continue;
        let n = 0; const s = [0, 0, 0];
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const j = k + dy * W + dx;
          if (!known[j]) continue;
          n++; s[0] += rgb[j * 3]; s[1] += rgb[j * 3 + 1]; s[2] += rgb[j * 3 + 2];
        }
        if (n) fill.push(k, s[0] / n, s[1] / n, s[2] / n);
      }
      for (let i = 0; i < fill.length; i += 4) {
        const k = fill[i];
        known[k] = 1;
        rgb[k * 3] = fill[i + 1]; rgb[k * 3 + 1] = fill[i + 2]; rgb[k * 3 + 2] = fill[i + 3];
      }
    }
    return { rgb, known };
  };
  // The near colour also covers the pixels the final blur reaches outside the outline.
  const near = bleed(edgeCore, EDGE + 4);
  const deep = bleed(core, HAIR);

  const lum = (a, i) => 0.3 * a[i] + 0.59 * a[i + 1] + 0.11 * a[i + 2];

  // Hair-band pixels the backdrop reaches through a chain of pixels lighter than the hair.
  const seeps = new Uint8Array(N);
  const lighter = (k) =>
    subject[k] && !core[k] && deep.known[k] && lum(deep.rgb, k * 3) < 90 && lum(px, k * 4) > lum(deep.rgb, k * 3) + 50;
  for (let pass = 0; pass < HAIR; pass++) {
    const add = [];
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
      const k = y * W + x;
      if (seeps[k] || !lighter(k)) continue;
      const open = (j) => !subject[j] || seeps[j];
      if (open(k - 1) || open(k + 1) || open(k - W) || open(k + W)) add.push(k);
    }
    if (!add.length) break;
    for (const k of add) seeps[k] = 1;
  }

  let alpha = new Float32Array(N);
  const colour = new Uint8Array(N); // 0 = photograph, 1 = near bleed, 2 = deep bleed
  for (let k = 0; k < N; k++) {
    if (!subject[k]) { if (near.known[k]) colour[k] = 1; continue; }
    alpha[k] = 1;
    if (seeps[k]) {
      // Project the pixel onto the hair→backdrop line; accept only if it sits close to it.
      let dot = 0, len = 0;
      for (let c = 0; c < 3; c++) {
        const f = deep.rgb[k * 3 + c] - plate[k * 3 + c];
        dot += (px[k * 4 + c] - plate[k * 3 + c]) * f;
        len += f * f;
      }
      const a = Math.max(0, Math.min(1, dot / len));
      let off = 0;
      for (let c = 0; c < 3; c++) {
        off += (px[k * 4 + c] - (plate[k * 3 + c] + a * (deep.rgb[k * 3 + c] - plate[k * 3 + c]))) ** 2;
      }
      if (Math.sqrt(off) < 25) { alpha[k] = a; colour[k] = 2; continue; }
    }
    if (!edgeCore[k] && near.known[k]) {
      let span = 0;
      for (let c = 0; c < 3; c++) span += (near.rgb[k * 3 + c] - plate[k * 3 + c]) ** 2;
      span = Math.sqrt(span);
      // A subject colour close to the backdrop (a white collar) cannot be unmixed; keep it whole.
      if (span >= 60) { alpha[k] = Math.min(1, dist[k] / span); colour[k] = 1; }
    }
  }

  // One separable 1-2-1 pass smooths the stair-steps of the pixel grid.
  const blur = (a, stepK) => {
    const o = new Float32Array(N);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const k = y * W + x;
      const prev = stepK === 1 ? (x > 0 ? k - 1 : k) : (y > 0 ? k - W : k);
      const next = stepK === 1 ? (x < W - 1 ? k + 1 : k) : (y < H - 1 ? k + W : k);
      o[k] = (a[prev] + 2 * a[k] + a[next]) / 4;
    }
    return o;
  };
  alpha = blur(blur(alpha, 1), W);

  const outData = ctx.createImageData(W, H);
  const o = outData.data;
  let minX = W, minY = H, maxX = -1, maxY = -1;
  for (let k = 0; k < N; k++) {
    const a = alpha[k];
    // Opaque pixels keep the photograph's own detail; only see-through ones take a bled colour.
    const src = colour[k] === 2 ? deep.rgb : colour[k] === 1 && !(subject[k] && a >= 0.99) ? near.rgb : null;
    o[k * 4] = src ? src[k * 3] : px[k * 4];
    o[k * 4 + 1] = src ? src[k * 3 + 1] : px[k * 4 + 1];
    o[k * 4 + 2] = src ? src[k * 3 + 2] : px[k * 4 + 2];
    o[k * 4 + 3] = Math.round(a * 255);
    if (a > 0.02) {
      const x = k % W, y = (k / W) | 0;
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
  }
  ctx.putImageData(outData, 0, 0);

  /* 4. Crop and scale. */
  const cw = maxX - minX + 1, ch = maxY - minY + 1;
  const tw = Math.min(targetWidth, cw);
  const th = Math.round((ch * tw) / cw);
  const out = document.createElement('canvas');
  out.width = tw; out.height = th;
  const octx = out.getContext('2d');
  octx.imageSmoothingQuality = 'high';
  octx.drawImage(canvas, minX, minY, cw, ch, 0, 0, tw, th);

  // Preview: the cut-out on the dark and light page colours, side by side.
  const pv = document.createElement('canvas');
  pv.width = tw * 2; pv.height = th;
  const pctx = pv.getContext('2d');
  pctx.fillStyle = '#08090c'; pctx.fillRect(0, 0, tw, th);
  pctx.fillStyle = '#f7f6f3'; pctx.fillRect(tw, 0, tw, th);
  pctx.drawImage(out, 0, 0); pctx.drawImage(out, tw, 0);

  return {
    width: tw,
    height: th,
    webp: out.toDataURL('image/webp', 0.86),
    preview: pv.toDataURL('image/png'),
    crop: { x: minX, y: minY, w: cw, h: ch, of: `${W}x${H}` },
  };
}

const { evaluate, close } = await launchChrome({ profileDir: path.join(ROOT, '.icon-profile') });
try {
  await mkdir(OUT, { recursive: true });
  for (const job of JOBS) {
    const bytes = await readFile(path.join(ROOT, job.src));
    const mime = /\.png$/i.test(job.src) ? 'image/png' : 'image/jpeg';
    const dataUrl = `data:${mime};base64,${bytes.toString('base64')}`;
    const r = await evaluate(`(${cutout.toString()})(${JSON.stringify(dataUrl)}, ${job.width})`);

    const webp = Buffer.from(r.webp.split(',')[1], 'base64');
    if (!r.webp.startsWith('data:image/webp')) throw new Error('This browser cannot encode WebP.');
    await writeFile(path.join(OUT, job.out), webp);
    console.log(`  → ${job.out}  ${r.width}×${r.height}  ${(webp.length / 1024).toFixed(1)} kB  (subject ${r.crop.w}×${r.crop.h} at ${r.crop.x},${r.crop.y} of ${r.crop.of})`);

    if (previewDir) {
      await mkdir(previewDir, { recursive: true });
      const file = path.join(previewDir, job.out.replace(/\.webp$/, '.preview.png'));
      await writeFile(file, Buffer.from(r.preview.split(',')[1], 'base64'));
      console.log(`    preview ${file}`);
    }
  }
  console.log('\n  Update w/h in src/content/profile.mjs if the size changed.\n');
} finally {
  await close();
}
