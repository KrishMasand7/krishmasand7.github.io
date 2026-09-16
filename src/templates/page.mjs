import { icons } from './icons.mjs';
import * as P from '../content/profile.mjs';
import * as W from '../content/work.mjs';

/* ── helpers ──────────────────────────────────────────────────────────── */

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Content strings that intentionally carry inline markup (only `<br>` today). */
const raw = (s) => String(s);

/** Split a display heading into masked lines so each can rise independently. */
const lines = (parts) =>
  parts
    .map((p, i) => `<span class="line-mask"><span class="line-inner" style="--d:${i * 90}ms">${esc(p)}</span></span>`)
    .join('');

const toneClass = (tone) => (tone === 'ml' ? 'tone tone-ml' : tone === 'web' ? 'tone tone-web' : 'tone');

const ext = (href, label, cls = 'xlink') =>
  `<a class="${cls}" href="${esc(href)}" target="_blank" rel="noopener noreferrer">${esc(label)}${icons.external}</a>`;

/** Display form of a profile URL: host and path, no scheme or trailing slash. */
const bare = (href) => href.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');

/* Optional sections render only when their content exists, and the nav
   follows — adding the first honour to work.mjs is all it takes. */
const has = {
  honours: W.honours.length > 0,
  certifications: W.certifications.length > 0,
};

/* ── nav ──────────────────────────────────────────────────────────────── */

const NAV = [
  ['about', 'About'],
  ['projects', 'Projects'],
  ['journey', 'Journey'],
  ...(has.honours ? [['honours', 'Honours']] : []),
  ['skills', 'Skills'],
];

/* Both glyphs are in the DOM; the stylesheet shows the one that names the
   theme you would switch *to*. Script only flips an attribute and a label —
   which is why the control is removed outright when script is absent. */
const themeToggle = () => `
<button class="theme-toggle" type="button" data-theme-toggle
        aria-label="Switch to the light theme" title="Switch theme">
  ${icons.sun}${icons.moon}
</button>`;

const nav = () => `
<div class="progress" data-progress aria-hidden="true"></div>
<header class="nav" data-nav>
  <div class="shell nav-inner">
    <a class="brand" href="#top">
      <span class="brand-dot" aria-hidden="true"></span>
      <span>${esc(P.meta.name)}</span>
      <span class="brand-sub" aria-hidden="true">Web / AI·ML</span>
    </a>
    <nav class="nav-links" aria-label="Sections">
      ${NAV.map(([id, label]) => `<a href="#${id}" data-nav-link>${label}</a>`).join('')}
    </nav>
    <div class="nav-cta">
      ${themeToggle()}
      <a class="btn" href="#contact">Get in touch ${icons.arrow}</a>
      <button class="nav-toggle" type="button" data-nav-toggle aria-expanded="false" aria-controls="nav-sheet">
        <span></span><span></span><span></span>
        <span class="vh">Menu</span>
      </button>
    </div>
  </div>
</header>
<div class="nav-sheet" id="nav-sheet" data-nav-sheet aria-hidden="true">
  ${NAV.map(([id, label], i) => `<a href="#${id}"><span class="idx">0${i + 1}</span>${label}</a>`).join('')}
  <a href="#contact"><span class="idx">0${NAV.length + 1}</span>Contact</a>
  <div class="sheet-foot">
    ${ext(P.links.github, 'GitHub')}
    ${ext(P.links.linkedin, 'LinkedIn')}
  </div>
</div>`;

/* Cut-outs, not photographs with a background: the subject is lifted onto
   transparency by scripts/make-portraits.mjs, so the same file sits correctly
   on ink and on paper. The panel behind it is drawn in CSS from the palette. */
const portrait = (p) => `
<figure class="portrait portrait--${p.variant}">
  <img src="assets/img/${esc(p.file)}" alt="${esc(p.alt)}"
       width="${p.w}" height="${p.h}"
       loading="${esc(p.loading)}" fetchpriority="${esc(p.priority)}" decoding="async">
</figure>`;

/* ── hero ─────────────────────────────────────────────────────────────── */

const hero = () => `
<section class="hero" id="top">
  <canvas class="hero-canvas" data-wave aria-hidden="true"></canvas>
  <div class="shell hero-inner">
    <p class="hero-eyebrow mono" data-reveal><span class="dot" aria-hidden="true"></span>${esc(P.hero.eyebrow)}</p>

    <h1 data-reveal="lines">${lines(P.meta.name.split(' '))}</h1>

    <p class="hero-roles" data-reveal style="--d:260ms">
      <span class="r-web">${esc(P.meta.role)}</span>
      <span class="sep" aria-hidden="true"></span>
      <span class="r-ml">${esc(P.meta.secondRole)}</span>
    </p>

    <p class="hero-lede" data-reveal style="--d:340ms">${esc(P.hero.lede)}</p>
    <p class="hero-sub" data-reveal style="--d:420ms">${esc(P.hero.sub)}</p>

    <div class="hero-actions" data-reveal style="--d:500ms">
      <a class="btn magnetic" data-magnetic href="#projects">See my projects ${icons.arrow}</a>
      <a class="btn btn--ghost magnetic" data-magnetic href="${esc(P.links.github)}" target="_blank" rel="noopener noreferrer">${icons.github}<span>GitHub profile</span>${icons.external}</a>
    </div>

    <dl class="hero-stats" data-stats="${P.hero.stats.length}" data-reveal style="--d:580ms;--stats:${P.hero.stats.length}">
      ${P.hero.stats
        .map(
          (s) => `<div class="hero-stat">
        <dd><span class="counter" data-count="${s.value}">${s.value}</span>${esc(s.suffix)}</dd>
        <dt>${raw(s.label)}</dt>
      </div>`
        )
        .join('')}
    </dl>
  </div>
</section>`;

/* ── identity ─────────────────────────────────────────────────────────── */

const identity = () => `
<section class="section" id="about" aria-labelledby="about-title">
  <div class="shell">
    <div class="sec-head">
      <p class="sec-kicker mono" data-reveal>${esc(P.identity.kicker)}</p>
      <h2 class="sec-title" id="about-title" data-reveal style="--d:80ms">${esc(P.identity.title)}</h2>
    </div>

    <div class="identity-split">
      <div>
        <p class="statement" data-reveal>${esc(P.identity.statement)}</p>
        ${P.identity.statementSource ? `<p class="statement-src mono" data-reveal style="--d:120ms">${esc(P.identity.statementSource)}</p>` : ''}
      </div>
      <div class="identity-side" data-reveal style="--d:180ms">
        ${P.portraits.studio ? portrait(P.portraits.studio) : ''}
        <dl class="now">
          ${P.identity.now
            .map(
              (n) => `<div class="now-row">
            <dt class="mono">${esc(n.k)}</dt>
            <dd><b>${esc(n.v)}</b><span>${esc(n.note)}</span></dd>
          </div>`
            )
            .join('')}
        </dl>
      </div>
    </div>

    <div class="disciplines">
      ${P.identity.columns
        .map(
          (c, i) => `<article class="discipline ${toneClass(c.tone)}" data-inview style="--d:${i * 120}ms">
        <p class="chip">${esc(c.label)}</p>
        <h3>${esc(c.headline)}</h3>
        <p>${esc(c.body)}</p>
        <ul>${c.points.map((p) => `<li><span>${esc(p)}</span></li>`).join('')}</ul>
      </article>`
        )
        .join('')}
    </div>
  </div>
</section>`;

/* ── projects ─────────────────────────────────────────────────────────── */

const project = (p, i) => {
  const n = String(i + 1).padStart(2, '0');
  const metrics = p.metrics || [];
  const highlights = p.highlights || [];
  const links = p.links || [];
  return `
<article class="project ${toneClass(p.tone)}" data-disclosure data-open="${i === 0 ? 'true' : 'false'}">
  <h3 class="vh">${esc(p.name)}</h3>
  <div class="shell">
    <button class="project-head" type="button" data-disclosure-btn
            aria-expanded="${i === 0}" aria-controls="proj-${p.id}">
      <span class="project-idx" aria-hidden="true">${n}</span>
      <span>
        <span class="project-title">
          <h3>${esc(p.name)}</h3>
          <span class="chip">${esc(p.category)}</span>
        </span>
        <span class="project-meta">${esc(p.role)}${p.period ? `<span class="sep" aria-hidden="true">—</span>${esc(p.period)}` : ''}</span>
        <span class="project-tagline">${esc(p.tagline)}</span>
      </span>
      <span class="project-toggle" aria-hidden="true">${icons.plus}</span>
    </button>

    <div class="project-body" id="proj-${p.id}" data-disclosure-panel>
      <div>
        <div class="project-detail">
          <div class="spacer" aria-hidden="true"></div>
          <div>
            <p class="project-summary">${esc(p.summary)}</p>

            ${
              metrics.length
                ? `<div class="project-metrics">${metrics
                    .map((m) => `<div class="project-metric"><b>${esc(m.value)}</b><span>${esc(m.label)}</span></div>`)
                    .join('')}</div>`
                : ''
            }

            ${
              highlights.length
                ? `<ul class="project-highlights">${highlights
                    .map((h) => `<li><h4>${esc(h.title)}</h4><p>${esc(h.body)}</p></li>`)
                    .join('')}</ul>`
                : ''
            }

            ${p.note ? `<p class="project-note">${esc(p.note)}</p>` : ''}

            <div class="project-foot">
              <ul class="stack-list">${p.stack.map((s) => `<li class="tag">${esc(s)}</li>`).join('')}</ul>
              ${links.length ? `<div class="project-links">${links.map((l) => ext(l.href, l.label)).join('')}</div>` : ''}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</article>`;
};

const projects = () => `
<section class="section" id="projects" aria-labelledby="projects-title">
  <div class="shell">
    <div class="sec-head">
      <p class="sec-kicker mono" data-reveal>${esc(W.projectsMeta.kicker)}</p>
      <h2 class="sec-title" id="projects-title" data-reveal style="--d:80ms">${esc(W.projectsMeta.title)}</h2>
      <p class="sec-summary" data-reveal style="--d:160ms">${esc(W.projectsMeta.summary)}</p>
    </div>
  </div>
  <div class="projects">${W.projects.map(project).join('')}</div>
</section>`;

/* ── journey ──────────────────────────────────────────────────────────── */

const journey = () => `
<section class="section" id="journey" aria-labelledby="journey-title">
  <div class="shell">
    <div class="sec-head">
      <p class="sec-kicker mono" data-reveal>${esc(W.experienceMeta.kicker)}</p>
      <h2 class="sec-title" id="journey-title" data-reveal style="--d:80ms">${esc(W.experienceMeta.title)}</h2>
    </div>

    <ol class="timeline">
      <span class="timeline-progress" data-timeline-progress aria-hidden="true"></span>
      ${W.experience
        .map(
          (e) => `<li class="tl-item ${toneClass(e.tone)}" data-inview>
        <div class="tl-top">
          <h3 class="tl-role">${esc(e.role)}</h3>
          <span class="tl-period">${esc(e.period)}</span>
        </div>
        <p class="tl-org"><b>${esc(e.org)}</b>${e.location ? `<span>${esc(e.location)}</span>` : ''}<span class="chip">${esc(e.kind)}</span></p>
        ${e.advisor ? `<p class="tl-advisor">${esc(e.advisor)}</p>` : ''}
        ${e.points && e.points.length ? `<ul class="tl-points">${e.points.map((p) => `<li><span>${esc(p)}</span></li>`).join('')}</ul>` : ''}
      </li>`
        )
        .join('')}
    </ol>

    ${
      has.certifications
        ? `<div class="certs" data-reveal>
      ${W.certifications
        .map(
          (c) => `<a class="cert" href="${esc(c.href)}" target="_blank" rel="noopener noreferrer">
        <span class="cert-name">${esc(c.name)} ${icons.external}</span>
        ${c.score ? `<span class="cert-score">${esc(c.score)}</span>` : ''}
      </a>`
        )
        .join('')}
    </div>`
        : ''
    }
  </div>
</section>`;

/* ── honours (only when there are any) ────────────────────────────────── */

const honours = () => {
  if (!has.honours) return '';
  const filters = W.honourFilters.filter((f) => f.id === 'all' || W.honours.some((h) => h.cat === f.id));
  return `
<section class="section" id="honours" aria-labelledby="honours-title">
  <div class="shell">
    <div class="sec-head">
      <p class="sec-kicker mono" data-reveal>${esc(W.honoursMeta.kicker)}</p>
      <h2 class="sec-title" id="honours-title" data-reveal style="--d:80ms">${esc(W.honoursMeta.title)}</h2>
      ${W.honoursMeta.summary ? `<p class="sec-summary" data-reveal style="--d:160ms">${esc(W.honoursMeta.summary)}</p>` : ''}
    </div>

    ${
      filters.length > 2
        ? `<div class="filters" data-filter-group data-filter-target=".honour" data-filter-status="#honour-status"
         role="group" aria-label="Filter honours by type">
      ${filters
        .map((f) => {
          const n = f.id === 'all' ? W.honours.length : W.honours.filter((h) => h.cat === f.id).length;
          return `<button class="filter" type="button" data-filter="${f.id}" aria-pressed="${f.id === 'all'}">${esc(f.label)}<span class="n">${n}</span></button>`;
        })
        .join('')}
    </div>
    <p class="vh" id="honour-status" role="status" aria-live="polite"></p>`
        : ''
    }

    <div class="honours-grid">
      ${W.honours
        .map(
          (h, i) => `<article class="honour" data-cat="${esc(h.cat)}" data-tier="${esc(h.tier)}" data-track
                 data-reveal style="--d:${Math.min(i, 5) * 60}ms">
        <p class="honour-rank">${esc(h.rank)}</p>
        <h3>${esc(h.title)}</h3>
        <p class="honour-meta">${esc(h.org)} · ${esc(h.date)}${h.scale ? `<br><span class="scale">${esc(h.scale)}</span>` : ''}</p>
        <p>${esc(h.detail)}</p>
      </article>`
        )
        .join('')}
    </div>
  </div>
</section>`;
};

/* ── skills ───────────────────────────────────────────────────────────── */

const skills = () => `
<section class="section" id="skills" aria-labelledby="skills-title">
  <div class="shell">
    <div class="sec-head">
      <p class="sec-kicker mono" data-reveal>${esc(W.skillsMeta.kicker)}</p>
      <h2 class="sec-title" id="skills-title" data-reveal style="--d:80ms">${esc(W.skillsMeta.title)}</h2>
      <p class="sec-summary" data-reveal style="--d:160ms">${esc(W.skillsMeta.summary)}</p>
    </div>

    <div class="skills">
      ${W.skills
        .map(
          (g) => `<section class="skill-group ${toneClass(g.tone)}" data-reveal>
        <h3>${esc(g.group)}</h3>
        <ul class="skill-items">${g.items.map((i) => `<li class="tag">${esc(i)}</li>`).join('')}</ul>
      </section>`
        )
        .join('')}
    </div>
  </div>
</section>`;

/* ── contact ──────────────────────────────────────────────────────────── */

const contact = () => `
<section class="section contact" id="contact" aria-labelledby="contact-title">
  <div class="shell contact-top${P.portraits.candid ? '' : ' contact-top--solo'}">
    <div class="contact-copy">
      <p class="sec-kicker mono" data-reveal>${esc(W.contact.kicker)}</p>
      <h2 class="contact-title" id="contact-title" data-reveal style="--d:80ms">${esc(W.contact.title)}</h2>
      <p class="contact-body" data-reveal style="--d:160ms">${esc(W.contact.body)}</p>

      <div class="contact-actions" data-reveal style="--d:220ms">
        <a class="btn magnetic" data-magnetic href="${esc(P.links.email)}">${icons.mail}<span>Email me</span></a>
        <button class="btn btn--ghost magnetic" type="button" data-magnetic data-copy="${esc(P.meta.email)}">
          ${icons.copy}<span data-copy-label>Copy address</span>
        </button>
      </div>
    </div>
    ${P.portraits.candid ? `<div data-reveal style="--d:280ms">${portrait(P.portraits.candid)}</div>` : ''}
  </div>

  <div class="shell">
    <div class="contact-links" data-reveal style="--d:280ms">
      <a class="contact-link" href="${esc(P.links.email)}">
        <span class="k">Email</span><span class="v">${esc(P.meta.email)} ${icons.arrow}</span>
      </a>
      <a class="contact-link" href="${esc(P.links.github)}" target="_blank" rel="noopener noreferrer">
        <span class="k">GitHub</span><span class="v">${icons.github} ${esc(bare(P.links.github))} ${icons.arrow}</span>
      </a>
      <a class="contact-link" href="${esc(P.links.linkedin)}" target="_blank" rel="noopener noreferrer">
        <span class="k">LinkedIn</span><span class="v">${icons.linkedin} ${esc(bare(P.links.linkedin).replace('linkedin.com/', ''))} ${icons.arrow}</span>
      </a>
    </div>
  </div>
</section>`;

/* A mailto link does nothing on a device with no email app set up, which is
   most browsers that only use webmail. main.js shows this panel when a mailto
   click leaves the page in focus, with webmail compose links as the way out.
   Rendered here rather than in script so every link in it is checked by
   verify.mjs, and it stays hidden — mailto working as normal — without JS. */
const mailHelp = () => {
  const to = encodeURIComponent(P.meta.email);
  return `
<div class="mail-help" data-mail-help data-open="false" role="status" aria-live="polite" hidden>
  <p class="mail-help-text"><b>No email app opened on this device.</b>
    <span data-mail-help-note>Write to ${esc(P.meta.email)} from your webmail instead.</span></p>
  <div class="mail-help-actions">
    <a class="btn" href="https://mail.google.com/mail/?view=cm&amp;fs=1&amp;to=${to}" target="_blank" rel="noopener noreferrer">${icons.mail}<span>Write in Gmail</span></a>
    <a class="btn btn--ghost" href="https://outlook.live.com/mail/0/deeplink/compose?to=${to}" target="_blank" rel="noopener noreferrer"><span>Write in Outlook</span>${icons.external}</a>
  </div>
  <button class="mail-help-close" type="button" data-mail-help-close aria-label="Close">${icons.close}</button>
</div>`;
};

const footer = () => `
<footer class="footer">
  <div class="shell footer-inner">
    <div>
      <p>© <span data-year>2026</span> ${esc(P.meta.name)} · ${esc(P.meta.location)}</p>
      <p class="footer-note">Built as a static site: hand-written HTML, CSS and JavaScript, no framework runtime. Design adapted from <a href="https://gauravmasand.github.io" target="_blank" rel="noopener noreferrer">Gaurav Masand’s site</a>.</p>
    </div>
    <nav class="footer-links" aria-label="Elsewhere">
      <a href="${esc(P.links.github)}" target="_blank" rel="noopener noreferrer">GitHub</a>
      <a href="${esc(P.links.linkedin)}" target="_blank" rel="noopener noreferrer">LinkedIn</a>
      <a href="${esc(P.links.email)}">Email</a>
    </nav>
  </div>
</footer>`;

/* ── structured data ──────────────────────────────────────────────────── */

const jsonLd = () => {
  const person = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: P.meta.name,
    url: P.meta.siteUrl,
    email: `mailto:${P.meta.email}`,
    jobTitle: [P.meta.role, P.meta.secondRole],
    description: P.meta.ogDescription,
    address: {
      '@type': 'PostalAddress',
      addressLocality: P.meta.address.locality,
      addressRegion: P.meta.address.region,
      addressCountry: P.meta.address.country,
    },
    affiliation: { '@type': 'CollegeOrUniversity', name: 'Sipna College of Engineering & Technology' },
    alumniOf: { '@type': 'CollegeOrUniversity', name: 'Dr. Panjabrao Deshmukh Polytechnic' },
    knowsAbout: ['Full-stack web development', 'Android development', 'Machine learning', 'Node.js', 'React', 'MongoDB', 'TensorFlow', 'PyTorch'],
    sameAs: [P.links.github, P.links.linkedin],
  };
  return `<script type="application/ld+json">${JSON.stringify(person).replace(/</g, '\\u003c')}</script>`;
};

/* ── document ─────────────────────────────────────────────────────────── */

export function renderPage({ cssHref, jsHref, cssInline }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(P.meta.title)}</title>
<meta name="description" content="${esc(P.meta.description)}">
<meta name="author" content="${esc(P.meta.name)}">
<meta name="keywords" content="${esc(P.meta.keywords.join(', '))}">
<meta name="theme-color" content="#08090c" media="(prefers-color-scheme: dark)" data-theme-color>
<meta name="theme-color" content="#f7f6f3" media="(prefers-color-scheme: light)" data-theme-color>
<link rel="canonical" href="${esc(P.meta.siteUrl)}/">

<meta property="og:type" content="website">
<meta property="og:url" content="${esc(P.meta.siteUrl)}/">
<meta property="og:site_name" content="${esc(P.meta.name)}">
<meta property="og:title" content="${esc(P.meta.title)}">
<meta property="og:description" content="${esc(P.meta.ogDescription)}">
<meta property="og:image" content="${esc(P.meta.siteUrl)}/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(P.meta.name)} — ${esc(P.meta.role)} and ${esc(P.meta.secondRole)}">
<meta property="og:locale" content="en_US">

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(P.meta.title)}">
<meta name="twitter:description" content="${esc(P.meta.ogDescription)}">
<meta name="twitter:image" content="${esc(P.meta.siteUrl)}/og.png">

<link rel="icon" href="favicon.svg" type="image/svg+xml">
<link rel="alternate icon" href="favicon.ico" sizes="any">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
<link rel="manifest" href="site.webmanifest">

<link rel="preload" href="assets/fonts/inter-latin-normal.woff2" as="font" type="font/woff2" crossorigin>
<!-- Set before first paint so enhanced styles never flash their fallback
     state, and so a stored theme choice is in force for the very first frame.
     No stored choice means no attribute, which leaves the palette to the
     prefers-color-scheme media query in the stylesheet. -->
<script>document.documentElement.classList.add('js');try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}</script>
${cssInline ? `<style>${cssInline}</style>` : `<link rel="stylesheet" href="${cssHref}">`}
<script type="module" src="${jsHref}"></script>
${jsonLd()}
</head>
<body>
<a class="skip-link" href="#main">Skip to content</a>
${nav()}
<main id="main">
${hero()}
${identity()}
${projects()}
${journey()}
${honours()}
${skills()}
${contact()}
</main>
${footer()}
${mailHelp()}
</body>
</html>`;
}
