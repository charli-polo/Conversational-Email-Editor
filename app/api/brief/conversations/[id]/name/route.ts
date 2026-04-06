import { NextRequest, NextResponse } from 'next/server';
import { getActiveAgentConfig } from '@/lib/dify/client';

const DIFY_API_BASE = process.env.DIFY_API_BASE_URL || 'https://api.dify.ai';
const DIFY_API_KEY = process.env.DIFY_API_KEY;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json();

  const config = await getActiveAgentConfig();
  const apiKey = config?.apiKey || DIFY_API_KEY;
  const apiBase = config?.baseUrl || DIFY_API_BASE;

  if (!apiKey) {
    return NextResponse.json({ error: 'DIFY_API_KEY not configured' }, { status: 500 });
  }

  const response = await fetch(`${apiBase}/v1/conversations/${id}/name`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      auto_generate: body.auto_generate ?? true,
      name: body.name ?? '',
      user: 'default-user',
    }),
  });

  if (!response.ok) {
    const err = await response.text().catch(() => '');
    return NextResponse.json(
      { error: `Dify rename failed: ${response.status}`, details: err },
      { status: response.status },
    );
  }

  const data = await response.json();
  return NextResponse.json(data);
}
