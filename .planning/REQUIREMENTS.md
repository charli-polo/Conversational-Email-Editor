# Requirements: Conversational Email Editor

**Defined:** 2026-04-06
**Core Value:** Two-step conversational flow: brief collection via AI agent, then email editing

## v1.1 Requirements

Requirements for Conversation Management milestone. Each maps to roadmap phases.

### Conversation List

- [ ] **LIST-01**: User can view all saved conversations on a dedicated page with agent name and timestamp
- [ ] **LIST-02**: User can navigate to a conversation from the list page
- [ ] **LIST-03**: User can rename a conversation inline from the list page
- [ ] **LIST-04**: User can delete a conversation with confirmation from the list page
- [ ] **LIST-05**: User sees empty state when no conversations exist

### Tagging

- [ ] **TAG-01**: User can create free-text tags and assign them to conversations
- [ ] **TAG-02**: User can remove tags from a conversation
- [ ] **TAG-03**: User can see tags displayed on each conversation in the list
- [ ] **TAG-04**: User sees autocomplete suggestions from existing tags when adding a tag

### Tab Navigation

- [ ] **TAB-01**: User can view an "All" tab showing all conversations
- [ ] **TAB-02**: User can view one tab per existing tag, filtering conversations by that tag
- [ ] **TAB-03**: User can switch between tabs to filter the conversation list

### Data Layer

- [x] **DATA-01**: Tags stored in junction table with efficient query support
- [x] **DATA-02**: Conversation list query loads tags in a single joined query (no N+1)
- [ ] **DATA-03**: Shared data hook used by both conversations page and ThreadListDrawer

## v2 Requirements

### Bulk Operations

- **BULK-01**: User can select multiple conversations for bulk delete
- **BULK-02**: User can apply/remove tags to multiple conversations at once

### Search & Filter

- **SRCH-01**: User can search conversations by title
- **SRCH-02**: User can filter conversations by agent
- **SRCH-03**: User can sort conversations by date or title

### Tag Management

- **TMGMT-01**: User can view all tags and their conversation counts
- **TMGMT-02**: User can rename a tag across all conversations
- **TMGMT-03**: User can delete a tag (removes from all conversations)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Nested folder hierarchy | Conflicts with multi-classification; tags are more flexible |
| Drag-and-drop reordering | Conversations have natural temporal order |
| Full-text message search | SQLite FTS5 complexity not justified for v1.1 |
| Tag colors/icons | Scope creep risk; can add in future milestone |
| Tag hierarchy/nesting | Adds complexity without clear user value |
| Conversation archiving | Soft-delete adds query complexity; hard delete sufficient for v1.1 |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| DATA-01 | Phase 7 | Complete |
| DATA-02 | Phase 7 | Complete |
| DATA-03 | Phase 7 | Pending |
| LIST-01 | Phase 8 | Pending |
| LIST-02 | Phase 8 | Pending |
| LIST-03 | Phase 8 | Pending |
| LIST-04 | Phase 8 | Pending |
| LIST-05 | Phase 8 | Pending |
| TAG-01 | Phase 9 | Pending |
| TAG-02 | Phase 9 | Pending |
| TAG-03 | Phase 9 | Pending |
| TAG-04 | Phase 9 | Pending |
| TAB-01 | Phase 10 | Pending |
| TAB-02 | Phase 10 | Pending |
| TAB-03 | Phase 10 | Pending |

**Coverage:**
- v1.1 requirements: 15 total
- Mapped to phases: 15
- Unmapped: 0

---
*Requirements defined: 2026-04-06*
*Last updated: 2026-04-06 after roadmap creation*
