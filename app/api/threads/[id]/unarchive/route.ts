import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { conversations } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db
      .update(conversations)
      .set({ isArchived: false, updatedAt: new Date().toISOString() })
      .where(eq(conversations.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to unarchive thread' },
      { status: 500 }
    );
  }
}
