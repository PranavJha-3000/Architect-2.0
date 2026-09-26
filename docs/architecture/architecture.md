# Architect 2.0 — Architecture

Architect 2.0 is a **single-page frontend application**. This document describes the code that
exists in this repository and runs in the browser. There is no backend, API server, database,
OAuth provider, model provider, agent runtime or sandbox infrastructure anywhere in the project.
Capabilities that are simulated are labelled **[simulated]** or **[mocked]**, and every label below
matches actual source behaviour rather than an intended future behaviour.

Companion artifact: [`architectural-diagram.svg`](./architectural-diagram.svg), with a raster
export at [`architectural-diagram.png`](./architectural-diagram.png). Every box in the diagram
maps to a file, route or store key named somewhere in this document.

## At a glance

| Concern | Implementation |
| --- | --- |
| Language / tooling | TypeScript 5 (strict), Vite 5, `@vitejs/plugin-react` |
| UI | React 18 function components and hooks only |
| Routing | `react-router-dom` 6 — **HashRouter**, mounted in `src/main.tsx` |
| State | Zustand 5 with `persist`; store name `architect-store` (`src/store/store.ts`) |
| Persistence | `localStorage` only, selected by `partialize` — browser-local, per origin |
| Styling | Tailwind CSS 3 plus CSS custom properties in `src/index.css` |
| Icons | `lucide-react`; brand marks from `public/assets/icons` via `src/assets.ts` |
| QR code | `qrcode.react` (used by `DeployView`) |
| Build | `npm run build` → `tsc -b && vite build` |
| Dev server | `npm run dev` → Vite on port `5173` (`vite.config.ts`) |
| Tests | none — there is no test runner, test script or test file in this repository |

## 1. Product Architecture

Architect 2.0 is one application with one visual language and a single shell:

- **One design system.** Every colour, radius, type step and motion value lives in
  `tailwind.config.js` and is mirrored by the CSS variables in `src/index.css`. Auth, onboarding,
  the workspace and every tool use the same token set.
- **One state container.** A single Zustand store holds user, Managers, projects, conversations,
  builds, previews, canvas documents, Guard results, GitHub connections and deployments.
- **One route tree.** `src/App.tsx` declares every route. There are no secondary entry points,
  no server-rendered pages and no API layer.
- **One shell.** `shell/AppShell.tsx` renders the workspace frame for every project route, so
  navigation never rebuilds the application around the user.
- **Chat is the primary product surface.** The Manager conversation is where requirements, plans,
  approvals, build narration and the results of other tools arrive. Canvas, Code, GitHub and
  Deploy are routes *inside* the shell, reached from the TopBar, and they report back into the
  same conversation.

### Layer overview

```
Browser (single origin, no network calls at runtime)
└── index.html → src/main.tsx
    └── HashRouter
        └── App.tsx                        route table + guards
            ├── pages/Auth.tsx             /login, /signup        [mocked sign-in]
            ├── components/onboarding/     /onboarding            [mocked integrations]
            ├── components/shell/AppShell.tsx
            │   ├── shell/ManagerRail.tsx       column 0 — Managers
            │   ├── shell/TopBar.tsx            identity + tool routes
            │   ├── shell/Sidebar.tsx           ProjectDrawer — overlay sheet
            │   ├── chat/ChatView.tsx           the conversation surface
            │   └── preview/PreviewPane.tsx     Preview + Vibing + Music
            ├── canvas/ code/ github/ deploy/   tool routes inside the shell

## 2. Application Shell

`src/components/shell/AppShell.tsx` owns the workspace frame: a horizontal flex row at `100dvh`
(`100dvh` rather than `100vh`, because on mobile `100vh` is taller than the visible viewport and
pushed the composer under the browser's URL bar).

```
[ ManagerRail 64px ][ TopBar 48px                                     ]
                     [ main — route outlet       ][ PreviewPane 36%    ]
```

### Manager navigation

- **Column 0 — `shell/ManagerRail.tsx` (64 px).** Renders `managers[]` from the store, marks the
  active Manager with a 2 px leading-edge indicator, and offers **＋ Add Manager**
  (`shell/AddManagerModal.tsx`). Clicking the active Manager toggles the project drawer; clicking a
  different Manager switches `activeManagerId` and opens the drawer for that Manager.
- A Manager is an identity, not a project: `createManager()` never creates a project, and selecting
  a Manager never auto-opens one.

### Project / context navigation

`shell/Sidebar.tsx` exports `ProjectDrawer`, and it is an **overlay sheet — not a docked column**:

- It is opened by `projectDrawerOpen` in the store, which defaults to `false` and is deliberately
  **not** in `partialize`, so a reload always starts with the drawer closed.
- While closed the component returns `null`; no permanent column is reserved for it, and the main
  column keeps the full width between the rail and the preview pane.
- While open it renders `role="dialog"` with `aria-modal="true"`, a full-viewport 60% scrim over
  the rest of the app, and a 288 px sheet that starts immediately right of the 64 px rail. It opens
  from the rail avatar, the identity button in the TopBar, and the "View projects" action on the
  Home empty state. It closes on project selection, on scrim click and on `Escape` (a capture-phase
  key listener).
- It lists **only the active Manager's projects**: pinned projects first, a search field filtering
  on name and description, relative timestamps (`relStamp`), unread dots, and a per-row overflow
  menu for **Pin** and **Archive** (archive shows an undo toast).
- On close the exit animation (140 ms) runs before unmount, then focus returns to the triggering
  Manager avatar (`restoreFocusRef`).

### Main conversation

`<main>` is the router outlet and the widest column; it holds whichever conversation or tool route
is active. The conversation itself is `chat/ChatView.tsx` (§6).

### Right workspace

`preview/PreviewPane.tsx` (36% width, clamped to 340–520 px) sits beside `<main>` on every project
route **except Canvas**: `AppShell` hides it when the path ends with `/canvas`, which is what makes
Canvas full-bleed. The panel stacks, top to bottom:

1. the **Preview** header — build-state badge plus the desktop / tablet / mobile viewport switch
2. the **per-agent progress** row while a build is running
3. the **preview well** — the only contained viewport in the panel (§8)
4. a **status footer** — "Open site" and "Copy link" when live, the current task while building
5. **Vibing** — the single compact control and its anchored chooser, plus the Music transport in
   Music mode (§9)

### Canvas, Code, GitHub, Deploy

The TopBar exposes four tool buttons — **UI Head** (Canvas), **Code**, **GitHub**, **Deploy** — each
carrying `aria-current` and a persistent fill while active. They navigate to child routes of the
same project (`/p/:projectId/canvas|code|github|deploy`), so the rail, the shell and the project
context stay put and only the centre column changes. **UI Head** additionally opens
`canvas/UiDemoVideoDialog.tsx`, a short non-editing teaser, with the editable surface one click
away behind "Open canvas".

### Responsive behaviour

Desktop-first, with the conversation as the last thing to lose width (`src/index.css` utilities):

| Viewport width | Behaviour |
| --- | --- |
| ≤ 1180 px | The preview pane narrows to 360 px |
| ≤ 1040 px | The Vibing control hides; Preview keeps its space |
| ≤ 900 px | The preview pane hides entirely |
| ≤ 720 px | The rail and the drawer re-layer above the content |

## 3. State Management

There is exactly one store: `src/store/store.ts` exports `useStore`, created with
`create<AppState>()(persist(...))` and stored under the key **`architect-store`**. Components read
narrow slices with selector functions (`useStore((s) => s.projects)`), and the store returns stable
references, because a selector that builds a fresh array or object on every call makes React
re-render until it throws (the comment on `TopBar` records this).

### State domains

| Domain | Keys | Shape |
| --- | --- | --- |
| Session | `user`, `googlePending`, `managers[]`, `activeManagerId`, `onboarding` | identity + onboarding step machine |
| Projects | `projects[]` | `Project` records: name, `managerId`, `status`, `strategy`, `pinned`, `archived`, `team[]`, `planState`, preview template, `lastMessage*`, `lastOpenedAt`, `lastView` |
| Conversations | `threads` | keyed `` `${projectId}:${threadKey}` `` where `threadKey` is `manager`, a channel id, or `dm:${agentId}`; each `Thread` holds `messages[]`, `unread`, `typing`, `active`, `lastPreview`, `introducedAt` |
| Build | `builds`, `previews` | `Build { state, tasks[], progress, currentTask, startedAt, failedReason }` and `PreviewState { mode, viewport, revealed }` |
| Canvas | `canvas` | `CanvasDoc { elements[], selectedId, source, analyzing }` per project |
| Code + Guard | `activeFile`, `guards` | selected file path per project; `GuardResult { checks[], scannedAt, scanning }` |
| GitHub | `github` | `GithubConn { connected, account, repo, branch, commits[], push }` per project |
| Deploy | `deployments` | `Deployment[]` per project: version, env, status, URL, `logs[]`, `failureReason`, `rolledBackFrom` |
| Import | `imports` | draft analysis records created by `setImportDraft` |
| UI-local | `toasts`, `managerViewMode`, `projectDrawerOpen`, `demoProjectId` | never persisted except `demoProjectId` |

### Persistence

`persist` is configured with:

- **`name: 'architect-store'`** — the `localStorage` key. This is the only persistence in the
  product: it is per origin and per browser, and clearing site data resets the application.
- **`partialize`** — persists exactly `user`, `projects`, `threads`, `builds`, `previews`,
  `canvas`, `guards`, `github`, `deployments`, `activeFile`, `demoProjectId`, `managers`,
  `activeManagerId` and `onboarding`. That is what makes "returning to a project resumes exactly
  where you left it" true for conversations, builds, previews, canvas edits, Guard results,
  commits and deployments.
- **Not persisted (local-only):** `toasts`, `imports`, `managerViewMode`, `projectDrawerOpen` and
  `googlePending`. The drawer therefore always opens *closed* after a reload.
- **`merge`** — migration for older stored shapes: a stored `user` with no `onboarding` record is
  treated as a returning user (`complete: true`); a store with projects but no `managers[]` gets a
  default Manager from the onboarding nickname/avatar; an `activeManagerId` that no longer exists
  falls back to the first Manager; and any project whose `managerId` is missing or unknown is
  reassigned to the active Manager.

### Project isolation

Isolation is by key, not by a backend query:

- Every per-project map (`threads`, `builds`, `previews`, `canvas`, `guards`, `github`,
  `deployments`, `activeFile`) is keyed by `projectId`.
- Thread ids embed both the project and the counterpart (`p1:manager`, `p1:frontend`,
  `p1:dm:qa`), so a channel or DM look-up can never resolve across projects.
- `Project.managerId` isolates *listing*: the drawer and `Home` both filter to
  `!p.managerId || p.managerId === activeManagerId`, and `createProject()` assigns the active
  Manager through `ownerManagerId()`.

### Manager state

- `managers[]` plus `activeManagerId` drive the rail, the drawer header and the identity avatars
  (`ui/Identity.tsx` renders the Manager avatar with an initial-letter fallback).
- The Manager conversation per project is `threads[`${projectId}:manager`]`; it is created by
  `createProject()` together with the project, so no project ever exists without its Manager thread.
- `lastMessage` / `lastMessageAt` on the project drive the drawer preview row, and `unread` on the
  thread drives the unread dot; `ChatView` clears it through `readThread()` while visible.
- `typing` drives the `StatusDot` in the TopBar and the typing row in the conversation.

### Build and preview state

`startBuild(projectId)` writes a `Build` in `building` state with the seven-task `TASK_SEQUENCE`
and empty per-agent progress, and a `PreviewState` in `building` at `revealed: 0`, then narrates
into the Manager thread while `tickBuild()` advances tasks. The number of tasks executed depends on
the chosen strategy (`lean` 3, `balanced` 5, `enterprise` 7), and each completed task raises
`revealed`, which is what reveals sections in the generated preview (§8). On completion the project
becomes `live`, and `runGuard()` is called automatically. `retryBuild()` is the recovery path from
`error`, restoring `live` and re-running Guard.

### Local-only state

- `toasts[]` — transient notifications with an optional action (for example the archive undo);
  auto-dismissed after 4.2 s by `pushToast`.
- `imports` — draft analysis produced by `setImportDraft`; the consuming wizard is not mounted in
  the current route tree (see §15).
- `managerViewMode` — written by the rail, the drawer, `FirstRun` and `AddManagerModal`, but not
  read by any rendering component today; it is bookkeeping left over from an earlier navigation
  model.
- `projectDrawerOpen` — pure UI state for the overlay sheet in §2.
- **The Vibing session is not in this store.** It lives in `components/vibing/session.ts` as
  module-local state, because it holds live `Window` handles and interaction phase that must never
  be serialised (§9).


            └── pages/DemoSite.tsx         /demo/:projectId        [simulated deployment]
```

### What the product does **not** contain

No server process, database client, runtime HTTP call, authentication provider, LLM or agent
orchestration, or sandbox execution. Conversations, builds, Guard findings, commits and
deployments are deterministic data plus timers inside the store. The external handoffs in §9 are
ordinary browser navigation performed by the user's own browser.


## 4. Routing

Routing is client-side only, using **`HashRouter`** (`src/main.tsx`). The hash strategy means the
built `dist/` works from any static host or sub-path without a server rewrite rule — and it is why
the project can be shipped as static output with no deployment infrastructure.

### Route table (`src/App.tsx`)

| Route | Renders |
| --- | --- |
| `/login`, `/signup` | `pages/Auth.tsx` — mode toggle, name/email/password, mocked Google chooser, guest link |
| `/onboarding` | `OnboardingRoute` → `components/onboarding/Onboarding.tsx` |
| `/` | `RequireOnboarded` → `AppShell` → index `Home` |
| `/p/:projectId` | `RequireAuth` → `AppShell` → `Touch view="manager"` + `ChatView mode="manager"` |
| `/p/:projectId/thread/:channelId` | `ThreadRoute` + `ChatView mode="channel"` |
| `/p/:projectId/dm/:agentId` | `DmRoute` + `ChatView mode="dm"` |
| `/p/:projectId/canvas` | `Touch view="canvas"` + `CanvasView` |
| `/p/:projectId/code` | `Touch view="code"` + `CodeView` |
| `/p/:projectId/github` | `Touch view="github"` + `GitHubView` |
| `/p/:projectId/deploy` | `Touch view="deploy"` + `DeployView` |
| `/demo/:projectId` | `RequireAuth` → `pages/DemoSite.tsx` (the "Open site" target) |
| `*` | redirect to `/` |

Chat, thread and DM routes are children of the `/p/:projectId` shell route, so the rail, TopBar,
drawer and preview pane persist while conversations change.

### Guards

- **`RequireAuth`** — with no `user` in the store it redirects to `/login`, carrying the attempted
  location in router state.
- **`RequireOnboarded`** — a signed-in user who has not completed onboarding is sent to
  `/onboarding`; this wraps the workspace index so the two states cannot interleave.
- **`OnboardingRoute`** — a user who has already completed onboarding is sent to `/`; everyone else
  gets the flow without a login round-trip.
- **`DmRoute`** — a private DM resolves only when `threads[`${projectId}:dm:${agentId}`]` exists;
  otherwise the user is redirected to `/p/:projectId`. That matches §5: a DM exists only for a
  specialist the Manager has actually introduced.
- **`ThreadRoute`** — always renders, because a channel may legitimately not exist yet; an
  unintroduced channel shows the empty state *"Nothing here yet — this channel activates once
  Manager brings the team in."* rather than an error.
- **`Home`** — with no project for the active Manager it renders `pages/FirstRun.tsx` inline; with
  projects it renders a neutral "Select a project" state offering **View projects** (opens the
  drawer) and **New project** (creates one and navigates into it). `Home` also runs `seedDemo()`,
  which creates the demo project when the store is empty.

### View tracking

Each project route renders a `Touch` helper that calls `touchProject(projectId, view)`, recording
`lastOpenedAt` and `lastView`. View names are `manager`, `canvas`, `code`, `github`, `deploy`,
`thread:<channelId>` and `dm:<agentId>`. Because the store is persisted, this is what lets a
project reopen where it was last used.


## 5. Manager + Specialist Architecture

### Manager as the primary interface

The Manager is the only conversational counterpart that always exists. `createProject()` seeds the
Manager thread with one opening message ("New project. What are we building?"), and every other
surface — Canvas edits, GitHub commits, deploys, Vibing handoffs — writes back into that same thread
through `pushManagerMessage()` / `pushUserMessage()`. A user who never opens Code, GitHub or Deploy
still gets the complete product loop from the conversation plus the preview pane.

Manager replies come from `src/store/scripts.ts`: `MANAGER_REPLIES` matches keywords in the user's
message (design/UI → frontend, data/auth/database → backend, AI/suggest → ai-ml, deploy/CI →
devops, test/bug → qa, change/fix → frontend) and answers with a scripted line, optionally routing
to a channel. `planFor(intent)` builds the plan card's feature list and team, and `pickTemplate()`
maps the intent to one of four preview templates. **This is string matching, not language
understanding — no model is called anywhere.**

### Dynamically represented specialists

Five specialists are declared once in `src/store/roster.ts`: `#frontend`, `#backend`, `#ai-ml`,
`#devops`, `#qa`. They are *represented* dynamically rather than instantiated:

- `ensureSpecialist()` creates a channel thread **and** its paired DM thread at the moment the
  Manager introduces that specialist. Until then neither exists.
- `Project.team[]` records who was introduced, and the drawer renders exactly that list, so a
  channel that was never introduced cannot be reached from the UI.
- The strategy decides the working set (`STRATEGIES` in `roster.ts`): `lean` = frontend + backend,
  `balanced` = those plus QA, `enterprise` = all five.
- Channel and DM replies come from `CHANNEL_REPLIES` scripted pools, each with its own voice,
  delivered after a short typing delay.

No agent process, tool call, model request or background worker exists in this architecture;
"specialists" are conversation threads with scripted content.

### Team conversations and private DMs

- **Team channels** (`/p/:projectId/thread/:channelId`) are the project's working record. The
  Manager delegates by naming channels (`routedTo`), and the delegation message renders each channel
  as a chip that links to its conversation.
- **Private DMs** (`/p/:projectId/dm/:agentId`) are reached from a channel through the TopBar
  overflow item **Message privately**. They use the same `Message` model and the same rendering, and
  are isolated per project like every other thread.
- Visibility is decided by `addressedToUser`: specialist chatter that is not addressed to the user
  collapses into an activity line instead of a bubble (§6).

### Project-specific context

Everything a Manager or specialist "knows" is the project's own record: its `intent` (the original
brief), `planState`, `strategy`, `team[]`, its threads, its build state and its Guard result. There
is no cross-project memory and no global knowledge base.

## 6. Chat Architecture

`src/components/chat/ChatView.tsx` renders all three conversation kinds (`manager`, `channel`,
`dm`) from the same primitives: `chat/MessageBubble.tsx` for presentation, `chat/grouping.ts` for
structure, and `chat/Cards.tsx` for inline functional cards.

### Message model

`Message` (`src/store/types.ts`):

| Field | Meaning |
| --- | --- |
| `id`, `threadId` | identity and owning thread |
| `authorId` | `user`, `manager`, or a specialist id |
| `text` | body; may be empty when a card carries the content |
| `kind` | `text` · `delegation` · `plan` · `strategy` · `build` · `system` |
| `routedTo[]` | channels the Manager delegated to (rendered as link chips) |
| `addressedToUser` | false marks agent-to-agent chatter, rendered as activity |

### Composer

A single auto-growing `<textarea>` (`data-chat-composer`) inside a rounded input plane:

- **Enter** sends, **Shift+Enter** inserts a newline.
- The field grows to **five lines** and then scrolls internally
  (`Math.min(scrollHeight, 22 * 5)`), so a long message never pushes the conversation off screen.
- Send is disabled until there is something to send, and the composer carries a visible focus ring
  through its container's `focus-within` state.
- The drawer returns focus to this composer after a project is selected, which is why the drawer
  participates in the keyboard flow instead of behaving like a separate screen.

### Auto-scroll behaviour

Scrolling is bottom-aware rather than "always jump on new message":

- `STICKY_PX = 96` — within 96 px of the bottom, the user is treated as following the conversation
  and new messages arrive smoothly.
- A user who has scrolled up to read history keeps their position; a small jump-to-latest control
  appears instead of yanking the view.
- Following happens in `useLayoutEffect`, so new content is positioned before paint and never
  flashes at the wrong offset.
- `prefers-reduced-motion` is consulted before smooth scrolling is requested.

### Typing, unread and emptiness

- `Thread.typing` drives a three-dot typing row and the `StatusDot` beside the name in the TopBar.
- `Thread.unread` drives the drawer's unread dot; `readThread()` clears it and marks messages read

## 7. Canvas

Canvas (`/p/:projectId/canvas`, `src/components/canvas/CanvasView.tsx`) is the visual-design surface,
reachable from the TopBar as **UI Head**. It is the only route that hides the right workspace, which
gives the canvas the full width.

**Functional:**

- A `CanvasDoc` is created per project (`initCanvas`) inside the persisted store, so edits survive
  navigation and reload.
- Eight element types are real, editable objects: `frame`, `text`, `button`, `image`, `card`,
  `input`, `nav`, `divider` — each with `x, y, w, h, text, color, radius, fontSize, fontWeight` and
  `children[]`.
- Selecting an element opens the property panel and the edits are genuine: text, width, height, font
  size, radius and fill all write through `updateElement()` and re-render the element.
- **Apply changes** routes the update to Frontend (`managerRoute(projectId, ['frontend'])`) — the
  Canvas-to-conversation hand-off — and confirms with a toast.
- The renderer is a positioned element list inside a 560 px frame: no drag handles, no multi-select,
  no undo stack.

**Simulated:**

- *From screenshot* and *From sketch* run the same staged pipeline: four steps
  (`Reading the image…` → `Detecting regions…` → `Inferring hierarchy…` → `Building editable
  elements…`) at 620 ms each, after which a **canned layout** is written
  (`makeScreenshotLayout()` / `makeSketchLayout()`).
- The chosen file is never read, decoded, analysed or uploaded: the file input only starts the
  simulation. The resulting elements are editable — the *interpretation* is fiction, the *editing*
  is real.
- `CanvasDoc.source` records `blank`, `sketch` or `screenshot`, and the header reports which one the
  document came from.

## 8. Preview

Preview is the right-hand surface of every project route except Canvas
(`src/components/preview/PreviewPane.tsx`).

### iframe architecture

- The generated application is a **`srcDoc` string** produced by
  `buildDoc(previewTemplateId, revealed, project.name)` in `components/preview/docTemplate.ts`.
  No bundling, dev server or build output is involved: Architect composes a complete HTML document,
  including its own `<style>` block, and hands it to the iframe.
- The iframe is sandboxed with **`sandbox="allow-scripts"`** only — no `allow-same-origin`, no
  navigation permission — so the generated document cannot reach Architect's origin, storage or
  router even though it is inlined markup.
- Four templates are canned: `streaks`, `portal`, `deals`, `meals`. `pickTemplate()` selects one
  from the project's intent, and each template is a fixed set of stat cards, a table or grid and a
  chart-like block.

### Generated preview and progressive build

`PreviewState.revealed` is a 0–100 value raised as build tasks complete. Each template arranges its
sections behind thresholds (for example 12 / 40 / 70 in `streaks`): sections at or below the current
value render normally, and later sections render dimmed and blurred. The preview therefore assembles
as the build "works", driven by the same store the build card reads — not by any compilation step.

### States

| Mode | Panel shows |
| --- | --- |
| `idle` | "Nothing built yet" with a **Start building** action |
| `building` | The per-agent progress row, the current task, a footer spinner, and the iframe revealing sections |
| `live` | The iframe fully revealed, plus **Open site**, **Copy link** and the host label |
| `error` | "Preview could not start" with the build's `failedReason`, **Retry build** and **View build log** (navigates to Deploy) |

### Viewport behaviour

The viewport switch writes `PreviewState.viewport` and sets the frame width: **desktop** `100%`,
**tablet** `720px`, **mobile** `390px`, each capped at `maxWidth: 100%` so a narrow pane degrades
instead of overflowing.

### Scroll containment

The preview well is `flex-1 min-h-0` with `overflow-hidden`, and the iframe fills it exactly at
`h-full w-full`. Nothing in the panel scrolls to reveal the frame, so only the *generated document*
scrolls — one scrollbar, not two. The comment in `PreviewPane.tsx` records the double-scrollbar
layout this replaced.

### Open site and the demo route

**Open site** navigates in-app to `/demo/:projectId` rather than opening a URL: `pages/DemoSite.tsx`
renders the same document at `revealed: 100` in a full-height iframe under a header that reads
*"Simulated deployment · shown in-app"*. The host string in the preview footer (for example
`streaks-preview.architect.app`) is a label, not a resolvable address.

  while the conversation is open.
- A channel that has not been activated renders `CHANNEL_EMPTY` — *"Nothing here yet — this channel
  activates once Manager brings the team in."*
- A brand-new Manager conversation (`planState === 'briefing'` with one message) renders three
  starter suggestions that submit as ordinary user turns.

| `ts`, `read` | timestamp and read state |
| `card?` | optional `PlanCardData` · `StrategyCardData` · `BuildCardData` |


## 9. Vibing

Vibing is the entertainment capability: it hands a link off to the user's own browser for Reels,
TikTok or YouTube, and offers a local mock music player. It is built from five small modules and
one component.

| File | Responsibility |
| --- | --- |
| `components/vibing/VibingChooser.tsx` | the single control, the anchored chooser, and the build-lifecycle watcher |
| `components/vibing/session.ts` | the session state machine (module-local, not in Zustand) |
| `components/vibing/externalTabs.ts` | tracked `window.open` handles and return-to-Architect signals |
| `components/vibing/links.ts` | pure local URL classification and feed defaults |
| `components/vibing/MusicPlayer.tsx` + `data.ts` | the mock music transport and static track list |

### Single Vibing control

There is exactly one input surface. A compact **Vibing** button sits at the bottom of the right
workspace (`PreviewPane`), next to the build-lifecycle watcher. Pressing it is the first
conversational turn: the session moves to `choosing` and the Manager says *"What should I open?"*.

### Anchored chooser

The chooser is a `Popover` anchored to that control, opening **upward** because the control sits at
the bottom edge of the panel. It contains:

- four source buttons — **Reels**, **TikTok**, **YouTube**, **Music**;
- a hairline divider;
- a paste field (**"paste a link…"**) that is focused automatically once a source has been picked.

`Escape` cancels the session. The chooser is the only place Vibing accepts input; the Manager
conversation mirrors what happens but never accepts Vibing input itself, so there is no duplicated
affordance.

### Session model

`session.ts` holds the session as **module-local state with a listener set — deliberately not in the
Zustand store**, because the store is persisted to `localStorage` and a session holds live `Window`
handles and interaction phase that must never be serialised. Because it is module-local, it survives
Preview unmounting (Canvas hides the right workspace) and survives route changes, so returning to a
project resumes mid-flow.

| Session field | Meaning |
| --- | --- |
| `phase` | `idle` · `choosing` · `awaiting-link` · `music` |
| `pending` | the source the user picked before being asked for a link |
| `handoff` | the last opened external link and when it was opened |
| `brainrot` | the feed window currently open while work runs |
| `queued` | links that were recognised but cannot be played locally |

### Chat transcript mirroring

Every Vibing step is written into the Manager conversation, so the capability is legible in the
product's primary surface: the source label or the pasted link is written as a **user** turn
(`pushUserMessage`), and the Manager answers with plain text (`pushManagerMessage`) — *"Turning the
music on."*, *"Opening your feed — paste a link for a specific video, or vibe while work runs."*,
*"I don't recognise that link. Which source is it?"*, *"Your browser blocked that tab…"*.

### Local URL classification

`links.ts` is pure, synchronous and offline — it decides **what** to open and nothing else:

- Input is parsed with the platform `URL` parser. A missing scheme is tolerated (`youtu.be/abc`
  becomes `https://youtu.be/abc`), and anything whose protocol is not `http:`/`https:` is rejected so
  a `javascript:` URL can never reach `window.open`.
- **Reels** — `instagram.com` / `instagr.am` with `/reel/`, `/reels/` or `/p/`.
- **TikTok** — `tiktok.com` / `vm.tiktok.com` with `/@user/video/…`, `/t/…` or `/v/…`. A bare
  profile is ambiguous and returns nothing.
- **YouTube** — `youtube.com`, `m.youtube.com`, `music.youtube.com`, `youtube-nocookie.com` and
  `youtu.be`, with `/watch`, `/shorts`, `/live`, `/embed` and `/playlist`, classified as
  `video` or `playlist`. `music.youtube.com` is still a YouTube URL: Music mode is chosen in the UI
  and never inferred from the host.
- Anything not confidently recognised returns `null`, which keeps the chooser open with the text
  intact so the user can name the source instead of losing what they typed.
- `FEED_URLS` provides the feed roots used when a source is picked without a link:
  `instagram.com/reels/`, `tiktok.com/explore`, `youtube.com/shorts/`.

### External-tab lifecycle

`externalTabs.ts` owns every window Architect opens:

- A keyed `Map` of handles, one per purpose (`vibing:handoff`, `vibing:brainrot`).
- `openExternal()` calls `window.open` (a new tab by default, or a named popup window with features),
  then sets `win.opener = null` — the noopener-equivalent behaviour, kept as a property assignment
  so the returned handle stays usable for closing. The `noopener` *feature string* is deliberately
  not used, because it makes `window.open` return `null` and Close could never work.
- One shared 1-second poll reads `handle.closed` and drops windows the user closed themselves; a
  subscriber set is notified on every change.

### Reels / TikTok / YouTube handoff

- **Picking a source** opens the feed window immediately, so Reels, TikTok or Shorts is already
  playing while work continues: a named popup (`width=420,height=800,menubar=no,toolbar=no,
  location=yes,status=no`) rather than a full tab.
- **Pasting a link** then replaces that window with the exact video, opened as a new tab. The
  session records the link and resets to `idle`.
- `openBrainrot()` returns `opened`, `blocked` or `already-open`, and `handoff()` returns `opened`,
  `queued`, `blocked` or `unrecognised`. Every outcome has its own Manager line; a blocked popup is
  reported as blocked and never dressed up as a successful opening.
- **A pasted music link is never faked.** It classifies as `music`, is added to `queued`, and Music
  mode opens — the entry reads *"Queued — YouTube playlist. Opens on YouTube."* and can be
  dismissed.

### Music player

Music is a **local mock** and says so in the source:

- `vibing/data.ts` holds three static tracks (title, artist, duration). There is **no audio element,
  no streaming, no embed and no bundled media**.
- Play/pause starts a 1-second interval that advances a position counter; previous/next wrap around
  the list; "Next up" is derived from the list.
- The seek and volume controls are real `role="slider"` elements with `tabIndex`, arrow keys,
  PageUp/PageDown, Home/End and `aria-valuetext` — they were previously click-only divs, and the
  accessibility gap is explicitly noted in the component.
- Music mode is the only Vibing mode that needs no link at all.

### Build-lifecycle watcher and popup blocking

- `BrainrotLifecycle` subscribes to `builds[projectId].state` while the panel is mounted. When the
  build reaches `live` or `error` it closes the feed window once and posts either
  *"Build is done — closed your feed. Back to work."* or *"Build hit an error — closed your feed so
  you can take a look."* If the user already closed the window, the handle poll syncs the session
  state instead, and nothing is claimed.
- `ReturnNotice` (mounted in `AppShell`, outside the right workspace, so it keeps working on Canvas)
  posts *"YouTube opened in a new tab. Come back whenever — your project is where you left it."* the
  first time Architect regains visibility or focus after a handoff. It fires once per handoff.
- **Popup blocking is a first-class outcome.** `window.open` returning `null` yields the `blocked`
  result, the chooser keeps the pasted text so nothing is retyped, and the user is told to allow
  pop-ups for Architect and try again.

### What Vibing is not

External media is **not embedded, proxied, downloaded, scraped, cached or authenticated**. Architect
does not read a video, cannot tell whether it was watched, and holds no credential for any platform.
The classification step is local string analysis of a URL the user supplied; the handoff is ordinary
browser navigation; the only signals observed afterwards are `window.closed` and Architect's own
focus or visibility.

- `closeExternal(key)` closes **only** a window Architect opened for that exact key. It never closes
  arbitrary user tabs, never touches `window.location`, and fails silently if the browser refuses —
  so the app is never affected by a cross-origin close.
- `onReturnToArchitect()` fires on `visibilitychange` and `focus` only. That is the entire
  observable surface of a cross-origin handoff; nothing about what happened in the other tab is
  inferred or claimed.

`kind === 'system'` messages are filtered out of the rendered list, so bookkeeping never appears as
a bubble.

### Grouping

`buildChatRows()` is a pure function (no store access) that converts a flat message array into the
rows the conversation actually contains:

## 10. Code + Architect Guard

Code (`/p/:projectId/code`, `src/components/code/CodeView.tsx`) is a **read-only** view of the
project's files, with Architect Guard reporting on them.

### The read-only Code experience

- **File tree** — the list comes from `filesFor(previewTemplateId)` in
  `components/code/codeFiles.ts`. The map currently has one populated key, `streaks`, holding five
  sample sources (`src/App.tsx`, `src/hooks/useStreaks.ts`, `src/components/Dashboard.tsx`,
  `src/api/client.ts`, `src/types.ts`); every other template falls back to it. These are hand-written
  sample files, not output from a generator, compiler or model.
- **Viewer** — line numbers plus a small regex-based highlighter for keywords, string literals and
  comments. There is no editor, no syntax tree, no linting and no write-back: nothing in CodeView
  can modify a file.
- **Explain file** — toggles a fixed explanatory paragraph in which the file name is interpolated.
  It is static copy, not an analysis of the file.
- The active file is remembered per project in `activeFile`, and the header shows the project's
  framework string.

Read-only is a deliberate boundary: the generated application is composed at render time
(`docTemplate.ts`), so there is no file that could be meaningfully edited here. Making the viewer
read-only avoids implying an editing pipeline that does not exist.

### Architect Guard

Guard is an **advisory** report, and it behaves that way everywhere:

- Checks come from the static `GUARD_CHECKS` list in `store.ts` — seven entries, five `pass` and two
  `advisory` (bundle size slightly over budget; muted text contrast at 4.2:1). Each entry carries a
  human-readable `detail`.
- `runGuard(projectId)` writes `GuardResult { checks, scannedAt, scanning }` and clears `scanning`
  after 1.5 s. **No analyser runs** — the scan is a timer over fixed findings.
- Guard runs automatically when a build completes and when `retryBuild()` recovers a failed build;
  otherwise the header offers **Run Guard**.
- The header badge reads `Guard: Passing` or `Guard: N advisory`, and the popover lists every check
  with its status and detail, plus the explicit note *"Advisory findings never block your build."*
  A **Re-scan** control re-runs the same timer.
- The one behavioural link between Guard and the rest of the product is exactly this: findings are
  informative. Nothing is gated on them, and no deploy, commit or preview depends on a Guard result.

## 11. GitHub

GitHub (`/p/:projectId/github`, `src/components/github/GitHubView.tsx`) is **mocked end to end**.
The view says so in the connect card: *"Simulated connection for this demo. No real account is
accessed."*

### Connection flow

- With no `github[projectId]` connection the view renders a connect card carrying the GitHub mark
  (from `public/assets/icons/github.svg`, forced to the palette via the `brand-icon` filter).
- The repository field is prefilled from the onboarding integration's `detail`, or from the project
  name slugged to lowercase-hyphenated form when onboarding recorded nothing.
- **Connect GitHub** waits 1.1 s (`setConnecting`) and then calls `connectGithub(projectId, repo)`,
  which writes a hardcoded demo connection into the store: account `pranav-dev`, the repository name
  the user typed, branch `main`, three seeded commits (scaffold, data layer) with random short
  hashes, and an empty push state. No account is read from anywhere.
- If onboarding already connected a GitHub account, the card acknowledges it (*"Connected during
  setup as …"*), which is the only interaction between the mocked onboarding integration and this
  screen.

### Repository and commit behaviour

| Action | What actually happens |
| --- | --- |
| Header | Shows `<account> / <repo>`, the branch and the commit count from the store |
| **Commit build** | `commitBuild()` prepends a `Commit` authored by `Manager` with a `Build: <current task>` message, a random 7-character hex `hash` and a timestamp, then toasts the hash |
| **Simulate conflict** | `createConflict()` sets `push.conflict` with canned local and remote summaries — no remote is contacted, and the button exists to make the resolution path demonstrable |
| Resolve conflict | A modal offers **Keep my local build** or **Accept main**; either choice calls `resolveConflict(keep)`, which records a new commit describing the resolution and clears the conflict |
| Commit history | A list of the stored commits with message, author, local timestamp and short hash |

### What is mocked or absent

There is no OAuth device flow, no GitHub App, no token, no `git` process, no remote, no branch
protection and no push. Every commit, hash, conflict and resolution is a record in `localStorage`.
Disconnecting (`disconnectGithub`) only flips `connected` to false; history is kept.


## 12. Deploy

Deploy (`/p/:projectId/deploy`, `src/components/deploy/DeployView.tsx`) is a **simulated deployment
pipeline** driven entirely by store state and timers.

### Build and deploy state

- The environment toggle selects `preview` or `production`, and the Deploy button is disabled while a
  build is missing (`builds[projectId]` absent or `state === 'idle'`) or a deployment is already
  running. When there is no successful build the card explains why: *"Deploy needs a successful build
  first. Open Manager and start building."*
- `deploy(projectId, env, fail)` creates a new `Deployment` in `running` state, version
  `previousCount + 1`, and streams the log.
- The `fail` flag is passed as `env === 'production'`, which means **every production deploy attempt
  is simulated to fail**, not only the first one (the helper copy in the view says "first attempt"
  while the code passes `fail: true` for each production attempt — the diagram and this document
  follow the code). Preview deploys always succeed. The failure card's **Retry deploy** calls
  `deploy(projectId, latest.env, false)`, so a retry always succeeds.

### Logs

Seven canned lines (`DEPLOY_LOGS`: resolving dependencies, compiling, optimising assets, uploading to
the edge network, warming the runtime, smoke tests, switching traffic) are appended at
600 ms + 750 ms per line. The log panel is a fixed-height scroller (`max-h-56`) that scrolls itself to
the bottom as lines arrive, and a spinner appears in its header while the deployment is running.

### URL, QR and success state

On success the view renders a monospace URL of the form `<project-slug>-v<version>.architect.app`
(slugged from the project name), a **QR code** rendered with `qrcode.react` on a white card, a
**Copy link** button, and **Open site**, which navigates to the in-app `/demo/:projectId` route
rather than to that hostname. The hostname is a label: no DNS, host or certificate is involved.

### Version history, rollback and errors

- Every deployment is listed newest-first with its version badge, environment, timestamp, status
  (`running` / `success` / `failed`) and URL or rollback note.
- **Rollback** is offered on older successful versions and is confirmed by `ConfirmDialog`. It does
  not mutate history: `rollback()` creates a **new** deployment whose URL points at the chosen
  version's version number, records `rolledBackFrom`, and writes its own logs
  (`$ architect rollback --to v<n>`, "Restoring previous version…", "Rolled back to v<n> as v<m>"),
  with a confirming toast.
- A failed deployment is explained in plain language ("The build ran out of memory while packaging
  images…"), offers **Retry deploy** and **Inspect code** (navigates to Code), and its log ends with
  explicit failure lines stating that deployment halted and no traffic was switched.
- With no deployments at all, the empty state offers a preview deploy, or points at Manager when no
  build exists yet.

### What is absent

There is no hosting provider, no container build, no artefact upload, no DNS record, no CDN, no
health check and no traffic switch. Deploys are state transitions over canned logs, and the URLs are
display strings. The one thing the deploy result genuinely drives is the in-app demo route that
**Open site** opens.



## 13. Design System

One visual language, defined once and shared by auth, onboarding, the workspace and every tool.

### Colour system

Tokens live in `tailwind.config.js` and are mirrored by CSS custom properties in `src/index.css`;
the two files must be edited together. Nothing else defines colour.

| Role | Token | Value | Used for |
| --- | --- | --- | --- |
| Plane 0 | `ink` | `#121214` | app background, chat canvas |
| Plane 1 | `sidebar` | `#121214` | rail, drawer, panels, incoming messages |
| Plane 2 | `surface` | `#18181B` | cards, popovers, secondary controls |
| Plane 2 alt | `bubble` | `#26262A` | outgoing user message, hover states |
| Input | `input` | `#1E1E22` | composer and input bars |
| Control | `action` | `#323238` | control fill, inactive track, scrollbar thumb |
| Hairline | `line` / `lineSoft` | `#2C2C32` / `rgba(44,44,50,.6)` | borders and dividers |
| Text | `paper` | `#E4E4E7` | primary text |
| Text | `muted` | `#A1A1AA` | secondary text and metadata |
| Text | `faint` | `#71717A` | placeholder, decorative and disabled only — never body text |
| Accent | `accent` / `accentHover` | `#007AFF` / `#0A84FF` | primary CTA, send button, progress fill |
| Accent | `accentPurple` / `accentPurpleSoft` | `#7C3AED` / `#A78BFA` | badges and highlights |

Two rules make the system coherent: **elevation is surface value, not shadow** (a hairline marks
containment of scrolling content and nothing else), and **hierarchy comes from size and weight, not
opacity**, so accidental `text-muted/60`-style values do not exist.

### Typography

- Six type steps, nothing below 11 px, and 11 px is uppercase-only.
- System sans stack (`-apple-system`, `BlinkMacSystemFont`, "SF Pro Text"/"SF Pro Display",
  `system-ui`); monospace stack (`ui-monospace`, `SFMono-Regular`, Menlo, Consolas) for code, file
  paths, hashes, URLs and counters.
- Tabular numerals (`font-variant-numeric: tabular-nums`) are applied to timestamps, percentages,
  durations and counts so digits do not reflow while a value animates.

### Surfaces and reusable primitives

`src/components/ui/` holds the primitives every screen composes:

| Primitive | Contents |
| --- | --- |
| `Button.tsx` | `Button` (primary / secondary / ghost × sm / md) and `IconButton` |
| `Row.tsx` | `Row` (the single 56 px list row used by both project and conversation lists) and `UnreadDot` |
| `Modal.tsx`, `Dialog.tsx` | `Modal`, `Dialog` and `ConfirmDialog`, with overlay enter/exit animation |
| `Popover.tsx` | `Popover` and `MenuItem` — the anchored menu used by the TopBar, drawer rows and Vibing |
| `Panel.tsx` | `Panel`, `PanelHeader`, `PanelBody` |
| `Surface.tsx` | `Input` and `SectionLabel` |
| `Progress.tsx` | the X-axis-only progress bar |
| `StatusDot.tsx` | the single "something is happening" indicator (typing, build, activity) |
| `EmptyState.tsx` | icon + title + body + one or two actions |
| `Toaster.tsx` | the toast stack, including action toasts such as archive undo |
| `Identity.tsx` | `Identity` and `SpecialistIdentity` avatars with initial-letter fallback |
| `cx.ts` | the class-name joiner |

### Motion

- Durations: `instant` 120 ms, `enter` 200 ms, `exit` 140 ms, `shift` 260 ms.
- Easings: `standard` `cubic-bezier(.2,.8,.2,1)`, `depart` `cubic-bezier(.4,0,1,1)`,
  `travel` `cubic-bezier(.4,0,.2,1)`.
- One rule: anything the user can re-trigger uses a `transition` (naturally interruptible) rather
  than a keyframe `animation`. The remaining keyframes are overlay and sheet in/out, `rise` for
  content arrival, `pulse` for the status dot and `spin`.
- Deprecated animation aliases (`fadeUp`, `typingPulse`, `shimmer`) are retained only so older call
  sites keep rendering during migration; new code must not use them.

### Reduced motion

`src/index.css` contains one global kill switch: under `prefers-reduced-motion: reduce` every
animation and transition collapses to 0.01 ms and `scroll-behavior` becomes `auto`. Components that
drive motion from script (smooth scrolling in the chat) also read the media query directly, because
CSS cannot stop a scripted scroll.

### Accessibility and input affordances

- A single focus ring (`--focus-ring`) is applied through `:focus-visible`; it is suppressed for
  pointer interaction only, so keyboard users always see where they are.
- `touch-targets.css` is imported after the Tailwind pipeline and expands the hit area of small
  controls to 44 px on coarse pointers (`coarse-hit`) without changing their visual size.
- The app owns its scroll containers: the page itself never scrolls (`overflow: hidden` plus
  `overscroll-behavior: none`), which stops mobile rubber-banding from detaching the composer.
- Brand assets (vendor icons, onboarding GIFs) are forced into palette greys at render time
  (`.brand-icon`, `.brand-icon-ink`, `.gif-mono`); the source files are never modified.

- **Author turns.** A turn starts when the author changes, when the gap exceeds
  `GROUP_WINDOW_MS` (5 minutes), when a card appears, or after an activity line. Identity — avatar
  and name — is drawn once per turn, not once per message, which is the difference between a
  conversation and a stack of cards.
- **Activity lines.** Consecutive messages where `addressedToUser` is false collapse into a single
  hairline separator naming the agents involved (`Frontend · Backend`). The recipient is
  deliberately not derived, because `Message` records no recipient — the line states who was
  involved without asserting who was talking to whom.
- **Your own messages** are never grouped: each is its own right-aligned utterance with no avatar.

### Cards

Cards are functional objects attached to a message, rendered on a different plane and radius from
the bubble so the two can never be confused:

- **Plan** — title, core-experience list, team chips, plan revision number, and an inline "request a

## 14. Security / Safety Boundaries

This section documents only boundaries that exist in the code.

### No network activity

The application makes no `fetch`, XHR, WebSocket or beacon call at runtime. There is no API base
URL, no SDK, no telemetry and no analytics. The only outbound navigation the product can perform is
the user-initiated external handoff in §9.

### URL validation and classification

- A pasted URL is parsed with the platform `URL` parser, not a regular expression alone, and must
  resolve to `http:` or `https:`. A `javascript:`, `data:` or `file:` URL is rejected before it can
  reach `window.open`.
- Classification only accepts exact known hosts and path shapes (Instagram, TikTok, YouTube); an
  ambiguous URL returns `null` and keeps the chooser open rather than guessing.
- The two built-in feed targets come from a constant map and are plain `https` URLs.

### External-tab handling

- Every opened window is registered under an internal key. Only a window that Architect opened for
  that key can ever be closed by Architect.
- `win.opener` is set to `null`, so the opened page cannot script back into the app.
- The app never assigns `window.location` in this flow, never reads cross-origin content, and treats
  a browser refusal to close as a silent no-op — a refused close cannot affect the app.
- One shared 1-second poll observes `closed`; there is no per-component timer.

### Popup blocking

A popup blocker returns no window. That case is a distinct result (`blocked`), surfaced in the
conversation with the pasted text preserved and the session phase unchanged, so the user can retry
without retyping. The app never reports an opening it did not get.

### No scraping or embedding

No external media is embedded, iframed, proxied, mirrored, downloaded or scraped, and no platform
credential is requested or stored. The user's browser performs the navigation; Architect's knowledge
of the outcome is limited to two local signals — `window.closed` and its own focus/visibility.

### Sandboxed generated content

Generated preview markup runs in an iframe sandboxed with `allow-scripts` only: no
`allow-same-origin`, no navigation, no popups and no downloads. The inlined document therefore cannot
read Architect's storage, router or DOM.

### Read-only and advisory by design

Code is read-only, and Architect Guard findings are advisory: no action in the product is gated on a
Guard result. Nothing in the UI can modify a file, a commit or a deployment record beyond the store
transitions described above.

### Stored data hygiene

- `localStorage` is the only persistence and holds demo state: identity name/email/avatar, projects,
  conversations, builds, previews, canvas documents, Guard results, GitHub records and deployments.
- The password typed on the sign-in screen exists only in component state for the duration of that
  screen; it is never written to the store or to storage. (The value shown in the field is masked by
  the input type.)
- No API keys, tokens, credentials, environment variables or secrets are used by the app. The single
  occurrence of an environment-variable name in the repository is inside the **displayed sample
  source** in `codeFiles.ts` (`import.meta.env.VITE_API_URL`); it is text on screen, not a value the
  application reads.
- `.gitignore` excludes `node_modules`, `dist`, `.DS_Store` and `*.local`.

  revision" input that calls `requestRevision()` and produces a new plan message.
- **Strategy** — the three options (Lean / Balanced / Enterprise) with their blurbs; selecting one
  calls `chooseStrategy()`, and the confirmation reveals **Start building**, which sends
  "start building" through the normal Manager path.
- **Build** — collapsed build status with an overall progress bar; expanding shows per-agent

## 15. Known Limitations

### Mocked behaviour (no external service exists)

| Area | What is mocked |
| --- | --- |
| Sign-in | Email/password, the Google account chooser and guest are all local: `signIn()` writes a `User` and nothing is verified |
| Onboarding integrations | GitHub, Vercel, Supabase and Figma are a catalogue of options in `store/integrations.ts`; connecting records a choice |
| Manager and specialist replies | Keyword matching over scripted pools in `store/scripts.ts`; no language model is involved |
| Plan and strategy cards | `planFor()` derives features and team from words in the brief; the strategy list is a constant |
| Build engine | Seven canned tasks with timers; per-agent progress is a number in the store |
| Preview | Four canned HTML templates composed at render time, revealed by a numeric threshold |
| Canvas analysis | Four timed steps and a canned element layout; the uploaded image is never read |
| Code | Five sample source files keyed by template id, with "streaks" as the only populated key and the fallback for everything else |
| Architect Guard | Seven static findings; "scanning" is a 1.5 s timer |
| GitHub | Connection, commits, hashes, conflicts and resolutions are store records; account `pranav-dev` is a hardcoded demo string |
| Deploy | Canned log lines, a generated display URL, a QR code for that string, and simulated failures |
| Music | A 1-second timer driving a position counter over three static tracks; there is no audio playback |
| Demo site | `/demo/:projectId` renders the same generated document in-app and labels itself as a simulated deployment |

### Intentionally simulated integrations

The four onboarding integrations, the GitHub connection and the deploy pipeline are simulated **on
purpose**, so the whole product loop is demonstrable without infrastructure, credentials or cost.
Where a simulation could be mistaken for the real thing, the UI says so: the GitHub connect card
states that no real account is accessed, the demo route states that the deployment is simulated and
shown in-app, and the deploy card explains that production fails on purpose so the error path is
visible.

### Browser limitations that shape behaviour

- **Cross-origin observability.** Once a link is handed to another tab, nothing about that tab is
  readable. The app therefore only observes `window.closed` and its own focus/visibility, and
  deliberately never claims that anything was watched.
- **Popup blockers.** Any `window.open` can be refused; the app reports that outcome instead of
  pretending a window opened, and keeps the user's text so a retry costs nothing.
- **Closing tabs.** A page may close only windows it opened itself. Architect never attempts to close
  a user's own tabs, and a refused close is swallowed.
- **Storage scope.** All persistence is `localStorage`, so a project exists in one browser profile on
  one origin. It does not sync across devices, browsers or profiles, and private-browsing modes may
  discard it.
- **Isolation approach.** Project isolation is by keys and filters (§3), not by an access-control
  layer — appropriate for a single-user local application, and worth restating so the boundary is not
  overread.

### Not implemented

- No backend, API server, database or server-side rendering.
- No OAuth provider, no GitHub/Vercel/Supabase/Figma API client, no token storage.
- No LLM, agent runtime, tool execution, queue or worker; no sandbox, container or CI.
- No real deployment target, DNS, TLS, CDN or traffic switching.
- No automated tests, lint configuration or CI pipeline in this repository; `npm run build` is the
  only gate (`tsc -b` plus `vite build`).
- No code editing or write-back; Code is a viewer, and Guard is advisory.
- **Responsive work is interim.** The stylesheet carries explicit phase notes: full responsive
  behaviour (sheets, scrims, focus traps) is future work, and the current rules are guards.
- **No focus trap in the project drawer.** It uses `aria-modal`, Escape, focus restore and a scrim,
  but `Tab` can leave the sheet, because no trap is implemented.
- **Unmounted or unreferenced code**, present in the repository but not part of any rendered route:
  `components/import/ImportWizard.tsx` and the `imports` / `setImportDraft` state that feeds it;
  `ProjectConversationList` in `shell/Sidebar.tsx`, an earlier docked-drawer variant; the store
  actions `setAnalyzing`, `toggleGuardDetail` and `setOnboardingStep`; and `demoProjectId`, which is
  written and persisted but never read. `managerViewMode` is written in four places and read by none.
- **Migration leftovers in the stylesheet:** the `--grok-*` variable aliases (mapped onto the current
  palette for the remaining onboarding components) and the deprecated `fadeUp`, `typingPulse` and
  `shimmer` animation aliases.
- **Deploy copy inconsistency.** The deploy card says production "simulate[s] one failure on the
  first attempt", while the code passes `fail: true` for every production attempt; this document and
  the diagram describe the code.

---

*This document describes the repository as committed. If a behaviour here disagrees with the code,
the code is authoritative.*

  progress. It reads the same `builds[projectId].progress` the preview pane uses.
