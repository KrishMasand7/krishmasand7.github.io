/* Projects, journey, honours, certifications, skills, contact.
   Provenance key (see profile.mjs): krish = told to us by Krish directly,
   github = read from the repository itself. Nothing here may be invented. */

/* ── Projects ─────────────────────────────────────────────────────────── */

export const projectsMeta = {
  kicker: 'Projects',
  title: 'Things I have built.',
  summary:
    'An Android app for civic complaints, a full-stack task manager, and a storefront layout in plain HTML and CSS. Open any of them for the details.',
};

/* `period`, `metrics`, `highlights`, `note` and `links` are all optional. */
export const projects = [
  {
    // krish — described in conversation, Sep 2026. No repository link yet.
    id: 'fixmycity',
    name: 'FixMyCity',
    role: 'Developer',
    category: 'Android app',
    tone: 'web',
    tagline: 'A civic complaint, from a photo on a phone to the municipal corporation.',
    summary:
      'An Android app for reporting problems in the city. A resident takes a photo of the problem and registers a complaint, which raises a ticket for the municipal corporation. An admin assigns the work to a worker, and the worker reports the details of the job back to the admin.',
    metrics: [
      { value: '3', label: 'roles: citizen, admin, worker' },
      { value: 'Photo', label: 'attached to every complaint' },
      { value: 'Ticket', label: 'raised for each report' },
    ],
    highlights: [
      {
        title: 'Citizen',
        body: 'Registers a complaint by adding a photo of the problem. Submitting it raises a ticket that goes to the municipal corporation.',
      },
      {
        title: 'Admin',
        body: 'Receives the tickets and assigns the work to a worker.',
      },
      {
        title: 'Worker',
        body: 'Carries out the assigned work and sends the details of it back to the admin.',
      },
    ],
    stack: ['Android', 'Java', 'XML'],
  },
  {
    // github — KrishMasand7/Task-manager-app (package.json, app.js, routes, controllers, views)
    id: 'task-manager',
    name: 'Task Manager',
    role: 'Developer',
    period: 'Feb 2025',
    category: 'Full-stack web',
    tone: 'web',
    tagline: 'A task-management web app on Node.js, Express and MongoDB, rendered on the server with EJS.',
    summary:
      'Create a task, mark it complete, delete it, and filter the list to all, completed or to-do. Pages are rendered on the server with EJS, while completing and deleting run through fetch calls, so the list updates in place without a reload.',
    metrics: [
      { value: '5', label: 'Express routes' },
      { value: '3', label: 'list filters' },
      { value: 'MVC', label: 'project layout' },
    ],
    highlights: [
      {
        title: 'Layered structure',
        body: 'The Mongoose model, the Express router and the controller functions each live in their own folder. The entry point only sets up middleware, connects to MongoDB and mounts the routes.',
      },
      {
        title: 'PUT and DELETE from the browser',
        body: 'Completing and deleting are PUT and DELETE endpoints that answer in JSON. The page calls them with fetch and updates the card when the request succeeds, fading a deleted task out rather than reloading.',
      },
      {
        title: 'Views',
        body: 'ejs-mate layouts give every page one shared boilerplate with header and footer partials. Bootstrap styles the cards and the new-task form.',
      },
    ],
    stack: ['Node.js', 'Express.js', 'MongoDB', 'Mongoose', 'EJS', 'Bootstrap'],
    links: [{ label: 'Source', href: 'https://github.com/KrishMasand7/Task-manager-app' }],
  },
  {
    // github — KrishMasand7/AmazoneClone (Amazon_project/index.html, style.css)
    id: 'amazon-clone',
    name: 'Amazon Homepage Clone',
    role: 'Developer',
    period: 'Jan 2024',
    category: 'Frontend',
    tone: 'web',
    tagline: 'The Amazon storefront rebuilt in plain HTML and CSS.',
    summary:
      'A static recreation of the Amazon homepage: the top bar with delivery location, search, account and cart, the deals panel beneath it, a grid of eight shopping-category cards, and the multi-column footer. There is no framework or JavaScript; it is all markup and CSS layout, with Font Awesome for the icons.',
    metrics: [],
    highlights: [],
    stack: ['HTML', 'CSS', 'Font Awesome'],
    links: [{ label: 'Source', href: 'https://github.com/KrishMasand7/AmazoneClone' }],
  },
];

/* ── Journey ──────────────────────────────────────────────────────────────
   Education and work on one timeline, newest first. `tone` is optional:
   leave it off for entries that are neither web nor ML. */

export const experienceMeta = { kicker: 'Journey', title: 'Where I have studied and worked.' };

export const experience = [
  {
    org: 'Sipna College of Engineering & Technology',
    location: 'Amravati, India',
    role: 'B.Tech, Computer Science & Engineering',
    kind: 'Education',
    period: 'Second year · Present',
    points: ['Currently in the second year of the degree, which followed the diploma.'],
  },
  {
    org: 'UEF Pvt. Ltd.',
    role: 'Android Development Intern',
    kind: 'Internship',
    tone: 'web',
    period: '3 months',
    points: ['A three-month internship in Android app development, working in Java with XML layouts, completed during the diploma.'],
  },
  {
    org: 'Dr. Panjabrao Deshmukh Polytechnic',
    location: 'Amravati, India',
    role: 'Diploma',
    kind: 'Education',
    period: 'Completed',
    points: [],
  },
];

/* ── Honours ──────────────────────────────────────────────────────────────
   Empty for now. Add an entry and the section, its filters and its nav link
   all appear on the next build. Shape:
   { cat: 'hackathon', rank: '1st Place', tier: 'gold', title: '…', org: '…',
     date: 'Mar 2027', scale: 'Of 80+ teams', detail: '…' }                 */

export const honoursMeta = {
  kicker: 'Honours',
  title: 'Competitions and recognition.',
  summary: '',
};

export const honourFilters = [
  { id: 'all', label: 'All' },
  { id: 'hackathon', label: 'Hackathons' },
  { id: 'coding', label: 'Competitive coding' },
];

export const honours = [];

/* ── Certifications ───────────────────────────────────────────────────────
   Empty for now; entries render under the journey timeline. Shape:
   { name: '…', score: '…', href: 'https://…' }                              */

export const certifications = [];

/* ── Skills ───────────────────────────────────────────────────────────────
   `count: true` groups feed the "technologies" figure in the hero, counted
   once each however many groups name them. Concepts are not counted. */

export const skillsMeta = {
  kicker: 'Toolkit',
  title: 'What I work with.',
  summary: 'Grouped by what each one is for.',
};

export const skills = [
  { group: 'Languages', tone: 'web', count: true, items: ['JavaScript', 'Python', 'Java', 'PHP', 'SQL'] },
  { group: 'Frontend', tone: 'web', count: true, items: ['HTML', 'CSS', 'React', 'Tailwind CSS', 'Bootstrap'] },
  { group: 'Backend & databases', tone: 'web', count: true, items: ['Node.js', 'Express.js', 'PHP', 'MongoDB', 'SQL'] },
  { group: 'Android', tone: 'web', count: true, items: ['Java', 'XML layouts'] },
  { group: 'Machine learning', tone: 'ml', count: true, items: ['TensorFlow', 'PyTorch', 'scikit-learn', 'NumPy', 'Ensemble methods'] },
  {
    group: 'Core computer science',
    items: ['Data structures & algorithms', 'Object-oriented programming', 'DBMS', 'Operating systems (Linux/Unix)', 'Computer networks (TCP/IP)', 'Distributed systems', 'System design'],
  },
  { group: 'Tools & practice', count: true, items: ['Git / GitHub', 'PyMOL'] },
];

/* ── Contact ──────────────────────────────────────────────────────────── */

export const contact = {
  kicker: 'Contact',
  title: 'Have an internship or a project in mind?',
  body:
    'I would like to hear about internships, app and web projects, and machine-learning work. Email is the quickest way to reach me, and my code is on GitHub.',
};
