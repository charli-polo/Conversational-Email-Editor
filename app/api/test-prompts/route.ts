import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { testPrompts } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';

export async function GET() {
  try {
    const allPrompts = await db.select().from(testPrompts).orderBy(testPrompts.displayOrder);
    return NextResponse.json(allPrompts);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch test prompts' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, text, autoSend, displayOrder } = body;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim().length === 0 || name.trim().length > 100) {
      return NextResponse.json(
        { error: 'name is required and must be 1-100 characters' },
        { status: 400 }
      );
    }
    if (!text || typeof text !== 'string' || text.trim().length === 0 || text.trim().length > 2000) {
      return NextResponse.json(
        { error: 'text is required and must be 1-2000 characters' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const id = crypto.randomUUID();

    // Determine display order: use provided or max + 1
    let order = displayOrder;
    if (order === undefined || order === null) {
      const result = await db
        .select({ maxOrder: sql<number>`COALESCE(MAX(${testPrompts.displayOrder}), -1)` })
        .from(testPrompts);
      order = (result[0]?.maxOrder ?? -1) + 1;
    }

    const newPrompt = {
      id,
      name: name.trim(),
      text: text.trim(),
      autoSend: autoSend ?? true,
      displayOrder: order,
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(testPrompts).values(newPrompt);

    return NextResponse.json(newPrompt, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create test prompt' },
      { status: 500 }
    );
  }
}
