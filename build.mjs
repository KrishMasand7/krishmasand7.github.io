/**
 * Static build for krishmasand7.github.io.
 *
 * GitHub Pages will serve this repository with the classic (branch-based)
 * builder from `main` at `/`, so the generated output is written to the
 * repository root and committed. `.nojekyll` stops Jekyll from touching it.
 * There is no server, no runtime dependency and no npm install —
 * `node build.mjs` is the whole pipeline.
 */

import { readFile, writeFile, mkdir, readdir, copyFile, rm, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(ROOT, 'src');
const OUT = ROOT;
const ASSETS = path.join(OUT, 'assets');

const rel = (p) => path.relative(ROOT, p) || '.';
const log = (...a) => console.log(...a);
/* Dynamic import needs a file URL on Windows; the query busts the module cache in --watch. */
const fresh = (p) => `${pathToFileURL(p).href}?v=${Date.now()}`;

/* ── CSS ──────────────────────────────────────────────────────────────── */

/** Conservative: drop block comments, trim lines, drop blank lines. Nothing
 *  that could change selector or value semantics. */
function squeezeCss(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .join('\n');
}

async function buildCss() {
  const dir = path.join(SRC, 'styles');
  const files = (await readdir(dir)).filter((f) => f.endsWith('.css')).sort();
  const parts = [];
  for (const f of files) parts.push(await readFile(path.join(dir, f), 'utf8'));
  // Inlined into <style>, so font URLs must resolve against the document.
  const css = squeezeCss(parts.join('\n')).replace(/url\('fonts\//g, "url('assets/fonts/");
  return { css, files };
}

/* ── static passthrough ───────────────────────────────────────────────── */

async function copyTree(from, to) {
  if (!existsSync(from)) return 0;
  await mkdir(to, { recursive: true });
  let n = 0;
  for (const entry of await readdir(from, { withFileTypes: true })) {
    const s = path.join(from, entry.name);
    const d = path.join(to, entry.name);
    if (entry.isDirectory()) n += await copyTree(s, d);
    else { await copyFile(s, d); n += 1; }
  }
  return n;
}

/* ── generated files ──────────────────────────────────────────────────── */

/* Two ridgelines running blue to gold — the hero surface in miniature. An SVG
   favicon carries its own stylesheet, and browsers evaluate
   prefers-color-scheme inside it against the *browser* chrome, which is what
   puts a dark tab strip and a dark favicon together. scripts/make-icons.mjs
   draws the same mark for the PNG and ICO fallbacks. */
const FAVICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
<style>
.bg{fill:#08090c}.s1{stop-color:#7ba3ff}.s2{stop-color:#e7b45a}
@media(prefers-color-scheme:light){.bg{fill:#f7f6f3}.s1{stop-color:#2c55d4}.s2{stop-color:#7f550c}}
</style>
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" class="s1"/><stop offset="1" class="s2"/></linearGradient></defs>
<rect class="bg" width="64" height="64" rx="14"/>
<g fill="none" stroke="url(#g)" stroke-width="4.6" stroke-linecap="round">
<path d="M11 29C19 29 22 17 32 17S45 27 53 23" opacity=".5"/>
<path d="M11 44C19 44 22 32 32 32S45 42 53 38"/>
</g>
</svg>`;

const MANIFEST = (meta) => JSON.stringify({
  name: meta.name,
  short_name: meta.shortName,
  description: meta.ogDescription,
  start_url: '/',
  scope: '/',
  display: 'standalone',
  background_color: '#08090c',
  theme_color: '#08090c',
  icons: [
    { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
    { src: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
  ],
}, null, 2);

const ROBOTS = (url) => `User-agent: *\nAllow: /\n\nSitemap: ${url}/sitemap.xml\n`;

const SITEMAP = (url, iso) =>
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${url}/</loc>
    <lastmod>${iso}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`;

const NOT_FOUND = (css, meta) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Page not found — ${meta.name}</title>
<meta name="robots" content="noindex">
<meta name="theme-color" content="#08090c" media="(prefers-color-scheme: dark)">
<meta name="theme-color" content="#f7f6f3" media="(prefers-color-scheme: light)">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<script>document.documentElement.classList.add('js');try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}</script>
<style>${css}</style>
</head>
<body>
<main id="main" class="section" style="display:grid;place-items:center;min-height:100svh;text-align:center">
  <div class="shell" style="max-width:38rem">
    <p class="mono" style="color:var(--fg-3)">Error 404</p>
    <h1 class="sec-title" style="margin-top:1.25rem">This page does not exist.</h1>
    <p class="sec-summary" style="margin-inline:auto">The link may be out of date. Everything lives on one page at the root of this site.</p>
    <p style="margin-top:2.25rem"><a class="btn" href="/">Back to the start</a></p>
  </div>
</main>
</body>
</html>
`;

/* ── main ─────────────────────────────────────────────────────────────── */

async function build() {
  const t0 = Date.now();
  const { renderPage } = await import(fresh(path.join(SRC, 'templates', 'page.mjs')));
  const P = await import(fresh(path.join(SRC, 'content', 'profile.mjs')));

  const { css, files: cssFiles } = await buildCss();

  await rm(ASSETS, { recursive: true, force: true });
  await mkdir(path.join(ASSETS, 'js'), { recursive: true });

  // Scripts: native ES modules, copied verbatim. No bundler, no transpile.
  const scriptDir = path.join(SRC, 'scripts');
  const scripts = (await readdir(scriptDir)).filter((f) => f.endsWith('.js'));
  for (const f of scripts) await copyFile(path.join(scriptDir, f), path.join(ASSETS, 'js', f));

  // Fonts and any other static payload.
  const fontCount = await copyTree(path.join(SRC, 'static', 'fonts'), path.join(ASSETS, 'fonts'));
  // Portrait cut-outs, generated by scripts/make-portraits.mjs.
  const imgCount = await copyTree(path.join(SRC, 'static', 'img'), path.join(ASSETS, 'img'));

  // Root-level static files that must keep their exact names for the platform.
  for (const f of ['og.png', 'apple-touch-icon.png', 'favicon.ico']) {
    const s = path.join(SRC, 'static', f);
    if (existsSync(s)) await copyFile(s, path.join(OUT, f));
  }

  const html = renderPage({ jsHref: 'assets/js/main.js', cssInline: css });

  await writeFile(path.join(OUT, 'index.html'), html);
  await writeFile(path.join(OUT, '404.html'), NOT_FOUND(css, P.meta));
  await writeFile(path.join(OUT, 'favicon.svg'), FAVICON);
  await writeFile(path.join(OUT, 'site.webmanifest'), MANIFEST(P.meta));
  await writeFile(path.join(OUT, 'robots.txt'), ROBOTS(P.meta.siteUrl));
  await writeFile(path.join(OUT, 'sitemap.xml'), SITEMAP(P.meta.siteUrl, new Date().toISOString().slice(0, 10)));
  // Classic GitHub Pages runs Jekyll unless this file is present.
  await writeFile(path.join(OUT, '.nojekyll'), '');

  const size = async (p) => (existsSync(p) ? (await stat(p)).size : 0);
  const kb = (n) => `${(n / 1024).toFixed(1)} kB`;

  log(`\n  built in ${Date.now() - t0} ms\n`);
  log(`  index.html        ${kb(await size(path.join(OUT, 'index.html')))}   (CSS inlined from ${cssFiles.length} files)`);
  log(`  assets/js         ${scripts.length} module${scripts.length === 1 ? '' : 's'}`);
  log(`  assets/fonts      ${fontCount} file${fontCount === 1 ? '' : 's'}`);
  log(`  assets/img        ${imgCount} file${imgCount === 1 ? '' : 's'}`);
  log(`  404.html, favicon.svg, site.webmanifest, robots.txt, sitemap.xml, .nojekyll`);
  log(`\n  output root: ${rel(OUT)}  →  to be served at ${P.meta.siteUrl}/\n`);
}

if (process.argv.includes('--watch')) {
  const { watch } = await import('node:fs');
  await build();
  let queued = null;
  watch(SRC, { recursive: true }, () => {
    clearTimeout(queued);
    queued = setTimeout(() => build().catch(console.error), 80);
  });
  log('  watching src/ …');
} else {
  await build();
}
