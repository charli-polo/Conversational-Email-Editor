import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { agents } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

function maskApiKey(key: string): string {
  return key.length > 4 ? 'sk-...' + key.slice(-4) : '****';
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const agent = await db.select().from(agents).where(eq(agents.id, id)).get();

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    return NextResponse.json({ ...agent, apiKey: maskApiKey(agent.apiKey) });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch agent' },
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
    const { label, apiKey, baseUrl, difyUrl, conversationMode, isActive } = body;

    // Check agent exists
    const existing = await db.select().from(agents).where(eq(agents.id, id)).get();
    if (!existing) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // Validate optional fields if provided
    if (label !== undefined && (typeof label !== 'string' || label.trim().length === 0 || label.trim().length > 100)) {
      return NextResponse.json(
        { error: 'label must be 1-100 characters' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // If setting as active, deactivate all other agents first
    if (isActive === true) {
      await db.update(agents).set({ isActive: false, updatedAt: now });
    }

    const updates: Record<string, unknown> = { updatedAt: now };
    if (label !== undefined) updates.label = label.trim();
    if (apiKey !== undefined) updates.apiKey = apiKey.trim();
    if (baseUrl !== undefined) updates.baseUrl = baseUrl.trim();
    if (difyUrl !== undefined) updates.difyUrl = difyUrl?.trim() || null;
    if (conversationMode !== undefined) updates.conversationMode = conversationMode;
    if (isActive !== undefined) updates.isActive = isActive;

    await db.update(agents).set(updates).where(eq(agents.id, id));

    const updated = await db.select().from(agents).where(eq(agents.id, id)).get();
    return NextResponse.json({ ...updated!, apiKey: maskApiKey(updated!.apiKey) });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update agent' },
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
    const existing = await db.select().from(agents).where(eq(agents.id, id)).get();
    if (!existing) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    await db.delete(agents).where(eq(agents.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete agent' },
      { status: 500 }
    );
  }
}
