import React, { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../store/store'
import { buildDoc } from '../components/preview/docTemplate'
import { Button } from '../components/ui/Button'
import { ArrowLeft, ExternalLink } from 'lucide-react'

/**
 * The deployed "Open site" target: a functioning in-app demo route,
 * not a dead external placeholder URL.
 */
export const DemoSite: React.FC = () => {
  const { projectId = '' } = useParams()
  const navigate = useNavigate()
  const project = useStore((s) => s.projects.find((p) => p.id === projectId))
  const deployments = useStore((s) => s.deployments[projectId])
  const latest = deployments?.find((d) => d.status === 'success')

  const doc = useMemo(
    () => (project ? buildDoc(project.previewTemplateId, 100, project.name) : ''),
    [project],
  )

  if (!project) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-ink">
        <p className="text-sm text-muted">This deployment no longer exists.</p>
        <Button onClick={() => navigate('/')}>Back to Architect</Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ink">
      <div className="flex h-12 items-center gap-3 border-b border-line px-4">
        <button
          onClick={() => navigate(`/p/${projectId}/deploy`)}
          className="inline-flex items-center gap-2 rounded-full border border-line px-3 py-1.5 text-[12px] text-muted transition-colors hover:bg-surface hover:text-paper"
        >
          <ArrowLeft size={13} /> Back to Architect
        </button>
        <div className="ml-auto flex items-center gap-3">
          <span className="hidden font-mono text-[11px] text-muted sm:block">
            {latest?.url ?? `${project.previewTemplateId}.architect.app`}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 text-[11px] text-paper">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" /> Live
          </span>
          <span className="hidden text-[11px] text-muted sm:block">
            Simulated deployment · <ExternalLink size={10} className="inline" /> shown in-app
          </span>
        </div>
      </div>
      <iframe title={project.name} srcDoc={doc} className="h-[calc(100vh-48px)] w-full border-0" sandbox="allow-scripts" />
    </div>
  )
}
