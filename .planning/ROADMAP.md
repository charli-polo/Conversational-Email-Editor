# Roadmap: Conversational Email Editor — Brief Flow

**Created:** 2026-03-25
**Milestone:** v1.0 — Brief Flow MVP

## Phase 1: Dify Agent API Integration

**Goal:** Create the backend bridge to Dify chat agent
**Requirements:** DIFY-01, DIFY-02, DIFY-03, DIFY-04
**Plans:** 2 plans

- Create `/api/brief/chat` API route
- Proxy messages to Dify `/chat-messages` endpoint with streaming
- Manage `conversation_id` for multi-turn state
- Store API key server-side via env vars

Plans:
- [x] 01-01-PLAN.md — Dify client library, types, and env configuration
- [x] 01-02-PLAN.md — API route SSE proxy and end-to-end verification

**Verification:** Send messages through API route, receive streaming responses from Dify agent with conversation continuity.

## Phase 2: Brief Page UI

**Goal:** Build the brief-taking page with chat and empty right panel
**Requirements:** BRIEF-01, BRIEF-02, BRIEF-03, BRIEF-04
**Plans:** 2 plans

- Create brief page with two-panel layout (reuse existing layout pattern)
- Build chat component connected to `/api/brief/chat`
- Add empty state / placeholder in right panel
- Add "Start editing" transition button

Plans:
- [x] 02-01-PLAN.md — Dify parameters proxy route and useBriefChat hook
- [x] 02-02-PLAN.md — Brief page UI components and two-panel layout

**Verification:** User can chat with Dify agent on brief page, see empty right panel, and see the transition button.

## Phase 3: Flow Navigation & Wiring

**Goal:** Wire the two-step flow together as the app entry point
**Requirements:** FLOW-01, FLOW-02, FLOW-03

- Make brief page the new landing page (`/`)
- Move current email editor to `/editor` route
- Button navigates from brief to editor
- Existing editor functionality unchanged

**Verification:** Full flow works: land on brief page -> chat with agent -> click button -> arrive on working email editor.

## Phase 4: Settings Panel, Chat Upgrade & Conversation Persistence

**Goal:** Add configurable agent/test prompt settings, upgrade chat to assistant-ui primitives, and persist conversations in a file-based DB that works on Railway
**Requirements:** CHAT-01, CHAT-02, CHAT-03, SETTINGS-01, SETTINGS-02, SETTINGS-03, SETTINGS-04, PERSIST-01, PERSIST-02, PERSIST-03, PERSIST-04, PERSIST-05

### Chat UI Upgrade (assistant-ui v0.12)
- Upgrade `@assistant-ui/react` from v0.9.6 to v0.12.x
- Replace 676-line custom chat panel with library primitives (`Thread`, `Composer`, `MessagePrimitive`)
- Use `ThreadPrimitive.Suggestion` for test prompt chips (replacing custom implementation)
- Keep existing `ChatModelAdapter` pattern for Dify API connection
- Wire `useRemoteThreadListRuntime` to enable thread persistence from the UI layer

### Settings Panel (inspired by best-channel-exploration)
- Settings page at `/settings` with navigation from main app
- Agent configuration: register agents with label, API key, base URL, Dify URL, conversation mode
- CRUD for agents (list, create, edit, delete) — API key never exposed in list views
- Active agent selection: pick which agent powers the brief chat
- Test prompts: create reusable prompts (name + text) that appear as quick-start chips in chat
- CRUD for test prompts (list, create, edit, delete)

### Conversation Persistence
- SQLite file-based database (better-sqlite3) — simple, zero-config, Railway-compatible
- Database schema: agents, test_prompts, conversations, messages tables
- Each conversation linked to agent config snapshot at creation time
- Conversation list sidebar via assistant-ui's `ThreadList` component
- Click to resume: loads messages and restores conversation context via `useRemoteThreadListRuntime`
- Railway deployment: SQLite file stored in persistent volume or app data directory

### Technical Approach
- **Chat UI:** assistant-ui v0.12 primitives (Thread, Composer, ThreadList, Suggestion)
- **DB:** better-sqlite3 (synchronous, no external service needed, file-based)
- **ORM:** Drizzle ORM with SQLite driver (type-safe, lightweight)
- **API routes:** RESTful Next.js API routes (same pattern as best-channel-exploration)
- **UI components:** Settings in `components/settings/`, chat in `components/assistant-ui/`
- **Railway:** SQLite file at `/app/data/db.sqlite` (Railway persistent storage) or `./data/db.sqlite` locally

Plans:
- [x] 04-01-PLAN.md — SQLite database setup (better-sqlite3 + Drizzle schema + migrations)
- [ ] 04-02-PLAN.md — assistant-ui upgrade + brief chat migration (v0.12, Thread/Composer primitives, Dify adapter)
- [ ] 04-03-PLAN.md — Settings API routes (agents CRUD, test-prompts CRUD, active agent selection)
- [ ] 04-04-PLAN.md — Settings page UI (agent form, agent list, test prompt form, navigation)
- [ ] 04-05-PLAN.md — Conversation persistence API (save/load conversations, messages, agent config tagging)
- [ ] 04-06-PLAN.md — ThreadList sidebar + useRemoteThreadListRuntime + resume flow + Railway deployment

**Verification:** User can register agents in settings, create test prompts, chat with selected agent using assistant-ui Thread UI, close browser, return and see past conversations in ThreadList sidebar, resume any conversation with its original agent config.

---
*Roadmap created: 2026-03-25*
*Updated: 2026-04-05 — Phases 2-3 marked complete, Phase 4 added*
