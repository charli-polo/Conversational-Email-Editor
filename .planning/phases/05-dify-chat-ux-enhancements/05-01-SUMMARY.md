---
phase: 05-dify-chat-ux-enhancements
plan: 01
subsystem: api, database
tags: [dify, feedback, file-upload, audio-to-text, drizzle, adapters, assistant-ui]

requires:
  - phase: 04-settings-panel-chat-upgrade-conversation-persistence
    provides: "SQLite schema with messages table, Dify client with AgentConfig, assistant-ui v0.12 runtime"
provides:
  - "Messages table with difyMessageId and rating columns for feedback persistence"
  - "Dify type definitions for agent_thought, feedback, file upload, audio, and chat files"
  - "Three new Dify client methods: submitFeedback, uploadFile, audioToText"
  - "sendChatMessage supports files array for attachment flow"
  - "Three API proxy routes: /api/brief/feedback, /api/brief/upload, /api/brief/audio"
  - "Extended /api/brief/parameters returning speech_to_text, file_upload, system_parameters"
  - "Three adapter factories: createDifyFeedbackAdapter, createDifyAttachmentAdapter, createDifyDictationAdapter"
affects: [05-02, 05-03, 05-04, 05-05]

tech-stack:
  added: []
  patterns: [adapter-bridge-pattern, dify-api-proxy-pattern]

key-files:
  created:
    - app/api/brief/feedback/route.ts
    - app/api/brief/upload/route.ts
    - app/api/brief/audio/route.ts
    - lib/dify/adapters.ts
    - drizzle/0001_misty_the_anarchist.sql
  modified:
    - lib/db/schema.ts
    - lib/dify/types.ts
    - lib/dify/client.ts
    - app/api/brief/parameters/route.ts

key-decisions:
  - "Feedback route persists locally even if Dify API call fails (graceful degradation)"
  - "Parameters route now resolves active agent config instead of using env vars only"
  - "DictationAdapter uses MediaRecorder with audio/webm for Dify STT endpoint"

patterns-established:
  - "Adapter bridge pattern: assistant-ui adapter interfaces delegating to Dify API proxy routes"
  - "Dify API proxy pattern: Next.js API routes proxy to Dify with agent config resolution from thread/active agent"

requirements-completed: [UX-02, UX-06, UX-08]

duration: 3min
completed: 2026-04-05
---

# Phase 5 Plan 01: Dify Backend Foundations Summary

**Extended DB schema, Dify client, and adapter layer with 3 API proxy routes for feedback, file upload, and audio-to-text**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-05T21:51:09Z
- **Completed:** 2026-04-05T21:54:18Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- Messages table extended with difyMessageId and rating columns (nullable, backward-compatible)
- Complete Dify type definitions covering agent_thought, feedback, file upload, audio, and chat file references
- Three new Dify client methods (submitFeedback, uploadFile, audioToText) following existing AgentConfig pattern
- sendChatMessage now passes files array to Dify when provided
- Three API proxy routes created for feedback, file upload, and audio-to-text
- Parameters route extended to return full Dify config (speech_to_text, file_upload, system_parameters) and resolves active agent config
- Three adapter factory functions bridging assistant-ui interfaces to Dify API routes

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend DB schema, Dify types, and client methods** - `2e92a84` (feat)
2. **Task 2: Create API proxy routes and adapters, extend parameters route** - `673a5ed` (feat)

## Files Created/Modified
- `lib/db/schema.ts` - Added difyMessageId and rating columns to messages table
- `lib/dify/types.ts` - Added DifyAgentThoughtEvent, DifyFeedbackRequest, DifyFileUploadResponse, DifyChatFile, DifyAudioToTextResponse types; updated DifySSEEvent union and DifyChatRequest
- `lib/dify/client.ts` - Added submitFeedback, uploadFile, audioToText methods; updated sendChatMessage to support files
- `lib/dify/adapters.ts` - New file with createDifyFeedbackAdapter, createDifyAttachmentAdapter, createDifyDictationAdapter
- `app/api/brief/feedback/route.ts` - POST endpoint proxying feedback to Dify + persisting rating in SQLite
- `app/api/brief/upload/route.ts` - POST endpoint proxying file upload to Dify
- `app/api/brief/audio/route.ts` - POST endpoint proxying audio-to-text to Dify
- `app/api/brief/parameters/route.ts` - Extended to return speech_to_text, file_upload, system_parameters
- `drizzle/0001_misty_the_anarchist.sql` - Migration for new columns

## Decisions Made
- Feedback route persists rating locally in SQLite even if Dify API call fails, ensuring graceful degradation
- Parameters route now resolves active agent config via getActiveAgentConfig() instead of relying solely on env vars
- DictationAdapter uses MediaRecorder API with audio/webm mime type for Dify's /audio-to-text endpoint

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Known Stubs

None - all implementations are complete and wired to Dify API endpoints.

## Next Phase Readiness
- All backend foundations ready for Phase 5 UI plans (05-02 through 05-05)
- Adapters are ready to be wired into useExternalStoreRuntime's adapters option
- API routes are ready to receive requests from the UI layer
- Pre-existing TypeScript errors in brief-runtime-provider.tsx are unrelated to this plan

---
*Phase: 05-dify-chat-ux-enhancements*
*Completed: 2026-04-05*
