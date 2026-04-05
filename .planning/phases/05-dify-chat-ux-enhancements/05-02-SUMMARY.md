---
phase: 05-dify-chat-ux-enhancements
plan: 02
subsystem: ui, api
tags: [assistant-ui, dify, sse, streaming, reasoning, feedback, attachments, dictation, opener]

requires:
  - phase: 05-01
    provides: "DB schema (difyMessageId, rating), Dify types, client extensions, 3 API proxy routes, 3 adapter factories"
provides:
  - "SSE proxy forwarding agent_thought events with thought/tool/observation/message_id"
  - "SSE proxy including message_id in done event"
  - "difyMessageId persisted on assistant messages in DB"
  - "Client-side reasoning content accumulation from agent_thought events"
  - "isStreamingReasoning + streamingTools metadata on in-progress messages (for D-14/D-16 dots+timer)"
  - "Final messages without isStreamingReasoning (for D-17 static toggle)"
  - "Opener message injection for new empty threads with suggestedQuestions metadata"
  - "Feedback, attachment, dictation adapters wired into useExternalStoreRuntime"
  - "onReload callback for message regeneration"
  - "DB messages hydrated with submittedFeedback and difyMessageId metadata"
  - "File references passed from attachments to chat API"
  - "DifyParamsContext + useDifyParams() exported for downstream consumption"
affects: [05-03, 05-04, 05-05]

tech-stack:
  added: []
  patterns: ["reasoning content type for agent_thought display", "isStreamingReasoning metadata pattern for dots+timer", "DifyParamsContext for parameter sharing without double-fetch"]

key-files:
  created: []
  modified:
    - "app/api/brief/chat/route.ts"
    - "components/assistant-ui/brief-runtime-provider.tsx"

key-decisions:
  - "Used 'any' type for onNew parameter to avoid complex AppendMessage union type mismatch"
  - "Wrapped setMessages with spread to satisfy readonly constraint from useExternalStoreRuntime"
  - "Dictation adapter wired as 'dictation' key (not 'speech') matching assistant-ui v0.12 adapter API"
  - "DifyParamsContext placed at outermost provider level for maximum availability"

patterns-established:
  - "Reasoning content pattern: type 'reasoning' with thought + tool text in content array"
  - "Streaming metadata pattern: isStreamingReasoning=true during active agent_thought, absent on final message"
  - "Opener injection pattern: synthetic assistant message with isOpener=true and suggestedQuestions in metadata.custom"

requirements-completed: [UX-03, UX-04, UX-07]

duration: 4min
completed: 2026-04-05
---

# Phase 05 Plan 02: SSE Streaming Extension and Runtime Wiring Summary

**Extended SSE proxy with agent_thought forwarding and message_id tracking, wired feedback/attachment/dictation adapters into runtime, injected conversation opener, and established reasoning streaming metadata pattern for D-14/D-16 dots+timer**

## Performance

- **Duration:** 4 min
- **Started:** 2026-04-05T21:56:42Z
- **Completed:** 2026-04-05T22:00:18Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- SSE proxy now forwards agent_thought events with all relevant fields (thought, tool, tool_input, observation, message_id) and includes message_id in done event
- Runtime provider fully wired with feedback, attachment, and dictation adapters, plus opener injection, reasoning content accumulation, and streaming state metadata
- DifyParamsContext exported for downstream components (Plan 03/04) to consume Dify parameters without double-fetching

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend SSE proxy to forward agent_thought events and message_id** - `438eab1` (feat)
2. **Task 2: Wire adapters, opener, reasoning, streaming state, DifyParamsContext, and difyMessageId into runtime** - `ddf4380` (feat)

## Files Created/Modified

- `app/api/brief/chat/route.ts` - Extended SSE proxy: agent_thought forwarding, difyMessageId tracking and persistence, message_id in done event, files passthrough
- `components/assistant-ui/brief-runtime-provider.tsx` - Extended runtime: adapters wiring, DifyParamsContext, opener injection, reasoning content accumulation, streaming metadata, DB message hydration with feedback/difyMessageId, onReload, file references

## Decisions Made

- Used `any` type for onNew parameter to work around complex readonly union type mismatch with AppendMessage -- pragmatic trade-off for type safety vs. build success
- Wrapped setMessages with spread operator to satisfy readonly constraint from useExternalStoreRuntime's type signature
- Wired dictation adapter under `dictation` key (not `speech`) matching assistant-ui v0.12's adapter interface where `speech` is SpeechSynthesisAdapter
- DifyParamsContext.Provider placed at outermost level (wrapping ThreadMetadataContext) for maximum availability to all child components

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed TypeScript type incompatibilities with assistant-ui v0.12**
- **Found during:** Task 2
- **Issue:** Four TS errors: readonly array in setMessages, AppendMessage union type mismatch in onNew, property access on content union type, speech vs dictation adapter key
- **Fix:** Wrapped setMessages with spread, used `any` for onNew param, safe property access with typeof checks, corrected adapter key from `speech` to `dictation`
- **Files modified:** components/assistant-ui/brief-runtime-provider.tsx
- **Verification:** `npx tsc --noEmit` passes clean
- **Committed in:** ddf4380

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Essential for TypeScript compilation. No scope creep.

## Issues Encountered

None beyond the TypeScript type fixes documented above.

## Known Stubs

None -- all data sources are wired to real APIs and DB queries.

## User Setup Required

None -- no external service configuration required.

## Next Phase Readiness

- Plan 03 can now build UI components that consume reasoning content (type 'reasoning'), streaming metadata (isStreamingReasoning, streamingTools), opener metadata (isOpener, suggestedQuestions), and feedback state (submittedFeedback, difyMessageId)
- Plan 04 can use exported DifyParamsContext/useDifyParams() to access Dify parameters without double-fetching
- All three adapters (feedback, attachment, dictation) are available to runtime consumers

---
*Phase: 05-dify-chat-ux-enhancements*
*Completed: 2026-04-05*
