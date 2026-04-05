import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { messages, conversations } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const threadMessages = await db
      .select({
        id: messages.id,
        role: messages.role,
        content: messages.content,
        created_at: messages.createdAt,
      })
      .from(messages)
      .where(eq(messages.conversationId, id))
      .orderBy(messages.createdAt);

    return NextResponse.json({ messages: threadMessages });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { messages: newMessages } = body;

    if (!Array.isArray(newMessages) || newMessages.length === 0) {
      return NextResponse.json(
        { error: 'messages array is required and must not be empty' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    const messagesToInsert = newMessages.map(
      (msg: { role: string; content: string }) => ({
        id: crypto.randomUUID(),
        conversationId: id,
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        createdAt: now,
      })
    );

    await db.insert(messages).values(messagesToInsert);

    // Update thread's updatedAt timestamp
    await db
      .update(conversations)
      .set({ updatedAt: now })
      .where(eq(conversations.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to save messages' },
      { status: 500 }
    );
  }
}
