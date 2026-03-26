# Phase 1: Dify Agent API Integration - Research

**Researched:** 2026-03-25
**Domain:** Dify Chat API integration via Next.js API route with SSE streaming
**Confidence:** HIGH

## Summary

Phase 1 requires creating a Next.js API route (`/api/brief/chat`) that proxies messages to the Dify `/chat-messages` endpoint with streaming support. The Dify API uses standard SSE (Server-Sent Events) with well-documented event types. The existing codebase already has a pattern for API routes with streaming (see `app/api/chat/route.ts` using Vercel AI SDK), but the Dify integration is different -- it requires raw SSE proxying rather than the Vercel AI SDK `streamText` abstraction, since Dify has its own streaming format.

The key complexity is correctly parsing Dify's SSE events (especially `message` vs `agent_message` for agent-mode apps) and forwarding them to the client, plus managing `conversation_id` state across multi-turn exchanges. The Dify API key must stay server-side only.

**Primary recommendation:** Build a raw `fetch` + SSE proxy route in Next.js App Router. Do NOT use Vercel AI SDK for the Dify call -- Dify's SSE format is custom and incompatible with `streamText`. Parse SSE events server-side and re-emit a simpler text stream (or forward raw SSE) to the client.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DIFY-01 | Next.js API route proxies chat messages to Dify `/chat-messages` endpoint | Architecture Pattern 1: SSE Proxy Route; Dify API spec documented below |
| DIFY-02 | Conversation state maintained via Dify `conversation_id` across messages | Architecture Pattern 2: Conversation ID management; client passes ID back each turn |
| DIFY-03 | Streaming responses from Dify displayed in chat panel | Dify SSE event types documented; proxy pattern forwards `answer` chunks |
| DIFY-04 | Dify API key stored server-side only, never exposed to client | Standard env var pattern; existing project uses same approach for OPENAI_API_KEY |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 15.3.x | API route handler (App Router) | Already in project |
| Native fetch | Built-in | HTTP client for Dify API | No external HTTP lib needed; Next.js edge/node runtime supports fetch natively |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| eventsource-parser | 3.x | Parse SSE stream from Dify | If raw TextDecoder parsing proves brittle; provides robust SSE parsing |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Raw fetch + SSE parsing | `dify-client` npm package | Package exists but is community-maintained, low download count, adds dependency for simple HTTP call |
| Raw SSE proxy | Vercel AI SDK custom provider | Overkill; AI SDK expects OpenAI-compatible format, Dify SSE is different |
| eventsource-parser | Manual TextDecoder split on `\n\n` | Manual approach works for simple cases but misses edge cases (partial chunks, multi-line data) |

**Installation:**
```bash
npm install eventsource-parser
```

**Note:** `eventsource-parser` is optional. The implementation can start with manual parsing and upgrade if needed. The Dify SSE format is straightforward enough that manual parsing is viable.

## Architecture Patterns

### Recommended Project Structure
```
app/
  api/
    brief/
      chat/
        route.ts          # POST handler - proxies to Dify
lib/
  dify/
    client.ts             # Dify API client (fetch wrapper)
    types.ts              # TypeScript types for Dify API
    parse-sse.ts          # SSE event parser (optional, can inline)
```

### Pattern 1: SSE Proxy Route
**What:** Next.js API route that receives a message from the client, calls Dify `/chat-messages` with streaming, and pipes the response back as a readable stream.
**When to use:** This is the core pattern for DIFY-01 and DIFY-03.

```typescript
// app/api/brief/chat/route.ts
export async function POST(req: Request) {
  const { message, conversation_id } = await req.json();

  const difyResponse = await fetch(`${process.env.DIFY_API_BASE_URL}/v1/chat-messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.DIFY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: {},
      query: message,
      response_mode: 'streaming',
      conversation_id: conversation_id || '',
      user: 'default-user',
    }),
  });

  if (!difyResponse.ok) {
    return new Response(
      JSON.stringify({ error: 'Dify API error', status: difyResponse.status }),
      { status: difyResponse.statusText === 'Not Found' ? 404 : 502 }
    );
  }

  // Transform Dify SSE into a simpler stream for the client
  const reader = difyResponse.body!.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data:')) {
            const data = line.slice(5).trim();
            if (!data) continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.event === 'message' || parsed.event === 'agent_message') {
                controller.enqueue(encoder.encode(
                  `data: ${JSON.stringify({
                    answer: parsed.answer,
                    conversation_id: parsed.conversation_id,
                    message_id: parsed.message_id,
                  })}\n\n`
                ));
              } else if (parsed.event === 'message_end') {
                controller.enqueue(encoder.encode(
                  `data: ${JSON.stringify({ event: 'done', conversation_id: parsed.conversation_id })}\n\n`
                ));
              } else if (parsed.event === 'error') {
                controller.enqueue(encoder.encode(
                  `data: ${JSON.stringify({ event: 'error', message: parsed.message })}\n\n`
                ));
              }
            } catch { /* skip malformed */ }
          }
        }
      }
      controller.close();
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

### Pattern 2: Conversation ID Flow
**What:** The client manages `conversation_id` state. First message sends empty/undefined `conversation_id`. The response includes the server-generated `conversation_id` which the client stores and sends with all subsequent messages.
**When to use:** DIFY-02 requirement.

```
Client                    API Route               Dify
  |-- POST {msg, cid:""}----->|                      |
  |                           |-- POST {query, cid:""}-->|
  |                           |<-- SSE {answer, cid:"abc"}|
  |<-- SSE {answer, cid:"abc"}|                      |
  |                           |                      |
  |-- POST {msg, cid:"abc"}--->|                      |
  |                           |-- POST {query, cid:"abc"}-->|
  |                           |<-- SSE {answer, cid:"abc"}  |
  |<-- SSE {answer, cid:"abc"}|                      |
```

**Key detail:** The `conversation_id` is returned in EVERY SSE `message` event from Dify, not just the first one. The client should capture it from the first `message` event of a new conversation.

### Pattern 3: Environment Variable Configuration
**What:** Dify API credentials via server-side env vars.
**When to use:** DIFY-04 requirement.

```
# .env.local (add to .gitignore)
DIFY_API_KEY=app-xxxxxxxxxxxx
DIFY_API_BASE_URL=https://api.dify.ai
```

Note: Dify API keys are prefixed with `app-`. The base URL may be `https://api.dify.ai` for cloud or a custom URL for self-hosted instances.

### Anti-Patterns to Avoid
- **Using Vercel AI SDK `streamText` for Dify:** The AI SDK expects OpenAI-compatible streaming. Dify's SSE has different event names (`message`, `agent_message`, `agent_thought`) and data structure. Do not try to force it through `streamText`.
- **Edge runtime for Dify proxy:** The existing routes use `export const runtime = "edge"`. The Dify proxy should use Node.js runtime (default) since edge runtime has limitations with streaming body consumption in some deployments. Do NOT set `export const runtime = "edge"` on this route.
- **Exposing `conversation_id` logic server-side:** Don't try to store conversation state on the server. Let the client manage `conversation_id` -- it's just a string that gets passed through.
- **Hardcoding Dify cloud URL:** Use an env var for the base URL to support both cloud and self-hosted Dify instances.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| SSE parsing | Custom regex parser | `eventsource-parser` or the buffer-split pattern above | SSE has edge cases with partial chunks |
| HTTP retry/timeout | Custom retry logic | Simple error handling + let client retry | Keep proxy thin; complexity belongs in client |
| Conversation persistence | Database for conversation IDs | Client-side state (React state or zustand) | Dify manages conversation state; we just pass the ID |

## Common Pitfalls

### Pitfall 1: Dify SSE Format Differences from OpenAI
**What goes wrong:** Developers assume Dify SSE looks like OpenAI's `data: {"choices": [...]}` format. It does not.
**Why it happens:** Prior experience with OpenAI streaming.
**How to avoid:** Dify uses `event:` + `data:` pairs where the event field is in the JSON data, NOT as a separate SSE event line. The format is `data: {"event": "message", "answer": "...", ...}\n\n`. Parse the `event` field from the JSON payload.
**Warning signs:** Empty responses, JSON parse errors, missing `answer` field.

### Pitfall 2: Agent vs Chat App Event Types
**What goes wrong:** If the Dify app is configured as an "Agent" (not just a chatbot), it emits `agent_message` events instead of (or in addition to) `message` events.
**Why it happens:** Different Dify app types emit different event types.
**How to avoid:** Handle BOTH `message` and `agent_message` events. The `answer` field is the same in both.
**Warning signs:** Streaming works in Dify playground but returns empty in your proxy.

### Pitfall 3: Conversation ID on First Message
**What goes wrong:** Sending `conversation_id: ""` (empty string) vs omitting the field vs sending `null`.
**Why it happens:** Dify docs say "leave empty" but don't specify the exact semantics.
**How to avoid:** Send `conversation_id: ""` (empty string) for new conversations. Dify returns a new UUID in the first SSE event.
**Warning signs:** 404 errors on first message, "Conversation does not exist" errors.

### Pitfall 4: SSE Buffer Splitting
**What goes wrong:** A single `data:` message arrives split across multiple TCP chunks, causing JSON parse failures.
**Why it happens:** Network chunking is unpredictable.
**How to avoid:** Always buffer incoming data and split on `\n\n` boundaries. Never assume one chunk = one event.
**Warning signs:** Intermittent JSON parse errors, works locally but fails in production.

### Pitfall 5: Missing `user` Parameter
**What goes wrong:** Dify returns 400 error.
**Why it happens:** `user` is required by Dify but easy to forget.
**How to avoid:** Always include a `user` string. For a prototype without auth, use a constant like `"default-user"`.
**Warning signs:** 400 Bad Request from Dify API.

## Code Examples

### Minimal Dify Client
```typescript
// lib/dify/client.ts
const DIFY_API_BASE = process.env.DIFY_API_BASE_URL || 'https://api.dify.ai';
const DIFY_API_KEY = process.env.DIFY_API_KEY;

export interface DifyChatRequest {
  query: string;
  conversation_id?: string;
  user?: string;
  inputs?: Record<string, string>;
}

export async function sendChatMessage(params: DifyChatRequest): Promise<Response> {
  if (!DIFY_API_KEY) {
    throw new Error('DIFY_API_KEY is not configured');
  }

  const response = await fetch(`${DIFY_API_BASE}/v1/chat-messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${DIFY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: params.inputs || {},
      query: params.query,
      response_mode: 'streaming',
      conversation_id: params.conversation_id || '',
      user: params.user || 'default-user',
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Dify API error ${response.status}: ${errorBody}`);
  }

  return response;
}
```

### Dify SSE Event Types
```typescript
// lib/dify/types.ts
export interface DifyMessageEvent {
  event: 'message' | 'agent_message';
  task_id: string;
  message_id: string;
  conversation_id: string;
  answer: string;     // Incremental text chunk
  created_at: number;
}

export interface DifyMessageEndEvent {
  event: 'message_end';
  task_id: string;
  message_id: string;
  conversation_id: string;
  metadata: {
    usage: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    };
  };
}

export interface DifyErrorEvent {
  event: 'error';
  status: number;
  code: string;
  message: string;
}

export type DifySSEEvent = DifyMessageEvent | DifyMessageEndEvent | DifyErrorEvent;
```

### Environment Setup
```bash
# .env.local additions
DIFY_API_KEY=app-your-dify-api-key-here
DIFY_API_BASE_URL=https://api.dify.ai
```

```typescript
// .env.example additions
# Dify Agent API
# Get your API key from: Dify dashboard > App > API Access
DIFY_API_KEY=app-your-dify-api-key-here
DIFY_API_BASE_URL=https://api.dify.ai
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Dify REST blocking mode | Streaming SSE (recommended) | Dify v0.6+ | Much better UX, token-by-token display |
| Custom conversation memory | Dify built-in conversation_id | Always available | No need to manage message history client-side |
| dify-client npm package | Raw fetch | Ongoing | Package has low maintenance; raw fetch is simpler and more reliable |

## Open Questions

1. **Dify app type: Chat vs Agent**
   - What we know: The roadmap says "Dify chat agent" -- if the Dify app is configured as an Agent, it will emit `agent_message` events instead of `message` events
   - What's unclear: Which exact Dify app type is configured
   - Recommendation: Handle both `message` and `agent_message` events to be safe

2. **Dify instance: Cloud vs Self-hosted**
   - What we know: The base URL defaults to `https://api.dify.ai` (cloud)
   - What's unclear: Whether a self-hosted instance is being used
   - Recommendation: Use `DIFY_API_BASE_URL` env var to support both

3. **User identification**
   - What we know: Dify requires a `user` parameter; no auth system in this prototype
   - What's unclear: Whether user tracking matters for this prototype
   - Recommendation: Use a constant `"default-user"` string for now

## Sources

### Primary (HIGH confidence)
- [Dify Official API Docs - Developing with APIs](https://docs.dify.ai/en/use-dify/publish/developing-with-apis) - API auth, conversation_id behavior
- [Dify GitHub - Chat Template MDX](https://github.com/langgenius/dify/blob/main/web/app/components/develop/template/template_chat.en.mdx) - Complete SSE event type specification, request/response format
- [Dify Send Chat Message Docs](https://docs.dify.ai/api-reference/chat/send-chat-message) - Endpoint reference

### Secondary (MEDIUM confidence)
- [Dify conversation_id issue #8858](https://github.com/langgenius/dify/issues/8858) - Verified conversation_id behavior and common errors
- [DeepWiki Dify API Reference](https://deepwiki.com/langgenius/dify-docs-mintlify/3-api-reference) - Cross-referenced SSE event types

### Tertiary (LOW confidence)
- None -- all findings verified against official documentation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Simple fetch + SSE; no exotic dependencies needed
- Architecture: HIGH - Dify API is well-documented; SSE proxy is a standard pattern
- Pitfalls: HIGH - Common issues well-documented in GitHub issues and community

**Research date:** 2026-03-25
**Valid until:** 2026-04-25 (Dify API is stable; major changes unlikely in 30 days)
