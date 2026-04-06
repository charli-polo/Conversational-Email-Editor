---
phase: 06-chat-ui-rewrite
plan: 02
subsystem: ui
tags: [assistant-ui, dify, save-on-demand, toast, auto-persist, conversation-resume]

requires:
  - phase: 06-chat-ui-rewrite/01
    provides: BriefRuntimeProvider with useLocalRuntime, ConversationIdContext
provides:
  - Save button with Dify auto-generated title, toast confirmation, URL update, saved state
  - Auto-persist mechanism via savedThreadIdRef passed through chat adapter
  - New conversation button resetting all state
  - Dify conversation rename proxy API route
  - Saved conversation resume with loading spinner and auto-persist initialization
affects: [06-chat-ui-rewrite/03, 06-chat-ui-rewrite/04]

tech-stack:
  added: []
  patterns: [SavedThreadIdContext for cross-component auto-persist signaling, inline toast with auto-dismiss]

key-files:
  created:
    - app/api/brief/conversations/[id]/name/route.ts
  modified:
    - components/assistant-ui/save-conversation-button.tsx
    - components/assistant-ui/brief-runtime-provider.tsx
    - components/assistant-ui/saved-thread-loader.tsx
    - app/c/[id]/page.tsx

key-decisions:
  - "Inline toast implementation using absolute positioning with auto-dismiss via setTimeout (3s), avoiding external toast library"
  - "SavedThreadIdContext added to BriefRuntimeProvider and wired to chat adapter for auto-persist after initial save"
  - "ConversationPageInner pattern to use context hooks inside BriefRuntimeProvider"

patterns-established:
  - "Save flow: create thread -> save messages -> Dify rename -> PATCH title -> set savedThreadIdRef -> replaceState URL"
  - "Auto-persist: savedThreadIdRef.current passed as threadId in chat API fetch body"

requirements-completed: [UX-03]

duration: 4min
completed: 2026-04-06
---

# Phase 06 Plan 02: Save-on-Demand Persistence Flow Summary

**Save button with Dify auto-generated titles, toast confirmation, 3-state tracking, auto-persist after save, New conversation reset, and resume page with loading spinner**

## Performance

- **Duration:** 4 min
- **Started:** 2026-04-06T18:36:17Z
- **Completed:** 2026-04-06T18:40:17Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Save button rewrites conversation persistence: creates DB thread, saves messages, calls Dify rename API for auto-generated title, updates URL via replaceState, shows toast, transitions to Saved state
- Auto-persist mechanism: once saved, savedThreadIdRef flows threadId to chat adapter which includes it in API requests for automatic message persistence
- New conversation button resets all refs and navigates to / with full reload
- Resume page (/c/{id}) sets savedThreadIdRef and conversationIdRef on mount, shows loading spinner during message import, then renders BriefThread

## Task Commits

Each task was committed atomically:

1. **Task 1: Rewrite save button with Dify rename, toast, auto-persist, and New conversation** - `e0c0045` (feat)
2. **Task 2: Improve saved conversation resume page with loading state and proper initialization** - `1168fa6` (feat)

## Files Created/Modified
- `app/api/brief/conversations/[id]/name/route.ts` - Dify conversation rename proxy (auto_generate: true)
- `components/assistant-ui/save-conversation-button.tsx` - 3-state save button, Dify rename, toast, New button
- `components/assistant-ui/brief-runtime-provider.tsx` - SavedThreadIdContext provider, threadId in adapter fetch
- `components/assistant-ui/saved-thread-loader.tsx` - onLoadingChange/onError callbacks for loading state
- `app/c/[id]/page.tsx` - Loading spinner, savedThreadIdRef/conversationIdRef init, SaveConversationButton in header

## Decisions Made
- Used inline toast (absolute positioned div with auto-dismiss) rather than pulling in a toast library -- keeps bundle light and matches project's no-new-deps approach
- Created ConversationPageInner component to use useSavedThreadId/useConversationId hooks inside BriefRuntimeProvider (hooks require context ancestor)
- Dify rename API proxy created at /api/brief/conversations/[id]/name to keep Dify API key server-side only

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Created Dify conversation rename API route**
- **Found during:** Task 1
- **Issue:** Plan references POST /api/brief/conversations/{id}/name but the route did not exist
- **Fix:** Created app/api/brief/conversations/[id]/name/route.ts as a proxy to Dify's conversation rename endpoint
- **Files modified:** app/api/brief/conversations/[id]/name/route.ts
- **Verification:** TypeScript compilation passes, route follows existing API route patterns
- **Committed in:** e0c0045 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Route creation was expected by plan (listed in interfaces) but needed to be created as part of this plan since Plan 01 did not create it. No scope creep.

## Issues Encountered
- Brief-runtime-provider.tsx was simultaneously modified by a parallel agent (Plan 01) during execution. Changes were compatible -- the other agent modified attachment extraction pattern while this plan modified the adapter signature and provider contexts. No conflicts.

## User Setup Required
None - no external service configuration required.

## Known Stubs
None - all data flows are wired end-to-end.

## Next Phase Readiness
- Save flow complete: ready for Plan 03 (thread list drawer improvements) and Plan 04 (testing)
- Auto-persist mechanism in place for seamless conversation continuation after initial save

## Self-Check: PASSED

All files verified present, all commit hashes found in git log.

---
*Phase: 06-chat-ui-rewrite*
*Completed: 2026-04-06*
