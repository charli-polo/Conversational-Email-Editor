import { db } from '@/lib/db';
import { tags, conversationTags } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params;
    const { name } = await req.json();
    const normalized = name?.trim().toLowerCase();

    if (!normalized) {
      return NextResponse.json({ error: 'Tag name required' }, { status: 400 });
    }

    // Find or create tag
    let tag = await db.query.tags.findFirst({
      where: eq(tags.name, normalized),
    });

    if (!tag) {
      const tagId = crypto.randomUUID();
      await db.insert(tags).values({ id: tagId, name: normalized });
      tag = { id: tagId, name: normalized, createdAt: new Date().toISOString() };
    }

    // Assign to conversation (ignore duplicate)
    try {
      await db.insert(conversationTags).values({
        conversationId,
        tagId: tag.id,
      });
    } catch {
      // Already assigned — not an error
    }

    return NextResponse.json({ tag: { id: tag.id, name: tag.name } });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to assign tag' }, { status: 500 });
  }
}
