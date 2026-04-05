---
phase: 04
plan: 06
status: complete
started: 2026-04-05T19:30:00Z
completed: 2026-04-05T20:15:00Z
---

# Plan 04-06 Summary: End-to-End Conversation Persistence

## What was built

Complete conversation persistence system wired end-to-end:

- **BriefRuntimeProvider** refactored from `useLocalRuntime` to `useExternalStoreRuntime` + `useRemoteThreadListRuntime` for full message persistence
- **Thread switching with message loading**: `useAuiState(remoteId)` triggers message fetch from `/api/threads/[id]/messages` on thread switch
- **ThreadListDrawer** as left-side Sheet overlay (D-06) with auto-close on thread switch, check icon on active thread
- **Two-panel layout preserved** (D-07): chat 420px + content flex-1
- **Dynamic suggestion chips** from `/api/test-prompts` with fallback defaults
- **Dify adapter** uses getter functions for threadId/conversationId to avoid stale closure bugs
- **Markdown rendering** in assistant messages via react-markdown
- **Dockerfile** updated for Railway with SQLite persistent volume at `/app/data/db.sqlite`
- **Auto-migration** on DB init — tables created on first import

## Key files

### Created
- `components/assistant-ui/thread-list-drawer.tsx` — Drawer overlay with thread list, active indicator, auto-close

### Modified
- `components/assistant-ui/brief-runtime-provider.tsx` — Full rewrite: useExternalStoreRuntime + DB message loading
- `components/assistant-ui/brief-thread.tsx` — Added react-markdown rendering for assistant messages
- `lib/dify/adapter.ts` — Changed to getter functions (getConversationId, getThreadId) to fix stale closures
- `lib/db/index.ts` — Auto-run migrations on module import
- `components/settings/settings-sheet.tsx` — Self-contained active agent fetch on open
- `app/page.tsx` — Wired ThreadListDrawer into header
- `Dockerfile` — SQLite persistent volume configuration

## Deviations

1. **useExternalStoreRuntime instead of useLocalRuntime** (Rule 3 auto-fix): `useLocalRuntime` stores messages in memory only — thread switching lost all messages. Switched to `useExternalStoreRuntime` which supports external message state, enabling DB-backed persistence.
2. **Agent label badges on thread list items not implemented** (D-11): The `ThreadListItemPrimitive` API doesn't expose a slot for custom metadata. Would require a custom thread list component — deferred to gap closure.

## Self-Check: PASSED
- [x] Thread drawer opens from left as overlay
- [x] Two-panel layout preserved
- [x] Messages persist to DB and load on thread switch
- [x] Messages survive page reload
- [x] Dify multi-turn context resumption via stored conversationId
- [x] New conversation creates fresh thread
- [x] Suggestion chips load from DB
- [x] Markdown rendered in assistant messages
- [x] Active thread indicator in drawer
- [x] Drawer auto-closes on thread switch
- [ ] Agent label badge on thread items (deferred — D-11)
