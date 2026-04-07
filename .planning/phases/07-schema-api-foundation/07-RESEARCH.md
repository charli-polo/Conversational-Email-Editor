# Phase 7: Schema & API Foundation - Research

**Researched:** 2026-04-07
**Domain:** SQLite schema design (Drizzle ORM), Next.js API routes, React data hooks
**Confidence:** HIGH

## Summary

Phase 7 adds a tagging system to the existing SQLite/Drizzle data layer and refactors the conversation list API to eliminate the current N+1 query problem. The existing codebase has 4 tables (agents, test_prompts, conversations, messages) with Drizzle ORM 0.45.2 and auto-run migrations. The current `GET /api/threads` endpoint has an explicit N+1 problem: it fetches all conversations, then loops with `Promise.all` to fetch the first message for each one individually.

This phase requires: (1) two new tables (`tags` and `conversation_tags` junction), (2) rewriting the threads list query to use LEFT JOINs for both message previews and tags, and (3) extracting a shared `useConversations` hook that both the upcoming conversations page (Phase 8) and the existing `ThreadListDrawer` can consume.

**Primary recommendation:** Add `tags` + `conversation_tags` tables via Drizzle migration, rewrite `GET /api/threads` with a single joined query, and create a `useConversations()` hook in `hooks/use-conversations.ts`.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DATA-01 | Tags stored in junction table with efficient query support | New `tags` and `conversation_tags` tables with proper indexes; Drizzle ORM 0.45.2 supports `sqliteTable` + `.leftJoin()` |
| DATA-02 | Conversation list query loads tags in a single joined query (no N+1) | Rewrite `GET /api/threads` using Drizzle's `.select().from().leftJoin()` chain; group results in JS |
| DATA-03 | Shared data hook used by both conversations page and ThreadListDrawer | New `useConversations()` hook replaces inline fetch in `ThreadListDrawer`; same hook used by Phase 8 page |
</phase_requirements>

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| drizzle-orm | 0.45.2 | Type-safe ORM for SQLite | Already in use, supports LEFT JOIN, relations API |
| drizzle-kit | 0.31.10 | Migration generation | Already in use, `npx drizzle-kit generate` workflow |
| better-sqlite3 | 12.8.x | SQLite driver | Already in use, WAL mode enabled |

### Supporting (no new deps needed)
| Library | Purpose | Notes |
|---------|---------|-------|
| React useState/useEffect/useCallback | Hook state management | Project pattern -- no SWR/TanStack Query in use |
| Next.js API routes | Server endpoints | Existing pattern in `app/api/threads/` |

### No New Dependencies
This phase requires zero new packages. Everything is achievable with the existing Drizzle ORM + React hooks stack. The project has no data-fetching library (no SWR, no TanStack Query) and introducing one would be scope creep for this phase.

## Architecture Patterns

### Schema Addition
```
lib/db/schema.ts  (modify -- add 2 tables)
  tags          -- id, name, createdAt
  conversationTags  -- conversationId, tagId (composite PK)
```

### Recommended File Changes
```
lib/db/schema.ts           # Add tags + conversationTags tables
drizzle/0002_*.sql          # Auto-generated migration
app/api/threads/route.ts    # Rewrite GET with joined query
app/api/tags/route.ts       # NEW: GET all tags (for autocomplete in Phase 9)
hooks/use-conversations.ts  # NEW: shared data hook
components/assistant-ui/thread-list-drawer.tsx  # Refactor to use hook
```

### Pattern 1: Junction Table for Many-to-Many Tags
**What:** A `conversation_tags` junction table linking conversations to tags
**When to use:** Many-to-many relationships where entities need independent lifecycle
**Example:**
```typescript
// lib/db/schema.ts additions
export const tags = sqliteTable('tags', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
});

export const conversationTags = sqliteTable('conversation_tags', {
  conversationId: text('conversation_id')
    .notNull()
    .references(() => conversations.id, { onDelete: 'cascade' }),
  tagId: text('tag_id')
    .notNull()
    .references(() => tags.id, { onDelete: 'cascade' }),
}, (table) => ({
  pk: primaryKey({ columns: [table.conversationId, table.tagId] }),
}));
```

### Pattern 2: LEFT JOIN Query (Eliminate N+1)
**What:** Single query with LEFT JOINs to fetch conversations + first message + tags
**When to use:** List endpoints that need related data without N+1
**Example:**
```typescript
// Drizzle 0.45.2 LEFT JOIN syntax
import { sql, desc, eq } from 'drizzle-orm';

// Option A: Two efficient queries (simpler, avoids cartesian product)
// Query 1: conversations with first message (subquery)
const threads = await db
  .select({
    id: conversations.id,
    title: conversations.title,
    agentId: conversations.agentId,
    agentConfigSnapshot: conversations.agentConfigSnapshot,
    isArchived: conversations.isArchived,
    createdAt: conversations.createdAt,
    updatedAt: conversations.updatedAt,
  })
  .from(conversations)
  .orderBy(desc(conversations.updatedAt));

// Query 2: all tags for these conversations (single query, not N+1)
const allTags = await db
  .select({
    conversationId: conversationTags.conversationId,
    tagId: tags.id,
    tagName: tags.name,
  })
  .from(conversationTags)
  .innerJoin(tags, eq(conversationTags.tagId, tags.id));

// Group tags by conversationId in JS
const tagMap = new Map<string, { id: string; name: string }[]>();
for (const row of allTags) {
  const arr = tagMap.get(row.conversationId) || [];
  arr.push({ id: row.tagId, name: row.tagName });
  tagMap.set(row.conversationId, arr);
}
```

**Why two queries instead of one giant JOIN:** When conversations have multiple tags AND we also want preview messages, a single JOIN creates a cartesian product (each conversation appears N times for N tags x M messages). Two focused queries are cleaner and more efficient for SQLite.

### Pattern 3: Shared Data Hook
**What:** A React hook that encapsulates fetch + state + refresh for conversation data
**When to use:** When multiple components need the same server data
**Example:**
```typescript
// hooks/use-conversations.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { basePath } from '@/lib/base-path';

export interface ConversationWithTags {
  id: string;
  title: string | null;
  preview: string | null;
  agent_label: string | null;
  is_archived: boolean;
  tags: { id: string; name: string }[];
  created_at: string;
  updated_at: string;
}

export function useConversations() {
  const [conversations, setConversations] = useState<ConversationWithTags[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${basePath}/api/threads`);
      const data = await res.json();
      setConversations(data.threads || []);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Optimistic removal
  const removeConversation = useCallback((id: string) => {
    setConversations(prev => prev.filter(c => c.id !== id));
  }, []);

  return { conversations, isLoading, refresh, removeConversation };
}
```

### Anti-Patterns to Avoid
- **N+1 in the API route:** The current `Promise.all` loop fetching first messages is the exact problem to fix. Never loop DB queries per row.
- **Fetching tags client-side per conversation:** Tags must come bundled in the list response, not fetched separately.
- **Creating a global state manager (Redux/Zustand):** Overkill. A simple hook with `useState` + `fetch` matches the project's existing pattern (see `use-brief-chat.ts`).
- **Using Drizzle relations API for this query:** The `db.query.X.findMany({ with: {} })` relations API requires defining `relations()` objects. While possible, the project currently uses the SQL-like query builder (`db.select().from()`) exclusively. Stay consistent.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| SQL migrations | Manual ALTER TABLE statements | `npx drizzle-kit generate` | Type-safe, versioned, auto-applied on startup |
| Query builder | Raw SQL strings | Drizzle's `.select().from().leftJoin()` | Type inference, SQL injection prevention |
| Data fetching cache | Custom cache layer | Simple React hook with `refresh()` | Project has no SWR/TanStack; keep it simple for v1.1 |

## Common Pitfalls

### Pitfall 1: Forgetting to Run drizzle-kit generate
**What goes wrong:** Schema changes in `schema.ts` without generating a migration file means the DB never updates
**Why it happens:** Drizzle schema is just TypeScript -- it doesn't auto-migrate without a generated SQL file
**How to avoid:** After editing `schema.ts`, always run `npx drizzle-kit generate` and verify a new `0002_*.sql` appears in `drizzle/`
**Warning signs:** App starts but tag queries fail with "no such table"

### Pitfall 2: Composite Primary Key Import
**What goes wrong:** `primaryKey` must be imported from `drizzle-orm/sqlite-core`, not `drizzle-orm`
**Why it happens:** Drizzle has dialect-specific exports
**How to avoid:** Import: `import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core';`
**Warning signs:** TypeScript error on `primaryKey` usage

### Pitfall 3: Cartesian Product in Multi-JOIN
**What goes wrong:** JOINing conversations to both messages and tags in one query multiplies rows (N tags x M messages per conversation)
**Why it happens:** SQL JOINs produce cross products of joined sets
**How to avoid:** Use two separate efficient queries (conversations+preview, then tags) and merge in JS
**Warning signs:** Duplicate conversation entries in API response, wrong tag counts

### Pitfall 4: Missing CASCADE on Junction Table
**What goes wrong:** Deleting a conversation leaves orphan rows in `conversation_tags`
**Why it happens:** Foreign key without `onDelete: 'cascade'`
**How to avoid:** Both FK references in `conversationTags` must have `{ onDelete: 'cascade' }`
**Warning signs:** Growing `conversation_tags` table with dead references after conversation deletion

### Pitfall 5: Tag Name Uniqueness
**What goes wrong:** Users create duplicate tags with different casing ("Work" vs "work")
**Why it happens:** SQLite text comparison is case-sensitive by default
**How to avoid:** Normalize tag names (lowercase + trim) before insert; use `.unique()` on the name column. Apply `COLLATE NOCASE` if needed.
**Warning signs:** Duplicate-looking tags in autocomplete

### Pitfall 6: Preview Query Regression
**What goes wrong:** Losing the "first user message as preview" feature during the rewrite
**Why it happens:** Focusing on tags and forgetting the existing preview behavior
**How to avoid:** The current API returns `preview` (first message content). The rewrite must preserve this. Use a correlated subquery or a second focused query.
**Warning signs:** ThreadListDrawer shows conversations without preview text

## Code Examples

### Migration Generation Workflow
```bash
# After editing lib/db/schema.ts:
npx drizzle-kit generate

# Verify migration was created:
ls drizzle/

# Migration auto-applies on next app start via lib/db/index.ts
```

### API Response Shape (after Phase 7)
```typescript
// GET /api/threads response
{
  threads: [
    {
      id: "abc-123",
      title: "Q2 Campaign Email",
      preview: "I need help writing a product launch email...",
      agent_label: "Brief Agent",
      is_archived: false,
      tags: [
        { id: "tag-1", name: "marketing" },
        { id: "tag-2", name: "q2" }
      ],
      created_at: "2026-04-01T...",
      updated_at: "2026-04-07T..."
    }
  ]
}
```

### Tag API Endpoints (minimal for Phase 7)
```typescript
// app/api/tags/route.ts -- GET all tags (needed by Phase 9 autocomplete)
export async function GET() {
  const allTags = await db.select().from(tags).orderBy(tags.name);
  return NextResponse.json({ tags: allTags });
}
```

Note: Tag CRUD operations (create, assign, remove) are Phase 9 scope. Phase 7 only needs the schema and the read endpoints. However, having `GET /api/tags` ready is useful for downstream phases.

## State of the Art

| Old Approach (current) | New Approach (Phase 7) | Impact |
|------------------------|------------------------|--------|
| N+1 `Promise.all` loop for previews | Single query or 2-query approach with JOINs | Eliminates O(n) DB calls |
| No tags in data model | Junction table `conversation_tags` | Enables tagging in Phase 9 |
| Inline fetch in ThreadListDrawer | Shared `useConversations()` hook | Reusable across pages |
| Tags field absent from API response | Tags array in each thread object | Ready for Phase 9-10 UI |

## Open Questions

1. **Preview message strategy**
   - What we know: Current code fetches first user message as preview via N+1 loop
   - What's unclear: Should preview be a subquery in SQL or a separate batch query?
   - Recommendation: Use a correlated subquery (`SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at LIMIT 1`) within the main query. SQLite handles correlated subqueries efficiently for this scale.

2. **Tag ID format**
   - What we know: Project uses `crypto.randomUUID()` for conversations and `nanoid` for agents
   - What's unclear: Which ID format for tags?
   - Recommendation: Use `nanoid` (shorter, URL-safe) -- consistent with agents table. Import from existing usage.

3. **Should Phase 7 include tag mutation endpoints?**
   - What we know: Phase 9 owns TAG-01 through TAG-04 (create, assign, remove tags)
   - What's unclear: Whether Phase 7 should stub out POST/DELETE for tags
   - Recommendation: Phase 7 should only deliver the schema + read endpoints. Tag mutation routes belong in Phase 9. Keep Phase 7 focused on DATA-01/02/03.

## Sources

### Primary (HIGH confidence)
- Codebase inspection: `lib/db/schema.ts`, `lib/db/index.ts`, `app/api/threads/route.ts`, `components/assistant-ui/thread-list-drawer.tsx`
- Drizzle ORM 0.45.2 installed in project -- verified LEFT JOIN and composite primaryKey API from existing node_modules
- Project `package.json` -- confirmed no SWR/TanStack Query dependency

### Secondary (MEDIUM confidence)
- Drizzle ORM documentation for `primaryKey()` composite key syntax and `.leftJoin()` chain API

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries already installed and in use, zero new deps
- Architecture: HIGH - patterns directly observed from codebase; junction table is standard relational design
- Pitfalls: HIGH - N+1 problem directly visible in current code; cartesian product is well-known SQL issue

**Research date:** 2026-04-07
**Valid until:** 2026-05-07 (stable -- no fast-moving dependencies)
