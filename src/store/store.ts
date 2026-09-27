import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  Build, BuildTask, CanvasDoc, CanvasEl, ChannelId, Commit, DeployStatus,
  Deployment, GithubConn, GuardResult, ImportDraft, IntegrationId, Manager, Message,
  OnboardingState, OnboardingStep, PlanCardData, PreviewState, Project, Strategy,
  Thread, User, MessageCard,
} from './types'
import { ONBOARDING_STEPS } from './types'
import { CHANNEL_SCRIPTS, CHANNEL_REPLIES, MANAGER_DEFAULT, MANAGER_REPLIES } from './scripts'
import {
  BUILD_NARRATION, MANAGER_BUILD_DONE, MANAGER_BUILD_INTRO, MANAGER_CONFIRM,
  MANAGER_PLAN_INTRO, MANAGER_REVISION_INTRO, MANAGER_STRATEGY_INTRO,
  planFor, titleFor, wantsBuild, wantsRevision, STRATEGY_OPTIONS,
} from './scripts'
import { agentById } from './roster'

const uid = (p: string) => `${p}_${Math.random().toString(36).slice(2, 9)}`
const shortHash = () => Math.random().toString(16).slice(2, 9)

interface Toast { id: string; text: string; action?: { label: string; run: () => void } }

interface AppState {
  user: User | null
  googlePending: boolean
  projects: Project[]
  threads: Record<string, Thread>
  builds: Record<string, Build>
  previews: Record<string, PreviewState>
  canvas: Record<string, CanvasDoc>
  guards: Record<string, GuardResult>
  github: Record<string, GithubConn>
  deployments: Record<string, Deployment[]>
  imports: Record<string, ImportDraft>
  toasts: Toast[]
  managerViewMode: 'conversations' | 'projects'
  projectDrawerOpen: boolean
  /** Which Manager's section the sidebar accordion has open (null = collapsed). */
  expandedManagerId: string | null
  /** Mobile sidebar visibility; the sidebar is always present at the
   *  desktop breakpoint regardless of this flag. */
  sidebarOpen: boolean
  activeFile: Record<string, string>
  demoProjectId: string | null
  /** All Manager identities. The leftmost rail renders exactly this list. */
  managers: Manager[]
  activeManagerId: string

  signIn: (u: User) => void
  signOut: () => void
  setGooglePending: (v: boolean) => void

  /** Creates a project AND its Manager conversation. No setup page. */
  createProject: (name?: string) => string
  importProject: (draft: ImportDraft) => string
  touchProject: (id: string, view: string) => void
  archiveProject: (id: string) => void
  restoreProject: (id: string) => void
  deleteProject: (id: string) => void
  renameProject: (id: string, name: string) => void
  chooseStrategy: (projectId: string, strategy: Strategy) => void
  requestRevision: (projectId: string, text: string) => void
  togglePin: (id: string) => void
  /** Adds a Manager identity. Never creates a project. */
  createManager: (input: { nickname: string; avatar: string; templateId?: string }) => string
  setActiveManager: (id: string) => void
  managerSend: (projectId: string, text: string) => void
  managerRoute: (projectId: string, channels: ChannelId[]) => void
  pushManagerMessage: (projectId: string, text: string, kind?: Message['kind'], card?: MessageCard, routedTo?: ChannelId[]) => void
  /** Writes a user-authored turn into the Manager thread without running intent
   *  routing. Used by contextual capabilities that mirror a user action into
   *  the conversation without pretending it was a typed request. */
  pushUserMessage: (projectId: string, text: string) => void
  channelSend: (projectId: string, channel: ChannelId, text: string) => void
  dmSend: (projectId: string, agentId: string, text: string) => void
  readThread: (threadId: string) => void
  setTyping: (threadId: string, v: boolean) => void

  startBuild: (projectId: string) => void
  tickBuild: (projectId: string) => void
  retryBuild: (projectId: string) => void

  setViewport: (projectId: string, v: PreviewState['viewport']) => void
  setManagerViewMode: (v: 'conversations' | 'projects') => void
  setProjectDrawerOpen: (open: boolean) => void
  toggleProjectDrawer: () => void
  setExpandedManagerId: (id: string | null) => void
  setSidebarOpen: (v: boolean) => void
  toggleSidebar: () => void

  initCanvas: (projectId: string, source: CanvasDoc['source'], elements?: CanvasEl[]) => void
  selectElement: (projectId: string, id: string | null) => void
  updateElement: (projectId: string, id: string, patch: Partial<CanvasEl>) => void
  setAnalyzing: (projectId: string, v: boolean) => void

  setActiveFile: (projectId: string, path: string) => void
  runGuard: (projectId: string) => void
  toggleGuardDetail: (projectId: string, id: string) => void

  connectGithub: (projectId: string, repo: string) => void
  disconnectGithub: (projectId: string) => void
  commitBuild: (projectId: string) => void
  createConflict: (projectId: string) => void
  resolveConflict: (projectId: string, keep: 'local' | 'remote') => void

  deploy: (projectId: string, env: 'preview' | 'production', fail: boolean) => void
  pushDeployLog: (projectId: string, line: string) => void
  rollback: (projectId: string, version: number) => void

  setImportDraft: (key: string, draft: ImportDraft) => void
  pushToast: (text: string, action?: Toast['action']) => void
  dismissToast: (id: string) => void
  seedDemo: () => void

  // ---- Onboarding ----
  onboarding: OnboardingState
  startOnboarding: () => void
  setOnboardingStep: (step: OnboardingStep) => void
  nextOnboardingStep: () => void
  prevOnboardingStep: () => void
  connectIntegration: (id: IntegrationId, account: string, detail: string) => void
  disconnectIntegration: (id: IntegrationId) => void
  setManagerAvatar: (dataUrl: string) => void
  setManagerNickname: (nickname: string) => void
  setManagerTemplate: (templateId: string) => void
  completeOnboarding: () => void
  resetOnboarding: () => void
}

const threadIdFor = (p: string, k: string) => `${p}:${k}`

function makeThread(kind: Thread['kind'], extra: Partial<Thread> = {}): Thread {
  return { id: uid('t'), kind, messages: [], unread: 0, typing: false, active: kind !== 'channel', lastPreview: '', ...extra }
}

const emptyProgress = (): Record<ChannelId, number> => ({ frontend: 0, backend: 0, 'ai-ml': 0, devops: 0, qa: 0 })

const TASK_SEQUENCE: { label: string; channel: ChannelId }[] = [
  { label: 'Scaffolding the project structure', channel: 'frontend' },
  { label: 'Modelling records and seeding data', channel: 'backend' },
  { label: 'Composing the dashboard layout', channel: 'frontend' },
  { label: 'Wiring list and create endpoints', channel: 'backend' },
  { label: 'Adding assisted suggestions', channel: 'ai-ml' },
  { label: 'Preparing the build and deploy', channel: 'devops' },
  { label: 'Running the first review pass', channel: 'qa' },
]

const GUARD_CHECKS = [
  { id: 'types', label: 'No `any` in public interfaces', status: 'pass' as const, detail: 'All exported types are explicit. No escape hatches used.' },
  { id: 'errors', label: 'Every async call has error handling', status: 'pass' as const, detail: 'All fetches are wrapped with a try/catch and a user-visible fallback.' },
  { id: 'keys', label: 'No secrets committed to the repo', status: 'pass' as const, detail: 'Configuration is read from environment variables.' },
  { id: 'a11y', label: 'Interactive elements have accessible names', status: 'pass' as const, detail: 'Buttons and inputs carry labels or aria-label text.' },
  { id: 'deps', label: 'Dependency audit clean', status: 'pass' as const, detail: 'No known critical advisories in the current tree.' },
  { id: 'bundle', label: 'Bundle size within budget', status: 'advisory' as const, detail: 'Bundle is 12% over the recommended budget. Consider code splitting the chart module. Not blocking.' },
  { id: 'contrast', label: 'Muted text contrast ratio', status: 'advisory' as const, detail: 'Muted text on the darkest surface measures 4.2:1. Slightly under the 4.5:1 target for body copy. Advisory only.' },
]

const DEPLOY_LOGS = [
  'Resolving dependencies from lockfile',
  'Compiling application bundle',
  'Optimising static assets',
  'Uploading build output to edge network',
  'Warming container runtime',
  'Running smoke tests against /health',
  'Switching traffic to new version',
]

const FAIL_REASON =
  'The build ran out of memory while packaging images. This usually means one of your images is very large. Try compressing it, or remove an image you no longer use.'


const initialTasks = (): BuildTask[] =>
  TASK_SEQUENCE.map((t, i) => ({ id: `task_${i}`, label: t.label, channel: t.channel, agentId: t.channel, status: 'queued' as const, ts: Date.now() + i }))

const pickTemplate = (intent: string) => {
  const t = intent.toLowerCase()
  if (t.includes('habit') || t.includes('streak')) return 'streaks'
  if (t.includes('client') || t.includes('portal') || t.includes('invoice')) return 'portal'
  if (t.includes('price') || t.includes('game') || t.includes('launch')) return 'deals'
  if (t.includes('recipe') || t.includes('meal') || t.includes('grocery')) return 'meals'
  return 'streaks'
}

const nameFromIntent = (intent: string) => {
  const w = intent.replace(/^(a|an|the|build me|create|make|build)\s+/i, '').trim()
  const short = w.split(/[,.]/)[0].split(' ').slice(0, 4).join(' ')
  return short ? short.charAt(0).toUpperCase() + short.slice(1) : 'Untitled project'
}

/**
 * Chat-first: a new project starts with ONLY the Manager.
 * Specialist threads are created lazily by `ensureSpecialist` the moment the
 * Manager actually brings someone in — never up front.
 */
const baseThreads = (projectId: string, now: number): Record<string, Thread> => {
  const tid = threadIdFor(projectId, 'manager')
  const opening: Message = {
    id: uid('m'), threadId: tid, authorId: 'manager',
    text: 'New project. What are we building?',
    kind: 'text', addressedToUser: true, ts: now, read: true,
  }
  return {
    [tid]: {
      ...makeThread('manager', { id: tid, active: true, introducedAt: now }),
      messages: [opening], lastPreview: 'New project. What are we building?',
    },
  }
}

/** Creates a specialist channel/DM thread on first introduction. */
const ensureSpecialist = (
  threads: Record<string, Thread>, projectId: string, ch: ChannelId,
): Record<string, Thread> => {
  const tid = threadIdFor(projectId, ch)
  if (threads[tid]) return threads
  const now = Date.now()
  return {
    ...threads,
    [tid]: makeThread('channel', { id: tid, channelId: ch, active: true, introducedAt: now, unread: 0, lastPreview: 'Manager brought the team in' }),
    [threadIdFor(projectId, `dm:${ch}`)]: makeThread('dm', { id: threadIdFor(projectId, `dm:${ch}`), agentId: ch, active: true, introducedAt: now }),
  }
}

const emptyConnections = (): OnboardingState['integrations'] => ({
  github: { connected: false, account: '', detail: '', connectedAt: 0 },
  vercel: { connected: false, account: '', detail: '', connectedAt: 0 },
  supabase: { connected: false, account: '', detail: '', connectedAt: 0 },
  figma: { connected: false, account: '', detail: '', connectedAt: 0 },
})

const initialOnboarding = (): OnboardingState => ({
  step: 'welcome',
  complete: false,
  startedAt: 0,
  integrations: emptyConnections(),
  managerAvatar: '',
  managerNickname: '',
  managerTemplate: '',
})

const stepIndex = (s: OnboardingStep) => Math.max(0, ONBOARDING_STEPS.indexOf(s))

/** Default Manager identity, derived from the onboarding avatar/nickname/template. */
const defaultManagerFrom = (onboarding: OnboardingState): Manager => ({
  id: uid('mgr'),
  nickname: onboarding.managerNickname,
  avatar: onboarding.managerAvatar,
  templateId: onboarding.managerTemplate || undefined,
  createdAt: Date.now(),
})

/** Owning Manager for a new project: active, else first, else create default. */
const ownerManagerId = (): string => {
  const s = useStore.getState()
  if (s.managers.some((m) => m.id === s.activeManagerId)) return s.activeManagerId
  if (s.managers.length) return s.managers[0].id
  const m = defaultManagerFrom(s.onboarding)
  useStore.setState({ managers: [m], activeManagerId: m.id })
  return m.id
}

/** Current per-agent progress snapshot (safe before any build exists). */
const s_progress = (projectId: string): Record<string, number> =>
  useStore.getState().builds[projectId]?.progress ?? emptyProgress()

/** How many times the plan has been revised in this conversation. */
const revisionOf = (projectId: string): number => {
  const t = useStore.getState().threads[threadIdFor(projectId, 'manager')]
  if (!t) return 0
  return t.messages.filter((m) => m.card?.type === 'plan').length
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      googlePending: false,
      projects: [],
      threads: {},
      builds: {},
      previews: {},
      canvas: {},
      guards: {},
      github: {},
      deployments: {},
      imports: {},
      toasts: [],
      managerViewMode: 'conversations',
      projectDrawerOpen: false,
      expandedManagerId: null,
      sidebarOpen: true,
      activeFile: {},
      demoProjectId: null,
      managers: [],
      activeManagerId: '',
      onboarding: initialOnboarding(),

      signIn: (u) => set({ user: u, googlePending: false }),
      signOut: () => set({ user: null }),
      setGooglePending: (v) => set({ googlePending: v }),

      // ---- Onboarding state machine: welcome → vibe → integrations → manager → workspace ----
      startOnboarding: () => set((s) => ({
        onboarding: { ...s.onboarding, step: 'welcome', startedAt: s.onboarding.startedAt || Date.now() },
      })),
      setOnboardingStep: (step) => set((s) => ({
        onboarding: { ...s.onboarding, step, startedAt: s.onboarding.startedAt || Date.now() },
      })),
      nextOnboardingStep: () => set((s) => {
        const i = stepIndex(s.onboarding.step)
        const next = ONBOARDING_STEPS[Math.min(i + 1, ONBOARDING_STEPS.length - 1)]
        return { onboarding: { ...s.onboarding, step: next, startedAt: s.onboarding.startedAt || Date.now() } }
      }),
      prevOnboardingStep: () => set((s) => {
        const i = stepIndex(s.onboarding.step)
        const prev = ONBOARDING_STEPS[Math.max(i - 1, 0)]
        return { onboarding: { ...s.onboarding, step: prev } }
      }),
      connectIntegration: (id, account, detail) => set((s) => ({
        onboarding: {
          ...s.onboarding,
          integrations: {
            ...s.onboarding.integrations,
            [id]: { connected: true, account, detail, connectedAt: Date.now() },
          },
        },
      })),
      disconnectIntegration: (id) => set((s) => ({
        onboarding: {
          ...s.onboarding,
          integrations: {
            ...s.onboarding.integrations,
            [id]: { connected: false, account: '', detail: '', connectedAt: 0 },
          },
        },
      })),
      setManagerAvatar: (dataUrl) => set((s) => ({ onboarding: { ...s.onboarding, managerAvatar: dataUrl } })),
      setManagerNickname: (n) => set((s) => ({ onboarding: { ...s.onboarding, managerNickname: n } })),
      setManagerTemplate: (templateId) => set((s) => ({ onboarding: { ...s.onboarding, managerTemplate: templateId } })),
      completeOnboarding: () => set((s) => {
        if (s.managers.length) return { onboarding: { ...s.onboarding, complete: true } }
        const m = defaultManagerFrom(s.onboarding)
        return { onboarding: { ...s.onboarding, complete: true }, managers: [m], activeManagerId: m.id }
      }),
      resetOnboarding: () => set({ onboarding: initialOnboarding() }),

      createProject: (name) => {
        const id = uid('proj')
        const now = Date.now()
        const title = name?.trim() || 'New project'
        const project: Project = {
          id, name: title, managerId: ownerManagerId(), framework: 'React + Vite + TypeScript',
          status: 'draft', strategy: 'balanced', archived: false,
          pinned: false, team: [], planState: 'briefing',
          lastMessage: 'New project. What are we building?', lastMessageAt: now,
          createdAt: now, lastOpenedAt: now, lastView: 'manager',
          previewTemplateId: 'streaks', intent: '', description: 'New conversation', thumbnailHue: Math.floor(Math.random() * 360),
        }
        set((s) => ({
          projects: [project, ...s.projects],
          threads: { ...s.threads, ...baseThreads(id, now) },
        }))
        return id
      },

      togglePin: (id) => set((s) => ({
        projects: s.projects.map((p) => (p.id === id ? { ...p, pinned: !p.pinned } : p)),
      })),

      /** Adds a Manager identity. Never creates a project. */
      createManager: (input) => {
        const m: Manager = {
          id: uid('mgr'), nickname: input.nickname.trim(), avatar: input.avatar,
          templateId: input.templateId || undefined, createdAt: Date.now(),
        }
        set((s) => ({ managers: [...s.managers, m], activeManagerId: m.id }))
        return m.id
      },
      setActiveManager: (id) => set((s) => (s.managers.some((m) => m.id === id) ? { activeManagerId: id } : {})),

      /** Strategy picked from an inline card in the Manager conversation. */
      chooseStrategy: (projectId, strategy) => {
        const tid = threadIdFor(projectId, 'manager')
        const label = strategy.charAt(0).toUpperCase() + strategy.slice(1)
        set((s) => {
          const t = s.threads[tid]
          if (!t) return {}
          const now = Date.now()
          const userMsg: Message = { id: uid('m'), threadId: tid, authorId: 'user', text: label, kind: 'text', addressedToUser: true, ts: now, read: true }
          // Mark the existing strategy card as answered rather than appending a new one.
          const messages = t.messages.map((m) =>
            m.card?.type === 'strategy' ? { ...m, card: { ...m.card, selected: strategy } } : m,
          )
          return {
            threads: { ...s.threads, [tid]: { ...t, messages: [...messages, userMsg], typing: true } },
            projects: s.projects.map((p) => (p.id === projectId ? { ...p, strategy } : p)),
          }
        })
        setTimeout(() => {
          get().pushManagerMessage(projectId, MANAGER_CONFIRM(label), 'text')
          setTimeout(() => {
            const t = get().threads[tid]
            if (t?.messages.some((m) => m.kind === 'build')) return
            get().pushManagerMessage(projectId, 'Say the word and I will start.', 'text')
          }, 650)
        }, 700)
      },

      /** User typed an adjustment; Manager revises the plan in the same thread. */
      requestRevision: (projectId, text) => {
        const tid = threadIdFor(projectId, 'manager')
        set((s) => {
          const t = s.threads[tid]
          if (!t) return {}
          const now = Date.now()
          const userMsg: Message = { id: uid('m'), threadId: tid, authorId: 'user', text, kind: 'text', addressedToUser: true, ts: now, read: true }
          return { threads: { ...s.threads, [tid]: { ...t, messages: [...t.messages, userMsg], typing: true } } }
        })
        setTimeout(() => {
          const project = get().projects.find((p) => p.id === projectId)
          if (!project) return
          const merged = `${project.intent}. ${text}`
          const plan = planFor(merged)
          const strategy = project.strategy
          set((s) => ({ projects: s.projects.map((p) => (p.id === projectId ? { ...p, intent: merged, name: project.name || plan.title } : p)) }))
          const intro = MANAGER_REVISION_INTRO[Math.floor(Math.random() * MANAGER_REVISION_INTRO.length)]
          get().pushManagerMessage(projectId, intro, 'text')
          setTimeout(() => {
            get().pushManagerMessage(projectId, plan.summary, 'plan', {
              type: 'plan', title: plan.title, summary: '', features: plan.features,
              team: plan.team, flow: plan.flow, strategy, revision: revisionOf(projectId) + 1,
            })
          }, 500)
        }, 800)
      },

      importProject: (draft) => {
        const id = uid('proj')
        const now = Date.now()
        const project: Project = {
          id, name: draft.source.replace(/^https?:\/\/github.com\//, '').replace(/\/$/, '') || 'Imported project',
          managerId: ownerManagerId(), framework: draft.detectedFramework, status: 'live', strategy: 'balanced', archived: false,
          pinned: false, team: draft.suggestedAgents, planState: 'live',
          lastMessage: draft.contextSummary, lastMessageAt: now,
          createdAt: now, lastOpenedAt: now, lastView: 'manager', previewTemplateId: 'portal',
          intent: draft.contextSummary,
          description: (draft.detectedStack || []).join(' + ') || 'Imported project',
          importSource: draft.sourceType, thumbnailHue: Math.floor(Math.random() * 360),
        }
        const threads = baseThreads(id, now)
        threads[threadIdFor(id, 'manager')].messages = [{
          id: uid('m'), threadId: threadIdFor(id, 'manager'), authorId: 'manager',
          text: draft.contextSummary, kind: 'plan', addressedToUser: true, ts: now, read: true,
        }]
        // Imported projects genuinely have these specialists already.
        let t = threads
        for (const ch of draft.suggestedAgents) {
          t = ensureSpecialist(t, id, ch)
          t[threadIdFor(id, ch)].lastPreview = 'Ready for work'
        }
        const build: Build = {
          projectId: id, state: 'live', tasks: initialTasks().map((t) => ({ ...t, status: 'done' as const })),
          progress: { frontend: 100, backend: 100, 'ai-ml': 100, devops: 100, qa: 100 },
          currentTask: 'Import complete — ready to build', startedAt: now, failedReason: '',
        }
        set((s) => ({
          projects: [project, ...s.projects], threads: { ...s.threads, ...threads },
          builds: { ...s.builds, [id]: build },
          previews: { ...s.previews, [id]: { projectId: id, mode: 'live', viewport: 'desktop', revealed: 100 } },
        }))
        return id
      },

      touchProject: (id, view) => set((s) => ({
        projects: s.projects.map((p) => (p.id === id ? { ...p, lastOpenedAt: Date.now(), lastView: view } : p)),
      })),

      archiveProject: (id) => {
        const p = get().projects.find((x) => x.id === id)
        set((s) => ({ projects: s.projects.map((x) => (x.id === id ? { ...x, archived: true } : x)) }))
        get().pushToast(`Archived “${p?.name ?? 'project'}”`, {
          label: 'Undo', run: () => get().restoreProject(id),
        })
      },
      restoreProject: (id) => set((s) => ({
        projects: s.projects.map((x) => (x.id === id ? { ...x, archived: false } : x)),
      })),
      deleteProject: (id) => set((s) => ({ projects: s.projects.filter((x) => x.id !== id) })),
      renameProject: (id, name) => set((s) => ({
        projects: s.projects.map((x) => (x.id === id ? { ...x, name } : x)),
      })),

      // ---- Chat: Manager ----
      pushManagerMessage: (projectId: string, text: string, kind?: Message['kind'], card?: MessageCard, routedTo?: ChannelId[]) => {
        const tid = threadIdFor(projectId, 'manager')
        set((s) => {
          const t = s.threads[tid]
          if (!t) return {}
          const msg: Message = {
            id: uid('m'), threadId: tid, authorId: 'manager', text, kind: kind ?? 'text',
            card, routedTo, addressedToUser: true, ts: Date.now(), read: true,
          }
          return {
            threads: { ...s.threads, [tid]: { ...t, messages: [...t.messages, msg], typing: false, lastPreview: text } },
            projects: s.projects.map((p) => (p.id === projectId ? { ...p, lastMessage: text, lastMessageAt: msg.ts } : p)),
          }
        })
      },

      pushUserMessage: (projectId, text) => {
        const tid = threadIdFor(projectId, 'manager')
        set((s) => {
          const t = s.threads[tid]
          if (!t) return {}
          const msg: Message = {
            id: uid('m'), threadId: tid, authorId: 'user', text,
            kind: 'text', addressedToUser: true, ts: Date.now(), read: true,
          }
          return {
            threads: { ...s.threads, [tid]: { ...t, messages: [...t.messages, msg], typing: false } },
            projects: s.projects.map((p) => (p.id === projectId ? { ...p, lastMessage: text, lastMessageAt: msg.ts } : p)),
          }
        })
      },

      managerSend: (projectId, text) => {
        const tid = threadIdFor(projectId, 'manager')
        const project = get().projects.find((p) => p.id === projectId)
        if (!project) return
        set((s) => {
          const t = s.threads[tid]
          if (!t) return {}
          const msg: Message = { id: uid('m'), threadId: tid, authorId: 'user', text, kind: 'text', addressedToUser: true, ts: Date.now(), read: true }
          return { threads: { ...s.threads, [tid]: { ...t, messages: [...t.messages, msg], typing: true } } }
        })

        const respond = (fn: () => void) => setTimeout(fn, 750 + Math.random() * 450)

        // 1. First real instruction: Manager plans.
        if (project.planState === 'briefing') {
          const plan = planFor(text)
          const name = plan.title
          set((s) => ({
            projects: s.projects.map((p) => (p.id === projectId
              ? { ...p, name, intent: text, description: plan.summary || name, previewTemplateId: pickTemplate(text), planState: 'planned' }
              : p)),
          }))
          respond(() => {
            get().pushManagerMessage(projectId, MANAGER_PLAN_INTRO, 'text')
            setTimeout(() => {
              get().pushManagerMessage(projectId, '', 'plan', {
                type: 'plan', title: plan.title, summary: '',
                features: plan.features, team: plan.team, flow: plan.flow,
                strategy: project.strategy, revision: 1,
              })
              setTimeout(() => get().pushManagerMessage(projectId, MANAGER_STRATEGY_INTRO, 'strategy', {
                type: 'strategy', selected: project.strategy, options: STRATEGY_OPTIONS,
              }), 600)
            }, 500)
          })
          return
        }

        // 2. Explicit go-ahead.
        if (wantsBuild(text)) {
          respond(() => {
            get().pushManagerMessage(projectId, 'On it.', 'text')
            setTimeout(() => get().startBuild(projectId), 450)
          })
          return
        }

        // 3. Revision to the plan.
        if (wantsRevision(text)) {
          get().requestRevision(projectId, text)
          return
        }

        // 4. Otherwise: Manager decides who is needed from the wording.
        const match = MANAGER_REPLIES.find((r) => r.match.test(text))
        respond(() => {
          if (match?.routedTo) {
            const names = match.routedTo.map((c) => agentById(c).name).join(' and ')
            get().pushManagerMessage(projectId, match.text, 'delegation', undefined, match.routedTo)
            get().managerRoute(projectId, match.routedTo)
          } else {
            get().pushManagerMessage(projectId, match?.text ?? MANAGER_DEFAULT, 'text')
          }
        })
      },

      // Dynamic team formation: a specialist thread is created ONLY here.
      managerRoute: (projectId, channels) => {
        const project = get().projects.find((p) => p.id === projectId)
        if (!project) return
        const newcomers = channels.filter((c) => !project.team.includes(c))
        if (!newcomers.length) return
        set((s) => ({
          projects: s.projects.map((p) => (p.id === projectId ? { ...p, team: [...p.team, ...newcomers] } : p)),
        }))
        for (const ch of newcomers) {
          const tid = threadIdFor(projectId, ch)
          const script = CHANNEL_SCRIPTS.find((s) => s.channel === ch)
          set((s) => ({ threads: ensureSpecialist(s.threads, projectId, ch) }))
          if (!script) continue
          set((s) => ({
            threads: {
              ...s.threads, [tid]: { ...s.threads[tid], active: true, typing: true,
                lastPreview: 'Manager brought the team in' },
            },
          }))
          script.lines.forEach((line, i) => {
            setTimeout(() => {
              if (!get().threads[tid]) return
              const msg: Message = {
                id: uid('m'), threadId: tid, authorId: line.agent, text: line.text, kind: 'text',
                addressedToUser: line.toUser, ts: Date.now(), read: false,
              }
              set((s) => ({
                threads: {
                  ...s.threads,
                  [tid]: {
                    ...s.threads[tid], messages: [...s.threads[tid].messages, msg],
                    typing: i < script.lines.length - 1,
                  },
                },
              }))
            }, 500 + i * 750)
          })
          const build = get().builds[projectId]
          if (build && build.state === 'building') {
            setTimeout(() => set((s) => ({ builds: { ...s.builds, [projectId]: { ...s.builds[projectId], currentTask: script.currentTask } } })), 300)
          }
        }
      },

      channelSend: (projectId, channel, text) => {
        const tid = threadIdFor(projectId, channel)
        set((s) => {
          const t = s.threads[tid]
          if (!t) return {}
          const msg: Message = { id: uid('m'), threadId: tid, authorId: 'user', text, kind: 'text', addressedToUser: true, ts: Date.now(), read: true }
          return { threads: { ...s.threads, [tid]: { ...t, messages: [...t.messages, msg], typing: true } } }
        })
        const pool = CHANNEL_REPLIES[channel]
        setTimeout(() => {
          if (!get().threads[tid]) return
          const msg: Message = { id: uid('m'), threadId: tid, authorId: channel, text: pool[Math.floor(Math.random() * pool.length)], kind: 'text', addressedToUser: true, ts: Date.now(), read: true }
          set((s) => ({ threads: { ...s.threads, [tid]: { ...s.threads[tid], messages: [...s.threads[tid].messages, msg], typing: false } } }))
        }, 1000 + Math.random() * 500)
      },

      dmSend: (projectId, agentId, text) => {
        const tid = threadIdFor(projectId, `dm:${agentId}`)
        set((s) => {
          const t = s.threads[tid]
          if (!t) return {}
          const msg: Message = { id: uid('m'), threadId: tid, authorId: 'user', text, kind: 'text', addressedToUser: true, ts: Date.now(), read: true }
          return { threads: { ...s.threads, [tid]: { ...t, messages: [...t.messages, msg], typing: true } } }
        })
        const pool = CHANNEL_REPLIES[agentId as ChannelId] ?? CHANNEL_REPLIES.frontend
        setTimeout(() => {
          if (!get().threads[tid]) return
          const msg: Message = { id: uid('m'), threadId: tid, authorId: agentId, text: pool[Math.floor(Math.random() * pool.length)], kind: 'text', addressedToUser: true, ts: Date.now(), read: true }
          set((s) => ({ threads: { ...s.threads, [tid]: { ...s.threads[tid], messages: [...s.threads[tid].messages, msg], typing: false } } }))
        }, 1000 + Math.random() * 400)
      },

      readThread: (tid) => set((s) => {
        const t = s.threads[tid]
        if (!t) return {}
        return { threads: { ...s.threads, [tid]: { ...t, unread: 0, messages: t.messages.map((m) => ({ ...m, read: true })) } } }
      }),
      setTyping: (tid, v) => set((s) => (s.threads[tid] ? { threads: { ...s.threads, [tid]: { ...s.threads[tid], typing: v } } } : {})),

      // ---- Build engine: narration happens IN the Manager conversation ----
      startBuild: (projectId) => {
        const now = Date.now()
        set((s) => ({
          builds: { ...s.builds, [projectId]: { projectId, state: 'building', tasks: initialTasks(), progress: emptyProgress(), currentTask: TASK_SEQUENCE[0].label, startedAt: now, failedReason: '' } },
          previews: { ...s.previews, [projectId]: { projectId, mode: 'building', viewport: 'desktop', revealed: 0 } },
          projects: s.projects.map((p) => (p.id === projectId ? { ...p, status: 'building', planState: 'building' } : p)),
        }))
        get().pushManagerMessage(projectId, MANAGER_BUILD_INTRO, 'build', {
          type: 'build', state: 'building', task: TASK_SEQUENCE[0].label, progress: emptyProgress(), order: [],
        })

        const strategy = get().projects.find((p) => p.id === projectId)?.strategy ?? 'balanced'
        const count = strategy === 'lean' ? 3 : strategy === 'balanced' ? 5 : 7
        const order: string[] = []
        let i = 0
        const advance = () => {
          if (i >= count) {
            set((s) => ({
              builds: { ...s.builds, [projectId]: { ...s.builds[projectId], state: 'live', currentTask: 'Build complete' } },
              previews: { ...s.previews, [projectId]: { ...s.previews[projectId], mode: 'live', revealed: 100 } },
              projects: s.projects.map((p) => (p.id === projectId ? { ...p, status: 'live', planState: 'live' } : p)),
            }))
            get().runGuard(projectId)
            get().pushManagerMessage(projectId, MANAGER_BUILD_DONE, 'build', {
              type: 'build', state: 'live', task: 'Build complete',
              progress: s_progress(projectId), order,
            })
            return
          }
          const task = get().builds[projectId]?.tasks[i]
          if (task) {
            set((s) => {
              const b = s.builds[projectId]
              const tasks = b.tasks.map((t, idx) => (idx < i ? { ...t, status: 'done' as const } : idx === i ? { ...t, status: 'running' as const } : t))
              const progress = { ...b.progress, [task.channel]: Math.min(100, Math.round(((i + 0.6) / count) * 100)) }
              const done = tasks.filter((t) => t.status === 'done').length
              return {
                builds: { ...s.builds, [projectId]: { ...b, tasks, progress, currentTask: task.label } },
                previews: { ...s.previews, [projectId]: { ...s.previews[projectId], revealed: Math.round((done / count) * 100) } },
              }
            })
            // The Manager introduces whoever is needed for this step.
            get().managerRoute(projectId, [task.channel])
            if (!order.includes(task.channel)) order.push(task.channel)
            get().pushManagerMessage(projectId, BUILD_NARRATION[task.label] ?? `${agentById(task.channel).name} is working.`, 'build', {
              type: 'build', state: 'building', task: task.label, progress: s_progress(projectId), order: [...order],
            })
          }
          i++
          setTimeout(advance, 1300)
        }
        setTimeout(advance, 900)
      },

      tickBuild: () => {},
      retryBuild: (projectId) => {
        set((s) => ({
          builds: { ...s.builds, [projectId]: { ...s.builds[projectId], state: 'building', currentTask: 'Retrying build' } },
          previews: { ...s.previews, [projectId]: { ...s.previews[projectId], mode: 'building', revealed: 0 } },
          projects: s.projects.map((p) => (p.id === projectId ? { ...p, status: 'building' } : p)),
        }))
        setTimeout(() => {
          set((s) => ({
            builds: { ...s.builds, [projectId]: { ...s.builds[projectId], state: 'live', currentTask: 'Build complete' } },
            previews: { ...s.previews, [projectId]: { ...s.previews[projectId], mode: 'live', revealed: 100 } },
            projects: s.projects.map((p) => (p.id === projectId ? { ...p, status: 'live' } : p)),
          }))
          get().runGuard(projectId)
          get().pushToast('Build recovered — preview is live')
        }, 2600)
      },

      setViewport: (projectId, v) => set((s) => ({
        previews: { ...s.previews, [projectId]: { ...(s.previews[projectId] ?? { projectId, mode: 'idle', revealed: 0 }), viewport: v } },
      })),
      setManagerViewMode: (v) => set({ managerViewMode: v }),
      setProjectDrawerOpen: (open) => set({ projectDrawerOpen: open }),
      toggleProjectDrawer: () => set((s) => ({ projectDrawerOpen: !s.projectDrawerOpen })),
      setExpandedManagerId: (id) => set({ expandedManagerId: id }),
      setSidebarOpen: (v) => set({ sidebarOpen: v }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

      // ---- Canvas (UI Head) ----
      initCanvas: (projectId, source, elements) => set((s) => {
        if (s.canvas[projectId]) return {}
        return { canvas: { ...s.canvas, [projectId]: { projectId, elements: elements ?? [], selectedId: null, source, analyzing: false } } }
      }),
      selectElement: (projectId, id) => set((s) => (s.canvas[projectId]
        ? { canvas: { ...s.canvas, [projectId]: { ...s.canvas[projectId], selectedId: id } } } : {})),
      updateElement: (projectId, id, patch) => set((s) => {
        const doc = s.canvas[projectId]
        if (!doc) return {}
        const walk = (els: CanvasEl[]): CanvasEl[] => els.map((e) =>
          e.id === id ? { ...e, ...patch } : { ...e, children: walk(e.children) })
        return { canvas: { ...s.canvas, [projectId]: { ...doc, elements: walk(doc.elements) } } }
      }),
      setAnalyzing: (projectId, v) => set((s) => (s.canvas[projectId]
        ? { canvas: { ...s.canvas, [projectId]: { ...s.canvas[projectId], analyzing: v } } } : {})),

      // ---- Code + Architect Guard (advisory only) ----
      setActiveFile: (projectId, path) => set((s) => ({ activeFile: { ...s.activeFile, [projectId]: path } })),
      runGuard: (projectId) => {
        set((s) => ({ guards: { ...s.guards, [projectId]: { checks: s.guards[projectId]?.checks ?? GUARD_CHECKS, scannedAt: Date.now(), scanning: true } } }))
        setTimeout(() => set((s) => (s.guards[projectId] ? { guards: { ...s.guards, [projectId]: { ...s.guards[projectId], scanning: false } } } : {})), 1500)
      },
      toggleGuardDetail: (projectId, id) => set((s) => {
        const g = s.guards[projectId]
        if (!g) return {}
        return { guards: { ...s.guards, [projectId]: { ...g, checks: g.checks.map((c) => (c.id === id ? { ...c, detail: c.detail } : c)) } } }
      }),

      // ---- GitHub (mock) ----
      connectGithub: (projectId, repo) => set((s) => ({
        github: {
          ...s.github,
          [projectId]: {
            connected: true, account: 'pranav-dev', repo, branch: 'main',
            commits: [
              { id: 'c0', hash: shortHash(), message: 'Initial commit from Architect', author: 'Manager', ts: Date.now() - 86400000 * 3 },
              { id: 'c1', hash: shortHash(), message: 'Add project scaffold and routing', author: 'Frontend', ts: Date.now() - 86400000 * 2 },
              { id: 'c2', hash: shortHash(), message: 'Seed data layer with local records', author: 'Backend', ts: Date.now() - 3600000 * 20 },
            ],
            push: { conflict: false, localSummary: '', remoteSummary: '' },
          },
        },
      })),
      disconnectGithub: (projectId) => set((s) => ({ github: { ...s.github, [projectId]: { ...s.github[projectId], connected: false } } })),
      commitBuild: (projectId) => {
        const g = get().github[projectId]
        if (!g?.connected) return
        const commit: Commit = { id: uid('c'), hash: shortHash(), message: `Build: ${get().builds[projectId]?.currentTask ?? 'update'}`, author: 'Manager', ts: Date.now() }
        set((s) => ({ github: { ...s.github, [projectId]: { ...s.github[projectId], commits: [commit, ...s.github[projectId].commits], push: { ...s.github[projectId].push, resolvedAt: Date.now() } } } }))
        get().pushToast(`Committed ${commit.hash} to ${g.branch}`)
      },
      createConflict: (projectId) => {
        const g = get().github[projectId]
        if (!g?.connected) return
        set((s) => ({
          github: {
            ...s.github,
            [projectId]: {
              ...s.github[projectId],
              push: {
                conflict: true,
                localSummary: '2 local changes from your latest build',
                remoteSummary: '1 commit pushed to main by another teammate',
              },
            },
          },
        }))
      },
      resolveConflict: (projectId, keep) => {
        const g = get().github[projectId]
        if (!g?.connected) return
        const commit: Commit = {
          id: uid('c'), hash: shortHash(),
          message: keep === 'local' ? 'Resolve conflict: keep local build' : 'Resolve conflict: accept main',
          author: 'Manager', ts: Date.now(),
        }
        set((s) => ({ github: { ...s.github, [projectId]: { ...s.github[projectId], commits: [commit, ...s.github[projectId].commits], push: { conflict: false, localSummary: '', remoteSummary: '', resolvedAt: Date.now() } } } }))
        get().pushToast(keep === 'local' ? 'Kept your local build and pushed' : 'Accepted main and rebased your build')
      },

      // ---- Deploy (mock) ----
      deploy: (projectId, env, fail) => {
        const version = (get().deployments[projectId]?.length ?? 0) + 1
        const dep: Deployment = {
          id: uid('d'), version, env, status: 'running', failureReason: '',
          url: '', logs: [`$ architect deploy --env ${env} --version v${version}`], createdAt: Date.now(),
        }
        set((s) => ({ deployments: { ...s.deployments, [projectId]: [dep, ...(s.deployments[projectId] ?? [])] } }))
        DEPLOY_LOGS.forEach((line, i) => setTimeout(() => get().pushDeployLog(projectId, line), 600 + i * 750))
        setTimeout(() => {
          if (fail) {
            set((s) => ({
              deployments: {
                ...s.deployments,
                [projectId]: (s.deployments[projectId] ?? []).map((d) =>
                  d.id === dep.id
                    ? { ...d, status: 'failed' as const, failureReason: FAIL_REASON, logs: [...d.logs, '✗ Build failed: out of memory while packaging images', '✗ Deployment halted. No traffic was switched.'] }
                    : d),
              },
            }))
            get().pushToast('Deploy failed — see the reason in Deploy')
          } else {
            const slug = (get().projects.find((p) => p.id === projectId)?.name ?? 'app').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
            const url = `${slug}-v${version}.architect.app`
            set((s) => ({
              deployments: {
                ...s.deployments,
                [projectId]: (s.deployments[projectId] ?? []).map((d) =>
                  d.id === dep.id ? { ...d, status: 'success' as const, url, logs: [...d.logs, `✓ Live at ${url}`] } : d),
              },
            }))
            get().pushToast(`Deployed v${version} — live at ${url}`)
          }
        }, 600 + DEPLOY_LOGS.length * 750)
      },

      pushDeployLog: (projectId, line) => set((s) => ({
        deployments: { ...s.deployments, [projectId]: (s.deployments[projectId] ?? []).map((d, i) => (i === 0 ? { ...d, logs: [...d.logs, line] } : d)) },
      })),

      rollback: (projectId, version) => {
        const list = get().deployments[projectId] ?? []
        const target = list.find((d) => d.version === version)
        if (!target) return
        const next = list.length + 1
        const dep: Deployment = {
          id: uid('d'), version: next, env: target.env, status: 'success', failureReason: '',
          url: target.url ? target.url.replace(/v\d+$/, `v${next}`) : '',
          logs: [`$ architect rollback --to v${version}`, 'Restoring previous version…', `✓ Rolled back to v${version} as v${next}`],
          createdAt: Date.now(), rolledBackFrom: version,
        }
        set((s) => ({ deployments: { ...s.deployments, [projectId]: [dep, ...list] } }))
        get().pushToast(`Rolled back to v${version}`)
      },

      setImportDraft: (key, draft) => set((s) => ({ imports: { ...s.imports, [key]: draft } })),

      pushToast: (text, action) => {
        const id = uid('toast')
        set((s) => ({ toasts: [...s.toasts, { id, text, action }] }))
        setTimeout(() => get().dismissToast(id), 4200)
      },
      dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),


      seedDemo: () => {
        if (get().projects.length) return
        const id = 'demo_project'
        const now = Date.now()
        const project: Project = {
          id, name: 'Habit tracker', managerId: ownerManagerId(), framework: 'React + Vite + TypeScript', status: 'live',
          strategy: 'balanced', archived: false, pinned: true,
          team: ['frontend', 'backend', 'qa'], planState: 'live',
          lastMessage: 'First pass is live. Tell me what to change.', lastMessageAt: now - 7000000,
          createdAt: now - 86400000 * 2, lastOpenedAt: now,
          lastView: 'manager', previewTemplateId: 'streaks',
          intent: 'A habit tracker where I log daily streaks and see a weekly heatmap',
          description: 'Daily habit logging with streaks', thumbnailHue: 24,
        }
        let threads = baseThreads(id, now - 7200000)
        threads[threadIdFor(id, 'manager')].messages = [
          { id: uid('m'), threadId: threadIdFor(id, 'manager'), authorId: 'user', text: 'I want a habit tracker with streaks and a weekly heatmap.', kind: 'text', addressedToUser: true, ts: now - 7200000, read: true },
          { id: uid('m'), threadId: threadIdFor(id, 'manager'), authorId: 'manager', text: "Here's how I'd approach it.", kind: 'text', addressedToUser: true, ts: now - 7150000, read: true },
          { id: uid('m'), threadId: threadIdFor(id, 'manager'), authorId: 'manager', text: '', kind: 'plan', addressedToUser: true, ts: now - 7140000, read: true,
            card: { type: 'plan', title: 'Habit tracker', summary: '', features: ['Daily habit logging', 'Streak tracking with recovery rules', 'Weekly heatmap', 'Empty states that teach the user', 'Authentication', 'Responsive layout'], team: ['frontend', 'backend', 'qa'], flow: ['Plan', 'Build', 'Review', 'Preview', 'Ship'], strategy: 'balanced', revision: 1 } },
          { id: uid('m'), threadId: threadIdFor(id, 'manager'), authorId: 'manager', text: 'Bringing in Frontend, Backend and QA.', kind: 'delegation', routedTo: ['frontend', 'backend', 'qa'], addressedToUser: true, ts: now - 7100000, read: true },
          { id: uid('m'), threadId: threadIdFor(id, 'manager'), authorId: 'manager', text: 'Starting the build.', kind: 'build', addressedToUser: true, ts: now - 7050000, read: true,
            card: { type: 'build', state: 'live', task: 'Build complete', progress: { frontend: 100, backend: 100, 'ai-ml': 60, devops: 100, qa: 100 }, order: ['frontend', 'backend', 'qa'] } },
          { id: uid('m'), threadId: threadIdFor(id, 'manager'), authorId: 'manager', text: 'First pass is live in the Preview. Tell me what to change and I will route it to whoever owns it.', kind: 'text', addressedToUser: true, ts: now - 7000000, read: true },
        ]
        for (const ch of ['frontend', 'backend', 'qa'] as ChannelId[]) {
          const script = CHANNEL_SCRIPTS.find((s) => s.channel === ch)!
          const tid = threadIdFor(id, ch)
          threads = ensureSpecialist(threads, id, ch)
          threads[tid].messages = script.lines.map((l, i) => ({
            id: uid('m'), threadId: tid, authorId: l.agent, text: l.text, kind: 'text' as const,
            addressedToUser: l.toUser, ts: now - 6900000 + i * 60000, read: true,
          }))
          const last = script.lines[script.lines.length - 1]
          threads[tid].lastPreview = `${agentById(last.agent).name}: ${last.text}`
        }
        const build: Build = {
          projectId: id, state: 'live',
          tasks: initialTasks().map((t) => ({ ...t, status: 'done' as const })),
          progress: { frontend: 100, backend: 100, 'ai-ml': 60, devops: 100, qa: 100 },
          currentTask: 'Build complete', startedAt: now - 7000000, failedReason: '',
        }
        set((s) => ({
          demoProjectId: id,
          projects: [project, ...s.projects],
          threads: { ...s.threads, ...threads },
          builds: { ...s.builds, [id]: build },
          previews: { ...s.previews, [id]: { projectId: id, mode: 'live', viewport: 'desktop', revealed: 100 } },
          guards: { ...s.guards, [id]: { checks: GUARD_CHECKS, scannedAt: now - 6900000, scanning: false } },
          github: {
            ...s.github,
            [id]: {
              connected: true, account: 'pranav-dev', repo: 'habit-tracker', branch: 'main',
              commits: [
                { id: 'c0', hash: 'a3f91c2', message: 'Initial commit from Architect', author: 'Manager', ts: now - 86400000 * 2 },
                { id: 'c1', hash: '7b2e40d', message: 'Add project scaffold and routing', author: 'Frontend', ts: now - 86400000 },
                { id: 'c2', hash: 'c91d5aa', message: 'Seed data layer with local records', author: 'Backend', ts: now - 3600000 * 20 },
                { id: 'c3', hash: 'e04b7f1', message: 'Review pass: fix long-text overflow', author: 'QA', ts: now - 3600000 * 6 },
              ],
              push: { conflict: false, localSummary: '', remoteSummary: '' },
            },
          },
          deployments: {
            ...s.deployments,
            [id]: [
              { id: 'd1', version: 2, env: 'preview', status: 'success', failureReason: '', url: 'habit-tracker-v2.architect.app', logs: [...DEPLOY_LOGS, '✓ Live at habit-tracker-v2.architect.app'], createdAt: now - 3600000 * 5 },
              { id: 'd0', version: 1, env: 'preview', status: 'success', failureReason: '', url: 'habit-tracker-v1.architect.app', logs: [...DEPLOY_LOGS, '✓ Live at habit-tracker-v1.architect.app'], createdAt: now - 3600000 * 28 },
            ],
          },
        }))
      },
    }),
    {
      name: 'architect-store',
      partialize: (s) => ({
        user: s.user, projects: s.projects, threads: s.threads, builds: s.builds,
        previews: s.previews, canvas: s.canvas, guards: s.guards, github: s.github,
        deployments: s.deployments, activeFile: s.activeFile,
        demoProjectId: s.demoProjectId, managers: s.managers, activeManagerId: s.activeManagerId,
        onboarding: s.onboarding,
      }),
      // Users who signed in before onboarding existed are returning users:
      // they go straight to the workspace instead of seeing onboarding again.
      merge: (persisted, current) => {
        const p = persisted as Partial<AppState> | undefined
        if (!p) return current
        const merged = { ...current, ...p } as AppState
        if (p.user && !p.onboarding) {
          merged.onboarding = { ...current.onboarding, complete: true }
        }
        // Multi-manager migration: legacy stores have projects but no managers.
        if (!merged.managers || merged.managers.length === 0) {
          const m: Manager = {
            id: uid('mgr'),
            nickname: merged.onboarding.managerNickname,
            avatar: merged.onboarding.managerAvatar,
            createdAt: Date.now(),
          }
          merged.managers = [m]
          merged.activeManagerId = m.id
        }
        if (!merged.managers.some((m) => m.id === merged.activeManagerId)) {
          merged.activeManagerId = merged.managers[0].id
        }
        merged.projects = (merged.projects ?? []).map((proj) => (
          proj.managerId && merged.managers.some((m) => m.id === proj.managerId)
            ? proj
            : { ...proj, managerId: merged.activeManagerId }
        ))
        return merged
      },
    },
  ),
)

