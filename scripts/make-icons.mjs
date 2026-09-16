/**
 * Generates og.png, apple-touch-icon.png and favicon.ico into src/static/.
 *
 * Needs Chrome or Edge on the machine (see scripts/chrome.mjs) and is NOT part
 * of `npm run build` — the outputs are committed, so a normal build (and CI)
 * needs nothing extra. Re-run with `npm run icons` only when the artwork or
 * the headline facts in scripts/og-card.html change.
 */
import { ensureWebSocket, launchChrome, sleep } from './chrome.mjs';
import { writeFile, mkdir, readFile, rm } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

ensureWebSocket();

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'src', 'static');

const { send, close } = await launchChrome({ profileDir: path.join(ROOT, '.icon-profile') });

try {
  await send('Page.enable');
  await mkdir(OUT, { recursive: true });

  const shoot = async (url, w, h, file) => {
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false });
    await send('Page.navigate', { url });
    await sleep(1400);
    const { data } = await send('Page.captureScreenshot', { format: 'png' });
    await writeFile(path.join(OUT, file), Buffer.from(data, 'base64'));
    console.log('  →', file);
  };

  await shoot(pathToFileURL(path.join(ROOT, 'scripts', 'og-card.html')).href, 1200, 630, 'og.png');

  // The dark variant of the mark in build.mjs's favicon.svg.
  const markUrl = 'data:text/html;charset=utf-8,' + encodeURIComponent(`<!doctype html><html><body style="margin:0;background:#08090c">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" style="display:block;width:100vw;height:100vh">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7ba3ff"/><stop offset="1" stop-color="#e7b45a"/></linearGradient></defs>
<rect width="64" height="64" rx="14" fill="#08090c"/>
<g fill="none" stroke="url(#g)" stroke-width="4.6" stroke-linecap="round">
<path d="M11 29C19 29 22 17 32 17S45 27 53 23" opacity=".5"/>
<path d="M11 44C19 44 22 32 32 32S45 42 53 38"/>
</g></svg></body></html>`);

  await shoot(markUrl, 180, 180, 'apple-touch-icon.png');
  await shoot(markUrl, 64, 64, 'favicon-64.png');

  /* Wrap the 64x64 PNG in an ICO container (PNG-in-ICO, universally supported
     by anything still asking for /favicon.ico). */
  const png = await readFile(path.join(OUT, 'favicon-64.png'));
  const header = Buffer.alloc(6); header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(1, 4);
  const entry = Buffer.alloc(16);
  entry[0] = 64; entry[1] = 64; entry[2] = 0; entry[3] = 0;
  entry.writeUInt16LE(1, 4); entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(png.length, 8); entry.writeUInt32LE(22, 12);
  await writeFile(path.join(OUT, 'favicon.ico'), Buffer.concat([header, entry, png]));
  await rm(path.join(OUT, 'favicon-64.png'));
  console.log('  → favicon.ico');
} finally {
  await close();
}
