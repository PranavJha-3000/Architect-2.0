import type { Agent, ChannelId, StrategyOption } from './types'

export const CHANNELS: { id: ChannelId; label: string; blurb: string }[] = [
  { id: 'frontend', label: 'frontend', blurb: 'UI, layout, interaction, polish' },
  { id: 'backend', label: 'backend', blurb: 'APIs, data, auth, integrations' },
  { id: 'ai-ml', label: 'ai-ml', blurb: 'Model calls, prompts, retrieval' },
  { id: 'devops', label: 'devops', blurb: 'Build, infra, deploy, observability' },
  { id: 'qa', label: 'qa', blurb: 'Tests, edge cases, regression passes' },
]

export const AGENTS: Agent[] = [
  { id: 'manager', name: 'Manager', role: 'Exec · your primary interface', short: 'MGR' },
  { id: 'frontend', name: 'Frontend', role: 'UI engineer', short: 'FE', channel: 'frontend' },
  { id: 'backend', name: 'Backend', role: 'Systems engineer', short: 'BE', channel: 'backend' },
  { id: 'ai-ml', name: 'AI / ML', role: 'Applied AI engineer', short: 'AI', channel: 'ai-ml' },
  { id: 'devops', name: 'DevOps', role: 'Infrastructure engineer', short: 'DO', channel: 'devops' },
  { id: 'qa', name: 'QA', role: 'Quality engineer', short: 'QA', channel: 'qa' },
]

export const agentById = (id: string): Agent =>
  AGENTS.find((a) => a.id === id) ?? AGENTS[0]

export const channelLabel = (id: ChannelId) => `#${id}`

export const CHANNEL_EMPTY =
  'Nothing here yet — this channel activates once Manager brings the team in.'

export const STRATEGIES: StrategyOption[] = [
  {
    id: 'lean',
    name: 'Lean',
    recommended: false,
    blurb: 'Fastest path to a working first version.',
    agents: ['frontend', 'backend'],
    flow: ['Plan', 'Build', 'Preview'],
    buildTime: '~2 min build',
  },
  {
    id: 'balanced',
    name: 'Balanced',
    recommended: true,
    blurb: 'Full core flow with a review pass before deploy.',
    agents: ['frontend', 'backend', 'qa'],
    flow: ['Plan', 'Build', 'Preview', 'QA pass', 'Deploy'],
    buildTime: '~4 min build',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    recommended: false,
    blurb: 'All specialists, extra hardening and observability.',
    agents: ['frontend', 'backend', 'ai-ml', 'devops', 'qa'],
    flow: ['Plan', 'Build', 'Preview', 'QA pass', 'Harden', 'Deploy'],
    buildTime: '~7 min build',
  },
]

export const STARTER_PROMPTS = [
  'A habit tracker where I log daily streaks and see a weekly heatmap',
  'A client portal for a small studio with invoices, files, and messages',
  'A price comparison board for indie game launches',
  'A recipe planner that turns my grocery list into a week of meals',
]

export const TEMPLATE_APPS: {
  id: string
  name: string
  summary: string
  mutedWord: string
}[] = [
  { id: 'streaks', name: 'Streak tracker', summary: 'Daily habits + heatmap', mutedWord: 'streaks' },
  { id: 'portal', name: 'Client portal', summary: 'Invoices, files, messages', mutedWord: 'invoices' },
  { id: 'deals', name: 'Launch board', summary: 'Price comparison feed', mutedWord: 'launches' },
  { id: 'meals', name: 'Meal planner', summary: 'Grocery list to week plan', mutedWord: 'meals' },
]

export interface ChannelScript {
  channel: ChannelId
  lines: { agent: string; text: string; toUser: boolean; routedTo?: ChannelId[] }[]
  currentTask: string
}
