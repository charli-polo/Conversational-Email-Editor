import { NextResponse } from 'next/server';
import { uploadFile, getActiveAgentConfig } from '@/lib/dify/client';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const agentConfig = await getActiveAgentConfig();
    const response = await uploadFile(file, file.name, 'default-user', agentConfig ?? undefined);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Dify upload error:', response.status, errorText);
      return NextResponse.json(
        { error: 'File upload failed', details: errorText },
        { status: 502 }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}
