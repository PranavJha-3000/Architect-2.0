import type { IntegrationDef } from './types'

/**
 * Onboarding integration catalog.
 * Every chooser is a polished mock — no real OAuth or API is called.
 */
export const INTEGRATIONS: IntegrationDef[] = [
  {
    id: 'github',
    name: 'GitHub',
    description: 'Import repositories, commit changes and manage your code.',
    primary: true,
    phases: [
      {
        key: 'account',
        title: 'Choose an account',
        description: 'Pick the GitHub account Architect should work from.',
        options: [
          { id: 'gh1', title: 'Pranav Jha', sub: 'pranav.jha@gmail.com' },
          { id: 'gh2', title: 'Pranav (work)', sub: 'pranav@studio.dev' },
        ],
      },
      {
        key: 'repo',
        title: 'Choose a repository',
        description: 'Select where new projects and commits will live.',
        options: [
          { id: 'r1', title: 'habit-tracker', sub: 'Private · updated 2 days ago' },
          { id: 'r2', title: 'client-portal', sub: 'Private · updated last week' },
          { id: 'r3', title: 'design-system', sub: 'Public · updated 3 weeks ago' },
        ],
      },
    ],
  },
  {
    id: 'vercel',
    name: 'Vercel',
    description: 'Deploy your applications.',
    primary: true,
    phases: [
      {
        key: 'workspace',
        title: 'Choose a workspace',
        description: 'Deployments will be created inside this workspace.',
        options: [
          { id: 'v1', title: "Pranav's Projects", sub: 'Personal · 12 projects' },
          { id: 'v2', title: 'Studio', sub: 'Team · 4 members' },
        ],
      },
    ],
  },
  {
    id: 'supabase',
    name: 'Supabase',
    description: 'Use databases and backend services.',
    recommended: true,
    phases: [
      {
        key: 'project',
        title: 'Choose a project',
        description: 'Backend projects can use this database as a starting point.',
        options: [
          { id: 's1', title: 'architect-dev', sub: 'Free tier · 1.2 GB used' },
          { id: 's2', title: 'client-apps', sub: 'Pro · 8.4 GB used' },
        ],
      },
    ],
  },
  {
    id: 'figma',
    name: 'Figma',
    description: 'Bring designs into Architect.',
    phases: [
      {
        key: 'account',
        title: 'Choose an account',
        description: 'Architect can import frames you have access to.',
        options: [
          { id: 'f1', title: 'Pranav Jha', sub: 'pranav.jha@gmail.com' },
          { id: 'f2', title: 'Studio Design', sub: 'figma.com/studio-design' },
        ],
      },
    ],
  },
]

export const integrationById = (id: string): IntegrationDef | undefined =>
  INTEGRATIONS.find((i) => i.id === id)
