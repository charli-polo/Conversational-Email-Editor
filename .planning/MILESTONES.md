# Milestones

## v1.0 Brief Flow MVP (Shipped: 2026-04-06)

**Phases completed:** 6 phases, 20 plans, 34 tasks

**Key accomplishments:**

- Typed Dify API client with SSE event types and sendChatMessage function using native fetch with streaming
- POST /api/brief/chat endpoint proxying messages to Dify agent with SSE streaming, conversation continuity, and structured error handling
- Dify parameters proxy route and useBriefChat hook with SSE streaming, conversation tracking, and [BRIEF_COMPLETE] detection
- SQLite database with better-sqlite3 + Drizzle ORM: 4 tables (agents, test_prompts, conversations, messages), WAL mode, auto-migration
- Upgraded assistant-ui to v0.12.x, replaced ~440 LOC custom chat with library primitives and Dify ChatModelAdapter, added SettingsSheet drawer
- RESTful CRUD APIs for agents and test prompts with API key masking, active agent singleton, and dynamic Dify client config from DB
- Settings page at /settings with tabbed agent CRUD (active toggle with D-09 switch confirmation and thread archive) and test prompt CRUD (reorder, auto-send toggle)
- Thread CRUD + message save/load API routes with brief chat persistence and Dify conversation_id tracking
- Empty state, preview text, and agent label badges added to ThreadListDrawer via React context metadata pattern
- Extended DB schema, Dify client, and adapter layer with 3 API proxy routes for feedback, file upload, and audio-to-text
- Extended SSE proxy with agent_thought forwarding and message_id tracking, wired feedback/attachment/dictation adapters into runtime, injected conversation opener, and established reasoning streaming metadata pattern for D-14/D-16 dots+timer
- Hybrid-visibility action toolbar with feedback/copy/regenerate, streaming reasoning dots+timer, collapsible post-response reasoning toggle, and opener suggestion chips wired into BriefMessage
- Conditional paperclip, mic/stop buttons, attachment preview chips, and drag-drop overlay in composer, gated by Dify /parameters config via shared DifyParamsContext
- SSE event normalization, reasoning content parts, feedback adapter wiring, attachment data parts, and Dify conversation rename proxy
- Save button with Dify auto-generated titles, toast confirmation, 3-state tracking, auto-persist after save, New conversation reset, and resume page with loading spinner
- Feedback buttons, collapsible reasoning with tool badges, SuggestionPrimitive pattern, and attachment component with drag-drop composer dropzone
- Build verification, automated regression tests, live browser testing, and two runtime bugfixes

---
