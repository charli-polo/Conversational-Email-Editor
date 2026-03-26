import { NextResponse } from 'next/server';
import { getParameters } from '@/lib/dify/client';

export async function GET() {
  try {
    const response = await getParameters();

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch parameters', code: 'DIFY_PARAMETERS_ERROR', status: response.status },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({
      opening_statement: data.opening_statement || '',
      suggested_questions: data.suggested_questions || [],
    });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : '';
    if (errMsg.includes('not configured')) {
      return NextResponse.json(
        { error: 'Chat service is not configured', code: 'DIFY_NOT_CONFIGURED', status: 500 },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: 'Unable to reach the chat service', code: 'DIFY_UNREACHABLE', status: 502 },
      { status: 502 }
    );
  }
}
