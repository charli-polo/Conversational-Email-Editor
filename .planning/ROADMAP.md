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

- [ ] **Phase 7: Schema & API Foundation** - Tag tables, joined list query, shared data hook
- [ ] **Phase 8: Conversation List** - Dedicated page to browse, navigate, rename, and delete conversations
- [ ] **Phase 9: Tagging System** - Free-text tag creation, assignment, removal, and autocomplete
- [ ] **Phase 10: Tab Navigation** - All tab plus per-tag tabs for filtering conversations

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
- [ ] 07-02-PLAN.md — Shared useConversations hook and ThreadListDrawer refactor

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
**Plans**: TBD

Plans:
- [ ] 08-01: TBD
- [ ] 08-02: TBD

### Phase 9: Tagging System
**Goal**: Users can organize conversations with free-text tags
**Depends on**: Phase 8
**Requirements**: TAG-01, TAG-02, TAG-03, TAG-04
**Success Criteria** (what must be TRUE):
  1. User can create a new tag and assign it to a conversation from the list page
  2. User can remove a tag from a conversation
  3. Each conversation in the list displays its assigned tags
  4. When typing a tag name, user sees autocomplete suggestions from existing tags
**Plans**: TBD

Plans:
- [ ] 09-01: TBD
- [ ] 09-02: TBD

### Phase 10: Tab Navigation
**Goal**: Users can filter the conversation list by tag using a tab bar
**Depends on**: Phase 9
**Requirements**: TAB-01, TAB-02, TAB-03
**Success Criteria** (what must be TRUE):
  1. An "All" tab is visible and shows every conversation regardless of tags
  2. One tab appears per existing tag, showing only conversations with that tag
  3. User can switch between tabs and the conversation list updates instantly
**Plans**: TBD

Plans:
- [ ] 10-01: TBD

## Progress

**Execution Order:** Phases execute in numeric order: 7 -> 8 -> 9 -> 10

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1-6 | v1.0 | 20/20 | Complete | 2026-04-06 |
| 7. Schema & API Foundation | v1.1 | 1/2 | In Progress|  |
| 8. Conversation List | v1.1 | 0/? | Not started | - |
| 9. Tagging System | v1.1 | 0/? | Not started | - |
| 10. Tab Navigation | v1.1 | 0/? | Not started | - |

---
*Roadmap created: 2026-03-25*
*Updated: 2026-04-07 — Phase 7 planned (2 plans)*
