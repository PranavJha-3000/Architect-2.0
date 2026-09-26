export const CODE_FILES: Record<string, { path: string; lang: string; content: string }[]> = {
  streaks: [
    {
      path: 'src/App.tsx', lang: 'tsx',
      content: `import { useState } from 'react'
import { Dashboard } from './components/Dashboard'
import { useStreaks } from './hooks/useStreaks'

export default function App() {
  const [filter, setFilter] = useState<'week' | 'month'>('week')
  const { entries, loading, error } = useStreaks()

  if (error) return <ErrorState onRetry={() => window.location.reload()} />
  if (loading) return <DashboardSkeleton />

  return (
    <Dashboard
      entries={entries}
      filter={filter}
      onFilterChange={setFilter}
    />
  )
}`,
    },
    {
      path: 'src/hooks/useStreaks.ts', lang: 'ts',
      content: `import { useEffect, useState } from 'react'
import type { Entry } from '../types'

export function useStreaks() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const res = await fetch('/api/entries')
        if (!res.ok) throw new Error('Request failed')
        const data: Entry[] = await res.json()
        if (!cancelled) setEntries(data)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Unknown error')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [])

  return { entries, loading, error }
}`,
    },
    {
      path: 'src/components/Dashboard.tsx', lang: 'tsx',
      content: `import { Heatmap } from './Heatmap'
import { StatCard } from './StatCard'
import type { Entry } from '../types'

interface Props {
  entries: Entry[]
  filter: 'week' | 'month'
  onFilterChange: (f: 'week' | 'month') => void
}

export function Dashboard({ entries, filter, onFilterChange }: Props) {
  const current = longestStreak(entries)
  const best = bestStreak(entries)
  const rate = completionRate(entries)

  return (
    <main className="dashboard">
      <header className="dashboard__header">
        <h1>Streaks</h1>
        <button onClick={() => onFilterChange(filter === 'week' ? 'month' : 'week')}>
          {filter === 'week' ? 'This week' : 'This month'}
        </button>
      </header>

      <section className="dashboard__stats">
        <StatCard label="Current streak" value={current} suffix="days" />
        <StatCard label="Best streak" value={best} suffix="days" />
        <StatCard label="Completion" value={rate} suffix="%" />
      </section>

      <Heatmap entries={entries} range={filter} />
    </main>
  )
}`,
    },
    {
      path: 'src/api/client.ts', lang: 'ts',
      content: `const BASE = import.meta.env.VITE_API_URL ?? '/api'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })

  if (!res.ok) {
    throw new Error(\`Request failed: \${res.status}\`)
  }

  return res.json() as Promise<T>
}

export const api = {
  listEntries: () => request<Entry[]>('/entries'),
  createEntry: (name: string) =>
    request<Entry>('/entries', { method: 'POST', body: JSON.stringify({ name }) }),
}`,
    },
    {
      path: 'src/types.ts', lang: 'ts',
      content: `export interface Entry {
  id: string
  name: string
  completedOn: string
  streak: number
}

export type Filter = 'week' | 'month'`,
    },
  ],
}

export const filesFor = (templateId: string) => CODE_FILES[templateId] ?? CODE_FILES.streaks
