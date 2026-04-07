---
phase: 13-suggested-answer-parsing
plan: 01
subsystem: api
tags: [parsing, streaming, sse, dify, assistant-ui]

# Dependency graph
requires: []
provides:
  - "Pure parseSuggestedAnswer function with SuggestedAction/ParseResult types"
  - "Streaming adapter strips <suggested_answer> blocks from display text"
  - "Final yield includes suggestedActions in metadata.custom"
affects: [14-suggested-answer-ui]

# Tech tracking
tech-stack:
  added: []
  patterns: ["<suggested_answer> block parsing mirroring existing <Brief> extraction pattern"]

key-files:
  created:
    - lib/dify/parse-suggested-answer.ts
    - __tests__/parse-suggested-answer.test.ts
  modified:
    - components/assistant-ui/brief-runtime-provider.tsx

key-decisions:
  - "Parser follows exact same regex pattern as existing <Brief> extraction"
  - "Partial tag stripping during streaming prevents UI leakage"
  - "Actions stored in metadata.custom.suggestedActions for Phase 14 consumption"

patterns-established:
  - "Suggested answer parsing: regex extract + JSON.parse + type guard filter"
  - "Streaming safety: strip trailing partial open tags before yield"

requirements-completed: [PARSE-01, PARSE-02, PARSE-03]

# Metrics
duration: 2min
completed: 2026-04-07
---

# Phase 13 Plan 01: Suggested Answer Parsing Summary

**Pure parser extracts <suggested_answer> JSON blocks from Dify messages, integrated into streaming adapter with partial-tag safety**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-07T19:17:33Z
- **Completed:** 2026-04-07T19:19:11Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Pure `parseSuggestedAnswer` function with 9 unit tests covering extraction, stripping, malformed JSON, empty input, and invalid action filtering
- Streaming adapter integration strips `<suggested_answer>` blocks from all yield points (agent_thought, agent_message, final)
- Final yield attaches parsed actions as `metadata.custom.suggestedActions` for Phase 14 to render as clickable chips

## Task Commits

Each task was committed atomically:

1. **Task 1: Create parseSuggestedAnswer function with TDD** - `2ff6bad` (feat)
2. **Task 2: Integrate parser into streaming adapter** - `8711fc5` (feat)

## Files Created/Modified
- `lib/dify/parse-suggested-answer.ts` - Pure parser function with SuggestedAction/ParseResult types
- `__tests__/parse-suggested-answer.test.ts` - 9 unit tests covering all edge cases
- `components/assistant-ui/brief-runtime-provider.tsx` - Adapter integration at 3 yield points + import

## Decisions Made
- Followed plan exactly: regex pattern mirrors existing `<Brief>` extraction approach
- Partial tag stripping uses `/<suggested_answer[^>]*$/` regex to prevent streaming leakage
- Actions only attached on final yield (not intermediate) to avoid premature rendering

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Known Stubs
None - all functionality is fully wired.

## Next Phase Readiness
- `suggestedActions` available in `metadata.custom` on final assistant message yield
- Phase 14 can import `SuggestedAction` type from `lib/dify/parse-suggested-answer.ts`
- Parser is pure and reusable for saved message rehydration in Phase 14

---
*Phase: 13-suggested-answer-parsing*
*Completed: 2026-04-07*
