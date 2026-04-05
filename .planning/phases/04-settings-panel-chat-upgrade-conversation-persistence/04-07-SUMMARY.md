---
phase: 04-settings-panel-chat-upgrade-conversation-persistence
plan: 07
subsystem: ui
tags: [assistant-ui, react-context, badge, thread-list, drawer]

# Dependency graph
requires:
  - phase: 04-06
    provides: ThreadListDrawer component, GET /api/threads endpoint with preview field
provides:
  - ThreadMetadataContext and useThreadMetadata hook for passing thread metadata to drawer
  - agent_label field in GET /api/threads response
  - Empty state in ThreadListDrawer when no conversations exist
  - Preview text and agent badge on each conversation list item
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "React context for passing API metadata to deeply nested assistant-ui primitives"

key-files:
  created: []
  modified:
    - app/api/threads/route.ts
    - components/assistant-ui/brief-runtime-provider.tsx
    - components/assistant-ui/thread-list-drawer.tsx

key-decisions:
  - "Used React context (ThreadMetadataContext) to pass metadata to ThreadListItem since ThreadListItemPrimitive does not support custom props"
  - "Used metadata map length check for empty state since ThreadListPrimitive.Empty is not available in assistant-ui v0.12"
  - "Used useAuiState with any cast for remoteId access inside ThreadListItem context"

patterns-established:
  - "ThreadMetadataContext pattern: API response metadata stored in context by BriefRuntimeProvider, consumed by drawer components"

requirements-completed: [PERSIST-02]

# Metrics
duration: 2min
completed: 2026-04-05
---

# Phase 04 Plan 07: Thread List Drawer Gap Closure Summary

**Empty state, preview text, and agent label badges added to ThreadListDrawer via React context metadata pattern**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-05T19:57:21Z
- **Completed:** 2026-04-05T19:59:48Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- GET /api/threads now returns agent_label extracted from agentConfigSnapshot JSON
- ThreadMetadataContext provides preview and agentLabel metadata keyed by remoteId to drawer components
- ThreadListDrawer shows "No conversations yet" with MessageSquare icon when list is empty
- Each conversation item displays truncated preview text and a secondary Badge with agent label

## Task Commits

Each task was committed atomically:

1. **Task 1: Surface agent_label in threads API and expose thread metadata via React context** - `c7a02f7` (feat)
2. **Task 2: Add empty state, preview text, and agent badge to ThreadListDrawer** - `cbc2114` (feat)

## Files Created/Modified
- `app/api/threads/route.ts` - Added agent_label extraction from agentConfigSnapshot in GET handler
- `components/assistant-ui/brief-runtime-provider.tsx` - Added ThreadMetadataContext, useThreadMetadata hook, metadata state, context provider wrapper
- `components/assistant-ui/thread-list-drawer.tsx` - Added empty state component, preview text, agent Badge, metadata consumption

## Decisions Made
- Used React context (ThreadMetadataContext) to pass thread metadata from BriefRuntimeProvider to ThreadListItem, since ThreadListItemPrimitive does not support custom metadata props
- Used `Object.keys(metadata).length === 0` for empty state detection since `ThreadListPrimitive.Empty` is not exported in assistant-ui v0.12
- Used `useAuiState` with `any` type cast for accessing `threadListItem.remoteId` inside item render context (matches existing pattern in codebase)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] ThreadListPrimitive.Empty not available**
- **Found during:** Task 2
- **Issue:** `ThreadListPrimitive.Empty` is not exported in assistant-ui v0.12 (plan anticipated this fallback)
- **Fix:** Used conditional render based on metadata map length as the plan's documented fallback approach
- **Files modified:** components/assistant-ui/thread-list-drawer.tsx
- **Verification:** TypeScript compiles, empty state renders conditionally
- **Committed in:** cbc2114 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Plan explicitly documented this fallback. No scope creep.

## Issues Encountered
- Pre-existing TypeScript errors in brief-runtime-provider.tsx (readonly type mismatch in useExternalStoreRuntime) -- not introduced by this plan, not in scope to fix

## Known Stubs
None -- all data paths are wired end-to-end.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 7 plans in Phase 04 are now complete
- ThreadListDrawer fully features empty state, preview text, and agent badges
- PERSIST-02 requirement satisfied

---
*Phase: 04-settings-panel-chat-upgrade-conversation-persistence*
*Completed: 2026-04-05*
