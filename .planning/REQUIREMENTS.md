# Requirements: Conversational Email Editor — Brief Flow

**Defined:** 2026-03-25
**Core Value:** Two-step AI conversational flow — brief then edit

## v1 Requirements

### Dify Agent Integration

- [ ] **DIFY-01**: Next.js API route proxies chat messages to Dify `/chat-messages` endpoint
- [ ] **DIFY-02**: Conversation state maintained via Dify `conversation_id` across messages
- [ ] **DIFY-03**: Streaming responses from Dify displayed in chat panel
- [x] **DIFY-04**: Dify API key stored server-side only, never exposed to client

### Brief Page UI

- [ ] **BRIEF-01**: New page with two-panel layout (chat left, empty panel right)
- [ ] **BRIEF-02**: Chat panel supports multi-turn conversation with Dify agent
- [ ] **BRIEF-03**: Right panel shows empty/placeholder state during brief phase
- [ ] **BRIEF-04**: "Start editing" button visible to transition to email editor

### Flow Navigation

- [ ] **FLOW-01**: Brief page is the landing page (entry point of the app)
- [ ] **FLOW-02**: Button transitions from brief page to email editor page
- [ ] **FLOW-03**: Email editor page works exactly as current implementation

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
| DIFY-01 | Phase 1 | Pending |
| DIFY-02 | Phase 1 | Pending |
| DIFY-03 | Phase 1 | Pending |
| DIFY-04 | Phase 1 | Complete |
| BRIEF-01 | Phase 2 | Pending |
| BRIEF-02 | Phase 2 | Pending |
| BRIEF-03 | Phase 2 | Pending |
| BRIEF-04 | Phase 2 | Pending |
| FLOW-01 | Phase 3 | Pending |
| FLOW-02 | Phase 3 | Pending |
| FLOW-03 | Phase 3 | Pending |

**Coverage:**
- v1 requirements: 11 total
- Mapped to phases: 11
- Unmapped: 0

---
*Requirements defined: 2026-03-25*
*Last updated: 2026-03-25 after initial definition*
