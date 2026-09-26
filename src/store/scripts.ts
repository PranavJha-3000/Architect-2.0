import type { ChannelId, Strategy } from './types'

/** Strategies offered inline in the chat (no standalone page). */
export const STRATEGY_OPTIONS: Strategy[] = ['lean', 'balanced', 'enterprise']

export const STRATEGY_BLURB: Record<Strategy, string> = {
  lean: 'Manager + a full-stack pass. Fastest to something usable.',
  balanced: 'A small team with a review pass before it ships.',
  enterprise: 'Full team, extra hardening and observability.',
}

/** Compact starter suggestions shown under the opening Manager message. */
export const STARTER_SUGGESTIONS = [
  'Build a habit tracker',
  'Build a client portal',
  'Build a price comparison board',
]

/** Maps an intent to a concrete feature list + the team Manager thinks it needs. */
export const planFor = (intent: string) => {
  const t = intent.toLowerCase()
  const features: string[] = []
  const team: ChannelId[] = []

  if (/\b(habit|streak|routine|tracker|exercise|water)\b/.test(t)) {
    features.push('Daily habit logging', 'Streak tracking with recovery rules', 'Weekly heatmap', 'Empty states that teach the user')
  } else if (/\b(portal|crm|client|invoice|invoice|agency|contract)\b/.test(t)) {
    features.push('Client list with search', 'Invoice and payment status', 'File sharing per client', 'Message thread per account')
  } else if (/\b(price|compare|deal|launch|game|product)\b/.test(t)) {
    features.push('Price feed across stores', 'Filter and sort', 'Price history per item', 'Watchlist with alerts')
  } else if (/\b(recipe|meal|grocery|food|cook)\b/.test(t)) {
    features.push('Recipe library', 'Grocery list that merges ingredients', 'Week planner', 'Servings scaling')
  } else {
    features.push('Core create and list flow', 'A detail view for each record', 'Search and filter', 'An empty state worth keeping')
  }

  features.push('Authentication', 'Responsive layout')
  team.push('frontend', 'backend', 'qa')

  if (/\b(ai|smart|suggest|recommend|sentiment|ml|model|chat|assist)\b/.test(t)) {
    features.push('Assisted suggestions, clearly optional')
    if (!team.includes('ai-ml')) team.push('ai-ml')
  }
  if (/\b(deploy|hosting|domain|ci|pipeline|infrastructure|docker)\b/.test(t)) {
    team.push('devops')
  }

  const name = titleFor(intent)
  return {
    title: name,
    summary: 'Here is how I would approach it. Nothing is built until you say so.',
    features,
    team,
    flow: ['Plan', 'Build', 'Review', 'Preview', 'Ship'],
  }
}

/** Title from the user's own words — used as the project name. */
export const titleFor = (intent: string) => {
  const cleaned = intent
    .replace(/^\s*(please\s+)?(can you\s+|could you\s+)?/i, '')
    .replace(/^\s*(build|create|make|design|add|set up|setup)\s+(me\s+)?(a|an|the)?\s*/i, '')
    .trim()
  const short = cleaned.split(/[.,\n]/)[0].split(/\s+/).slice(0, 4).join(' ')
  if (!short) return 'New project'
  return short.charAt(0).toUpperCase() + short.slice(1)
}

/** Manager's line before the plan card. */
export const MANAGER_PLAN_INTRO = "Here's how I'd approach it."

/** Manager's line when the user revises the request. */
export const MANAGER_REVISION_INTRO = [
  'Good call — here is the plan with that folded in.',
  'Updated. Same thread, new shape.',
  'That changes a few things. Here is the revised version.',
]

export const MANAGER_STRATEGY_INTRO = 'Three ways we could build this.'

export const MANAGER_CONFIRM = (strategy: string) =>
  `${strategy} it is. I will start with the core flow.`

export const MANAGER_BUILD_INTRO = 'Starting the build.'

export const MANAGER_BUILD_DONE =
  'First pass is live in the Preview. Tell me what to change and I will route it to whoever owns it.'

/** Narration for each build step, shown as Manager messages during the build. */
export const BUILD_NARRATION: Record<string, string> = {
  'Scaffolding the project structure': 'Frontend is scaffolding the app structure.',
  'Modelling records and seeding data': 'Backend is wiring the data model and seeding records.',
  'Composing the dashboard layout': 'Frontend is composing the main screen.',
  'Wiring list and create endpoints': 'Backend is wiring the list and create endpoints.',
  'Adding assisted suggestions': 'AI / ML is adding assisted suggestions.',
  'Preparing the build and deploy': 'DevOps is preparing the build and deploy.',
  'Running the first review pass': 'QA will review once the first pass is live.',
}

/** Detects an explicit "start building" instruction. */
export const wantsBuild = (t: string) =>
  /\b(start|begin|build it|go ahead|ship it|let.s go|do it|make it happen|confirmed?)\b/i.test(t)

/** Detects a plan revision request. */
export const wantsRevision = (t: string) =>
  /\b(add|also|change|instead|remove|drop|include|make sure|also need|plus|with)\b/i.test(t)

/** Scripted Manager↔agent conversation played when a channel is activated. */
export const CHANNEL_SCRIPTS = [
  {
    channel: 'frontend' as ChannelId,
    currentTask: 'Composing the dashboard layout',
    lines: [
      { agent: 'manager', text: 'Frontend — Manager here. I need the main screen for this build. Headers, the primary action, and the empty state.', toUser: true },
      { agent: 'frontend', text: 'Taking the shell now. I will wire the layout with a pill action top-right and a friendly empty state so the first run does not look broken.', toUser: true },
      { agent: 'manager', text: 'Good. Keep the visual language consistent with the rest of the product, no heavy shadows.', toUser: false },
      { agent: 'frontend', text: 'Understood. Neutral surfaces, 8px cards, the muted only for active state. I will post the canvas when the structure is stable.', toUser: true },
    ],
  },
  {
    channel: 'backend' as ChannelId,
    currentTask: 'Wiring the data layer',
    lines: [
      { agent: 'manager', text: 'Backend — I need somewhere to store records and return them fast. Keep it simple for the demo.', toUser: true },
      { agent: 'backend', text: 'On it. I will model the core record, add list and create endpoints, and seed a few rows so the preview is not empty on first load.', toUser: true },
      { agent: 'manager', text: 'Seed data is important. A blank first screen reads as broken.', toUser: false },
      { agent: 'backend', text: 'Agreed. Seeding five records with plausible values. Auth is stubbed for now, I will flag that clearly rather than fake it.', toUser: true },
    ],
  },
  {
    channel: 'ai-ml' as ChannelId,
    currentTask: 'Adding smart suggestions',
    lines: [
      { agent: 'manager', text: 'AI / ML — can we add something genuinely useful without slowing the build down?', toUser: true },
      { agent: 'ai-ml', text: 'I can add a suggestions layer that reads the current records and proposes the next action. It runs after load so it never blocks the first paint.', toUser: true },
      { agent: 'manager', text: 'That is the right trade. Make it clearly optional.', toUser: false },
      { agent: 'ai-ml', text: 'It will be behind a toggle and labelled as assisted suggestions. I will not present it as magic.', toUser: true },
    ],
  },
  {
    channel: 'devops' as ChannelId,
    currentTask: 'Preparing the build and deploy',
    lines: [
      { agent: 'manager', text: 'DevOps — we need a deploy that someone can actually run and understand.', toUser: true },
      { agent: 'devops', text: 'I will set up a preview deploy first, then production. Logs streamed in the Deploy tab, and a rollback for every version.', toUser: true },
      { agent: 'manager', text: 'Make failures explain themselves in plain language.', toUser: false },
      { agent: 'devops', text: 'Every failure gets a reason and a retry. No dead ends. Versions stay rollback-able for 30 days.', toUser: true },
    ],
  },
  {
    channel: 'qa' as ChannelId,
    currentTask: 'Running the first review pass',
    lines: [
      { agent: 'manager', text: 'QA — run the first pass once the core screens are up.', toUser: true },
      { agent: 'qa', text: 'I will cover the happy path plus three edge cases: empty state, very long text, and a failed request. Anything blocking goes straight back to the owner.', toUser: true },
      { agent: 'manager', text: 'Prioritise. A broken primary action matters more than a missing tooltip.', toUser: false },
      { agent: 'qa', text: 'Agreed, and I will keep the findings advisory so the build is never blocked by a minor issue.', toUser: true },
    ],
  },
]

/** Manager reply pool keyed by intent keywords. */
export const MANAGER_REPLIES: { match: RegExp; text: string; routedTo?: ChannelId[] }[] = [
  {
    match: /\b(look|design|style|ui|canvas|layout|color|colour)\b/i,
    text: 'That is a visual decision, so I am bringing in the right hands. I will route this to the specialists and keep you posted here.',
    routedTo: ['frontend'],
  },
  {
    match: /\b(api|data|auth|login|signup|database|save|store|backend|server)\b/i,
    text: 'This touches the systems layer. I am routing it so the data model and endpoints are right before we build on top.',
    routedTo: ['backend'],
  },
  {
    match: /\b(ai|smart|suggest|recommend|ml|model|chat)\b/i,
    text: 'Good instinct. I am bringing in the applied AI specialist to keep this useful rather than decorative.',
    routedTo: ['ai-ml'],
  },
  {
    match: /\b(deploy|hosting|domain|ci|build|pipeline|infrastructure)\b/i,
    text: 'Shipping is the goal here. I am routing this so we get a preview deploy before we touch production.',
    routedTo: ['devops'],
  },
  {
    match: /\b(test|bug|broken|error|edge case|check|review|qa)\b/i,
    text: 'Let us not ship a regression. I am routing this for a review pass with findings you can actually act on.',
    routedTo: ['qa'],
  },
  {
    match: /\b(change|update|fix|tweak|adjust|rename)\b/i,
    text: 'Small, clear change. I am routing it so the right specialist picks it up directly.',
    routedTo: ['frontend'],
  },
]

export const MANAGER_DEFAULT =
  'Got it. I have the intent and I am assembling the team. Watch the channels — I will bring specialists in as the work needs them, and everything stays visible here.'

export const MANAGER_BUILD_REPLY =
  'Starting the build now. Watch the Preview pane on the right — it grows as each specialist finishes their piece.'

export const CHANNEL_REPLIES: Record<ChannelId, string[]> = {
  frontend: [
    'Done — the layout is in and the empty state is handled. It looks intentional with no data.',
    'Pushed the styling pass. One weight for active state, everything else stays neutral.',
    'Interaction is wired. Try the primary action and it should behave.',
  ],
  backend: [
    'Records are seeded and the endpoints return real-shaped data. The preview is populated now.',
    'Auth is stubbed and labelled as such. I did not want to fake something that looks secure but is not.',
    'Schema is stable. Frontend can build against it without waiting on me.',
  ],
  'ai-ml': [
    'Suggestions are running after load so first paint is never blocked. It is behind a toggle.',
    'I kept it assistive rather than magic. You can see the reasoning instead of a black box.',
    'Threshold tuned. It is quiet until it is actually useful.',
  ],
  devops: [
    'Preview deploy is green. Production is queued behind the QA pass.',
    'Logs stream in the Deploy tab. Failures explain themselves and offer a retry.',
    'Rollback is wired for every version, so a bad deploy is not a dead end.',
  ],
  qa: [
    'Happy path passes. I found one long-text overflow and routed it back to Frontend.',
    'Edge cases covered: empty state, very long strings, and a failed request all degrade gracefully.',
    'Findings are advisory. Nothing is blocking your build.',
  ],
}

