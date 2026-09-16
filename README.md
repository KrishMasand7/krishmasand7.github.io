# krishmasand7.github.io

Personal site of **Krish Masand** — web, Android and AI/ML developer.
To be published at <https://krishmasand7.github.io> (not live yet).

A static, single-page site: hand-written HTML, CSS and JavaScript with no framework
runtime and no dependencies. `node build.mjs` is the entire pipeline. The design and
build are adapted from [gauravmasand.github.io](https://github.com/gauravmasand/gauravmasand.github.io).

---

## Editing the content

Everything the page says lives in two files. Edit them, run `npm run build`, done.

| File | What is in it |
| --- | --- |
| `src/content/profile.mjs` | name, roles, links, hero text and stats, About section, photo |
| `src/content/work.mjs` | projects, journey (education + internship), honours, certifications, skills, contact text |

- **Add a project:** copy an entry in `projects`. `metrics`, `highlights`, `period` and
  `links` are optional; leave out anything you do not have.
- **Add a hackathon or award:** add an entry to `honours`. The Honours section and its
  nav link appear automatically once there is at least one.
- **Add a certificate:** add an entry to `certifications`; it shows under the journey.
- The hero's "technologies" and "projects" numbers are counted from the lists, so they
  stay correct on their own.

Generated files at the repository root (`index.html`, `404.html`, `assets/`,
`favicon.svg`, `sitemap.xml`, …) are overwritten by every build. Edit `src/`, not them.

---

## Commands

```bash
npm run build       # build once
npm run dev         # rebuild whenever src/ changes
npm run serve       # build, then preview at http://localhost:4321
npm run check       # build, then run the static checks
npm run links       # check every external link (needs internet)
npm run portraits   # re-cut the photo in src/photos/ (needs Chrome or Edge)
npm run icons       # regenerate og.png, favicon.ico, apple-touch-icon.png (needs Chrome or Edge)
```

Needs Node.js 20 or newer. No `npm install` — there are no dependencies.

---

## Layout

```
build.mjs               the whole build — reads src/, writes the site to the repo root
serve.mjs               local preview server (never deployed)
src/
  content/              profile.mjs and work.mjs — every fact on the page
  templates/page.mjs    renders index.html from the content
  styles/*.css          inlined into the page at build time; colours only in 01-tokens.css
  scripts/main.js       theme, navigation, reveals, disclosures, counters
  scripts/wave.js       the hero animation
  photos/               original photo — input to make-portraits, not published
  static/               fonts and generated images, copied as-is
scripts/
  verify.mjs            static checks on the output
  check-links.mjs       resolves every external link
  make-portraits.mjs    cuts the subject out of a studio photo onto transparency
  make-icons.mjs        renders og.png and the icons from og-card.html
  chrome.mjs            tiny headless-Chrome driver both of those use
```

---

## Changing the photo

Replace `src/photos/portrait-studio.jpg` with a photo taken against a plain, light
background, run `npm run portraits`, and copy the size it prints into `w` and `h` of
`portraits.studio` in `src/content/profile.mjs`. Add `--preview <folder>` to also get
a PNG of the cut-out on the dark and light backgrounds for checking.

The cut-out runs inside headless Chrome, so it works on Windows without installing
anything. It keeps a white shirt even though the shirt is the same colour as the
background, and softens hair edges so they do not leave a light fringe on the dark page.

---

## Going live (when ready)

1. Create a public GitHub repository named exactly **`krishmasand7.github.io`** under
   the `KrishMasand7` account.
2. Push this folder to its `main` branch.
3. In the repository, open **Settings → Pages** and set the source to
   **Deploy from a branch**, branch `main`, folder `/ (root)`.

The site then appears at <https://krishmasand7.github.io> within a minute or two.
`.github/workflows/build.yml` does not deploy; it rebuilds on every push and fails if
the committed output is out of date, so run `npm run build` before committing.

---

## Design notes

- **Two accents carry meaning.** Blue marks web and Android work, gold marks AI and
  machine learning — in the hero roles, the About columns, the skill groups and the
  timeline.
- **Two palettes.** Dark is the default; light follows the system setting or the toggle
  in the nav, and the choice is remembered. Every colour is defined once, in
  `src/styles/01-tokens.css`.
- **The hero animation** is a rolling 3D surface of ridgelines drawn on a canvas, each
  line running from blue to gold. It pauses when scrolled away, and is skipped on small
  screens and for anyone who has reduced motion turned on.
- **Works without JavaScript.** Every section is readable and every project panel is
  open with scripts disabled.
