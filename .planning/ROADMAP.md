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
- [ ] 02-01-PLAN.md — Dify parameters proxy route and useBriefChat hook
- [ ] 02-02-PLAN.md — Brief page UI components and two-panel layout

**Verification:** User can chat with Dify agent on brief page, see empty right panel, and see the transition button.

## Phase 3: Flow Navigation & Wiring

**Goal:** Wire the two-step flow together as the app entry point
**Requirements:** FLOW-01, FLOW-02, FLOW-03

- Make brief page the new landing page (`/`)
- Move current email editor to `/editor` route
- Button navigates from brief to editor
- Existing editor functionality unchanged

**Verification:** Full flow works: land on brief page -> chat with agent -> click button -> arrive on working email editor.

---
*Roadmap created: 2026-03-25*
