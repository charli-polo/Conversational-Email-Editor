import { NextResponse } from 'next/server';
import { renameConversation, getActiveAgentConfig } from '@/lib/dify/client';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: conversationId } = await params;
    const body = await req.json().catch(() => ({}));

    // Resolve agent config
    const agentConfig = await getActiveAgentConfig();

    const response = await renameConversation(
      conversationId,
      { auto_generate: body.auto_generate ?? true, name: body.name },
      'default-user',
      agentConfig ?? undefined,
    );

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: 'Failed to rename conversation', details: errorText },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to rename conversation' },
      { status: 500 },
    );
  }
}
