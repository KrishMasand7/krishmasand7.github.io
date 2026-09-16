/**
 * SINGLE SOURCE OF TRUTH for every factual claim rendered on this site.
 *
 * Provenance key used on entries:
 *   krish  — supplied by Krish Masand directly (Sep 2026)
 *   github — read from github.com/KrishMasand7 (profile, repositories, source)
 *
 * Nothing here may be invented. If a fact is unknown, omit the field — every
 * template branch that reads an optional field checks for it first.
 */

import { projects, skills } from './work.mjs';

export const meta = {
  name: 'Krish Masand',
  shortName: 'K. Masand',
  role: 'Web & Android Developer',
  secondRole: 'AI/ML Developer',
  location: 'Amravati, Maharashtra, India',     // github profile + both colleges
  address: { locality: 'Amravati', region: 'Maharashtra', country: 'IN' },
  email: 'krishmasand7@gmail.com',
  /* The GitHub Pages address this repository will serve from once it is
     published as KrishMasand7/krishmasand7.github.io. Not live yet. */
  siteUrl: 'https://krishmasand7.github.io',
  title: 'Krish Masand — Web, Android & AI/ML Developer',
  description:
    'Krish Masand is a Computer Science & Engineering student in Amravati who builds full-stack web apps with Node.js, Express, React and MongoDB, Android apps, and machine-learning models with scikit-learn, TensorFlow and PyTorch.',
  ogDescription:
    'Web, Android and AI/ML developer. B.Tech Computer Science & Engineering student at Sipna College of Engineering & Technology, Amravati.',
  keywords: [
    'Krish Masand', 'web developer', 'Android developer', 'machine learning',
    'full-stack', 'Node.js', 'React', 'MongoDB', 'TensorFlow', 'PyTorch',
    'Sipna College of Engineering and Technology', 'Amravati',
  ],
};

export const links = {
  github: 'https://github.com/KrishMasand7',
  linkedin: 'https://www.linkedin.com/in/krish-masand-63264727a/',
  email: 'mailto:krishmasand7@gmail.com',
};

/* ── Portraits ────────────────────────────────────────────────────────────
   Generated from src/photos/ by scripts/make-portraits.mjs, which lifts the
   subject off the studio background onto transparency. Dimensions are the
   intrinsic size of the generated file and must be updated with it — they
   reserve the layout box so nothing shifts as the image arrives.
   `candid` is optional: add a second photo and it appears in Contact. */

export const portraits = {
  studio: {
    variant: 'studio',
    file: 'portrait-studio.webp',
    w: 760,
    h: 705,
    alt: 'Krish Masand, studio portrait',
    loading: 'eager',
    priority: 'low',
  },
};

/* ── Hero ─────────────────────────────────────────────────────────────── */

const technologies = new Set(skills.filter((g) => g.count).flatMap((g) => g.items)).size;

export const hero = {
  eyebrow: 'Amravati, India',
  lede:
    'I build full-stack web apps and Android apps, and I work with machine-learning models in Python.',
  sub:
    'Second-year B.Tech student in Computer Science & Engineering at Sipna College of Engineering & Technology, with a diploma from Dr. Panjabrao Deshmukh Polytechnic and a three-month Android development internship at UEF Pvt. Ltd.',
  // Every figure below is sourced; the first two are counted from work.mjs.
  stats: [
    { value: technologies,    suffix: '',   label: 'Languages, frameworks<br>&amp; tools' },
    { value: projects.length, suffix: '',   label: 'Projects<br>built' },
    { value: 3,               suffix: '',   label: 'Months of Android<br>internship' },
    { value: 2,               suffix: 'nd', label: 'Year of B.Tech in<br>Computer Science' },
  ],
};

/* ── Identity / the two disciplines ───────────────────────────────────── */

export const identity = {
  kicker: 'About',
  title: 'Building apps. Learning from data.',
  statement:
    'I am a Computer Science & Engineering student in Amravati. Most of my time goes into building apps: full-stack web apps with Node.js, Express, React and MongoDB, and Android apps like FixMyCity. Alongside that, I work with machine learning in Python.',
  /* A short orientation rail beside the statement. */
  now: [
    { k: 'Studying', v: 'B.Tech, Computer Science & Engineering', note: 'Sipna College of Engineering & Technology, Amravati · Second year' },
    { k: 'Diploma', v: 'Dr. Panjabrao Deshmukh Polytechnic', note: 'Amravati · Completed' },
    { k: 'Internship', v: 'Android Development Intern, UEF Pvt. Ltd.', note: 'Three months, during the diploma' },
    { k: 'Building', v: 'FixMyCity', note: 'Android app for civic complaints · citizen, admin and worker roles' },
  ],
  columns: [
    {
      id: 'apps',
      tone: 'web',
      label: 'Web & Android',
      headline: 'From the database to the screen.',
      body:
        'On the web I work across the stack: Node.js and Express on the server, MongoDB or SQL for data, and React, Tailwind CSS or Bootstrap on the page. On Android I build with Java and XML layouts, which is what my internship at UEF Pvt. Ltd. was about. FixMyCity is my largest app so far, with separate flows for citizens, admins and workers.',
      points: [
        'Frontend: HTML, CSS, React, Tailwind CSS, Bootstrap',
        'Backend: Node.js, Express.js, PHP',
        'Databases: MongoDB, SQL',
        'Android: Java with XML layouts',
      ],
    },
    {
      id: 'ml',
      tone: 'ml',
      label: 'AI & machine learning',
      headline: 'Models that learn from data.',
      body:
        'My machine-learning work is in Python. NumPy handles the numerical side, scikit-learn covers classical models and ensemble methods, and TensorFlow and PyTorch are what I use for neural networks.',
      points: [
        'Deep learning: TensorFlow, PyTorch',
        'Classical ML: scikit-learn, ensemble methods',
        'Numerical computing: Python, NumPy',
      ],
    },
  ],
};
