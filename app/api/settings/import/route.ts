import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { agents, testPrompts } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body || body.version !== 1) {
      return NextResponse.json({ error: 'Invalid config file format' }, { status: 400 });
    }

    const now = new Date().toISOString();
    let agentsAdded = 0;
    let promptsAdded = 0;

    // Import agents — skip duplicates by label
    if (Array.isArray(body.agents)) {
      const existingAgents = await db.select({ label: agents.label }).from(agents);
      const existingLabels = new Set(existingAgents.map((a) => a.label));

      for (const agent of body.agents) {
        if (!agent.label || !agent.apiKey) continue;
        if (existingLabels.has(agent.label)) continue;

        await db.insert(agents).values({
          id: crypto.randomUUID(),
          label: agent.label,
          apiKey: agent.apiKey,
          baseUrl: agent.baseUrl || 'https://api.dify.ai',
          difyUrl: agent.difyUrl || null,
          conversationMode: agent.conversationMode || 'agent',
          isActive: false, // never auto-activate imported agents
          createdAt: now,
          updatedAt: now,
        });
        agentsAdded++;
      }
    }

    // Import test prompts — skip duplicates by name
    if (Array.isArray(body.testPrompts)) {
      const existingPrompts = await db.select({ name: testPrompts.name }).from(testPrompts);
      const existingNames = new Set(existingPrompts.map((p) => p.name));

      // Get max display order for appending
      const maxOrderResult = await db
        .select({ maxOrder: sql<number>`COALESCE(MAX(${testPrompts.displayOrder}), -1)` })
        .from(testPrompts);
      let nextOrder = (maxOrderResult[0]?.maxOrder ?? -1) + 1;

      for (const prompt of body.testPrompts) {
        if (!prompt.name || !prompt.text) continue;
        if (existingNames.has(prompt.name)) continue;

        await db.insert(testPrompts).values({
          id: crypto.randomUUID(),
          name: prompt.name,
          text: prompt.text,
          autoSend: prompt.autoSend ?? true,
          displayOrder: nextOrder++,
          createdAt: now,
          updatedAt: now,
        });
        promptsAdded++;
      }
    }

    return NextResponse.json({
      agentsAdded,
      promptsAdded,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to import settings' }, { status: 500 });
  }
}
