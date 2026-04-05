import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { conversations } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const thread = await db.query.conversations.findFirst({
      where: eq(conversations.id, id),
    });

    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: thread.id,
      title: thread.title,
      is_archived: thread.isArchived,
      agent_id: thread.agentId,
      agent_config_snapshot: thread.agentConfigSnapshot
        ? JSON.parse(thread.agentConfigSnapshot)
        : null,
      dify_conversation_id: thread.difyConversationId,
      created_at: thread.createdAt,
      updated_at: thread.updatedAt,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch thread' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { title, difyConversationId } = body;

    const now = new Date().toISOString();
    const updates: Record<string, unknown> = { updatedAt: now };

    if (title !== undefined) {
      updates.title = title;
    }
    if (difyConversationId !== undefined) {
      updates.difyConversationId = difyConversationId;
    }

    await db
      .update(conversations)
      .set(updates)
      .where(eq(conversations.id, id));

    const updated = await db.query.conversations.findFirst({
      where: eq(conversations.id, id),
    });

    if (!updated) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: updated.id,
      title: updated.title,
      is_archived: updated.isArchived,
      agent_id: updated.agentId,
      agent_config_snapshot: updated.agentConfigSnapshot
        ? JSON.parse(updated.agentConfigSnapshot)
        : null,
      dify_conversation_id: updated.difyConversationId,
      created_at: updated.createdAt,
      updated_at: updated.updatedAt,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update thread' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.delete(conversations).where(eq(conversations.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete thread' },
      { status: 500 }
    );
  }
}
