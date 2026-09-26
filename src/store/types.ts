export type Strategy = 'lean' | 'balanced' | 'enterprise'
export type ProjectStatus = 'draft' | 'building' | 'live' | 'error'
export type BuildState = 'idle' | 'building' | 'live' | 'error'
export type PreviewMode = 'idle' | 'building' | 'live' | 'error'
export type Viewport = 'desktop' | 'tablet' | 'mobile'
export type AuthMethod = 'google' | 'password' | 'guest'
export type Persona = 'technical' | 'non-technical'
export type ThreadKind = 'manager' | 'channel' | 'dm'
export type MessageKind = 'text' | 'delegation' | 'plan' | 'strategy' | 'build' | 'system'
/** Where a project is in the chat-first lifecycle. */
export type PlanState = 'briefing' | 'planned' | 'building' | 'live'
export type ChannelId = 'frontend' | 'backend' | 'ai-ml' | 'devops' | 'qa'
export type TaskStatus = 'queued' | 'running' | 'done' | 'failed'

export interface User {
  id: string
  name: string
  email: string
  avatar: string
  persona: Persona
  authMethod: AuthMethod
}

export interface Manager {
  id: string
  /** Optional display nickname layered over the canonical "The Manager". */
  nickname: string
  /** Avatar data URL (empty = initial-letter fallback). */
  avatar: string
  createdAt: number
}

export interface Project {
  id: string
  /** Owning Manager — projects are listed and isolated per Manager. */
  managerId: string
  name: string
  framework: string
  status: ProjectStatus
  strategy: Strategy
  archived: boolean
  /** Pinned conversations sort to the top of the sidebar. */
  pinned: boolean
  /** Specialists the Manager has actually introduced. Empty until needed. */
  team: ChannelId[]
  planState: PlanState
  /** Newest Manager message — drives the conversation list preview. */
  lastMessage: string
  lastMessageAt: number
  createdAt: number
  lastOpenedAt: number
  lastView: string
  previewTemplateId: string
  intent: string
  /** Short human description shown under the project name in the drawer. */
  description: string
  importSource?: 'native' | 'github' | 'zip' | 'paste'
  thumbnailHue: number
}

/** Inline cards rendered inside a message, not as separate pages. */
export interface PlanCardData {
  type: 'plan'
  title: string
  summary: string
  features: string[]
  team: ChannelId[]
  flow: string[]
  strategy: Strategy
  revision: number
}

export interface StrategyCardData {
  type: 'strategy'
  selected: Strategy
  options: Strategy[]
}

export interface BuildCardData {
  type: 'build'
  state: BuildState
  task: string
  progress: Record<string, number>
  order: string[]
}

export type MessageCard = PlanCardData | StrategyCardData | BuildCardData

export interface Agent {
  id: string
  name: string
  role: string
  short: string
  channel?: ChannelId
}

export interface Message {
  id: string
  threadId: string
  authorId: string
  text: string
  kind: MessageKind
  routedTo?: ChannelId[]
  addressedToUser: boolean
  ts: number
  read: boolean
  /** Optional inline card rendered inside the message bubble. */
  card?: MessageCard
}

export interface Thread {
  id: string
  kind: ThreadKind
  agentId?: string
  channelId?: ChannelId
  messages: Message[]
  unread: number
  typing: boolean
  active: boolean
  lastPreview: string
  /** Set when the Manager first brings this specialist into the project. */
  introducedAt?: number
}

export interface BuildTask {
  id: string
  label: string
  agentId: string
  channel: ChannelId
  status: TaskStatus
  ts: number
}

export interface Build {
  projectId: string
  state: BuildState
  tasks: BuildTask[]
  progress: Record<ChannelId, number>
  currentTask: string
  startedAt: number
  failedReason: string
}

export interface PreviewState {
  projectId: string
  mode: PreviewMode
  viewport: Viewport
  revealed: number
}

export interface CanvasEl {
  id: string
  type: 'frame' | 'text' | 'button' | 'image' | 'card' | 'input' | 'nav' | 'divider'
  x: number
  y: number
  w: number
  h: number
  text: string
  color: string
  radius: number
  fontSize: number
  fontWeight: number
  children: CanvasEl[]
}

export interface CanvasDoc {
  projectId: string
  elements: CanvasEl[]
  selectedId: string | null
  source: 'blank' | 'sketch' | 'screenshot'
  analyzing: boolean
}

export interface FileNode {
  path: string
  lang: string
  content: string
}

export interface GuardCheck {
  id: string
  label: string
  status: 'pass' | 'advisory'
  detail: string
}

export interface GuardResult {
  checks: GuardCheck[]
  scannedAt: number
  scanning: boolean
}

export interface Commit {
  id: string
  hash: string
  message: string
  author: string
  ts: number
}

export interface PushState {
  conflict: boolean
  localSummary: string
  remoteSummary: string
  resolvedAt?: number
}

export interface GithubConn {
  connected: boolean
  account: string
  repo: string
  branch: string
  commits: Commit[]
  push: PushState
}

export type DeployStatus = 'running' | 'success' | 'failed'

export interface Deployment {
  id: string
  version: number
  env: 'preview' | 'production'
  status: DeployStatus
  failureReason: string
  url: string
  logs: string[]
  createdAt: number
  rolledBackFrom?: number
}

export interface ImportDraft {
  source: string
  sourceType: 'github' | 'zip' | 'paste'
  status: 'idle' | 'analyzing' | 'detected'
  step: number
  detectedFramework: string
  detectedStack: string[]
  suggestedAgents: ChannelId[]
  fileCount: number
  contextSummary: string
  tree: string[]
}

export interface StrategyOption {
  id: Strategy
  name: string
  recommended: boolean
  blurb: string
  agents: ChannelId[]
  flow: string[]
  buildTime: string
}

/* ---------- Onboarding ---------- */

export type OnboardingStep = 'welcome' | 'vibe' | 'integrations' | 'manager'
export type IntegrationId = 'github' | 'vercel' | 'supabase' | 'figma'

export const ONBOARDING_STEPS: OnboardingStep[] = ['welcome', 'vibe', 'integrations', 'manager']

export interface IntegrationConnection {
  connected: boolean
  account: string
  detail: string
  connectedAt: number
}

export interface OnboardingState {
  step: OnboardingStep
  complete: boolean
  startedAt: number
  integrations: Record<IntegrationId, IntegrationConnection>
  managerAvatar: string
  managerNickname: string
}

export interface IntegrationPhaseOption {
  id: string
  title: string
  sub: string
}

export interface IntegrationPhase {
  key: string
  title: string
  description: string
  options: IntegrationPhaseOption[]
}

export interface IntegrationDef {
  id: IntegrationId
  name: string
  description: string
  /** Primary integrations are shown first and labelled. */
  primary?: boolean
  recommended?: boolean
  phases: IntegrationPhase[]
}
