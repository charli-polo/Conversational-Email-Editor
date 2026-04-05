import { NextResponse } from 'next/server';
import { getParameters, getActiveAgentConfig } from '@/lib/dify/client';

export async function GET() {
  try {
    const agentConfig = await getActiveAgentConfig();
    const response = await getParameters('default-user', agentConfig ?? undefined);

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch parameters', code: 'DIFY_PARAMETERS_ERROR', status: response.status },
        { status: response.status }
      );
    }

    const data = await response.json();
    const fileUpload = data.file_upload || {};
    return NextResponse.json({
      opening_statement: data.opening_statement || '',
      suggested_questions: data.suggested_questions || [],
      speech_to_text: data.speech_to_text || { enabled: false },
      file_upload: {
        enabled: fileUpload.enabled ?? fileUpload.image?.enabled ?? false,
        allowed_file_types: fileUpload.allowed_file_types || [],
        allowed_file_extensions: fileUpload.allowed_file_extensions || [],
        number_limits: fileUpload.number_limits || 0,
        image: fileUpload.image || { enabled: false, number_limits: 0, transfer_methods: [] },
      },
      system_parameters: data.system_parameters || {},
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
