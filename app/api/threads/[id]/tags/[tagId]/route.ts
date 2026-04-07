import { db } from '@/lib/db';
import { conversationTags } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; tagId: string }> }
) {
  try {
    const { id: conversationId, tagId } = await params;

    await db.delete(conversationTags).where(
      and(
        eq(conversationTags.conversationId, conversationId),
        eq(conversationTags.tagId, tagId),
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to remove tag' }, { status: 500 });
  }
}
