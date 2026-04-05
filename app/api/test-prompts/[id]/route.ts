import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { testPrompts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const prompt = await db.select().from(testPrompts).where(eq(testPrompts.id, id)).get();

    if (!prompt) {
      return NextResponse.json({ error: 'Test prompt not found' }, { status: 404 });
    }

    return NextResponse.json(prompt);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch test prompt' },
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
    const { name, text, autoSend, displayOrder } = body;

    // Check prompt exists
    const existing = await db.select().from(testPrompts).where(eq(testPrompts.id, id)).get();
    if (!existing) {
      return NextResponse.json({ error: 'Test prompt not found' }, { status: 404 });
    }

    // Validate optional fields if provided
    if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0 || name.trim().length > 100)) {
      return NextResponse.json(
        { error: 'name must be 1-100 characters' },
        { status: 400 }
      );
    }
    if (text !== undefined && (typeof text !== 'string' || text.trim().length === 0 || text.trim().length > 2000)) {
      return NextResponse.json(
        { error: 'text must be 1-2000 characters' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const updates: Record<string, unknown> = { updatedAt: now };
    if (name !== undefined) updates.name = name.trim();
    if (text !== undefined) updates.text = text.trim();
    if (autoSend !== undefined) updates.autoSend = autoSend;
    if (displayOrder !== undefined) updates.displayOrder = displayOrder;

    await db.update(testPrompts).set(updates).where(eq(testPrompts.id, id));

    const updated = await db.select().from(testPrompts).where(eq(testPrompts.id, id)).get();
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update test prompt' },
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
    const existing = await db.select().from(testPrompts).where(eq(testPrompts.id, id)).get();
    if (!existing) {
      return NextResponse.json({ error: 'Test prompt not found' }, { status: 404 });
    }

    await db.delete(testPrompts).where(eq(testPrompts.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete test prompt' },
      { status: 500 }
    );
  }
}
