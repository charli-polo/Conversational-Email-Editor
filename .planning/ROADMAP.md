# Roadmap: Conversational Email Editor — Brief Flow

**Created:** 2026-03-25

## Milestones

- ✅ **v1.0 Brief Flow MVP** — Phases 1-6 (shipped 2026-04-06)
- 🚧 **v1.1 Conversation Management** — Phases 7-10 (in progress)

## Phases

<details>
<summary>v1.0 Brief Flow MVP (Phases 1-6) — SHIPPED 2026-04-06</summary>

- [x] Phase 1: Dify Agent API Integration (2/2 plans)
- [x] Phase 2: Brief Page UI (2/2 plans)
- [x] Phase 3: Flow Navigation & Wiring
- [x] Phase 4: Settings Panel & Conversation Persistence (7/7 plans)
- [x] Phase 5: Dify Chat UX Enhancements (5/5 plans)
- [x] Phase 6: Chat UI Rewrite (4/4 plans)

See: `.planning/milestones/v1.0-ROADMAP.md` for full details.

</details>

### v1.1 Conversation Management (In Progress)

**Milestone Goal:** Give users a dedicated page to browse, organize, and manage all their saved conversations with free-text tagging and tab-based filtering.

- [x] **Phase 7: Schema & API Foundation** - Tag tables, joined list query, shared data hook (completed 2026-04-07)
- [ ] **Phase 8: Conversation List** - Dedicated page to browse, navigate, rename, and delete conversations
- [ ] **Phase 9: Tagging System** - Free-text tag creation, assignment, removal, and autocomplete
- [x] **Phase 10: Tab Navigation** - All tab plus per-tag tabs for filtering conversations (completed 2026-04-07)

## Phase Details

### Phase 7: Schema & API Foundation
**Goal**: Data layer supports tags and efficient conversation listing for all downstream UI
**Depends on**: Phase 6 (v1.0 complete)
**Requirements**: DATA-01, DATA-02, DATA-03
**Success Criteria** (what must be TRUE):
  1. Tags and conversation-tag associations persist across server restarts
  2. GET /api/threads returns conversations with their tags in a single query (no N+1)
  3. A shared hook provides conversation data consumable by both the conversations page and ThreadListDrawer
**Plans**: 2 plans

Plans:
- [x] 07-01-PLAN.md — Tag schema, migration, and API rewrite (eliminate N+1)
- [x] 07-02-PLAN.md — Shared useConversations hook and ThreadListDrawer refactor

### Phase 8: Conversation List
**Goal**: Users can browse all saved conversations and manage them from a dedicated page
**Depends on**: Phase 7
**Requirements**: LIST-01, LIST-02, LIST-03, LIST-04, LIST-05
**Success Criteria** (what must be TRUE):
  1. User can open /conversations and see all saved conversations with agent name and timestamp
  2. User can click a conversation to navigate to /c/{id} and resume it
  3. User can rename a conversation inline without leaving the list page
  4. User can delete a conversation after confirming, and it disappears from the list
  5. User sees a helpful empty state when no conversations exist
**Plans**: 2 plans

Plans:
- [x] 08-01-PLAN.md — Page route, list rendering, empty state (LIST-01, LIST-02, LIST-05)
- [ ] 08-02-PLAN.md — Inline rename and delete with confirmation (LIST-03, LIST-04)

### Phase 08.1: E2E Testing Infrastructure (INSERTED)

**Goal:** Reliable Playwright E2E testing infrastructure with mocked Dify, DB isolation, and coverage for Phase 6 and Phase 8 features
**Requirements**: D-01, D-02, D-03, D-04, D-05, D-06, D-07, D-08
**Depends on:** Phase 8
**Plans:** 2/2 plans complete

Plans:
- [x] 08.1-01-PLAN.md — Playwright config (webServer, globalSetup), test helpers, fix Phase 6 tests
- [x] 08.1-02-PLAN.md — Phase 8 E2E tests (LIST-01 through LIST-05)

### Phase 9: Tagging System
**Goal**: Users can organize conversations with free-text tags
**Depends on**: Phase 8
**Requirements**: TAG-01, TAG-02, TAG-03, TAG-04
**Success Criteria** (what must be TRUE):
  1. User can create a new tag and assign it to a conversation from the list page
  2. User can remove a tag from a conversation
  3. Each conversation in the list displays its assigned tags
  4. When typing a tag name, user sees autocomplete suggestions from existing tags
**Plans**: 2 plans

Plans:
- [x] 09-01-PLAN.md — Tag API endpoints (assign/remove) + shadcn Popover/Command + TagPopover component
- [x] 09-02-PLAN.md — Wire tag display, add/remove into ConversationListItem and ConversationsPage

### Phase 10: Tab Navigation
**Goal**: Users can filter the conversation list by tag using a tab bar
**Depends on**: Phase 9
**Requirements**: TAB-01, TAB-02, TAB-03
**Success Criteria** (what must be TRUE):
  1. An "All" tab is visible and shows every conversation regardless of tags
  2. One tab appears per existing tag, showing only conversations with that tag
  3. User can switch between tabs and the conversation list updates instantly
**Plans**: 1 plan

Plans:
- [x] 10-01-PLAN.md — Tab bar with client-side filtering and E2E tests (TAB-01, TAB-02, TAB-03)

### Phase 11: Navigation, Bug Fix & Verification Closure
**Goal**: Close all audit gaps — add in-app navigation to /conversations, fix stale tag tabs, and complete Phase 8 verification trail
**Depends on**: Phase 10
**Requirements**: LIST-03, LIST-04 (verification closure)
**Gap Closure:** Closes gaps from v1.1 milestone audit
**Success Criteria** (what must be TRUE):
  1. User can reach /conversations from within the app (sidebar or header link)
  2. Removing the last conversation with a tag refreshes the tab bar immediately (no stale tabs)
  3. Phase 8 has VERIFICATION.md and 08-02 has SUMMARY.md (LIST-03/LIST-04 tracking gaps closed)
**Plans**: 2 plans

Plans:
- [x] 11-01-PLAN.md — Navigation link + stale tab fix (code changes)
- [x] 11-02-PLAN.md — Phase 8 verification trail (08-02-SUMMARY.md + 08-VERIFICATION.md)

### Phase 12: Regression Test Suite
**Goal**: E2E smoke tests for every app route plus critical path coverage — catch route-level regressions like the /settings bug
**Depends on**: Phase 11
**Requirements**: (quality gate — no new functional requirements)
**Gap Closure:** Closes test coverage gaps for /settings and /editor routes
**Success Criteria** (what must be TRUE):
  1. /settings page loads without error and agents CRUD works end-to-end
  2. /editor page loads without error
  3. Every app route (/, /conversations, /c/[id], /editor, /settings) has at least a smoke E2E test
  4. A single `npm test` or `npx playwright test` command runs the full regression suite
  5. The /settings bug is diagnosed and fixed
**Plans**: 2 plans

Plans:
- [x] 12-01-PLAN.md — Diagnose and fix /settings bug, verify /editor loads
- [ ] 12-02-PLAN.md — E2E regression suite with all 7 critical flows

## Progress

**Execution Order:** Phases execute in numeric order: 7 -> 8 -> 8.1 -> 9 -> 10 -> 11 -> 12

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1-6 | v1.0 | 20/20 | Complete | 2026-04-06 |
| 7. Schema & API Foundation | v1.1 | 2/2 | Complete   | 2026-04-07 |
| 8. Conversation List | v1.1 | 0/2 | Planned | - |
| 8.1 E2E Testing Infrastructure | v1.1 | 0/2 | Planned | - |
| 9. Tagging System | v1.1 | 0/2 | Planned | - |
| 10. Tab Navigation | v1.1 | 1/1 | Complete    | 2026-04-07 |
| 11. Navigation & Verification | v1.1 | 2/2 | Complete    | 2026-04-07 |
| 12. Regression Test Suite | v1.1 | 1/2 | In Progress|  |

---
*Roadmap created: 2026-03-25*
*Updated: 2026-04-07 — Phase 12 planned: 2 plans in 2 waves*
