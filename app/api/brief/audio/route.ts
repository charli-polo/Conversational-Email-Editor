import { NextResponse } from 'next/server';
import { audioToText, getActiveAgentConfig } from '@/lib/dify/client';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as Blob | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    const agentConfig = await getActiveAgentConfig();
    const response = await audioToText(file, 'default-user', agentConfig ?? undefined);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Dify audio-to-text error:', response.status, errorText);
      return NextResponse.json(
        { error: 'Audio transcription failed', details: errorText },
        { status: 502 }
      );
    }

    const data = await response.json();
    return NextResponse.json({ text: data.text || '' });
  } catch (error) {
    console.error('Audio-to-text error:', error);
    return NextResponse.json(
      { error: 'Failed to transcribe audio' },
      { status: 500 }
    );
  }
}
