import { NextResponse } from 'next/server';
import { submitFeedback, getActiveAgentConfig } from '@/lib/dify/client';
import { db } from '@/lib/db';
import { messages, conversations, agents } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messageId, difyMessageId, threadId, rating } = body as {
      messageId: string;
      difyMessageId?: string;
      threadId: string;
      rating: 'like' | 'dislike';
    };

    if (!messageId || !rating) {
      return NextResponse.json(
        { error: 'messageId and rating are required' },
        { status: 400 }
      );
    }

    // Persist rating locally in SQLite (only if thread exists)
    if (threadId) {
      await db.update(messages).set({ rating }).where(eq(messages.id, messageId));
    }

    // If we have a Dify message ID, also submit feedback to Dify
    if (difyMessageId) {
      // Resolve agent config from thread's linked agent (if saved)
      let agentConfig = await getActiveAgentConfig();
      if (threadId) {
        const thread = await db.query.conversations.findFirst({
          where: eq(conversations.id, threadId),
        });
        if (thread?.agentId) {
          const agent = await db.query.agents.findFirst({
            where: eq(agents.id, thread.agentId),
          });
          if (agent) {
            agentConfig = { apiKey: agent.apiKey, baseUrl: agent.baseUrl, difyUrl: agent.difyUrl };
          }
        }
      }

      const response = await submitFeedback(difyMessageId, rating, 'default-user', agentConfig ?? undefined);
      if (!response.ok) {
        console.error('Dify feedback API error:', response.status, await response.text());
        // Still return success since we persisted locally
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Feedback error:', error);
    return NextResponse.json(
      { error: 'Failed to submit feedback' },
      { status: 500 }
    );
  }
}
