# Roadmap: Conversational Email Editor — Brief Flow

**Created:** 2026-03-25

## Milestones

- ✅ **v1.0 Brief Flow MVP** — Phases 1-6 (shipped 2026-04-06)
- ✅ **v1.1 Conversation Management** — Phases 7-12 (shipped 2026-04-07)
- 🚧 **v1.2 Suggested Answers** — Phases 13-14 (in progress)

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

<details>
<summary>v1.1 Conversation Management (Phases 7-12) — SHIPPED 2026-04-07</summary>

- [x] **Phase 7: Schema & API Foundation** - Tag tables, joined list query, shared data hook
- [x] **Phase 8: Conversation List** - Dedicated page to browse, navigate, rename, and delete conversations
- [x] **Phase 08.1: E2E Testing Infrastructure** (INSERTED) - Playwright infrastructure + Phase 8 E2E coverage
- [x] **Phase 9: Tagging System** - Free-text tag creation, assignment, removal, and autocomplete
- [x] **Phase 10: Tab Navigation** - All tab plus per-tag tabs for filtering conversations
- [x] **Phase 11: Navigation, Bug Fix & Verification Closure** - In-app nav, stale tab fix, Phase 8 verification trail
- [x] **Phase 12: Regression Test Suite** - E2E smoke tests for every route + critical path coverage

See phase details in `.planning/milestones/v1.1-ROADMAP.md` for full history.

</details>

### v1.2 Suggested Answers (In Progress)

**Milestone Goal:** Render clickable action buttons in the chat when the Dify agent sends a `<suggested_answer>` JSON block, enabling one-click responses that send the action's prompt as the user's next message.

- [x] **Phase 13: Suggested Answer Parsing** - Extract, validate, and strip `<suggested_answer>` JSON blocks from agent messages (completed 2026-04-07)
- [ ] **Phase 14: Suggested Answer UI** - Render action chips below assistant messages with click-to-send and auto-dismiss

## Phase Details

### Phase 13: Suggested Answer Parsing
**Goal**: Agent messages containing `<suggested_answer>` blocks are cleanly split into visible text and structured action data
**Depends on**: Phase 12 (v1.1 complete)
**Requirements**: PARSE-01, PARSE-02, PARSE-03
**Success Criteria** (what must be TRUE):
  1. A pure parsing function extracts the JSON actions array from a `<suggested_answer>` block in message text
  2. The returned message text has the `<suggested_answer>` block completely removed (user sees clean markdown only)
  3. Messages without a `<suggested_answer>` block pass through unchanged with no actions extracted
**Plans:** 1/1 plans complete

Plans:
- [x] 13-01-PLAN.md — Parser function with TDD, adapter streaming integration

### Phase 14: Suggested Answer UI
**Goal**: Users can see and click suggested answer chips to send follow-up messages with one click
**Depends on**: Phase 13
**Requirements**: RENDER-01, RENDER-02, RENDER-03, INTERACT-01, INTERACT-02
**Success Criteria** (what must be TRUE):
  1. Clickable action buttons appear below the assistant message bubble when suggested answers are present
  2. Each button displays the action's label text and is styled as a chip/pill consistent with existing chat UI
  3. Clicking an action button sends the action's prompt as the user's next chat message
  4. After clicking any action, all suggested answer buttons for that message disappear
  5. Messages without suggested answers render normally with no extra UI elements
**Plans:** 1 plan

Plans:
- [ ] 14-01-PLAN.md — SuggestedAnswerChips component, BriefThread integration, unit tests, visual verification

## Progress

**Execution Order:** Phases execute in numeric order: 13 -> 14

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1-6 | v1.0 | 20/20 | Complete | 2026-04-06 |
| 7-12 | v1.1 | 12/12 | Complete | 2026-04-07 |
| 13. Suggested Answer Parsing | v1.2 | 1/1 | Complete    | 2026-04-07 |
| 14. Suggested Answer UI | v1.2 | 0/1 | Not started | - |

---
*Roadmap created: 2026-03-25*
*Updated: 2026-04-07 — Phase 14 planned (1 plan)*
