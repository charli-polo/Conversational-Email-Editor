---
phase: 05-dify-chat-ux-enhancements
plan: 03
subsystem: ui
tags: [assistant-ui, action-toolbar, reasoning, suggestions, feedback, streaming]

requires:
  - phase: 05-02
    provides: "SSE streaming with agent_thought forwarding, reasoning content parts, isStreamingReasoning metadata, feedback/attachment/dictation adapters"
provides:
  - "AssistantActionToolbar with hybrid visibility (feedback always, copy/export hover, regenerate last)"
  - "UserActionToolbar with copy on hover"
  - "StreamingReasoningIndicator with 3-dot pulse, timer, tool badges (D-14/D-16)"
  - "ReasoningSection with collapsible toggle and tool badges (D-17)"
  - "OpenerSuggestions with clickable chips below opener message (D-06)"
  - "BriefMessage fully wired with all message UI components"
affects: [05-04, 05-05]

tech-stack:
  added: []
  patterns:
    - "useAuiState for message metadata access inside MessagePrimitive.Root"
    - "Hybrid ActionBarPrimitive.Root visibility: no-autohide for always-visible, autohide=always for hover, autohide=not-last for last-only"
    - "Separate streaming vs post-response reasoning display based on isStreamingReasoning metadata flag"

key-files:
  created:
    - components/assistant-ui/action-toolbar.tsx
    - components/assistant-ui/reasoning-section.tsx
    - components/assistant-ui/opener-suggestions.tsx
  modified:
    - components/assistant-ui/brief-thread.tsx

key-decisions:
  - "Used useAuiState from @assistant-ui/store (v0.12 API) instead of deprecated useMessage for accessing message state"
  - "Three separate ActionBarPrimitive.Root instances for different visibility behaviors (feedback, copy/export, regenerate)"
  - "StreamingReasoningIndicator and ReasoningSection as distinct components for streaming vs post-response states"

patterns-established:
  - "Hybrid toolbar visibility: separate ActionBarPrimitive.Root per visibility tier"
  - "group class on message container + opacity-0 group-hover:opacity-100 for hover-reveal actions"

requirements-completed: [UX-01, UX-07]

duration: 4min
completed: 2026-04-05
---

# Phase 5 Plan 3: Message Action Toolbar, Reasoning Display & Opener Suggestions Summary

**Hybrid-visibility action toolbar with feedback/copy/regenerate, streaming reasoning dots+timer, collapsible post-response reasoning toggle, and opener suggestion chips wired into BriefMessage**

## Performance

- **Duration:** 4 min
- **Started:** 2026-04-05T22:02:15Z
- **Completed:** 2026-04-05T22:06:26Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Created action toolbar with three-tier visibility: feedback always visible, copy/export on hover, regenerate on last message only
- Built StreamingReasoningIndicator (D-14/D-16) with animated 3-dot pulse, elapsed timer, tool badges, and expandable detail view
- Built collapsible ReasoningSection (D-17) for post-response reasoning with tool badge summary
- Wired all components plus MessageAttachmentDisplay and OpenerSuggestions into BriefMessage via AssistantMessageContent sub-component

## Task Commits

Each task was committed atomically:

1. **Task 1: Create action toolbar, reasoning section, and opener suggestions components** - `307b7e1` (feat)
2. **Task 2: Wire toolbar, streaming reasoning, post-response reasoning, opener suggestions, and MessageAttachmentDisplay into BriefMessage** - `74f2a5d` (feat)

## Files Created/Modified
- `components/assistant-ui/action-toolbar.tsx` - AssistantActionToolbar (3 ActionBarPrimitive.Root instances) and UserActionToolbar with tooltips
- `components/assistant-ui/reasoning-section.tsx` - StreamingReasoningIndicator (dots+timer+badges) and ReasoningSection (collapsible toggle)
- `components/assistant-ui/opener-suggestions.tsx` - OpenerSuggestions using ThreadPrimitive.Suggestion with autoSend
- `components/assistant-ui/brief-thread.tsx` - AssistantMessageContent sub-component with useAuiState, all components wired, TooltipProvider wrapper

## Decisions Made
- Used `useAuiState((s) => s.message)` from `@assistant-ui/store` instead of deprecated `useMessage` hook -- the v0.12 recommended approach
- Used three separate `ActionBarPrimitive.Root` instances with different `autohide` settings to achieve hybrid visibility (no autohide for feedback, `always` for copy/export, `not-last` for regenerate)
- StreamingReasoningIndicator and ReasoningSection are distinct components rather than a single component with mode toggle -- cleaner separation of streaming vs post-response states
- Each `TooltipProvider` wrapped individually in `ActionButton` helper within the toolbar, plus outer `TooltipProvider` on `BriefThread`

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None - all components are fully functional with real data from runtime metadata.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All message UI components wired and ready for visual verification
- Plan 04 (file upload composer, drag-drop, STT) can proceed independently
- Plan 05 (visual polish, final integration) has all message-level components available

## Self-Check: PASSED

- All 4 files verified present on disk
- Commit 307b7e1 verified in git log
- Commit 74f2a5d verified in git log
- TypeScript compilation passes with no errors

---
*Phase: 05-dify-chat-ux-enhancements*
*Completed: 2026-04-05*
