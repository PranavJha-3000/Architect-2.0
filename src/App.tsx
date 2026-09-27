import React, { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useStore } from './store/store'
import { AppShell } from './components/shell/AppShell'
import { Toaster } from './components/ui/Toaster'
import { ChatView } from './components/chat/ChatView'
import { CanvasView } from './components/canvas/CanvasView'
import { CodeView } from './components/code/CodeView'
import { GitHubView } from './components/github/GitHubView'
import { DeployView } from './components/deploy/DeployView'
import { Auth } from './pages/Auth'
import { FirstRun } from './pages/FirstRun'
import { Identity } from './components/ui/Identity'
import { EmptyState } from './components/ui/EmptyState'
import { DemoSite } from './pages/DemoSite'
import { Landing } from './pages/Landing'
import { Onboarding } from './components/onboarding/Onboarding'
import type { ChannelId } from './store/types'

const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const user = useStore((s) => s.user)
  const location = useLocation()
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />
  return <>{children}</>
}

/** First successful auth lands here. Completed users skip straight through. */
const OnboardingRoute: React.FC = () => {
  const user = useStore((s) => s.user)
  const complete = useStore((s) => s.onboarding.complete)
  if (!user) return <Navigate to="/login" replace />
  if (complete) return <Navigate to="/home" replace />
  return <Onboarding onDone={() => window.location.assign('#/home')} />
}

/** Guards the workspace so a completed user can't re-enter onboarding. */
const RequireOnboarded: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const user = useStore((s) => s.user)
  const complete = useStore((s) => s.onboarding.complete)
  if (!user) return <Navigate to="/login" replace />
  if (!complete) return <Navigate to="/onboarding" replace />
  return <>{children}</>
}

/**
 * The app has no global home screen. `/` resolves inside the shell to either
 * the "Manager selected, no project selected" placeholder (when the drawer is
 * at the active Manager's project list) or the most recently used project of
 * the active Manager. Selecting a Manager never auto-opens a project.
 */
export const Home: React.FC = () => {
  const navigate = useNavigate()
  const projects = useStore((s) => s.projects)
  const activeManagerId = useStore((s) => s.activeManagerId)
  const seedDemo = useStore((s) => s.seedDemo)
  const createProject = useStore((s) => s.createProject)
  const setExpandedManagerId = useStore((s) => s.setExpandedManagerId)

  useEffect(() => { seedDemo() }, [seedDemo])

  const mine = projects
    .filter((p) => !p.archived && (!p.managerId || p.managerId === activeManagerId))
    .sort((a, b) => b.lastOpenedAt - a.lastOpenedAt)

  if (mine.length === 0) {
    return <FirstRun inline />
  }

  const handleNewProject = () => {
    const id = createProject()
    navigate(`/p/${id}`)
  }

  return (
    <div className="flex h-full items-center justify-center p-6">
      <EmptyState
        icon={<Identity size="lg" />}
        title="Select a project"
        body="Pick a project to open its conversation with The Manager, or create a new one."
        actionLabel="View projects"
        onAction={() => activeManagerId && setExpandedManagerId(activeManagerId)}
        secondaryLabel="New project"
        onSecondary={handleNewProject}
      />
    </div>
  )
}

const Touch: React.FC<{ view: string }> = ({ view }) => {
  const { projectId = '' } = useParams()
  const touch = useStore((s) => s.touchProject)
  useEffect(() => { if (projectId) touch(projectId, view) }, [projectId, view])
  return null
}

const App: React.FC = () => (
  <>
    <Routes>
      <Route path="/landing" element={<Navigate to="/" replace />} />
      <Route path="/login" element={<Auth />} />
      <Route path="/signup" element={<Auth />} />
      <Route path="/onboarding" element={<OnboardingRoute />} />
      <Route path="/demo/:projectId" element={<RequireAuth><DemoSite /></RequireAuth>} />

      {/* Public landing is the entry point. Authenticated workspace lives at /home. */}
      <Route path="/" element={<Landing />} />

      <Route path="/home" element={<RequireOnboarded><AppShell /></RequireOnboarded>}>
        <Route index element={<Home />} />
      </Route>

      <Route path="/p/:projectId" element={<RequireAuth><AppShell /></RequireAuth>}>
        <Route index element={<><Touch view="manager" /><ChatView mode="manager" /></>} />
        <Route path="thread/:channelId" element={<ThreadRoute />} />
        <Route path="dm/:agentId" element={<DmRoute />} />
        <Route path="canvas" element={<><Touch view="canvas" /><CanvasView /></>} />
        <Route path="code" element={<><Touch view="code" /><CodeView /></>} />
        <Route path="github" element={<><Touch view="github" /><GitHubView /></>} />
        <Route path="deploy" element={<><Touch view="deploy" /><DeployView /></>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    <Toaster />
  </>
)

/** Specialist conversations only exist once the Manager has introduced them. */
const ThreadRoute: React.FC = () => {
  const { channelId } = useParams<{ channelId: ChannelId }>()
  return <><Touch view={`thread:${channelId}`} /><ChatView mode="channel" channelId={channelId} /></>
}

/**
 * Private DM. Only agents the Manager has actually introduced can have one —
 * `ensureSpecialist` creates the dm thread at introduction time, so an
 * unintroduced agent has no thread and is redirected back to the Manager.
 */
const DmRoute: React.FC = () => {
  const { projectId = '', agentId = '' } = useParams<{ projectId: string; agentId: ChannelId }>()
  const project = useStore((s) => s.projects.find((p) => p.id === projectId))
  const thread = useStore((s) => s.threads[`${projectId}:dm:${agentId}`])
  if (!project || !thread) return <Navigate to={`/p/${projectId}`} replace />
  return <><Touch view={`dm:${agentId}`} /><ChatView mode="dm" agentId={agentId} /></>
}

export default App
