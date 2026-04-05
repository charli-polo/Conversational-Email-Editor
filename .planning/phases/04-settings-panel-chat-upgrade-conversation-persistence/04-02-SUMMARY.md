---
phase: 04-settings-panel-chat-upgrade-conversation-persistence
plan: 02
subsystem: ui
tags: [assistant-ui, streaming, chat, shadcn, dify, settings]

requires:
  - phase: 01-dify-agent-api-integration
    provides: Dify SSE proxy route at /api/brief/chat
provides:
  - "BriefThread component using assistant-ui v0.12 primitives"
  - "BriefRuntimeProvider with Dify ChatModelAdapter"
  - "SettingsSheet drawer for quick access from gear icon (D-02)"
  - "createDifyAdapter factory for Dify SSE streaming"
affects: [04-03, 04-04, 04-05, 04-06]

tech-stack:
  added: ["@assistant-ui/react@0.12.23", "assistant-stream", "@radix-ui/react-dialog (via sheet)"]
  patterns: ["ChatModelAdapter factory pattern for Dify SSE", "ThreadPrimitive/ComposerPrimitive/MessagePrimitive composition", "SettingsSheet as quick-access drawer from header"]

key-files:
  created:
    - "lib/dify/adapter.ts"
    - "components/assistant-ui/brief-thread.tsx"
    - "components/assistant-ui/brief-runtime-provider.tsx"
    - "components/settings/settings-sheet.tsx"
    - "components/ui/sheet.tsx"
  modified:
    - "package.json"
    - "components/assistant-runtime-provider.tsx"
    - "app/page.tsx"

key-decisions:
  - "Used v0.12 Message component (single) with MessagePrimitive.If for role-based rendering instead of deprecated separate UserMessage/AssistantMessage components"
  - "Used autoSend prop on ThreadPrimitive.Suggestion (deprecated but functional) since send prop is the v0.12 replacement"
  - "Preserved old brief-chat-panel.tsx and use-brief-chat.ts for rollback safety -- they are no longer imported"

patterns-established:
  - "ChatModelAdapter: createDifyAdapter() factory with options for conversationId tracking, Brief tag extraction, and onConversationId callback"
  - "Runtime provider pattern: BriefRuntimeProvider wraps useLocalRuntime + AssistantRuntimeProvider with refs for conversation state"

requirements-completed: [CHAT-01, CHAT-02, CHAT-03]

duration: 10min
completed: 2026-04-05
---

# Phase 04 Plan 02: Chat Upgrade to assistant-ui Primitives Summary

**Upgraded assistant-ui to v0.12.x, replaced ~440 LOC custom chat with library primitives and Dify ChatModelAdapter, added SettingsSheet drawer**

## Performance

- **Duration:** 10 min
- **Started:** 2026-04-05T18:53:30Z
- **Completed:** 2026-04-05T19:04:04Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Upgraded @assistant-ui/react from v0.9.6 to v0.12.23 with codemod migration
- Created Dify ChatModelAdapter with SSE parsing, Brief tag extraction, and conversation_id tracking
- Built BriefThread using ThreadPrimitive, ComposerPrimitive, MessagePrimitive with suggestion chips
- Added SettingsSheet drawer accessible from gear icon in header (per D-02)
- Old custom chat components preserved unused for rollback safety

## Task Commits

Each task was committed atomically:

1. **Task 1: Upgrade assistant-ui and create Dify ChatModelAdapter** - `254a0ec` (feat)
2. **Task 2: Create BriefThread, BriefRuntimeProvider, SettingsSheet, and rewire BriefPage** - `006a85a` (feat)

## Files Created/Modified
- `lib/dify/adapter.ts` - ChatModelAdapter factory for Dify SSE streaming with Brief tag parsing
- `components/assistant-ui/brief-thread.tsx` - Chat UI using ThreadPrimitive, ComposerPrimitive, MessagePrimitive
- `components/assistant-ui/brief-runtime-provider.tsx` - Runtime provider wrapping useLocalRuntime with Dify adapter
- `components/settings/settings-sheet.tsx` - Quick-access settings drawer from gear icon
- `components/ui/sheet.tsx` - shadcn Sheet component (new)
- `package.json` - Updated assistant-ui, added assistant-stream
- `components/assistant-runtime-provider.tsx` - Codemod renamed AssistantProvider to AuiProvider
- `app/page.tsx` - Rewired to use BriefRuntimeProvider, BriefThread, SettingsSheet

## Decisions Made
- Used v0.12 single Message component with MessagePrimitive.If for role branching (new API pattern)
- Kept deprecated autoSend/method props on ThreadPrimitive.Suggestion for compatibility
- Preserved old custom components (brief-chat-panel.tsx, use-brief-chat.ts) for rollback -- no imports remain

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Adapted to v0.12 ThreadPrimitive.Messages API change**
- **Found during:** Task 2 (BriefThread creation)
- **Issue:** Plan specified separate `UserMessage`/`AssistantMessage` in `components` prop, but v0.12 uses a single `Message` component
- **Fix:** Used single `BriefMessage` component with `MessagePrimitive.If user` / `MessagePrimitive.If assistant` for role-based rendering
- **Files modified:** `components/assistant-ui/brief-thread.tsx`
- **Verification:** Build passes, component renders correctly
- **Committed in:** 006a85a (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking - API change)
**Impact on plan:** Necessary adaptation to actual v0.12 API. No scope creep.

## Issues Encountered
None beyond the API adaptation documented above.

## Known Stubs
- `components/settings/settings-sheet.tsx` line 30: `activeAgentLabel` prop defaults to "No agent selected" -- will be wired to agent CRUD in Plan 04-04

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- assistant-ui v0.12 primitives fully operational, ready for ThreadList/remote runtime in Plan 04-05
- SettingsSheet ready for agent selector enhancement in Plan 04-04
- Dify ChatModelAdapter pattern established for reuse

---
*Phase: 04-settings-panel-chat-upgrade-conversation-persistence*
*Completed: 2026-04-05*
