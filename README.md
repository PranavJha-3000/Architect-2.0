# Architect 2.0

A vibe-coding platform that feels like talking to an AI engineering team rather than one giant chatbot.

Manager is the primary interface. Work is routed to specialist team channels (`#frontend`, `#backend`, `#ai-ml`, `#devops`, `#qa`), a persistent Preview pane builds section by section, and UI Head Canvas handles visual design. Technical users can drop into Code, GitHub and Deploy at any point; non-technical users can stay in Manager + Preview the whole time.

## Running locally

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # typecheck + production build
```

## Core loop

**Describe → Choose approach → Build → Preview → Refine in Canvas → Code → GitHub → Deploy**

1. Sign in — email, mocked Google chooser, or guest. A fresh account goes through onboarding (welcome → vibe coding → integrations → meet the Manager).
2. The workspace opens on Home. Create a project or pick one from the project drawer; each project opens its own Manager conversation.
3. Describe what you want. The Manager answers with a **Plan** card and then an **Approach** card: **Lean**, **Balanced** (recommended) or **Enterprise** — each showing its agent composition.
4. Press **Start building**. The Preview pane reveals section by section while the Manager narrates progress and brings each specialist in as the work needs them.
5. Open the specialist channels or DM a specialist directly, refine visually in Canvas, read the generated files in Code, commit in GitHub, then deploy — with version history and rollback.

## Coverage

| Area | Where it lives |
| --- | --- |
| Authentication | `/login`, `/signup` — email, mocked Google chooser, guest; session and onboarding progress survive a refresh |
| Homepage | Home state inside the workspace: create a project, or open the project drawer to pick one |
| Chat | Manager conversation, team channels, private DMs, grouped turns, activity lines, plan/strategy/build cards |
| App preview | Right-hand pane: idle, building, live and error states, with desktop/tablet/mobile viewports |
| Agent section | Manager rail + the five specialists, introduced only when the Manager brings them in |
| UI getting built | Build narration in chat, per-agent progress, and a preview that grows as tasks complete |
| GitHub | Connect, commit history, commit a build, simulated push conflict and its resolution |
| Deploy | Preview/production, streamed logs, live URL, QR code, failure with a plain-language reason, retry and rollback |

## Design

One dark, message-first palette is the single colour system for the whole product — auth, onboarding and workspace share it and differ only in layout. Tokens live in `tailwind.config.js` and mirror the CSS variables in `src/index.css`:

| Token | Value | Use |
| --- | --- | --- |
| `ink` | `#121214` | App background, chat canvas |
| `sidebar` | `#121214` | Manager rail, project drawer, panels, incoming messages |
| `surface` | `#18181B` | Cards, popovers, secondary controls |
| `bubble` | `#26262A` | Your own messages, hover states |
| `input` | `#1E1E22` | Composer and input bars |
| `action` | `#323238` | Control fill, inactive track, scrollbar thumb |
| `paper` | `#E4E4E7` | Primary text |
| `muted` | `#A1A1AA` | Secondary text and metadata |
| `faint` | `#71717A` | Placeholder / decorative / disabled only — never body text |

## Structure

```
src/
  store/          Zustand store (persisted to localStorage), types, agent roster, scripts
  components/
    shell/        Manager rail, project drawer (overlay), top bar, app shell
    chat/         Manager conversation, channels, DMs, plan/strategy/build cards
    preview/      Preview pane (sandboxed iframe) + canned app templates
    vibing/       Vibing chooser, local link classification, external-tab tracking, music
    canvas/       UI Head canvas (full-bleed, hides the right workspace)
    code/         File tree, code viewer, Architect Guard
    github/       Connect, commit history, push-conflict resolution
    deploy/       Logs, success + QR, failure + retry, version rollback
    ui/           Design-system primitives (Button, Row, Dialog, Popover, Panel, …)
  pages/          Auth, Home/first-run, in-app demo site
docs/architecture/  Architecture diagram (SVG + PNG) and architecture.md
```

## What is mocked

Intentionally simulated so the whole product is demonstrable without infrastructure:

- Sign-in, including the Google account chooser (no OAuth provider is contacted)
- The GitHub connection, commits, hashes and push conflict (no API, no git, no remote)
- Deployment: logs, live URLs and failures (the QR encodes the shown URL; **Open site** opens an in-app demo route)
- Architect Guard checks (advisory only — findings never block a build)
- Manager routing, specialist replies and build tasks (scripted data, not a model or an agent runtime)
- Screenshot/sketch-to-UI conversion in Canvas (the uploaded file is never read)

Everything the app stores lives in `localStorage`, so returning to a project resumes exactly where you left off. See `docs/architecture/architecture.md` for the full description and the list of known limitations.

## Notes

- Channels start empty and activate only when the Manager brings the team in — see the empty state: *"Nothing here yet — this channel activates once Manager brings the team in."*
- Agent-to-agent chatter collapses into a single activity line naming who was involved; messages addressed to you render as full bubbles.
- Production deploys always simulate a failure so the error path is visible. Preview deploys succeed, and **Retry** always succeeds. Rollback never rewrites history — it adds a new version pointing at the one you chose.

| `line` | `#2C2C32` | Hairline borders and dividers |
| `accent` | `#007AFF` | Primary action, send button, progress fill |
| `accentPurple` | `#7C3AED` | Badges and highlights |

Neutral planes carry the product. The two accents appear only where a decision is being made — a primary action, the selected approach, an active build. There are no gradients, no glassmorphism, no neon and no heavy shadows: elevation is surface value plus a hairline. Controls are 8px, bubbles and dialogs 12px, and only genuinely circular things are round. System sans for UI; monospace for code, paths, hashes and counters.
