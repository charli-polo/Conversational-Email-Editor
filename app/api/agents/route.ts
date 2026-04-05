import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { agents } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

function maskApiKey(key: string): string {
  return key.length > 4 ? 'sk-...' + key.slice(-4) : '****';
}

export async function GET() {
  try {
    const allAgents = await db.select().from(agents).orderBy(agents.createdAt);
    const masked = allAgents.map((agent) => ({
      ...agent,
      apiKey: maskApiKey(agent.apiKey),
    }));
    return NextResponse.json(masked);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch agents' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { label, apiKey, baseUrl, difyUrl, conversationMode, isActive } = body;

    // Validate required fields
    if (!label || typeof label !== 'string' || label.trim().length === 0 || label.trim().length > 100) {
      return NextResponse.json(
        { error: 'label is required and must be 1-100 characters' },
        { status: 400 }
      );
    }
    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
      return NextResponse.json(
        { error: 'apiKey is required' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const id = crypto.randomUUID();

    // If setting as active, deactivate all others first
    if (isActive) {
      await db.update(agents).set({ isActive: false, updatedAt: now });
    }

    const newAgent = {
      id,
      label: label.trim(),
      apiKey: apiKey.trim(),
      baseUrl: baseUrl?.trim() || 'https://api.dify.ai',
      difyUrl: difyUrl?.trim() || null,
      conversationMode: conversationMode || 'chatbot',
      isActive: isActive || false,
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(agents).values(newAgent);

    return NextResponse.json(
      { ...newAgent, apiKey: maskApiKey(newAgent.apiKey) },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create agent' },
      { status: 500 }
    );
  }
}
