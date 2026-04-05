# Requirements: Conversational Email Editor — Brief Flow

**Defined:** 2026-03-25
**Core Value:** Two-step AI conversational flow — brief then edit

## v1 Requirements

### Dify Agent Integration

- [x] **DIFY-01**: Next.js API route proxies chat messages to Dify `/chat-messages` endpoint
- [x] **DIFY-02**: Conversation state maintained via Dify `conversation_id` across messages
- [x] **DIFY-03**: Streaming responses from Dify displayed in chat panel
- [x] **DIFY-04**: Dify API key stored server-side only, never exposed to client

### Brief Page UI

- [x] **BRIEF-01**: New page with two-panel layout (chat left, empty panel right)
- [x] **BRIEF-02**: Chat panel supports multi-turn conversation with Dify agent
- [x] **BRIEF-03**: Right panel shows empty/placeholder state during brief phase
- [x] **BRIEF-04**: "Start editing" button visible to transition to email editor

### Flow Navigation

- [x] **FLOW-01**: Brief page is the landing page (entry point of the app)
- [x] **FLOW-02**: Button transitions from brief page to email editor page
- [x] **FLOW-03**: Email editor page works exactly as current implementation

### Chat UI Upgrade

- [x] **CHAT-01**: Upgrade @assistant-ui/react to v0.12.x and replace custom brief chat panel (~676 LOC) with library primitives (Thread, Composer, MessagePrimitive)
- [x] **CHAT-02**: Test prompt chips rendered via ThreadPrimitive.Suggestion instead of custom implementation
- [x] **CHAT-03**: Brief chat wired through assistant-ui runtime with existing Dify ChatModelAdapter

### Settings Panel

- [ ] **SETTINGS-01**: Settings page accessible from main navigation with agent configuration form (label, API key, base URL, conversation mode)
- [x] **SETTINGS-02**: CRUD operations for registered agents (create, list, edit, delete)
- [x] **SETTINGS-03**: Test prompts management — create, list, edit, delete reusable prompts that appear as quick-start chips in chat
- [x] **SETTINGS-04**: Active agent selection — choose which registered agent powers the brief chat

### Conversation Persistence

- [x] **PERSIST-01**: File-based SQLite database stores conversations with messages, timestamps, and agent config reference
- [ ] **PERSIST-02**: Conversation list sidebar showing past conversations with preview text
- [ ] **PERSIST-03**: User can resume a past conversation (loads messages + restores agent config context)
- [x] **PERSIST-04**: Each conversation tagged with the agent configuration used at creation time
- [x] **PERSIST-05**: Database works on Railway deployment (SQLite with persistent volume or data directory)

## v2 Requirements

### Brief Rendering

- **RENDER-01**: Brief data parsed and displayed as structured card in right panel
- **RENDER-02**: Brief updates live as conversation progresses

### Brief-to-Editor Integration

- **INTEG-01**: Brief data passed as context to email editor AI
- **INTEG-02**: Email auto-generated from brief as starting point

## Out of Scope

| Feature | Reason |
|---------|--------|
| Live brief rendering | Deferred to v2, simplify first iteration |
| Brief -> editor context injection | Simulation only, no functional link needed |
| Email generation from brief | Not in current scope |
| Dify agent builder/config | Agent is pre-built externally |
| Authentication | Not needed for this prototype |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DIFY-01 | Phase 1 | Complete |
| DIFY-02 | Phase 1 | Complete |
| DIFY-03 | Phase 1 | Complete |
| DIFY-04 | Phase 1 | Complete |
| BRIEF-01 | Phase 2 | Complete |
| BRIEF-02 | Phase 2 | Complete |
| BRIEF-03 | Phase 2 | Complete |
| BRIEF-04 | Phase 2 | Complete |
| FLOW-01 | Phase 3 | Complete |
| FLOW-02 | Phase 3 | Complete |
| FLOW-03 | Phase 3 | Complete |

| CHAT-01 | Phase 4 | Complete |
| CHAT-02 | Phase 4 | Complete |
| CHAT-03 | Phase 4 | Complete |
| SETTINGS-01 | Phase 4 | Pending |
| SETTINGS-02 | Phase 4 | Complete |
| SETTINGS-03 | Phase 4 | Complete |
| SETTINGS-04 | Phase 4 | Complete |
| PERSIST-01 | Phase 4 | Complete |
| PERSIST-02 | Phase 4 | Pending |
| PERSIST-03 | Phase 4 | Pending |
| PERSIST-04 | Phase 4 | Complete |
| PERSIST-05 | Phase 4 | Complete |

**Coverage:**
- v1 requirements: 23 total
- Mapped to phases: 23
- Unmapped: 0

---
*Requirements defined: 2026-03-25*
*Last updated: 2026-03-25 after initial definition*
