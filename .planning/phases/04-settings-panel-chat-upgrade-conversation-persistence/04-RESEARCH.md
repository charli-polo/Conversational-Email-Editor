# Phase 4: Settings Panel, Chat Upgrade & Conversation Persistence - Research

**Researched:** 2026-04-05
**Domain:** assistant-ui v0.12 migration, SQLite persistence with Drizzle ORM, settings CRUD, Railway deployment
**Confidence:** MEDIUM-HIGH

## Summary

Phase 4 involves three interleaved workstreams: (1) upgrading assistant-ui from v0.9.6 to v0.12.x and replacing the custom brief chat panel (~163 LOC in `brief-chat-panel.tsx` + ~278 LOC in `use-brief-chat.ts`) with library primitives, (2) adding a settings page for agent and test prompt CRUD, and (3) persisting conversations to a file-based SQLite database using better-sqlite3 + Drizzle ORM.

The assistant-ui v0.12 upgrade includes significant hook renames (e.g., `useAssistantRuntime` becomes deprecated in favor of `useAui`/`useAuiState`), but provides an automated codemod (`npx assistant-ui@latest upgrade`). The `useRemoteThreadListRuntime` hook enables connecting a custom database backend (our SQLite) to the library's `ThreadList` component for conversation persistence. The existing `ChatModelAdapter` pattern used in the editor page (`components/assistant-runtime-provider.tsx`) is still supported, so the Dify streaming adapter can be ported cleanly.

For the database layer, better-sqlite3 is synchronous and zero-config but requires `serverExternalPackages` configuration in Next.js to avoid webpack bundling issues with native modules. On Railway, SQLite files must be stored on a persistent volume mounted at `/data` (with WAL mode files also persisted). Drizzle ORM provides type-safe schema definitions and lightweight migrations.

**Primary recommendation:** Start with database schema + migrations (foundation), then assistant-ui upgrade (unlocks ThreadList), then settings CRUD, then wire persistence through `useRemoteThreadListRuntime`.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CHAT-01 | Upgrade @assistant-ui/react to v0.12.x, replace custom chat with Thread/Composer/MessagePrimitive | v0.12.23 verified on npm; codemod available; ChatModelAdapter pattern preserved |
| CHAT-02 | Test prompt chips via ThreadPrimitive.Suggestion | Suggestion component confirmed: `<ThreadPrimitive.Suggestion prompt="..." method="replace" autoSend />` |
| CHAT-03 | Brief chat wired through assistant-ui runtime with Dify adapter | useLocalRuntime + ChatModelAdapter pattern still works; must create Dify-specific adapter for SSE streaming |
| SETTINGS-01 | Settings page with agent config form | Standard Next.js `/settings` route + form components; no special library needed |
| SETTINGS-02 | CRUD for agents | Drizzle ORM + better-sqlite3 + Next.js API routes; API key stored encrypted or masked in responses |
| SETTINGS-03 | Test prompts management | Same CRUD pattern as agents; stored in `test_prompts` table; surfaced as Suggestion chips |
| SETTINGS-04 | Active agent selection | `agents` table `is_active` boolean column; API route to toggle; runtime reads active agent config |
| PERSIST-01 | SQLite database stores conversations with messages | better-sqlite3 v12.8.0 + Drizzle ORM v0.45.2; schema with conversations + messages tables |
| PERSIST-02 | Conversation list sidebar | ThreadListPrimitive (Root, New, Items) from assistant-ui v0.12 |
| PERSIST-03 | Resume past conversation | useRemoteThreadListRuntime adapter `fetch()` + message loading from SQLite |
| PERSIST-04 | Conversation tagged with agent config at creation | `conversations.agent_config_snapshot` JSON column capturing agent state at thread creation |
| PERSIST-05 | Database works on Railway | SQLite file at `/data/db.sqlite` on persistent volume; WAL mode files co-located; `RAILWAY_RUN_UID=0` if needed |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @assistant-ui/react | 0.12.23 | Chat UI primitives (Thread, Composer, ThreadList, Suggestion) | Official library already in project; v0.12 adds ThreadList + remote runtime |
| assistant-stream | 0.3.10 | Stream creation for generateTitle adapter method | Required dependency of @assistant-ui/react v0.12 |
| better-sqlite3 | 12.8.0 | Synchronous SQLite driver for Node.js | Zero-config, file-based, no external service; ideal for Railway persistent volume |
| drizzle-orm | 0.45.2 | Type-safe ORM for SQLite | Lightweight, no code generation, works directly with better-sqlite3 |
| drizzle-kit | 0.31.10 | Schema migrations CLI | Generates and applies SQL migrations from Drizzle schema |
| @types/better-sqlite3 | 7.6.13 | TypeScript types for better-sqlite3 | Type safety for DB driver |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| nanoid | 5.x | Generate unique IDs for DB records | Already a transitive dep of assistant-ui; use for conversation/message IDs |
| lucide-react | (existing) | Icons for settings UI | Already in project |
| zustand | 5.x | State management | Already in project; may be useful for active agent state |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| better-sqlite3 | libsql/turso | Cloud-hosted but adds external dependency; overkill for prototype |
| Drizzle ORM | Raw SQL via better-sqlite3 | Drizzle adds type safety and migration tooling for minimal overhead |
| Drizzle ORM | Prisma | Prisma requires code generation step; heavier; Drizzle is more lightweight for SQLite |

**Installation:**
```bash
npm install better-sqlite3 drizzle-orm assistant-stream
npm install -D drizzle-kit @types/better-sqlite3
```

Note: `@assistant-ui/react` is already installed and will be upgraded:
```bash
npm install @assistant-ui/react@^0.12.23
```

## Architecture Patterns

### Recommended Project Structure
```
lib/
├── db/
│   ├── index.ts           # Database connection singleton
│   ├── schema.ts          # Drizzle table definitions
│   └── migrate.ts         # Auto-migration on startup
app/
├── api/
│   ├── agents/
│   │   └── route.ts       # GET (list), POST (create)
│   ├── agents/[id]/
│   │   └── route.ts       # GET, PATCH, DELETE
│   ├── test-prompts/
│   │   └── route.ts       # GET (list), POST (create)
│   ├── test-prompts/[id]/
│   │   └── route.ts       # GET, PATCH, DELETE
│   ├── threads/
│   │   └── route.ts       # GET (list), POST (initialize)
│   ├── threads/[id]/
│   │   └── route.ts       # GET (fetch), PATCH (rename), DELETE
│   ├── threads/[id]/messages/
│   │   └── route.ts       # GET (load), POST (save)
│   ├── threads/[id]/archive/
│   │   └── route.ts       # POST (archive)
│   └── threads/[id]/unarchive/
│       └── route.ts       # POST (unarchive)
├── settings/
│   └── page.tsx           # Settings page
components/
├── settings/
│   ├── agent-form.tsx     # Agent create/edit form
│   ├── agent-list.tsx     # Agent list with actions
│   ├── test-prompt-form.tsx
│   └── test-prompt-list.tsx
├── assistant-ui/
│   ├── brief-thread.tsx   # Thread UI using assistant-ui primitives
│   └── thread-list-sidebar.tsx  # Conversation list sidebar
data/
└── db.sqlite              # SQLite database file (gitignored)
drizzle/                   # Generated migration SQL files
drizzle.config.ts          # Drizzle Kit configuration
```

### Pattern 1: Database Singleton
**What:** Single better-sqlite3 connection shared across all API routes
**When to use:** Always -- better-sqlite3 is synchronous and thread-safe within a single process
**Example:**
```typescript
// lib/db/index.ts
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import path from 'path';

const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'db.sqlite');

const sqlite = new Database(DB_PATH);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

export const db = drizzle(sqlite, { schema });
```

### Pattern 2: Dify ChatModelAdapter for assistant-ui v0.12
**What:** Custom adapter that sends messages to the Dify SSE proxy route and streams responses back
**When to use:** For the brief chat, connecting assistant-ui runtime to the existing Dify API route
**Example:**
```typescript
// Source: assistant-ui docs + existing project pattern
import type { ChatModelAdapter } from '@assistant-ui/react';

export const difyAdapter: ChatModelAdapter = {
  async *run({ messages, abortSignal }) {
    const lastMessage = messages[messages.length - 1];
    const text = lastMessage.content[0]?.type === 'text' ? lastMessage.content[0].text : '';

    const res = await fetch('/api/brief/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: text,
        conversation_id: '', // managed by runtime
      }),
      signal: abortSignal,
    });

    if (!res.ok || !res.body) throw new Error('Failed to fetch');

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        try {
          const data = JSON.parse(line.slice(6));
          if (data.answer) {
            fullContent += data.answer;
            yield { content: [{ type: 'text' as const, text: fullContent }] };
          }
        } catch { /* skip */ }
      }
    }
  },
};
```

### Pattern 3: RemoteThreadListAdapter for SQLite persistence
**What:** Adapter that connects assistant-ui ThreadList to our SQLite database via API routes
**When to use:** To enable conversation persistence, listing, and resuming
**Example:**
```typescript
// Source: https://www.assistant-ui.com/docs/runtimes/custom/custom-thread-list
import type { RemoteThreadListAdapter } from '@assistant-ui/react';

const threadListAdapter: RemoteThreadListAdapter = {
  async list() {
    const res = await fetch('/api/threads');
    const threads = await res.json();
    return {
      threads: threads.map((t: any) => ({
        remoteId: t.id,
        status: t.is_archived ? 'archived' : 'regular',
        title: t.title ?? undefined,
      })),
    };
  },
  async initialize(localId) {
    const res = await fetch('/api/threads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ localId }),
    });
    const result = await res.json();
    return { remoteId: result.id };
  },
  async rename(remoteId, title) {
    await fetch(`/api/threads/${remoteId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    });
  },
  async archive(remoteId) {
    await fetch(`/api/threads/${remoteId}/archive`, { method: 'POST' });
  },
  async unarchive(remoteId) {
    await fetch(`/api/threads/${remoteId}/unarchive`, { method: 'POST' });
  },
  async delete(remoteId) {
    await fetch(`/api/threads/${remoteId}`, { method: 'DELETE' });
  },
  async fetch(remoteId) {
    const res = await fetch(`/api/threads/${remoteId}`);
    const t = await res.json();
    return {
      remoteId: t.id,
      status: t.is_archived ? 'archived' : 'regular',
      title: t.title,
    };
  },
  async generateTitle(remoteId, messages) {
    // Simple: use first user message as title
    const firstUserMsg = messages.find(m => m.role === 'user');
    const title = firstUserMsg
      ? (firstUserMsg.content[0] as any)?.text?.slice(0, 50) || 'New conversation'
      : 'New conversation';

    // Save title via API
    await fetch(`/api/threads/${remoteId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    });

    const { createAssistantStream } = await import('assistant-stream');
    return createAssistantStream(async (controller) => {
      controller.appendText(title);
    });
  },
};
```

### Pattern 4: useRemoteThreadListRuntime Wiring
**What:** Combines the Dify adapter with the thread list adapter
**Example:**
```typescript
import {
  AssistantRuntimeProvider,
  useLocalRuntime,
  useRemoteThreadListRuntime,
} from '@assistant-ui/react';

function BriefRuntimeProvider({ children }: { children: React.ReactNode }) {
  const runtime = useRemoteThreadListRuntime({
    runtimeHook: () => useLocalRuntime(difyAdapter),
    adapter: threadListAdapter,
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {children}
    </AssistantRuntimeProvider>
  );
}
```

### Anti-Patterns to Avoid
- **Bundling better-sqlite3 with webpack:** Must add to `serverExternalPackages` in next.config.ts or builds will fail with native module errors
- **Multiple DB connections:** better-sqlite3 is synchronous; one connection per process is correct. Do not create per-request connections
- **Storing API keys in plaintext in API responses:** Agent list endpoints must mask API keys (e.g., show only last 4 chars)
- **Saving messages before thread initialization completes:** Per assistant-ui docs, await thread initialization before saving the first message or it will be lost

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Chat UI (messages, composer, scroll) | Custom message list + textarea + scroll logic | assistant-ui Thread + Composer primitives | Current custom code is ~440 LOC; library handles scroll, streaming, accessibility |
| Suggestion chips | Custom button rendering + state management | ThreadPrimitive.Suggestion | Handles composer integration, auto-send, method (replace/append) |
| Conversation list sidebar | Custom list component + state | ThreadListPrimitive (Root, New, Items) | Handles thread switching, new thread creation, archive status |
| Thread persistence wiring | Custom state sync between DB and UI | useRemoteThreadListRuntime | Handles optimistic updates, thread switching, runtime lifecycle |
| Database migrations | Manual SQL scripts | drizzle-kit generate + migrate | Tracks schema changes, generates SQL, handles versioning |
| SQLite WAL mode | Manual PRAGMA management | Set once in DB singleton | WAL mode enables concurrent reads during writes |

**Key insight:** assistant-ui v0.12 provides the full conversation management layer (ThreadList, remote runtime, suggestions) that eliminates the need for custom state management. The custom brief chat panel and its hook can be entirely replaced by library primitives + a Dify ChatModelAdapter.

## Common Pitfalls

### Pitfall 1: Native Module Build Failure
**What goes wrong:** `better-sqlite3` is a native Node.js module with C++ bindings. Webpack (used by Next.js) cannot bundle it.
**Why it happens:** Next.js tries to bundle all server-side code by default.
**How to avoid:** Add to `next.config.ts`:
```typescript
const nextConfig: NextConfig = {
  serverExternalPackages: ['better-sqlite3'],
  // ... existing config
};
```
**Warning signs:** Build errors mentioning `prebuild-install`, `node-gyp`, or `Cannot read properties of undefined (reading 'indexOf')`.

### Pitfall 2: SQLite File Not Persisting on Railway
**What goes wrong:** Database is lost on every deployment because Railway containers are ephemeral.
**Why it happens:** Without a persistent volume, files in the container filesystem are destroyed on redeploy.
**How to avoid:** Mount a Railway persistent volume at `/data`, store DB at `/data/db.sqlite`. Set env var `DATABASE_PATH=/data/db.sqlite`. WAL mode creates `-wal` and `-shm` companion files that must also be on the persistent volume (they will be, if the main DB file is).
**Warning signs:** Data disappears after deployment. Also check `RAILWAY_RUN_UID=0` if permission errors occur.

### Pitfall 3: assistant-ui v0.12 Hook Deprecations
**What goes wrong:** Existing code using `useAssistantRuntime`, `useThread`, etc. breaks or shows deprecation warnings.
**Why it happens:** v0.12 renamed all hooks to the `useAui`/`useAuiState` pattern.
**How to avoid:** Run `npx assistant-ui@latest upgrade` codemod after upgrading the package. Old names still work (deprecated until v0.13) but should be migrated.
**Warning signs:** Console deprecation warnings.

### Pitfall 4: Conversation ID Management with Dify
**What goes wrong:** The Dify API uses its own `conversation_id` for multi-turn context, but assistant-ui manages thread IDs independently.
**Why it happens:** Two separate ID systems (Dify conversation_id vs assistant-ui thread remoteId).
**How to avoid:** Store the Dify `conversation_id` alongside the thread in the database. When resuming a conversation, pass the stored Dify `conversation_id` to the API route so Dify maintains context continuity.
**Warning signs:** Resumed conversations lose prior context (Dify treats them as new conversations).

### Pitfall 5: Race Condition on First Message Save
**What goes wrong:** First message in a new conversation is lost because the thread hasn't been initialized in the DB yet.
**Why it happens:** `useRemoteThreadListRuntime` calls `initialize()` asynchronously; if message save fires before initialization completes, there's no thread record to attach it to.
**How to avoid:** Ensure the `initialize()` adapter method completes and the remoteId is available before attempting to persist messages. The assistant-ui docs explicitly warn about this.
**Warning signs:** First message of new conversations missing when resuming.

### Pitfall 6: Zod Version Conflict
**What goes wrong:** assistant-ui v0.12.23 depends on `zod@^4.3.6` but the project may not have zod installed.
**Why it happens:** Zod 4 is a new major version (released 2025); transitive dependency may cause conflicts.
**How to avoid:** Let npm resolve it as a transitive dependency. If conflicts arise, install `zod@^4.3.6` explicitly.
**Warning signs:** `Cannot find module 'zod'` errors or version mismatch warnings during install.

## Code Examples

### Database Schema (Drizzle)
```typescript
// lib/db/schema.ts
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const agents = sqliteTable('agents', {
  id: text('id').primaryKey(), // nanoid
  label: text('label').notNull(),
  apiKey: text('api_key').notNull(), // encrypted or plain (server-only)
  baseUrl: text('base_url').notNull().default('https://api.dify.ai'),
  difyUrl: text('dify_url'), // optional override
  conversationMode: text('conversation_mode').notNull().default('chat'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
});

export const testPrompts = sqliteTable('test_prompts', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  text: text('text').notNull(),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
});

export const conversations = sqliteTable('conversations', {
  id: text('id').primaryKey(), // maps to assistant-ui remoteId
  title: text('title'),
  agentId: text('agent_id').references(() => agents.id),
  agentConfigSnapshot: text('agent_config_snapshot'), // JSON snapshot of agent at creation
  difyConversationId: text('dify_conversation_id'), // Dify's own conversation_id
  isArchived: integer('is_archived', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
});

export const messages = sqliteTable('messages', {
  id: text('id').primaryKey(),
  conversationId: text('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  role: text('role', { enum: ['user', 'assistant'] }).notNull(),
  content: text('content').notNull(),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
});
```

### Drizzle Config
```typescript
// drizzle.config.ts
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'sqlite',
  schema: './lib/db/schema.ts',
  out: './drizzle',
  dbCredentials: {
    url: process.env.DATABASE_PATH || './data/db.sqlite',
  },
});
```

### Next.js Config Update
```typescript
// next.config.ts (additions)
const nextConfig: NextConfig = {
  serverExternalPackages: ['better-sqlite3'],
  // ... existing config preserved
};
```

### Thread Primitives Usage
```tsx
// Source: assistant-ui docs
import { ThreadPrimitive } from '@assistant-ui/react';

function BriefThread() {
  return (
    <ThreadPrimitive.Root>
      <ThreadPrimitive.Viewport>
        <ThreadPrimitive.Messages />
        <ThreadPrimitive.FollowingSuggestions />
      </ThreadPrimitive.Viewport>
      <ComposerPrimitive.Root>
        <ComposerPrimitive.Input placeholder="Tell me about the email..." />
        <ComposerPrimitive.Send />
      </ComposerPrimitive.Root>
    </ThreadPrimitive.Root>
  );
}
```

### Suggestion Chips
```tsx
// Source: assistant-ui docs
import { ThreadPrimitive } from '@assistant-ui/react';

// Individual suggestion
<ThreadPrimitive.Suggestion
  prompt="Create a product launch email"
  method="replace"
  autoSend
>
  Create a product launch email
</ThreadPrimitive.Suggestion>
```

### ThreadList Sidebar
```tsx
// Source: assistant-ui docs
import { ThreadListPrimitive } from '@assistant-ui/react';

function ThreadListSidebar() {
  return (
    <ThreadListPrimitive.Root>
      <ThreadListPrimitive.New>New Conversation</ThreadListPrimitive.New>
      <ThreadListPrimitive.Items
        components={{
          ThreadListItem: ThreadListItem,
        }}
      />
    </ThreadListPrimitive.Root>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| useAssistantRuntime, useThread | useAui, useAuiState | assistant-ui v0.12 (2025) | All hook names changed; codemod available |
| Custom chat panel + manual scroll | ThreadPrimitive.Root + Viewport + Messages | assistant-ui v0.12 | Eliminates ~440 LOC of custom chat UI |
| No conversation persistence | useRemoteThreadListRuntime + ThreadListPrimitive | assistant-ui v0.12 | Built-in support for thread list + remote DB |
| kebab-case events (thread.run-start) | camelCase events (thread.runStart) | assistant-ui v0.12 | Event listener names must be updated |

**Deprecated/outdated:**
- `useMessageUtils`, `useMessageUtilsStore` -- removed entirely in v0.12
- `useToolUIs`, `useToolUIsStore` -- removed entirely in v0.12
- `useAssistantApi` -- renamed to `useAui`

## Open Questions

1. **Dify conversation_id persistence for resumed threads**
   - What we know: Dify maintains conversation context via `conversation_id`. When resuming a thread, we need to pass this back.
   - What's unclear: Whether the existing `useBriefChat` hook's `<Brief>` tag parsing logic needs to be preserved in the new adapter, or if that was specific to an earlier agent configuration.
   - Recommendation: Inspect current Dify agent behavior; if `<Brief>` tags are still used, the ChatModelAdapter must handle tag parsing during streaming.

2. **Message persistence timing with useRemoteThreadListRuntime**
   - What we know: assistant-ui calls adapter methods; we need to save messages to SQLite.
   - What's unclear: Whether assistant-ui provides a hook/event to intercept each message for persistence, or if we need to save messages via the API route that proxies to Dify.
   - Recommendation: Save messages in the Dify proxy API route (`/api/brief/chat`) after streaming completes, not in the UI layer. This ensures messages are persisted regardless of UI state.

3. **Active agent dynamic switching**
   - What we know: Settings allow selecting which agent is active. The Dify adapter needs to read the active agent's API key and base URL.
   - What's unclear: Whether the ChatModelAdapter can read dynamic config or if it's captured at creation time.
   - Recommendation: Use a factory pattern -- read active agent from API on adapter creation; wrap in a provider that re-creates the adapter when active agent changes.

4. **Editor page assistant-ui compatibility**
   - What we know: The editor page at `/editor` also uses assistant-ui (v0.9.6) with `useLocalRuntime` and a different `ChatModelAdapter` for the email editing chat.
   - What's unclear: Whether upgrading to v0.12 will break the editor's assistant-ui usage.
   - Recommendation: Run the `npx assistant-ui@latest upgrade` codemod against the entire codebase; the editor's `AssistantProvider` component should work with v0.12 since `useLocalRuntime` and `ChatModelAdapter` are preserved.

## Sources

### Primary (HIGH confidence)
- [assistant-ui v0.12 migration guide](https://www.assistant-ui.com/docs/migrations/v0-12) - Breaking changes, hook renames, codemod
- [assistant-ui Custom Thread List docs](https://www.assistant-ui.com/docs/runtimes/custom/custom-thread-list) - RemoteThreadListAdapter full API + example
- [Drizzle ORM SQLite setup](https://orm.drizzle.team/docs/get-started-sqlite) - Schema definition, config, migrations
- npm registry verified: @assistant-ui/react@0.12.23, better-sqlite3@12.8.0, drizzle-orm@0.45.2, drizzle-kit@0.31.10

### Secondary (MEDIUM confidence)
- [assistant-ui ThreadPrimitive.Suggestion docs](https://www.assistant-ui.com/docs/ui/primitives/Thread) - Suggestion component API (404 on fetch but WebSearch confirmed API)
- [assistant-ui ThreadListPrimitive docs](https://www.assistant-ui.com/docs/api-reference/primitives/ThreadList) - ThreadList component structure
- [Railway SQLite persistent volume](https://station.railway.com/questions/how-do-i-use-volumes-to-make-a-sqlite-da-34ea0372) - Volume mount + WAL considerations

### Tertiary (LOW confidence)
- [better-sqlite3 webpack issues](https://github.com/WiseLibs/better-sqlite3/issues/1445) - serverExternalPackages workaround (verified via Next.js docs)
- [Next.js serverExternalPackages](https://nextjs.org/docs/app/api-reference/config/next-config-js/serverExternalPackages) - Official Next.js config option

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All versions verified against npm registry; assistant-ui v0.12 docs confirmed API patterns
- Architecture: MEDIUM-HIGH - Patterns sourced from official docs; Dify adapter integration is project-specific and needs validation
- Pitfalls: HIGH - Native module bundling, Railway persistence, and race conditions well-documented in official sources
- Conversation ID management: MEDIUM - Dify + assistant-ui dual-ID pattern is project-specific; needs careful implementation

**Research date:** 2026-04-05
**Valid until:** 2026-05-05 (assistant-ui is fast-moving; check for v0.13 breaking changes)
