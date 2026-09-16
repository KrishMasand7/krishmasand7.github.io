/**
 * Static checks on the generated output. No dependencies, no network.
 * Run with `npm run check` (which builds first) or `node scripts/verify.mjs`.
 */
import { readFile, stat, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { gzipSync } from 'node:zlib';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fails = [];
const warns = [];
const ok = [];

const fail = (m) => fails.push(m);
const warn = (m) => warns.push(m);
const pass = (m) => ok.push(m);

const html = await readFile(path.join(ROOT, 'index.html'), 'utf8');

/* ── required files ───────────────────────────────────────────────────── */

const required = [
  'index.html', '404.html', '.nojekyll', 'robots.txt', 'sitemap.xml',
  'favicon.svg', 'favicon.ico', 'apple-touch-icon.png', 'og.png', 'site.webmanifest',
  'assets/js/main.js', 'assets/js/wave.js',
  'assets/fonts/inter-latin-normal.woff2', 'assets/fonts/newsreader-latin-normal.woff2',
  'assets/img/portrait-studio.webp',
];
for (const f of required) {
  existsSync(path.join(ROOT, f)) ? pass(`present  ${f}`) : fail(`missing  ${f}`);
}

/* ── every local asset the document references actually exists ────────── */

const refs = new Set();
for (const m of html.matchAll(/(?:href|src)="([^"#][^"]*)"/g)) refs.add(m[1]);
for (const m of html.matchAll(/url\('([^']+)'\)/g)) refs.add(m[1]);
let missing = 0;
for (const r of refs) {
  if (/^(https?:|mailto:|data:|#|\/\/)/.test(r)) continue;
  const p = path.join(ROOT, r.replace(/^\//, ''));
  if (!existsSync(p)) { fail(`broken local reference: ${r}`); missing += 1; }
}
if (!missing) pass(`all ${[...refs].filter((r) => !/^(https?:|mailto:|data:|#)/.test(r)).length} local references resolve`);

/* ── in-page anchors resolve to real ids ──────────────────────────────── */

const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
let badAnchor = 0;
for (const m of html.matchAll(/href="#([^"]+)"/g)) {
  if (!ids.has(m[1])) { fail(`anchor #${m[1]} has no matching id`); badAnchor += 1; }
}
if (!badAnchor) pass('every in-page anchor resolves');

/* ── aria-controls point at real elements ─────────────────────────────── */

let badAria = 0;
for (const m of html.matchAll(/aria-controls="([^"]+)"/g)) {
  if (!ids.has(m[1])) { fail(`aria-controls="${m[1]}" has no matching id`); badAria += 1; }
}
if (!badAria) pass('every aria-controls target exists');

/* ── labelledby targets ───────────────────────────────────────────────── */

let badLabel = 0;
for (const m of html.matchAll(/aria-labelledby="([^"]+)"/g)) {
  if (!ids.has(m[1])) { fail(`aria-labelledby="${m[1]}" has no matching id`); badLabel += 1; }
}
if (!badLabel) pass('every aria-labelledby target exists');

/* ── duplicate ids ────────────────────────────────────────────────────── */

const idList = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
const dupes = idList.filter((v, i) => idList.indexOf(v) !== i);
dupes.length ? fail(`duplicate ids: ${[...new Set(dupes)].join(', ')}`) : pass('no duplicate ids');

/* ── document essentials ──────────────────────────────────────────────── */

const must = [
  [/<html lang="en">/, 'html lang'],
  [/<title>[^<]{20,}<\/title>/, 'title'],
  [/<meta name="description" content="[^"]{80,}"/, 'meta description'],
  [/<link rel="canonical"/, 'canonical link'],
  [/<meta property="og:image"/, 'og:image'],
  [/<meta name="twitter:card"/, 'twitter card'],
  [/"@type":"Person"/, 'Person structured data'],
  [/<main id="main">/, 'main landmark'],
  [/class="skip-link"/, 'skip link'],
  [/<h1[ >]/, 'h1'],
  [/data-wave/, 'hero canvas'],
];
for (const [re, label] of must) (re.test(html) ? pass : fail)(`${re.test(html) ? 'has' : 'missing'}  ${label}`);

const h1s = [...html.matchAll(/<h1[\s>]/g)].length;
h1s === 1 ? pass('exactly one h1') : fail(`expected 1 h1, found ${h1s}`);

/* Nav links and sections move together: an empty optional section must take
   its nav entry with it. The in-page anchor check above covers the reverse. */
for (const m of html.matchAll(/<a href="#([^"]+)" data-nav-link>/g)) {
  if (!new RegExp(`<section[^>]+id="${m[1]}"`).test(html)) fail(`nav link #${m[1]} has no section`);
}

/* ── both palettes are present, and only in the token layer ───────────── */

const style = (html.match(/<style>([\s\S]*?)<\/style>/) || [, ''])[1];
const themeChecks = [
  [style, /:root\[data-theme='light'\]/, 'explicit light palette'],
  [style, /@media \(prefers-color-scheme: light\) \{\s*:root:not\(\[data-theme='dark'\]\)/, 'system light palette'],
  [html, /data-theme-toggle/, 'theme toggle control'],
  [html, /localStorage\.getItem\('theme'\)/, 'pre-paint theme script'],
];
for (const [hay, re, label] of themeChecks) {
  re.test(hay) ? pass(`has  ${label}`) : fail(`missing  ${label}`);
}

/* Every colour lives in 01-tokens.css, which is what makes a second palette
   a change to one file rather than a sweep of the stylesheet. The print
   palette in 08-motion.css is the one sanctioned exception. */
const styleDir = path.join(ROOT, 'src', 'styles');
const strays = [];
for (const f of (await readdir(styleDir)).sort()) {
  if (!f.endsWith('.css') || f === '01-tokens.css') continue;
  let css = await readFile(path.join(styleDir, f), 'utf8');
  css = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const print = css.indexOf('@media print');
  if (print >= 0) css = css.slice(0, print);
  for (const m of css.matchAll(/(#[0-9a-fA-F]{3,8}\b|\brgba?\([\d.\s,%]+\))/g)) strays.push(`${f}: ${m[1]}`);
}
strays.length
  ? fail(`literal colours outside the token layer — ${strays.join(', ')}`)
  : pass('every colour outside 01-tokens.css comes from a token');

/* ── external links must be safe and absolute ─────────────────────────── */

const externals = [...html.matchAll(/<a\b[^>]*href="(https?:[^"]+)"[^>]*>/g)];
let unsafe = 0;
for (const [tag, href] of externals) {
  if (!/rel="[^"]*noopener/.test(tag)) { fail(`external link without rel=noopener: ${href}`); unsafe += 1; }
  if (!/target="_blank"/.test(tag)) warn(`external link without target=_blank: ${href}`);
}
if (!unsafe) pass(`all ${externals.length} external links carry rel="noopener noreferrer"`);

/* ── weight budget ────────────────────────────────────────────────────── */

const bytes = async (p) => (existsSync(path.join(ROOT, p)) ? (await stat(path.join(ROOT, p))).size : 0);
const htmlGz = gzipSync(Buffer.from(html)).length;
const jsRaw = (await bytes('assets/js/main.js')) + (await bytes('assets/js/wave.js'));
const fontDir = path.join(ROOT, 'assets', 'fonts');
let fontBytes = 0;
for (const f of await readdir(fontDir)) fontBytes += (await stat(path.join(fontDir, f))).size;

const kb = (n) => `${(n / 1024).toFixed(1)} kB`;
const imgDir = path.join(ROOT, 'assets', 'img');
let imgBytes = 0;
for (const f of await readdir(imgDir)) imgBytes += (await stat(path.join(imgDir, f))).size;

const budget = [
  ['index.html (gzipped)', htmlGz, 60 * 1024],
  ['JavaScript (raw)', jsRaw, 40 * 1024],
  ['fonts', fontBytes, 260 * 1024],
  ['portraits', imgBytes, 120 * 1024],
];
for (const [label, size, max] of budget) {
  size <= max ? pass(`${label.padEnd(22)} ${kb(size)}  (budget ${kb(max)})`)
              : warn(`${label} is ${kb(size)}, over the ${kb(max)} budget`);
}

/* ── report ───────────────────────────────────────────────────────────── */

console.log('\n  Static checks\n');
for (const m of ok) console.log(`   ✓ ${m}`);
for (const m of warns) console.log(`   ! ${m}`);
for (const m of fails) console.log(`   ✗ ${m}`);
console.log(`\n  ${ok.length} passed, ${warns.length} warnings, ${fails.length} failures\n`);
process.exit(fails.length ? 1 : 0);
