---
phase: 04-settings-panel-chat-upgrade-conversation-persistence
plan: 05
subsystem: api
tags: [sqlite, drizzle, threads, conversations, sse, persistence]

requires:
  - phase: 04-01
    provides: SQLite database with conversations and messages tables
provides:
  - Thread CRUD API (create, list, fetch, rename, archive, unarchive, delete)
  - Messages save/load API
  - Brief chat message persistence with dify_conversation_id tracking
affects: [04-06-thread-list-ui]

tech-stack:
  added: []
  patterns: [thread-linked agent config lookup, stale conversation_id fallback, post-stream persistence in finally block]

key-files:
  created:
    - app/api/threads/route.ts
    - app/api/threads/[id]/route.ts
    - app/api/threads/[id]/archive/route.ts
    - app/api/threads/[id]/unarchive/route.ts
    - app/api/threads/[id]/messages/route.ts
  modified:
    - app/api/brief/chat/route.ts

key-decisions:
  - "Agent API key REDACTED in config snapshot stored on thread - real key looked up via agentId reference at runtime"
  - "Stale Dify conversation_id fallback: retry without ID on error, clear stored ID, let new ID be captured"
  - "Message persistence in ReadableStream finally block - non-blocking to SSE delivery"

patterns-established:
  - "Thread-linked agent: threads store agentId reference, chat route resolves actual config at runtime"
  - "Post-stream persistence: accumulate content during SSE, persist in finally block"

requirements-completed: [PERSIST-01, PERSIST-04]

duration: 2min
completed: 2026-04-05
---

# Phase 04 Plan 05: Thread Persistence API Summary

**Thread CRUD + message save/load API routes with brief chat persistence and Dify conversation_id tracking**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-05T19:05:59Z
- **Completed:** 2026-04-05T19:08:24Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Complete thread lifecycle API: create (with agent snapshot), list (ordered by recency with preview), fetch, rename, archive, unarchive, delete (cascade)
- Messages API for saving and loading conversation messages
- Brief chat route wired to persist user + assistant messages after SSE streaming
- Dify conversation_id stored on thread for multi-turn resumption
- Stale conversation_id fallback: retries without ID when Dify rejects expired sessions

## Task Commits

Each task was committed atomically:

1. **Task 1: Create thread CRUD and archive API routes** - `32daefd` (feat)
2. **Task 2: Create messages API and wire persistence into brief chat route** - `53b20db` (feat)

## Files Created/Modified
- `app/api/threads/route.ts` - GET (list with preview) and POST (create with agent snapshot)
- `app/api/threads/[id]/route.ts` - GET (fetch), PATCH (rename/update difyConversationId), DELETE (cascade)
- `app/api/threads/[id]/archive/route.ts` - POST to archive thread
- `app/api/threads/[id]/unarchive/route.ts` - POST to unarchive thread
- `app/api/threads/[id]/messages/route.ts` - GET (load messages) and POST (save message array)
- `app/api/brief/chat/route.ts` - Added threadId support, content accumulation, post-stream persistence, stale conversation_id fallback

## Decisions Made
- Agent API key is REDACTED in the agentConfigSnapshot stored on the thread. The real key is resolved at runtime via the agentId foreign key reference. This prevents key leakage in snapshots.
- Stale Dify conversation_id fallback: when Dify rejects a stored conversation_id, the route retries without it, clears the stored ID, and captures the new one from the retry response.
- Message persistence runs in the ReadableStream's finally block, after the stream has been fully delivered to the client. This ensures streaming is never blocked by DB writes.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Known Stubs
None - all endpoints are fully wired to the database.

## Next Phase Readiness
- Thread API layer complete, ready for ThreadList UI consumption in Plan 06
- All endpoints match the contract expected by assistant-ui RemoteThreadListAdapter

---
*Phase: 04-settings-panel-chat-upgrade-conversation-persistence*
*Completed: 2026-04-05*
