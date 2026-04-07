import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { conversations, agents, messages, tags, conversationTags } from '@/lib/db/schema';
import { desc, eq, sql } from 'drizzle-orm';

export async function GET() {
  try {
    // Query 1: All conversations with first-message preview via correlated subquery
    const allThreads = await db
      .select({
        id: conversations.id,
        title: conversations.title,
        agentId: conversations.agentId,
        agentConfigSnapshot: conversations.agentConfigSnapshot,
        isArchived: conversations.isArchived,
        createdAt: conversations.createdAt,
        updatedAt: conversations.updatedAt,
        preview: sql<string | null>`(
          SELECT content FROM messages
          WHERE messages.conversation_id = ${conversations.id}
          ORDER BY messages.created_at ASC
          LIMIT 1
        )`.as('preview'),
      })
      .from(conversations)
      .orderBy(desc(conversations.updatedAt));

    // Query 2: All tags for all conversations (single query, not N+1)
    const allConvTags = await db
      .select({
        conversationId: conversationTags.conversationId,
        tagId: tags.id,
        tagName: tags.name,
      })
      .from(conversationTags)
      .innerJoin(tags, eq(conversationTags.tagId, tags.id));

    // Group tags by conversationId
    const tagMap = new Map<string, { id: string; name: string }[]>();
    for (const row of allConvTags) {
      const arr = tagMap.get(row.conversationId) || [];
      arr.push({ id: row.tagId, name: row.tagName });
      tagMap.set(row.conversationId, arr);
    }

    // Build response
    const threadsWithTags = allThreads.map((thread) => {
      let agent_label: string | null = null;
      if (thread.agentConfigSnapshot) {
        try {
          const snapshot = JSON.parse(thread.agentConfigSnapshot);
          agent_label = snapshot.label ?? null;
        } catch {
          agent_label = null;
        }
      }

      return {
        id: thread.id,
        title: thread.title,
        is_archived: thread.isArchived,
        agent_id: thread.agentId,
        agent_label,
        created_at: thread.createdAt,
        updated_at: thread.updatedAt,
        preview: thread.preview,
        tags: tagMap.get(thread.id) || [],
      };
    });

    return NextResponse.json({ threads: threadsWithTags });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch threads' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    // Look up active agent for snapshot
    let agentId: string | null = null;
    let agentConfigSnapshot: string | null = null;

    const activeAgent = await db.query.agents.findFirst({
      where: eq(agents.isActive, true),
    });

    if (activeAgent) {
      agentId = activeAgent.id;
      agentConfigSnapshot = JSON.stringify({
        label: activeAgent.label,
        apiKey: 'REDACTED',
        baseUrl: activeAgent.baseUrl,
        difyUrl: activeAgent.difyUrl,
        conversationMode: activeAgent.conversationMode,
      });
    }

    await db.insert(conversations).values({
      id,
      title: null,
      agentId,
      agentConfigSnapshot,
      difyConversationId: null,
      isArchived: false,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create thread' },
      { status: 500 }
    );
  }
}
