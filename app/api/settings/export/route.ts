import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { agents, testPrompts } from '@/lib/db/schema';

export async function GET() {
  try {
    const allAgents = await db.select().from(agents).orderBy(agents.createdAt);
    const allPrompts = await db.select().from(testPrompts).orderBy(testPrompts.displayOrder);

    const exportData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      agents: allAgents.map(({ id, label, apiKey, baseUrl, difyUrl, conversationMode, isActive }) => ({
        label,
        apiKey,
        baseUrl,
        difyUrl,
        conversationMode,
        isActive,
      })),
      testPrompts: allPrompts.map(({ name, text, autoSend, displayOrder }) => ({
        name,
        text,
        autoSend,
        displayOrder,
      })),
    };

    return NextResponse.json(exportData);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to export settings' }, { status: 500 });
  }
}
