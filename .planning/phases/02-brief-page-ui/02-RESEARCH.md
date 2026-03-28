# Phase 2: Brief Page UI - Research

**Researched:** 2026-03-25
**Domain:** Next.js React UI — chat component with SSE consumption, two-panel layout
**Confidence:** HIGH

## Summary

This phase builds a brief-taking page with a chat panel (left) and an empty right panel. The chat connects to the existing `/api/brief/chat` SSE proxy route built in Phase 1. A new `/api/brief/parameters` proxy route fetches the Dify agent's opening statement and suggested questions on page mount.

The codebase already contains all the UI patterns needed: `DesignEmptyState` for empty state layout, `ChatPanel` for chat rendering and input styling, and `app/page.tsx` for the two-panel layout structure. The custom `useBriefChat` hook is the primary new code — it consumes the Dify SSE format directly (no Vercel AI SDK `useChat`) and manages conversation state, streaming, and the `[BRIEF_COMPLETE]` marker detection.

**Primary recommendation:** Build a custom `useBriefChat` hook that handles SSE parsing, message accumulation, conversation_id tracking, and brief completion detection. Mirror the existing UI patterns exactly for visual consistency.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Build a custom `useBriefChat` hook — do NOT use Vercel AI SDK's `useChat`. The Dify SSE format (`{answer, conversation_id}`) is consumed directly.
- **D-02:** On page mount, call `GET /parameters` via a new proxy route (`/api/brief/parameters`) to fetch `opening_statement` and `suggested_questions` from Dify.
- **D-03:** The `opening_statement` is displayed as the first assistant message. The `suggested_questions` are shown as clickable chips below it.
- **D-04:** No `suggested_questions_after_answer` support — the agent drives the conversation by asking questions, not the user. Only initial suggested questions are used.
- **D-05:** Input placeholder text: "Tell me about the email you'd like to create..."
- **D-06:** Informational empty state — explains what's happening: "Chat with the AI to define your email brief. Once done, you'll move to the editor."
- **D-07:** Panel header labeled "Brief"
- **D-08:** When the agent signals brief completion, the empty state updates to "Brief complete — ready to edit"
- **D-09:** Button is NOT visible from the start. It only appears when the agent signals the brief is complete.
- **D-10:** Completion signal is convention-based: the agent includes `[BRIEF_COMPLETE]` marker in its final message. The marker is stripped from display.
- **D-11:** Button label: "Start editing"
- **D-12:** Clicking the button navigates directly to the editor — no confirmation dialog.

### Claude's Discretion
- Lucide icon choice for the empty state
- Component file structure and naming
- SSE parsing implementation details in the custom hook
- Loading/typing indicator design
- Exact Tailwind styling and spacing

### Deferred Ideas (OUT OF SCOPE)
- Live brief rendering in right panel (structured card updating as conversation progresses) — v2
- Brief data passed as context to email editor AI — v2
- Navigation sidebar integration for brief page — Phase 3
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| BRIEF-01 | New page with two-panel layout (chat left, empty panel right) | Existing `app/page.tsx` provides exact layout pattern: 420px left + flex-1 right. `DesignEmptyState` provides empty panel template. |
| BRIEF-02 | Chat panel supports multi-turn conversation with Dify agent | Custom `useBriefChat` hook consumes `/api/brief/chat` SSE stream. Existing `ChatPanel` provides message rendering patterns. `conversation_id` from first response persists across turns. |
| BRIEF-03 | Right panel shows empty/placeholder state during brief phase | `DesignEmptyState` pattern: icon-in-circle + title + description. Two states: "chatting" and "brief complete". |
| BRIEF-04 | "Start editing" button visible to transition to email editor | Button appears only when `[BRIEF_COMPLETE]` marker detected in agent message. Uses `next/navigation` `useRouter().push()` for navigation. |
</phase_requirements>

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | ^15.3.0 | App router, API routes, page routing | Project framework |
| react | ^19.0.0 | UI components, hooks | Project framework |
| tailwindcss | ^3.4.17 | Styling | Project convention |
| lucide-react | ^0.577.0 | Icons | Project convention |

### Supporting (already installed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| clsx | ^2.1.1 | Conditional class names | Combining Tailwind classes |
| tailwind-merge | ^3.5.0 | Merge Tailwind classes | Via `cn()` utility |

### No New Dependencies
This phase requires zero new npm packages. Everything is built with existing project dependencies.

## Architecture Patterns

### Recommended Project Structure
```
app/
  brief/
    page.tsx                     # Brief page (two-panel layout)
  api/
    brief/
      chat/route.ts              # [EXISTS] SSE proxy
      parameters/route.ts        # [NEW] Parameters proxy
components/
  brief/
    brief-chat-panel.tsx         # Chat panel for brief page
    brief-empty-state.tsx        # Right panel empty/complete state
hooks/
  use-brief-chat.ts              # Custom SSE chat hook
lib/
  dify/
    client.ts                    # [EXTEND] Add getParameters()
    types.ts                     # [EXTEND] Add parameters types
```

### Pattern 1: Custom SSE Hook (`useBriefChat`)
**What:** A React hook that manages SSE connection to `/api/brief/chat`, accumulates streamed `answer` chunks into messages, tracks `conversation_id`, and detects `[BRIEF_COMPLETE]`.
**When to use:** For the brief chat — NOT a generic hook, purpose-built for this flow.
**Key state:**
```typescript
interface UseBriefChatReturn {
  messages: BriefMessage[];
  input: string;
  setInput: (value: string) => void;
  sendMessage: (text?: string) => void;  // optional param for chip clicks
  isLoading: boolean;
  isBriefComplete: boolean;
  conversationId: string | null;
}

interface BriefMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}
```

**SSE parsing approach:**
```typescript
// The /api/brief/chat route emits SSE lines in this format:
// data: {"answer":"chunk","conversation_id":"xxx","message_id":"yyy"}
// data: {"event":"done","conversation_id":"xxx"}

// Use fetch + ReadableStream reader to consume:
const response = await fetch('/api/brief/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message, conversation_id }),
});

const reader = response.body!.getReader();
const decoder = new TextDecoder();
let buffer = '';
let accumulated = '';

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  buffer += decoder.decode(value, { stream: true });
  const lines = buffer.split('\n');
  buffer = lines.pop() || '';

  for (const line of lines) {
    if (!line.startsWith('data: ')) continue;
    const data = JSON.parse(line.slice(6));

    if (data.event === 'done') {
      // Stream complete — check accumulated text for [BRIEF_COMPLETE]
      break;
    }
    if (data.answer) {
      accumulated += data.answer;
      // Update the current assistant message in state
    }
    if (data.conversation_id) {
      // Store conversation_id for subsequent messages
    }
  }
}

// After stream ends: check for [BRIEF_COMPLETE] marker
if (accumulated.includes('[BRIEF_COMPLETE]')) {
  // Strip marker from display text
  const cleanText = accumulated.replace('[BRIEF_COMPLETE]', '').trim();
  // Set isBriefComplete = true
}
```

### Pattern 2: Parameters Fetch on Mount
**What:** On page mount, fetch `/api/brief/parameters` to get `opening_statement` and `suggested_questions`.
**When to use:** Once, when the brief page loads.
**Example:**
```typescript
// In the brief page or hook initialization:
useEffect(() => {
  async function loadParameters() {
    const res = await fetch('/api/brief/parameters');
    const data = await res.json();
    // Set opening_statement as first assistant message
    // Set suggested_questions for chip display
  }
  loadParameters();
}, []);
```

### Pattern 3: Two-Panel Layout (from existing page.tsx)
**What:** 420px left panel + flex-1 right panel with full viewport height.
**Key classes from existing code:**
```tsx
<div className="h-screen w-screen overflow-hidden flex flex-col">
  <div className="flex flex-1 overflow-hidden">
    {/* Left panel */}
    <div className="w-[420px] flex-shrink-0">
      <BriefChatPanel />
    </div>
    {/* Right panel */}
    <div className="flex-1 overflow-y-auto">
      <BriefEmptyState isBriefComplete={isBriefComplete} />
    </div>
  </div>
</div>
```

### Pattern 4: Empty State (from DesignEmptyState)
**What:** Centered icon-in-circle + title + description.
**Key classes:**
```tsx
<div className="flex-1 flex items-center justify-center p-8">
  <div className="flex flex-col items-center text-center max-w-sm">
    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-6">
      <Icon className="w-7 h-7 text-muted-foreground" />
    </div>
    <h3 className="text-lg font-semibold text-foreground mb-3">Title</h3>
    <p className="text-sm text-muted-foreground leading-relaxed">Description</p>
  </div>
</div>
```

### Anti-Patterns to Avoid
- **Using Vercel AI SDK `useChat`:** The Dify SSE format (`{answer, conversation_id}`) is NOT compatible with `useChat` which expects the AI SDK wire format. D-01 explicitly forbids this.
- **EventSource API:** The browser `EventSource` API only supports GET requests. The chat endpoint is POST. Use `fetch` + `ReadableStream` reader instead.
- **Storing all state in parent page:** Keep chat state inside `useBriefChat` hook. The page only needs `isBriefComplete` and a `sendMessage` handle from the hook.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| SSE line parsing | Custom regex parser | Simple `split('\n')` + `startsWith('data: ')` + `JSON.parse()` | The existing `route.ts` already normalizes Dify events to simple JSON. The client parser is straightforward. |
| UI components | Custom buttons, inputs | `components/ui/button.tsx`, existing Tailwind patterns | Already exist in project |
| Navigation | Custom history manipulation | `next/navigation` `useRouter().push()` | Standard Next.js pattern |

## Common Pitfalls

### Pitfall 1: SSE Buffer Incomplete Lines
**What goes wrong:** SSE chunks can split mid-line, so `data: {"answer":"hel` arrives in one chunk and `lo"}\n\n` in the next.
**Why it happens:** TCP framing does not align with SSE message boundaries.
**How to avoid:** Maintain a buffer string. Only process complete lines (split by `\n`, keep the last incomplete fragment as the new buffer). The existing `route.ts` already does this server-side; the client hook must do the same.
**Warning signs:** Missing chunks, JSON parse errors in console.

### Pitfall 2: Stale conversation_id in Closure
**What goes wrong:** `conversation_id` captured in a closure doesn't update between messages.
**Why it happens:** React state is stale inside async callbacks.
**How to avoid:** Use a `useRef` for `conversation_id` (updated on each response) alongside state. Read from ref in `sendMessage`, expose state for rendering.
**Warning signs:** Dify creates a new conversation on every message instead of continuing.

### Pitfall 3: Race Condition on Rapid Send
**What goes wrong:** User sends a message while previous stream is still active.
**Why it happens:** No guard against concurrent requests.
**How to avoid:** Disable the send button and input while `isLoading` is true (the existing ChatPanel already does this). Optionally abort the previous request via `AbortController`.
**Warning signs:** Interleaved streams, garbled messages.

### Pitfall 4: [BRIEF_COMPLETE] Marker in Middle of Stream
**What goes wrong:** The marker might appear mid-stream as chunks accumulate, triggering premature detection.
**Why it happens:** Checking for the marker on every chunk instead of after stream completes.
**How to avoid:** Only check for `[BRIEF_COMPLETE]` after the `event: done` SSE event is received (i.e., when the full message is assembled).
**Warning signs:** Brief marked complete before agent finishes speaking.

### Pitfall 5: Parameters Fetch Fails Silently
**What goes wrong:** If `/api/brief/parameters` fails, the chat shows no opening statement and no suggested questions — blank screen.
**Why it happens:** No error handling or fallback.
**How to avoid:** Provide a hardcoded fallback opening statement (e.g., "Hi! Tell me about the email you'd like to create.") and empty suggestions array. Log the error but don't block the UI.
**Warning signs:** Blank chat on page load.

## Code Examples

### Dify Parameters Proxy Route
```typescript
// app/api/brief/parameters/route.ts
// Source: Dify API docs GET /parameters
import { NextResponse } from 'next/server';

const DIFY_API_BASE = process.env.DIFY_API_BASE_URL || 'https://api.dify.ai';
const DIFY_API_KEY = process.env.DIFY_API_KEY;

export async function GET() {
  if (!DIFY_API_KEY) {
    return NextResponse.json(
      { error: 'DIFY_API_KEY is not configured' },
      { status: 500 }
    );
  }

  const response = await fetch(
    `${DIFY_API_BASE}/v1/parameters?user=default-user`,
    {
      headers: { 'Authorization': `Bearer ${DIFY_API_KEY}` },
    }
  );

  if (!response.ok) {
    return NextResponse.json(
      { error: 'Failed to fetch parameters' },
      { status: response.status }
    );
  }

  const data = await response.json();
  return NextResponse.json({
    opening_statement: data.opening_statement || '',
    suggested_questions: data.suggested_questions || [],
  });
}
```

### Dify Client Extension
```typescript
// Addition to lib/dify/client.ts
export async function getParameters(user: string = 'default-user'): Promise<Response> {
  if (!DIFY_API_KEY) {
    throw new Error('DIFY_API_KEY is not configured');
  }

  return fetch(`${DIFY_API_BASE}/v1/parameters?user=${encodeURIComponent(user)}`, {
    headers: { 'Authorization': `Bearer ${DIFY_API_KEY}` },
  });
}
```

### Suggestion Chips Pattern (from existing ChatPanel)
```tsx
// Clickable suggestion chips — reuse exact styling from existing code
<div className="flex flex-wrap gap-2">
  {suggestedQuestions.map((question, index) => (
    <button
      key={index}
      type="button"
      onClick={() => sendMessage(question)}
      className="px-3 py-1.5 text-xs rounded-full border border-border bg-background hover:bg-muted transition-colors text-foreground"
    >
      {question}
    </button>
  ))}
</div>
```

### Chat Message Rendering Pattern (from existing ChatPanel)
```tsx
// User message — right-aligned, muted background
<div className="flex justify-end">
  <div className="max-w-[90%] rounded-lg px-4 py-2 bg-muted text-foreground">
    <div className="text-sm whitespace-pre-wrap break-words">{message.content}</div>
  </div>
</div>

// Assistant message — left-aligned, full width
<div className="flex justify-start">
  <div className="w-full text-sm text-foreground whitespace-pre-wrap">
    {message.content}
  </div>
</div>
```

### Chat Input Pattern (from existing ChatPanel)
```tsx
// Pill-shaped input with send button
<form onSubmit={handleSubmit} className="relative border border-border rounded-[24px] bg-background focus-within:ring-2 focus-within:ring-ring transition-shadow">
  <div className="flex items-end gap-2 px-3 py-2">
    <textarea
      value={input}
      onChange={(e) => setInput(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          if (input.trim() && !isLoading) sendMessage();
        }
      }}
      placeholder="Tell me about the email you'd like to create..."
      disabled={isLoading}
      rows={1}
      className="flex-1 border-0 bg-transparent focus-visible:ring-0 shadow-none px-2 py-2 text-sm resize-none outline-none min-h-[24px] max-h-[72px] overflow-y-auto"
    />
    <Button type="submit" disabled={isLoading || !input.trim()} size="icon"
      className="flex-shrink-0 h-9 w-9 rounded-full bg-muted hover:bg-muted/80 text-foreground disabled:opacity-50">
      {/* arrow icon or spinner */}
    </Button>
  </div>
</form>
```

## Open Questions

1. **What happens if Dify agent does not include `[BRIEF_COMPLETE]`?**
   - What we know: The marker is convention-based (D-10). The agent must be configured to emit it.
   - What's unclear: What if the agent never signals completion (misconfiguration)?
   - Recommendation: After the brief page is built, the transition button simply never appears. This is acceptable for v1 — the agent config is a separate concern.

2. **Should the brief page have a header/top bar?**
   - What we know: The existing editor page has a 48px header with title, undo/redo, export. The brief page has no such requirements.
   - What's unclear: Whether a minimal header is expected for consistency.
   - Recommendation: Include a minimal header with app title for visual consistency. Keep it simple — no functional buttons needed.

## Sources

### Primary (HIGH confidence)
- Existing codebase: `components/chat/chat-panel-with-assistant-ui.tsx` — chat UI patterns, message rendering, input area, suggestion chips
- Existing codebase: `components/design/design-empty-state.tsx` — empty state pattern
- Existing codebase: `app/page.tsx` — two-panel layout pattern (420px + flex-1)
- Existing codebase: `app/api/brief/chat/route.ts` — SSE proxy format (the exact format the hook must consume)
- Existing codebase: `lib/dify/client.ts` and `lib/dify/types.ts` — Dify client to extend
- `.planning/research/Dify_API.md` lines 703-752 — `GET /parameters` endpoint specification

### Secondary (MEDIUM confidence)
- `.planning/research/Dify_API.md` lines 76-163 — SSE event types documentation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — zero new dependencies, all already in package.json
- Architecture: HIGH — directly mirrors existing patterns in the codebase
- Pitfalls: HIGH — based on known SSE parsing challenges and React closure behavior

**Research date:** 2026-03-25
**Valid until:** 2026-04-25 (stable — no external dependency changes expected)
