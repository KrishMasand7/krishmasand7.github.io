/**
 * Progressive enhancement only. The document is complete and navigable with
 * this file absent; everything here adds motion, disclosure and filtering on
 * top of markup that already works.
 */

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
const supportsIO = 'IntersectionObserver' in window;

/* `js` is set by an inline script in <head> so the fallback layout never
   flashes; re-assert it here in case this module is loaded on its own. */
document.documentElement.classList.add('js');

/* ── Reveal on scroll ─────────────────────────────────────────────────── */

function initReveals() {
  if (!supportsIO) return;
  const targets = document.querySelectorAll('[data-reveal]');
  if (!targets.length) return;

  targets.forEach((el) => {
    el.classList.add(el.dataset.reveal === 'lines' ? 'lines' : 'reveal');
  });

  if (reduced.matches) {
    targets.forEach((el) => el.classList.add('is-in'));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
  );
  targets.forEach((el) => io.observe(el));
}

/* Elements that only need an in-view flag (timeline dots, discipline rules) */
function initInView() {
  if (!supportsIO) return;
  const targets = document.querySelectorAll('[data-inview]');
  if (!targets.length) return;
  if (reduced.matches) { targets.forEach((el) => el.classList.add('is-in')); return; }
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
    }),
    { rootMargin: '0px 0px -15% 0px', threshold: 0.15 }
  );
  targets.forEach((el) => io.observe(el));
}

/* ── Count-up numerals ────────────────────────────────────────────────── */

function initCounters() {
  const counters = document.querySelectorAll('[data-count]');
  if (!counters.length) return;

  const paint = (el, v) => {
    const dp = Number(el.dataset.decimals || 0);
    el.textContent = v.toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp });
  };

  if (!supportsIO || reduced.matches) {
    counters.forEach((el) => paint(el, Number(el.dataset.count)));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      io.unobserve(el);
      const target = Number(el.dataset.count);
      const dur = 1100;
      const t0 = performance.now();
      const step = (now) => {
        const p = Math.min(1, (now - t0) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        paint(el, target <= 10 ? Math.round(target * eased) : Math.round(target * eased));
        if (p < 1) requestAnimationFrame(step);
        else paint(el, target);
      };
      requestAnimationFrame(step);
    }),
    { threshold: 0.4 }
  );
  counters.forEach((el) => { el.textContent = '0'; io.observe(el); });
}

/* ── Navigation ───────────────────────────────────────────────────────── */

function initNav() {
  const nav = document.querySelector('[data-nav]');
  const toggle = document.querySelector('[data-nav-toggle]');
  const sheet = document.querySelector('[data-nav-sheet]');
  const progress = document.querySelector('[data-progress]');
  const navLinks = Array.from(document.querySelectorAll('[data-nav-link]'));

  /* Sticky background + reading progress, batched into one rAF. */
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const y = window.scrollY;
      if (nav) nav.dataset.stuck = y > 12 ? 'true' : 'false';
      if (progress) {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        progress.style.scale = `${max > 0 ? Math.min(1, y / max) : 0} 1`;
      }
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Mobile sheet */
  if (toggle && sheet) {
    const setOpen = (open) => {
      toggle.setAttribute('aria-expanded', String(open));
      sheet.dataset.open = String(open);
      sheet.setAttribute('aria-hidden', String(!open));
      document.body.style.overflow = open ? 'hidden' : '';
    };
    setOpen(false);
    toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
    sheet.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
        toggle.focus();
      }
    });
    window.addEventListener('resize', () => {
      if (window.innerWidth > 900 && toggle.getAttribute('aria-expanded') === 'true') setOpen(false);
    }, { passive: true });
  }

  /* Scroll spy */
  if (supportsIO && navLinks.length) {
    const sections = navLinks
      .map((a) => document.querySelector(a.getAttribute('href')))
      .filter(Boolean);
    const seen = new Map();
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => seen.set(e.target.id, e.intersectionRatio));
        let best = '', ratio = 0;
        seen.forEach((r, id) => { if (r > ratio) { ratio = r; best = id; } });
        navLinks.forEach((a) => {
          a.setAttribute('aria-current', a.getAttribute('href') === `#${best}` && ratio > 0 ? 'true' : 'false');
        });
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: [0, 0.25, 0.5, 1] }
    );
    sections.forEach((s) => spy.observe(s));
  }
}

/* ── Disclosure panels (projects) ───────────────────────── */

function initDisclosures() {
  document.querySelectorAll('[data-disclosure]').forEach((root) => {
    const btn = root.querySelector('[data-disclosure-btn]');
    const panel = root.querySelector('[data-disclosure-panel]');
    if (!btn || !panel) return;

    const set = (open) => {
      root.dataset.open = String(open);
      btn.setAttribute('aria-expanded', String(open));
      panel.hidden = false; // height is animated via grid-template-rows, not [hidden]
      panel.setAttribute('aria-hidden', String(!open));
      panel.inert = !open;
    };

    set(root.dataset.open === 'true');
    btn.addEventListener('click', () => set(btn.getAttribute('aria-expanded') !== 'true'));
  });
}

/* ── Filters (honours) ────────────────────────────────── */

function initFilters() {
  document.querySelectorAll('[data-filter-group]').forEach((group) => {
    const targetSel = group.dataset.filterTarget;
    const items = Array.from(document.querySelectorAll(targetSel));
    const buttons = Array.from(group.querySelectorAll('[data-filter]'));
    const status = document.querySelector(group.dataset.filterStatus || '');
    if (!items.length || !buttons.length) return;

    const apply = (value) => {
      let shown = 0;
      items.forEach((item) => {
        const match = value === 'all' || (item.dataset.cat || '').split('|').includes(value);
        item.hidden = !match;
        if (match) shown += 1;
      });
      buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.filter === value)));
      if (status) status.textContent = `Showing ${shown} of ${items.length}.`;
    };

    buttons.forEach((b) => b.addEventListener('click', () => apply(b.dataset.filter)));
    apply('all');
  });
}

/* ── Magnetic buttons & pointer-tracked cards ─────────────────────────── */

function initPointerFx() {
  if (reduced.matches || !window.matchMedia('(pointer: fine)').matches) return;

  document.querySelectorAll('[data-magnetic]').forEach((el) => {
    let raf = 0;
    const move = (e) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const r = el.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) / r.width;
        const dy = (e.clientY - (r.top + r.height / 2)) / r.height;
        el.style.transform = `translate(${dx * 9}px, ${dy * 9}px)`;
      });
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });

  document.querySelectorAll('[data-track]').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${e.clientX - r.left}px`);
      el.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });
}

/* ── Timeline progress rail ───────────────────────────────────────────── */

function initTimeline() {
  const rail = document.querySelector('[data-timeline-progress]');
  const list = rail && rail.closest('.timeline');
  if (!rail || !list || reduced.matches) return;

  let ticking = false;
  const update = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const r = list.getBoundingClientRect();
      const mid = window.innerHeight * 0.55;
      const p = Math.max(0, Math.min(1, (mid - r.top) / Math.max(1, r.height)));
      rail.style.height = `${p * (r.height - 24)}px`;
    });
  };
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update, { passive: true });
  update();
}

/* ── Copy-to-clipboard for the email address ──────────────────────────── */

function initCopy() {
  document.querySelectorAll('[data-copy]').forEach((btn) => {
    const original = btn.querySelector('[data-copy-label]');
    if (!original || !navigator.clipboard) return;
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        await navigator.clipboard.writeText(btn.dataset.copy);
        const prev = original.textContent;
        original.textContent = 'Copied';
        btn.dataset.copied = 'true';
        setTimeout(() => { original.textContent = prev; delete btn.dataset.copied; }, 1800);
      } catch {
        window.location.href = `mailto:${btn.dataset.copy}`;
      }
    });
  });
}

/* ── Webmail fallback for mailto links ────────────────────────────────────
   A mailto link hands off to the device's email app. With none set up — the
   usual case for anyone who only uses Gmail or Outlook in the browser — the
   click does nothing at all. When an app does open, this window loses focus;
   so if the page is still focused shortly after the click, nothing handled
   it, and the panel offers webmail compose links and copies the address. */

function initMailFallback() {
  const panel = document.querySelector('[data-mail-help]');
  if (!panel) return;
  const note = panel.querySelector('[data-mail-help-note]');
  const close = panel.querySelector('[data-mail-help-close]');
  let hideTimer = 0;

  const hide = () => {
    panel.dataset.open = 'false';
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => { panel.hidden = true; }, 320);
  };

  const show = async (address) => {
    let copied = false;
    try {
      await navigator.clipboard.writeText(address);
      copied = true;
    } catch { /* clipboard blocked; the note still shows the address */ }
    if (note) {
      note.textContent = copied
        ? `${address} is copied to your clipboard, or write from your webmail:`
        : `Write to ${address} from your webmail instead:`;
    }
    clearTimeout(hideTimer);
    panel.hidden = false;
    void panel.offsetWidth; // commit the closed state so the open transition runs
    panel.dataset.open = 'true';
  };

  if (close) close.addEventListener('click', hide);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !panel.hidden) hide(); });
  panel.addEventListener('click', (e) => { if (e.target.closest('a')) hide(); });

  document.querySelectorAll('a[href^="mailto:"]').forEach((link) => {
    link.addEventListener('click', () => {
      const address = decodeURIComponent(link.getAttribute('href').slice('mailto:'.length).split('?')[0]);
      let handled = false;
      const onLeave = () => { handled = true; };
      window.addEventListener('blur', onLeave, { once: true });
      document.addEventListener('visibilitychange', onLeave, { once: true });
      setTimeout(() => {
        window.removeEventListener('blur', onLeave);
        document.removeEventListener('visibilitychange', onLeave);
        if (!handled && document.hasFocus()) show(address);
      }, 900);
    });
  });
}

/* ── Hero canvas (lazy, and never on reduced motion) ──────────────────── */

async function initHero() {
  const canvas = document.querySelector('[data-wave]');
  if (!canvas || reduced.matches) return;
  if (window.matchMedia('(max-width: 520px)').matches && navigator.hardwareConcurrency <= 4) return;
  try {
    const { mountWave } = await import('./wave.js');
    mountWave(canvas);
  } catch {
    /* Canvas is purely decorative; a failure here must not affect the page. */
  }
}

/* ── Theme ────────────────────────────────────────────────────────────────
   Three states, two of them written down. With no stored choice the page has
   no data-theme attribute and the stylesheet's prefers-color-scheme query
   decides — which is why the OS preference keeps working here, and keeps
   working live, without this file doing anything. Clicking the toggle writes
   an explicit choice; from then on the attribute wins until it is cleared.

   The inline script in <head> has already applied any stored choice, so this
   runs after first paint and never causes a flash. */

const THEME_KEY = 'theme';

function readStoredTheme() {
  try {
    const v = localStorage.getItem(THEME_KEY);
    return v === 'light' || v === 'dark' ? v : null;
  } catch {
    return null;  /* Storage can be disabled outright; the site still works. */
  }
}

function initTheme() {
  const toggle = document.querySelector('[data-theme-toggle]');
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)');
  const root = document.documentElement;

  /* What the reader is actually looking at, whatever the reason. */
  const active = () => root.dataset.theme || (systemDark.matches ? 'dark' : 'light');

  const paint = () => {
    const now = active();
    if (toggle) {
      toggle.setAttribute('aria-label', `Switch to the ${now === 'dark' ? 'light' : 'dark'} theme`);
    }
    /* Address-bar tint. The two tags ship media-scoped for the no-choice case;
       once a choice exists it applies at every system setting, so both match. */
    document.querySelectorAll('[data-theme-color]').forEach((m) => {
      m.setAttribute('content', now === 'dark' ? '#08090c' : '#f7f6f3');
    });
    window.dispatchEvent(new CustomEvent('themechange', { detail: { theme: now } }));
  };

  if (toggle) {
    toggle.addEventListener('click', () => {
      const next = active() === 'dark' ? 'light' : 'dark';
      root.dataset.theme = next;
      try { localStorage.setItem(THEME_KEY, next); } catch { /* nothing to do */ }
      paint();
    });
  }

  /* Only meaningful while no explicit choice is stored, but harmless after:
     `active()` prefers the attribute. */
  systemDark.addEventListener('change', () => { if (!readStoredTheme()) paint(); });

  /* Another tab changed the choice. */
  window.addEventListener('storage', (e) => {
    if (e.key !== THEME_KEY) return;
    const stored = readStoredTheme();
    if (stored) root.dataset.theme = stored;
    else delete root.dataset.theme;
    paint();
  });

  paint();
}

/* ── Year stamp ───────────────────────────────────────────────────────── */

function initYear() {
  document.querySelectorAll('[data-year]').forEach((el) => {
    el.textContent = String(new Date().getFullYear());
  });
}

function boot() {
  initTheme();
  initNav();
  initReveals();
  initInView();
  initCounters();
  initDisclosures();
  initFilters();
  initPointerFx();
  initTimeline();
  initCopy();
  initMailFallback();
  initYear();
  initHero();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
