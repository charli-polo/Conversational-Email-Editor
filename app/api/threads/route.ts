import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { conversations, agents, messages } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';

export async function GET() {
  try {
    const allThreads = await db
      .select()
      .from(conversations)
      .orderBy(desc(conversations.updatedAt));

    // Get first user message for each thread as preview
    const threadsWithPreview = await Promise.all(
      allThreads.map(async (thread) => {
        const firstMessage = await db
          .select({ content: messages.content })
          .from(messages)
          .where(eq(messages.conversationId, thread.id))
          .orderBy(messages.createdAt)
          .limit(1);

        return {
          id: thread.id,
          title: thread.title,
          is_archived: thread.isArchived,
          agent_id: thread.agentId,
          created_at: thread.createdAt,
          updated_at: thread.updatedAt,
          preview: firstMessage.length > 0 ? firstMessage[0].content : null,
        };
      })
    );

    return NextResponse.json({ threads: threadsWithPreview });
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
