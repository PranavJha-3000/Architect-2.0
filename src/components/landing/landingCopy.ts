/** All landing copy in one reviewable file. Concrete, no fluff. */

export const COPY = {
  nav: {
    start: 'Start building',
  },
  hero: {
    eyebrow: 'ARCHITECT 2.0',
    headline: 'Vibe coding feels like a group chat.',
    sub: 'You talk to a Manager, the Manager brings in specialist agents, and the team plans, builds, reviews, previews, and ships your product.',
    primary: 'Start building',
    meta: 'Manager · Specialists · Preview · Code · GitHub · Deploy',
  },
  proof: [
    { n: '01', label: 'Prompt', desc: 'you describe it' },
    { n: '02', label: 'Plan', desc: 'Manager scopes it' },
    { n: '03', label: 'Team', desc: 'specialists join' },
    { n: '04', label: 'Build', desc: 'UI, backend, AI, QA' },
    { n: '05', label: 'Preview', desc: 'watch it take shape' },
    { n: '06', label: 'Ship', desc: 'code, GitHub, deploy' },
  ],
  why: {
    eyebrow: 'WHY ARCHITECT',
    title: 'One Manager. A team that actually builds.',
    body: 'Asking an AI to write code gives you text. Working with Architect gives you coordination: the Manager scopes the work, routes it to Frontend, Backend, AI / ML, QA and DevOps, and returns one reviewed result.',
    points: [
      { k: 'Code generator', v: 'You prompt. It prints files. You integrate everything.' },
      { k: 'Architect team', v: 'You describe. The Manager plans, routes, reviews, and ships.' },
    ],
  },
  how: {
    eyebrow: 'HOW IT WORKS',
    title: 'From idea to shipped product.',
    steps: [
      { n: '01', label: 'Describe', desc: 'You explain what you want in plain language. No tickets, no specs.' },
      { n: '02', label: 'Plan', desc: 'The Manager turns it into a concrete build plan — steps, specialists, scope.' },
      { n: '03', label: 'Build', desc: 'Specialists work across UI, backend, AI, QA and infrastructure. Progress narrates in chat.' },
      { n: '04', label: 'Ship', desc: 'Preview it live, review the code, connect GitHub, and deploy to a URL.' },
    ],
  },
  scenes: {
    eyebrow: 'THE PRODUCT',
    title: 'The workspace is the proof.',
    items: [
      { k: 'A', title: 'Talk to the Manager', desc: 'Requirements, plan, approvals and results land in one conversation.' },
      { k: 'B', title: 'Shape it on Canvas', desc: 'The generated interface becomes editable regions you adjust visually.' },
      { k: 'C', title: 'Watch Preview go live', desc: 'Desktop, tablet and mobile viewports update as the team builds.' },
      { k: 'D', title: 'Review, commit, deploy', desc: 'Read the code, track commits, and ship a versioned URL.' },
    ],
  },
  specialists: {
    eyebrow: 'THE TEAM',
    title: 'Bring in the right specialist when the work calls for it.',
    note: 'Specialists join when the Manager routes work — no idle chatter.',
    list: [
      { short: 'FE', name: 'Frontend', resp: 'Interface, layout, interaction.' },
      { short: 'BE', name: 'Backend', resp: 'APIs, data, auth.' },
      { short: 'AI', name: 'AI / ML', resp: 'Model calls, prompts, retrieval.' },
      { short: 'QA', name: 'QA', resp: 'Tests, edge cases, regression.' },
      { short: 'DO', name: 'DevOps', resp: 'Build, infra, deploy.' },
    ],
  },
  build: {
    eyebrow: 'LIVE PREVIEW',
    title: 'Watch the product take shape.',
    body: 'Every build narrates itself in chat while Preview updates beside it. No terminal, no context switching.',
  },
  canvas: {
    eyebrow: 'CANVAS',
    title: 'Shape the interface before you ship it.',
    body: 'Open UI Head to turn a screenshot or sketch into editable regions. Adjust layout visually — the code stays in sync through Frontend.',
  },
  ship: {
    eyebrow: 'SHIP',
    title: 'From conversation to production.',
    body: 'One chain from chat to live URL. Simulated in this build so you can review the full path honestly.',
    chain: ['Architect', 'Code', 'GitHub', 'Deploy', 'Live URL'],
    honesty: 'GitHub and Deploy are simulated in this build — commits, conflicts and deploy logs behave like the real flow. No real account is accessed.',
  },
  trust: {
    eyebrow: 'TRANSPARENCY',
    title: 'What Architect actually does.',
    items: [
      { t: 'Local-first state', d: 'Projects, conversations, builds and previews stay isolated in this browser (localStorage, architect-store).' },
      { t: 'Clearly simulated integrations', d: 'GitHub and Deploy are labelled simulated wherever they appear.' },
      { t: 'External media, honestly', d: 'Third-party media opens externally in a new tab. Nothing is embedded or scraped.' },
      { t: 'No hidden APIs', d: 'No model provider, backend, or sandbox calls in this client build.' },
    ],
    nonClaims: 'No SOC 2 · No encryption guarantees · No zero-retention promise — not implemented, not claimed.',
  },
  final: {
    title: 'Your next product starts with a conversation.',
    primary: 'Start building',
    secondary: 'Explore the workspace',
  },
  footer: {
    brand: 'Architect 2.0',
    by: 'Lyzr AI',
    cols: [
      { h: 'Product', links: ['How it works', 'Canvas', 'Preview', 'Deploy'] },
      { h: 'Resources', links: ['GitHub', 'Docs', 'Security'] },
    ],
  },
} as const
